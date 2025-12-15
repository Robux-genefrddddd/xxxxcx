import { IncomingMessage, ServerResponse } from "http";

export default async function handler(
  req: IncomingMessage & { body?: Record<string, unknown> },
  res: ServerResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { storagePath, fileName } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: "Storage path is required" });
    }

    console.log("Download request - storagePath:", storagePath);

    const firebaseStorageBucket = "keysystem-d0b86-8df89.firebasestorage.app";
    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseStorageBucket}/o/${encodedPath}?alt=media`;

    console.log("Generated download URL:", downloadUrl);

    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Firebase Storage error: ${response.statusText}`,
        });
      }

      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      const contentLength = response.headers.get("content-length");

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName || "download"}"`,
      );

      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const buffer = await response.arrayBuffer();
      res.status(200).send(Buffer.from(buffer));
    } catch (fetchError) {
      console.error("Error fetching from Firebase Storage:", fetchError);
      return res.status(500).json({
        error: "Failed to fetch file from storage",
      });
    }
  } catch (error) {
    console.error("File download error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({ error: `Download failed: ${errorMsg}` });
  }
}
