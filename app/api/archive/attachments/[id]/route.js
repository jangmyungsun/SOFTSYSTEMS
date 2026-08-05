import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

const SIGNED_URL_TTL_SECONDS = 60;

function getAuthToken(request) {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7).trim();
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

async function getAuthenticatedUser(request) {
  const accessToken = getAuthToken(request);

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}

async function getAttachmentWithArchive(attachmentId) {
  const { data: attachment, error: attachmentError } = await supabaseAdmin
    .from("archive_attachments")
    .select(
      `
        id,
        archive_id,
        user_id,
        storage_bucket,
        storage_path,
        original_filename,
        mime_type,
        size_bytes,
        attachment_type,
        created_at
      `
    )
    .eq("id", attachmentId)
    .maybeSingle();

  if (attachmentError) {
    if (attachmentError.code === "PGRST205") {
      return {
        attachment: null,
        archive: null,
      };
    }

    throw attachmentError;
  }

  if (!attachment) {
    return {
      attachment: null,
      archive: null,
    };
  }

  const { data: archive, error: archiveError } = await supabaseAdmin
    .from("archive_items")
    .select("id, user_id, is_public")
    .eq("id", attachment.archive_id)
    .maybeSingle();

  if (archiveError) {
    throw archiveError;
  }

  return {
    attachment,
    archive,
  };
}

function canAccessAttachment({ archive, user }) {
  if (archive?.is_public) {
    return true;
  }

  if (!user) {
    return false;
  }

  return String(archive.user_id || "") === user.id || isConfiguredOwner(user);
}

export async function GET(request, context) {
  try {
    const params = await context?.params;
    const attachmentId = String(params?.id || "").trim();

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required." }, { status: 400 });
    }

    const download = request.nextUrl.searchParams.get("download") === "1";
    const user = await getAuthenticatedUser(request);
    const { attachment, archive } = await getAttachmentWithArchive(attachmentId);

    if (!attachment || !archive) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    if (!canAccessAttachment({ archive, user })) {
      return NextResponse.json({ error: "Attachment access is not allowed." }, { status: 403 });
    }

    const options = download
      ? {
          download: attachment.original_filename || true,
        }
      : undefined;

    const { data, error } = await supabaseAdmin.storage
      .from(attachment.storage_bucket)
      .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS, options);

    if (error || !data?.signedUrl) {
      throw error || new Error("Signed URL generation failed.");
    }

    return NextResponse.json({
      id: attachment.id,
      archive_id: attachment.archive_id,
      original_filename: attachment.original_filename,
      mime_type: attachment.mime_type,
      size_bytes: attachment.size_bytes,
      attachment_type: attachment.attachment_type,
      signed_url: data.signedUrl,
      expires_in_seconds: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    console.error("Archive attachment read route error:", error);

    return NextResponse.json(
      { error: "The attachment could not be opened." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context?.params;
    const attachmentId = String(params?.id || "").trim();

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required." }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const { attachment, archive } = await getAttachmentWithArchive(attachmentId);

    if (!attachment || !archive) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    const canDelete =
      String(archive.user_id || "") === user.id ||
      String(attachment.user_id || "") === user.id ||
      isConfiguredOwner(user);

    if (!canDelete) {
      return NextResponse.json({ error: "Owner access is required." }, { status: 403 });
    }

    const { error: metadataDeleteError } = await supabaseAdmin
      .from("archive_attachments")
      .delete()
      .eq("id", attachment.id)
      .eq("archive_id", attachment.archive_id);

    if (metadataDeleteError) {
      throw metadataDeleteError;
    }

    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from(attachment.storage_bucket)
      .remove([attachment.storage_path]);

    if (storageDeleteError) {
      return NextResponse.json(
        {
          ok: true,
          warning: `Attachment metadata removed but storage object could not be deleted: ${storageDeleteError.message}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Archive attachment delete route error:", error);

    return NextResponse.json(
      { error: "The attachment could not be removed." },
      { status: 500 }
    );
  }
}
