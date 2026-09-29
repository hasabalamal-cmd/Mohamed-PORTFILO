// netlify/functions/upload-to-drive.mjs

import { google } from "googleapis";
import { Readable } from "stream";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

export function parseMultipartFormData(body, contentType, isBase64Encoded = false) {
  const boundaryMatch = contentType?.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]?.trim();
  if (!boundary || boundary.length > 200) {
    throw badRequest("Missing or invalid multipart boundary.");
  }

  const requestBuffer = Buffer.isBuffer(body)
    ? body
    : Buffer.from(body || "", isBase64Encoded ? "base64" : "utf8");
  const delimiter = Buffer.from(`--${boundary}`);
  const separator = Buffer.from(`\r\n--${boundary}`);
  const fields = {};
  let file = null;
  let cursor = 0;

  if (!requestBuffer.subarray(0, delimiter.length).equals(delimiter)) {
    throw badRequest("Malformed multipart request.");
  }

  while (cursor < requestBuffer.length) {
    if (!requestBuffer.subarray(cursor, cursor + delimiter.length).equals(delimiter)) {
      throw badRequest("Malformed multipart boundary.");
    }
    cursor += delimiter.length;

    if (requestBuffer.subarray(cursor, cursor + 2).toString() === "--") break;
    if (requestBuffer.subarray(cursor, cursor + 2).toString() !== "\r\n") {
      throw badRequest("Malformed multipart part.");
    }
    cursor += 2;

    const headersEnd = requestBuffer.indexOf(Buffer.from("\r\n\r\n"), cursor);
    if (headersEnd === -1) throw badRequest("Missing multipart part headers.");

    const headers = requestBuffer.subarray(cursor, headersEnd).toString("latin1");
    const disposition = headers.match(/^content-disposition:\s*form-data;(.*)$/im)?.[1];
    const fieldName = disposition?.match(/(?:^|;)\s*name="([^"]*)"/i)?.[1];
    const filename = disposition?.match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1];
    if (!fieldName) throw badRequest("Multipart part is missing its field name.");

    const contentTypeHeader = headers.match(/^content-type:\s*([^\r\n]+)/im)?.[1]?.trim();
    const valueStart = headersEnd + 4;
    const nextPartStart = requestBuffer.indexOf(separator, valueStart);
    if (nextPartStart === -1) throw badRequest("Multipart part has no closing boundary.");

    const value = requestBuffer.subarray(valueStart, nextPartStart);
    if (filename !== undefined) {
      if (fieldName !== "file" || file) {
        throw badRequest("Exactly one file field named 'file' is supported.");
      }
      file = {
        fileName: filename,
        mimeType: contentTypeHeader || "application/octet-stream",
        buffer: value,
      };
    } else {
      fields[fieldName] = value.toString("utf8");
    }

    cursor = nextPartStart + 2;
  }

  if (!file?.fileName || file.buffer.length === 0) {
    throw badRequest("A non-empty file field named 'file' is required.");
  }
  if (!file.mimeType.startsWith("image/")) {
    throw badRequest("The uploaded file must be an image.");
  }
  if (file.buffer.length > MAX_IMAGE_SIZE_BYTES) {
    const error = new Error("Image exceeds the 4 MiB upload limit.");
    error.statusCode = 413;
    throw error;
  }

  return { ...file, folderId: fields.folderId || null };
}

