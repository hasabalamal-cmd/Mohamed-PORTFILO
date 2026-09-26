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

    const payload = JSON.parse(event.body || "{}");

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

    const cleanBase64 = base64Data.replace(
      /^data:[^;]+;base64,/,
      ""
    );

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

    if (!clientEmail || !rawPrivateKey) {
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error:
            "Google Drive credentials are not configured.",
          details:
            "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY.",
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

    /*
      Supports both:
      1. Direct PEM private key
      2. Full Google service-account JSON
    */

    try {
      const trimmedKey = rawPrivateKey.trim();

      if (trimmedKey.startsWith("{")) {
        const parsedKey = JSON.parse(trimmedKey);

        if (parsedKey.private_key) {
          rawPrivateKey = parsedKey.private_key;
        }
      }
    } catch (jsonError) {
      console.warn(
        "GOOGLE_PRIVATE_KEY is not JSON. Treating it as PEM."
      );
    }

    // Remove accidental surrounding quotes
    let privateKey = rawPrivateKey
      .trim()
      .replace(/^["']/, "")
      .replace(/["']$/, "");

    // Convert escaped newlines to real newlines
    privateKey = privateKey.replace(/\\n/g, "\n");

    // Normalize Windows line endings
    privateKey = privateKey.replace(/\r/g, "");

    // Remove accidental spaces before/after
    privateKey = privateKey.trim();

    // =========================
    // Validate Private Key
    // =========================

    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      throw new Error(
        "GOOGLE_PRIVATE_KEY does not contain a valid BEGIN PRIVATE KEY header."
      );
    }

    if (!privateKey.includes("-----END PRIVATE KEY-----")) {
      throw new Error(
        "GOOGLE_PRIVATE_KEY does not contain a valid END PRIVATE KEY footer."
      );
    }

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
    } catch (permissionError) {
      console.warn(
        "Could not make file public:",
        permissionError?.message || permissionError
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
        fileName: uploadRes?.data?.name || finalFileName,
        mimeType:
          uploadRes?.data?.mimeType ||
          mimeType ||
          "image/jpeg",
        imageUrl: directImageUrl,
        fallbackUrl: fallbackDirectUrl,
        webViewLink:
          uploadRes?.data?.webViewLink || null,
        webContentLink:
          uploadRes?.data?.webContentLink || null,
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