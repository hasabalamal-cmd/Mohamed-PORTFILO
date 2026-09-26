// netlify/functions/upload-to-drive.mjs

import { google } from "googleapis";
import { Readable } from "stream";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    // =========================
    // Read request
    // =========================

    let payload = {};

    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid JSON request body.",
        }),
      };
    }

    const {
      fileName,
      mimeType,
      base64Data,
      folderId,
    } = payload;

    // =========================
    // Validate request
    // =========================

    if (!base64Data || !fileName) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error:
            "Missing required fields: fileName or base64Data",
        }),
      };
    }

    // =========================
    // Clean Base64
    // =========================

    const cleanBase64 = String(base64Data)
      .replace(/^data:[^;]+;base64,/i, "")
      .replace(/\s/g, "");

    const buffer = Buffer.from(cleanBase64, "base64");

    if (!buffer.length) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid or empty base64 image data.",
        }),
      };
    }

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
      statusCode: 500,
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