export const handler = async (event) => {
  // =========================
  // CORS
  // =========================

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "CORS Preflight OK",
      }),
    };
  }

  // =========================
  // Only POST
  // =========================

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Method Not Allowed. Use POST.",
      }),
    };
  }

  try {
    const contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"];
    if (!contentType?.toLowerCase().startsWith("multipart/form-data")) {
      throw badRequest("Content-Type must be multipart/form-data.");
    }

    const { fileName, mimeType, buffer, folderId } = parseMultipartFormData(
      event.body,
      contentType,
      event.isBase64Encoded,
    );
    const bufferStream = Readable.from(buffer);

    // =========================
    // Environment Variables
    // =========================

    const clientEmail =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";

    let rawPrivateKey =
      process.env.GOOGLE_PRIVATE_KEY || "";

    const targetFolderId =
      folderId ||
      process.env.GOOGLE_DRIVE_FOLDER_ID ||
      "";

    // =========================
    // Validate credentials
    // =========================

    if (!clientEmail) {
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error:
            "GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured.",
        }),
      };
    }

    if (!rawPrivateKey) {
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error:
            "GOOGLE_PRIVATE_KEY is not configured.",
        }),
      };
    }

    if (!targetFolderId) {
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error:
            "GOOGLE_DRIVE_FOLDER_ID is not configured.",
        }),
      };
    }

    // =========================
    // Prepare Private Key
    // =========================

    let privateKey = String(rawPrivateKey).trim();

    // -----------------------------------------
    // Case 1:
    // GOOGLE_PRIVATE_KEY contains full JSON
    // -----------------------------------------

    if (privateKey.startsWith("{")) {
      try {
        const parsedKey = JSON.parse(privateKey);

        if (
          parsedKey &&
          typeof parsedKey.private_key === "string"
        ) {
          privateKey = parsedKey.private_key;
        } else {
          throw new Error(
            "JSON does not contain private_key."
          );
        }
      } catch (jsonError) {
        console.error(
          "Failed to parse GOOGLE_PRIVATE_KEY JSON:",
          jsonError?.message || jsonError
        );

        throw new Error(
          "GOOGLE_PRIVATE_KEY contains invalid JSON."
        );
      }
    }

    // -----------------------------------------
    // Remove accidental surrounding quotes
    // -----------------------------------------

    privateKey = privateKey.trim();

    if (
      (privateKey.startsWith('"') &&
        privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") &&
        privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // -----------------------------------------
    // Convert escaped \n to real new lines
    // -----------------------------------------

    privateKey = privateKey.replace(/\\n/g, "\n");

    // -----------------------------------------
    // Normalize line endings
    // -----------------------------------------

    privateKey = privateKey.replace(/\r\n/g, "\n");
    privateKey = privateKey.replace(/\r/g, "\n");

    privateKey = privateKey.trim();

    // -----------------------------------------
    // Expected PEM markers
    // -----------------------------------------

    const beginMarker =
      "-----BEGIN PRIVATE KEY-----";

    const endMarker =
      "-----END PRIVATE KEY-----";

    // -----------------------------------------
    // Find PEM markers
    // -----------------------------------------

    const beginIndex =
      privateKey.indexOf(beginMarker);

    const endIndex =
      privateKey.indexOf(endMarker);

    if (beginIndex === -1) {
      throw new Error(
        "GOOGLE_PRIVATE_KEY does not contain a valid BEGIN PRIVATE KEY header."
      );
    }

    if (endIndex === -1) {
      throw new Error(
        "GOOGLE_PRIVATE_KEY does not contain a valid END PRIVATE KEY footer."
      );
    }

    if (endIndex <= beginIndex) {
      throw new Error(
        "GOOGLE_PRIVATE_KEY has an invalid PEM structure."
      );
    }

    // -----------------------------------------
    // Extract only the Base64 body
    // -----------------------------------------

    const keyBody = privateKey
      .slice(
        beginIndex + beginMarker.length,
        endIndex
      )
      .replace(/\s+/g, "");

    if (!keyBody) {
      throw new Error(
        "GOOGLE_PRIVATE_KEY contains an empty private key body."
      );
    }

    // -----------------------------------------
    // Rebuild PEM with 64-character lines
    // -----------------------------------------

    const keyLines =
      keyBody.match(/.{1,64}/g) || [];

    privateKey =
      `${beginMarker}\n` +
      keyLines.join("\n") +
      `\n${endMarker}\n`;

    // -----------------------------------------
    // Safe diagnostics
    // NEVER log the private key itself
    // -----------------------------------------

    console.log(
      "Google private key diagnostics:",
      {
        length: privateKey.length,
        bodyLength: keyBody.length,
        startsCorrectly:
          privateKey.startsWith(beginMarker),
        endsCorrectly:
          privateKey.trim().endsWith(endMarker),
        newlineCount:
          (privateKey.match(/\n/g) || []).length,
      }
    );

    // =========================
    // Google Authentication
    // =========================

    const authClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/drive",
      ],
    });

    // =========================
    // Google Drive Client
    // =========================

    const drive = google.drive({
      version: "v3",
      auth: authClient,
    });

    // =========================
    // File Name
    // =========================

    const safeFileName = String(fileName)
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const finalFileName =
      `${Date.now()}_${safeFileName}`;

    // =========================
    // File Metadata
    // =========================

    const fileMetadata = {
      name: finalFileName,
      parents: [targetFolderId],
    };

    // =========================
    // File Media
    // =========================

    const media = {
      mimeType: mimeType || "image/jpeg",
      body: bufferStream,
    };

    // =========================
    // Upload to Google Drive
    // =========================

    console.log(
      "Uploading file to Google Drive:",
      finalFileName
    );

    const uploadRes = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields:
        "id,name,mimeType,webViewLink,webContentLink",
    });

    const fileId = uploadRes?.data?.id;

    if (!fileId) {
      throw new Error(
        "Google Drive did not return a file ID."
      );
    }

    console.log(
      "Google Drive upload successful:",
      fileId
    );

    // =========================
    // Make File Public
    // =========================

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      console.log(
        "Google Drive file permission set to public."
      );
    } catch (permissionError) {
      console.warn(
        "Could not make file public:",
        permissionError?.message ||
          permissionError
      );
    }

    // =========================
    // Image URLs
    // =========================

    const directImageUrl =
      `https://lh3.googleusercontent.com/d/${fileId}`;

    const fallbackDirectUrl =
      `https://drive.google.com/uc?export=view&id=${fileId}`;

    // =========================
    // Success
    // =========================

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        fileId,
        fileName:
          uploadRes?.data?.name ||
          finalFileName,
        mimeType:
          uploadRes?.data?.mimeType ||
          mimeType ||
          "image/jpeg",
        imageUrl: directImageUrl,
        fallbackUrl: fallbackDirectUrl,
        webViewLink:
          uploadRes?.data?.webViewLink ||
          null,
        webContentLink:
          uploadRes?.data?.webContentLink ||
          null,
      }),
    };
  } catch (error) {
    // =========================
    // Error
    // =========================

    console.error(
      "Google Drive Upload Error:",
      error
    );

    return {
      statusCode: error?.statusCode || 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error:
          error?.message ||
          "Internal Server Error during upload",
      }),
    };
  }
};
