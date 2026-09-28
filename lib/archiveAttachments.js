const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const BOOK_EXTENSIONS = new Set(["pdf", "epub"]);
const DOCUMENT_EXTENSIONS = new Set(["txt", "doc", "docx"]);

const IMAGE_MIME_PREFIX = "image/";
const BOOK_MIME_TYPES = new Set([
  "application/pdf",
  "application/epub+zip",
]);
const DOCUMENT_MIME_TYPES = new Set([
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const ARCHIVE_ATTACHMENT_BUCKET =
  process.env.NEXT_PUBLIC_ARCHIVE_ATTACHMENT_BUCKET || "archive-files";

export const ARCHIVE_ATTACHMENT_MAX_FILES = 10;
export const ARCHIVE_ATTACHMENT_MAX_FILE_SIZE = 25 * 1024 * 1024;

function stripPath(filename) {
  return String(filename || "").replace(/^.*[\\/]/, "").trim();
}

export function sanitizeFilename(filename) {
  const base = stripPath(filename);

  if (!base) {
    return "file";
  }

  const sanitized = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "file";
}

export function getFilenameExtension(filename) {
  const value = stripPath(filename).toLowerCase();
  const index = value.lastIndexOf(".");

  if (index < 0 || index === value.length - 1) {
    return "";
  }

  return value.slice(index + 1);
}

export function getAttachmentType({ filename, mimeType }) {
  const extension = getFilenameExtension(filename);
  const normalizedMimeType = String(mimeType || "").toLowerCase();

  if (
    IMAGE_EXTENSIONS.has(extension) &&
    normalizedMimeType.startsWith(IMAGE_MIME_PREFIX)
  ) {
    return "image";
  }

  if (
    BOOK_EXTENSIONS.has(extension) &&
    BOOK_MIME_TYPES.has(normalizedMimeType)
  ) {
    return "book";
  }

  if (
    DOCUMENT_EXTENSIONS.has(extension) &&
    DOCUMENT_MIME_TYPES.has(normalizedMimeType)
  ) {
    return "document";
  }

  return "";
}

export function validateArchiveAttachmentFile(file) {
  const size = Number(file?.size || 0);

  if (size <= 0) {
    return {
      ok: false,
      errorKey: "archiveForm.unsupportedFileType",
      attachmentType: "",
    };
  }

  if (size > ARCHIVE_ATTACHMENT_MAX_FILE_SIZE) {
    return {
      ok: false,
      errorKey: "archiveForm.fileTooLarge",
      attachmentType: "",
    };
  }

  const attachmentType = getAttachmentType({
    filename: file?.name,
    mimeType: file?.type,
  });

  if (!attachmentType) {
    return {
      ok: false,
      errorKey: "archiveForm.unsupportedFileType",
      attachmentType: "",
    };
  }

  return {
    ok: true,
    errorKey: "",
    attachmentType,
  };
}

export function isImageAttachment(attachment) {
  const type = String(attachment?.attachment_type || "").toLowerCase();

  if (type === "image") {
    return true;
  }

  const mimeType = String(attachment?.mime_type || "").toLowerCase();
  const filename = String(attachment?.original_filename || "");

  return getAttachmentType({ filename, mimeType }) === "image";
}

export function formatAttachmentSize(size) {
  const bytes = Number(size || 0);

  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function createArchiveStoragePath({ userId, archiveId, filename }) {
  const safeUserId = String(userId || "").trim();
  const safeArchiveId = String(archiveId || "").trim();
  const safeFilename = sanitizeFilename(filename);
  const randomId =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${safeUserId}/${safeArchiveId}/${randomId}-${safeFilename}`;
}

export function getAttachmentTypeLabelKey(attachmentType) {
  const value = String(attachmentType || "").toLowerCase();

  if (value === "image") {
    return "common.image";
  }

  if (value === "book") {
    return "common.bookFile";
  }

  return "common.document";
}
