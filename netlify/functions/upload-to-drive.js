// netlify/functions/upload-to-drive.js
// Netlify Serverless Function for uploading images securely to Google Drive API
import { google } from 'googleapis';
import { Readable } from 'stream';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS Preflight OK' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { fileName, mimeType, base64Data, folderId } = payload;

    if (!base64Data || !fileName) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: fileName or base64Data' }),
      };
    }

    // Clean base64 string if it contains data URL prefix
    const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9\/\+]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // Retrieve environment variables
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    // OAuth2 fallback credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    let authClient = null;

    // 1. Service Account Authentication (Preferred for background servers)
    if (clientEmail && privateKey) {
      // Fix potential escaped newlines from environment variable strings
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      authClient = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/drive']
      );
    } 
    // 2. OAuth2 Refresh Token Authentication
    else if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      authClient = oauth2Client;
    } 
    else {
      // If server credentials are not yet configured in Netlify environment variables
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Google Drive credentials are not configured in Netlify Environment Variables.',
          details: 'Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY (or GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) in your Netlify Site Settings.',
        }),
      };
    }

    const drive = google.drive({ version: 'v3', auth: authClient });

    // File metadata
    const fileMetadata = {
      name: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      parents: targetFolderId ? [targetFolderId] : undefined,
    };

    const media = {
      mimeType: mimeType || 'image/jpeg',
      body: bufferStream,
    };

    // Upload file to Google Drive
    const uploadRes = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    const fileId = uploadRes.data.id;

    // Make file publicly readable so it can be loaded in web portfolio <img> tags
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.warn('Warning: Could not set public permission on Drive file:', permError.message);
    }

    // Direct Google CDN image URLs for reliable display in web browsers:
    // https://lh3.googleusercontent.com/d/FILE_ID or drive.google.com thumbnail
    const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const fallbackDirectUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        fileId: fileId,
        fileName: uploadRes.data.name,
        imageUrl: directImageUrl,
        fallbackUrl: fallbackDirectUrl,
        webViewLink: uploadRes.data.webViewLink,
      }),
    };
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Internal Server Error during upload',
      }),
    };
  }
};
