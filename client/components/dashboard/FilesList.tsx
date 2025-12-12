import {
  Share2,
  Trash2,
  Download,
  FileText,
  Image,
  Video,
  Archive,
  File,
  Check,
} from "lucide-react";
import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, getBytes } from "firebase/storage";
import { getThemeColors } from "@/lib/theme-colors";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  shared: boolean;
  shareUrl?: string;
  storagePath?: string;
}

interface FilesListProps {
  files: FileItem[];
  loading: boolean;
  theme: string;
  onShare: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onCopyShareLink: (url: string) => void;
}

const getFileIcon = (filename: string) => {
  return { icon: File, color: "#3B82F6" };
};

export function FilesList({
  files,
  loading,
  theme,
  onShare,
  onDelete,
  onCopyShareLink,
}: FilesListProps) {
  const colors = getThemeColors(theme);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleteFileName, setDeleteFileName] = useState("");

  const handleDownload = async (file: FileItem) => {
    if (!file.storagePath) {
      alert("File storage path not found. Please try again.");
      return;
    }

    setDownloadingId(file.id);

    // Retry configuration
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000; // 1 second

    const downloadWithRetry = async (retryCount = 0): Promise<Uint8Array> => {
      try {
        const fileRef = ref(storage, file.storagePath);

        // Configure timeout - increase max time for larger files
        const maxDownloadBytes = 500 * 1024 * 1024; // 500MB max
        const bytes = await getBytes(fileRef, maxDownloadBytes);

        return bytes;
      } catch (storageError) {
        const errorMsg =
          storageError instanceof Error
            ? storageError.message
            : String(storageError);
        console.error(`Download attempt ${retryCount + 1} failed:`, errorMsg);

        // Check if we should retry
        if (
          (errorMsg.includes("retry-limit-exceeded") ||
            errorMsg.includes("network") ||
            errorMsg.includes("timeout")) &&
          retryCount < MAX_RETRIES
        ) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = INITIAL_DELAY * Math.pow(2, retryCount);
          console.log(
            `Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return downloadWithRetry(retryCount + 1);
        }

        // Check for common Firebase Storage errors
        if (
          errorMsg.includes("auth/unauthenticated") ||
          errorMsg.includes("permission-denied")
        ) {
          throw new Error("Access denied. Please try logging in again.");
        } else if (errorMsg.includes("storage/object-not-found")) {
          throw new Error(
            "File not found in storage. It may have been deleted.",
          );
        } else if (errorMsg.includes("retry-limit-exceeded")) {
          throw new Error(
            "Download timed out due to slow connection. Please check your internet and try again.",
          );
        } else if (errorMsg.includes("network")) {
          throw new Error(
            "Network error. Please check your connection and try again.",
          );
        } else {
          throw new Error(`Storage error: ${errorMsg}`);
        }
      }
    };

    try {
      // Download with retry logic
      const bytes = await downloadWithRetry();

      // Create blob with proper type
      const blob = new Blob([bytes], { type: "application/octet-stream" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name || "download";
      link.style.display = "none";

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to download file: ${errorMessage}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyShare = (fileId: string, shareUrl?: string) => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(fileId);
      setTimeout(() => setCopiedId(null), 2000);
      onCopyShareLink(shareUrl);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.sidebar,
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: colors.text }}
          >
            Files
            {files.length > 0 && (
              <span
                className="ml-3 px-2 py-1 rounded text-xs font-medium inline-block"
                style={{
                  backgroundColor: colors.accentLight,
                  color: colors.primary,
                }}
              >
                {files.length}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div style={{ borderColor: colors.border }}>
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block">
              <div
                className="w-8 h-8 border-3 border-transparent rounded-full animate-spin"
                style={{
                  borderTopColor: colors.primary,
                  borderRightColor: colors.primary,
                }}
              ></div>
            </div>
            <p
              className="mt-4 text-sm"
              style={{
                color: colors.textSecondary,
              }}
            >
              Loading your files...
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: colors.border,
              }}
            >
              <File
                className="w-6 h-6"
                style={{ color: colors.textSecondary }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{
                color: colors.text,
              }}
            >
              No files yet
            </p>
            <p
              className="text-xs mt-1"
              style={{
                color: colors.textSecondary,
              }}
            >
              Upload files to get started
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {files.map((file) => {
              const { icon: FileIcon, color } = getFileIcon(file.name);

              return (
                <div
                  key={file.id}
                  className="px-6 py-3 flex items-center justify-between group hover:bg-opacity-50 transition-all duration-200 hover:scale-[1.02] origin-left cursor-pointer"
                  style={{
                    backgroundColor: colors.card,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sidebar;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.card;
                  }}
                >
                  {/* File Icon & Name */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${color}15`,
                      }}
                    >
                      <FileIcon className="w-4 h-4" style={{ color }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: colors.text,
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div
                        className="flex items-center gap-3 mt-0.5 text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.uploadedAt}</span>
                        {file.shared && (
                          <>
                            <span>•</span>
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                color: "#22C55E",
                              }}
                            >
                              ✓ Shared
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm active:scale-95"
                      style={{
                        backgroundColor:
                          downloadingId === file.id
                            ? colors.accentLight
                            : "transparent",
                        color: colors.primary,
                      }}
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {!file.shared ? (
                      <button
                        onClick={() => onShare(file.id)}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm active:scale-95"
                        style={{
                          color: colors.textSecondary,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            colors.accentLight;
                          e.currentTarget.style.color = colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = colors.textSecondary;
                        }}
                        title="Share file"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCopyShare(file.id, file.shareUrl)}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm active:scale-95"
                        style={{
                          backgroundColor:
                            copiedId === file.id
                              ? "rgba(34, 197, 94, 0.15)"
                              : "transparent",
                          color:
                            copiedId === file.id ? "#22C55E" : colors.primary,
                        }}
                        title="Copy share link"
                      >
                        {copiedId === file.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDeleteFileId(file.id);
                        setDeleteFileName(file.name);
                        setDeleteConfirmOpen(true);
                      }}
                      disabled={deletingId === file.id}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm active:scale-95"
                      style={{
                        color: "#EF4444",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(239, 68, 68, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteFileId(null);
          setDeleteFileName("");
        }}
        onConfirm={async () => {
          if (deleteFileId) {
            setDeletingId(deleteFileId);
            await onDelete(deleteFileId);
            setDeleteConfirmOpen(false);
            setDeleteFileId(null);
            setDeleteFileName("");
            setDeletingId(null);
          }
        }}
        title="Delete File?"
        description={`Are you sure you want to delete "${deleteFileName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        theme={theme}
        loading={deletingId === deleteFileId}
      />
    </div>
  );
}
