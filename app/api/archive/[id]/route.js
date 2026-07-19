import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const MEDIA_SKIP_BUCKETS = new Set(["daily-collection"]);

const SUPABASE_HOST = (() => {
  try {
    const value = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();

    if (!value) {
      return "";
    }

    return new URL(value).hostname;
  } catch {
    return "";
  }
})();

function getAuthToken(request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function getOwnerIdentifiers() {
  return {
    userIds: [process.env.OWNER_USER_ID, process.env.ADMIN_USER_ID].filter(Boolean),
    emails: [process.env.OWNER_EMAIL, process.env.ADMIN_EMAIL]
      .filter(Boolean)
      .map((value) => value.toLowerCase()),
  };
}

function isConfiguredOwner(user) {
  if (!user) {
    return false;
  }

  const { userIds, emails } = getOwnerIdentifiers();

  if (userIds.includes(user.id)) {
    return true;
  }

  const email = String(user.email || "").toLowerCase();
  return Boolean(email && emails.includes(email));
}

function addMediaRef(map, bucket, objectPath) {
  const safeBucket = String(bucket || "").trim();
  const safePath = String(objectPath || "").trim().replace(/^\/+/, "");

  if (!safeBucket || !safePath || MEDIA_SKIP_BUCKETS.has(safeBucket)) {
    return;
  }

  if (!map.has(safeBucket)) {
    map.set(safeBucket, new Set());
  }

  map.get(safeBucket).add(safePath);
}

function parseStoragePathFromUrl(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }

  const value = rawValue.trim();

  if (!value || !/^https?:\/\//i.test(value)) {
    return null;
  }

  try {
    const parsedUrl = new URL(value);

    if (SUPABASE_HOST && parsedUrl.hostname !== SUPABASE_HOST) {
      return null;
    }

    const match = parsedUrl.pathname.match(
      /^\/storage\/v1\/object\/(?:public|sign|authenticated)?\/?([^/]+)\/(.+)$/i
    );

    if (!match) {
      return null;
    }

    return {
      bucket: decodeURIComponent(match[1] || ""),
      objectPath: decodeURIComponent(match[2] || ""),
    };
  } catch {
    return null;
  }
}

function collectMediaRefs(value, map, depth = 0) {
  if (depth > 4 || value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    const storageRef = parseStoragePathFromUrl(value);

    if (storageRef) {
      addMediaRef(map, storageRef.bucket, storageRef.objectPath);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaRefs(item, map, depth + 1));
    return;
  }

  if (typeof value === "object") {
    const bucket = value.bucket || value.storage_bucket || value.bucket_id;
    const objectPath = value.path || value.file_path || value.object_path || value.name;

    if (bucket && objectPath) {
      addMediaRef(map, bucket, objectPath);
    }

    Object.values(value).forEach((item) => collectMediaRefs(item, map, depth + 1));
  }
}

async function loadArchiveRow(archiveId) {
  const itemResult = await supabaseAdmin
    .from("archive_items")
    .select("*")
    .eq("id", archiveId)
    .maybeSingle();

  if (itemResult.error) {
    throw itemResult.error;
  }

  if (itemResult.data) {
    return {
      table: "archive_items",
      row: itemResult.data,
    };
  }

  const legacyResult = await supabaseAdmin
    .from("archive_entries")
    .select("*")
    .eq("id", archiveId)
    .maybeSingle();

  if (legacyResult.error) {
    if (legacyResult.error.code === "PGRST205") {
      return null;
    }

    throw legacyResult.error;
  }

  if (!legacyResult.data) {
    return null;
  }

  return {
    table: "archive_entries",
    row: legacyResult.data,
  };
}

function getMediaCandidates(row) {
  return [
    row?.url,
    row?.link,
    row?.file_url,
    row?.media,
    row?.media_files,
    row?.assets,
    row?.files,
  ];
}

async function cleanupStorageMedia(row) {
  const mediaRefs = new Map();

  getMediaCandidates(row).forEach((candidate) => {
    collectMediaRefs(candidate, mediaRefs);
  });

  const warnings = [];

  for (const [bucket, pathSet] of mediaRefs.entries()) {
    const paths = Array.from(pathSet);

    if (!paths.length) {
      continue;
    }

    const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);

    if (error) {
      warnings.push(
        `Storage cleanup failed for bucket ${bucket}: ${error.message}`
      );
    }
  }

  return {
    mediaRefs,
    warnings,
  };
}

export async function DELETE(request, context) {
  try {
    const params = await context?.params;
    const archiveId = String(params?.id || "").trim();

    if (!archiveId) {
      return NextResponse.json({ error: "Archive ID is required." }, { status: 400 });
    }

    const accessToken = getAuthToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authentication." }, { status: 401 });
    }

    const located = await loadArchiveRow(archiveId);

    if (!located?.row) {
      return NextResponse.json({ error: "Archive entry not found." }, { status: 404 });
    }

    const archiveOwnerId = String(located.row.user_id || "");
    const canDelete = archiveOwnerId === user.id || isConfiguredOwner(user);

    if (!canDelete) {
      return NextResponse.json({ error: "Owner access is required." }, { status: 403 });
    }

    const cleanupResult = await cleanupStorageMedia(located.row);

    const deleteResult = await supabaseAdmin
      .from(located.table)
      .delete()
      .eq("id", archiveId)
      .eq("user_id", archiveOwnerId);

    if (deleteResult.error) {
      console.error("Archive delete failed:", deleteResult.error);

      return NextResponse.json(
        {
          error: "The Archive entry could not be deleted.",
          warnings: cleanupResult.warnings,
        },
        { status: 500 }
      );
    }

    revalidatePath("/");
    revalidatePath("/archive");
    revalidatePath("/input");

    return NextResponse.json({
      ok: true,
      table: located.table,
      storageDeleted:
        Array.from(cleanupResult.mediaRefs.values()).reduce(
          (count, pathSet) => count + pathSet.size,
          0
        ) || 0,
      warnings: cleanupResult.warnings,
    });
  } catch (error) {
    console.error("Archive delete route error:", error);

    return NextResponse.json(
      { error: "The Archive entry could not be deleted." },
      { status: 500 }
    );
  }
}
