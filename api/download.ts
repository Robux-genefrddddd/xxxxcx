import { IncomingMessage, ServerResponse } from "http";

function setJsonHeader(res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  setJsonHeader(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

async function parseRequestBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { storagePath, fileName } = body as { storagePath?: string; fileName?: string };

    if (!storagePath) {
      return sendJson(res, 400, { error: "Storage path is required" });
    }

    console.log("Download request - storagePath:", storagePath);

    const firebaseStorageBucket = "keysystem-d0b86-8df89.firebasestorage.app";
    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseStorageBucket}/o/${encodedPath}?alt=media`;

    console.log("Generated download URL:", downloadUrl);

    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        return sendJson(res, response.status, {
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
      res.statusCode = 200;
      res.end(Buffer.from(buffer));
    } catch (fetchError) {
      console.error("Error fetching from Firebase Storage:", fetchError);
      return sendJson(res, 500, {
        error: "Failed to fetch file from storage",
      });
    }
  } catch (error) {
    console.error("File download error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    return sendJson(res, 500, { error: `Download failed: ${errorMsg}` });
  }
}
