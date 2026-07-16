import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  return authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
}

async function getAttachmentWithParent(attachmentId) {
  const { data, error } = await supabaseAdmin
    .from("daily_attachments")
    .select(
      `
        id,
        daily_id,
        storage_bucket,
        storage_path,
        original_filename,
        mime_type,
        size_bytes,
        created_at,
        uploaded_by,
        is_public,
        field_logs:daily_id (
          id,
          user_id,
          is_public
        )
      `
    )
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

function isOwner(attachment, userId) {
  return Boolean(userId) && (
    attachment?.uploaded_by === userId ||
    attachment?.field_logs?.user_id === userId
  );
}

function isPublicAttachment(attachment) {
  return Boolean(attachment?.is_public) && Boolean(attachment?.field_logs?.is_public);
}

export async function GET(request, { params }) {
  try {
    const attachmentId = params?.id || "";

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    const accessToken = getAccessToken(request);
    let userId = "";

    if (accessToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

      if (!error && data?.user?.id) {
        userId = data.user.id;
      }
    }

    const attachment = await getAttachmentWithParent(attachmentId);

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    if (!isOwner(attachment, userId) && !isPublicAttachment(attachment)) {
      return NextResponse.json({ error: "Attachment not available." }, { status: 403 });
    }

    const expiresIn = 60 * 5;
    const download = request.nextUrl.searchParams.get("download") === "1";

    const { data, error } = await supabaseAdmin.storage
      .from(attachment.storage_bucket || "daily-collection")
      .createSignedUrl(attachment.storage_path, expiresIn, download
        ? { download: attachment.original_filename || undefined }
        : undefined);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Attachment preview unavailable." }, { status: 404 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      attachment: {
        id: attachment.id,
        daily_id: attachment.daily_id,
        storage_bucket: attachment.storage_bucket,
        storage_path: attachment.storage_path,
        original_filename: attachment.original_filename,
        mime_type: attachment.mime_type,
        size_bytes: attachment.size_bytes,
        created_at: attachment.created_at,
        is_public: attachment.is_public,
      },
    });
  } catch (error) {
    console.error("Daily attachment signed URL error", {
      message: error?.message || "unknown",
    });

    return NextResponse.json({ error: "Attachment preview unavailable." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const attachmentId = params?.id || "";
    const accessToken = getAccessToken(request);

    if (!attachmentId || !accessToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !userData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const attachment = await getAttachmentWithParent(attachmentId);

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    if (!isOwner(attachment, userData.user.id)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from(attachment.storage_bucket || "daily-collection")
      .remove([attachment.storage_path]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message || "Attachment deletion failed." }, { status: 500 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("daily_attachments")
      .delete()
      .eq("id", attachmentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message || "Attachment deletion failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Daily attachment delete error", {
      message: error?.message || "unknown",
    });

    return NextResponse.json({ error: "Attachment deletion failed." }, { status: 500 });
  }
}