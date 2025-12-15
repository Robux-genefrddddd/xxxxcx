import admin from "firebase-admin";

// Initialize Firebase Admin SDK once
let firebaseApp: admin.app.App | null = null;

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set",
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new Error("Firebase initialization failed");
  }
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { storagePath, fileName } = req.body;

    // Validate required fields
    if (!storagePath || typeof storagePath !== "string") {
      res.status(400).json({ error: "storagePath is required" });
      return;
    }

    if (!fileName || typeof fileName !== "string") {
      res.status(400).json({ error: "fileName is required" });
      return;
    }

    // Security: Prevent path traversal
    if (storagePath.includes("..") || storagePath.startsWith("/")) {
      res.status(400).json({ error: "Invalid storagePath" });
      return;
    }

    // Initialize Firebase if not already done
    const app = initializeFirebase();

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

    res.status(200).json({ signedUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
}
