import { Router, Request, Response } from "express";

const router = Router();

router.post("/download", async (req: Request, res: Response) => {
  try {
    const { storagePath } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: "Storage path is required" });
    }

    const firebaseStorageBucket = "keysystem-d0b86-8df89";
    const encodedPath = encodeURIComponent(storagePath);
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseStorageBucket}/o/${encodedPath}?alt=media`;

    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000;

    const downloadWithRetry = async (retryCount = 0): Promise<Response> => {
      try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (
          (errorMsg.includes("network") || errorMsg.includes("timeout")) &&
          retryCount < MAX_RETRIES
        ) {
          const delay = INITIAL_DELAY * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return downloadWithRetry(retryCount + 1);
        }

        throw error;
      }
    };

    const response = await downloadWithRetry();
    const buffer = await response.arrayBuffer();

    res.set("Content-Type", "application/octet-stream");
    res.set("Content-Length", String(buffer.byteLength));
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("File download error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    if (errorMsg.includes("404") || errorMsg.includes("not-found")) {
      return res.status(404).json({ error: "File not found" });
    }

    res.status(500).json({ error: "Download failed" });
  }
});

export { router as fileDownloadRouter };
