import { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let app: admin.app.App;

try {
  // Get Firebase service account from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set"
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { storagePath, fileName } = req.body;

    // Validate required fields
    if (!storagePath || typeof storagePath !== "string") {
      return res.status(400).json({ error: "storagePath is required" });
    }

    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({ error: "fileName is required" });
    }

    // Security: Prevent path traversal
    if (storagePath.includes("..") || storagePath.startsWith("/")) {
      return res.status(400).json({ error: "Invalid storagePath" });
    }

    if (!app) {
      return res
        .status(500)
        .json({ error: "Firebase not properly initialized" });
    }

    // Get reference to the file
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    // Generate signed URL valid for 1 hour
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      responseDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
      responseContentType: "application/octet-stream",
    });

    return res.status(200).json({ signedUrl });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating signed URL:", error);

    return res.status(500).json({ error: "Failed to generate signed URL" });
  }
};
