import { X, Lock, Link2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { getThemeColors } from "@/lib/theme-colors";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  theme: string;
  onShareComplete?: () => void;
}

export function ShareFileModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  theme,
  onShareComplete,
}: ShareFileModalProps) {
  const colors = getThemeColors(theme);
  const [shareType, setShareType] = useState<"link" | "password">("link");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"options" | "confirm">("options");
  const [showPassword, setShowPassword] = useState(false);

  const generateShareUrl = () => {
    return `${window.location.origin}/share/${fileId}`;
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      const url = generateShareUrl();
      const fileRef = doc(db, "files", fileId);

      const updateData: any = {
        shared: true,
        shareUrl: url,
        sharePassword: shareType === "password" ? password : null,
        shareCreatedAt: new Date().toISOString(),
      };

      await updateDoc(fileRef, updateData);
      setShareUrl(url);
      setStep("confirm");

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      alert("Failed to share file");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("options");
    setPassword("");
    setShowPassword(false);
    setShareUrl("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: "#111214",
          border: "1px solid #1F2124",
          borderRadius: "16px",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b"
          style={{
            borderColor: "#1F2124",
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "#E5E7EB", letterSpacing: "-0.01em" }}
          >
            {step === "options" ? "Share File" : "Share Link Ready"}
          </h2>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            {fileName.length > 35
              ? fileName.substring(0, 32) + "..."
              : fileName}
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {step === "options" ? (
            <div className="space-y-4">
              {/* Share Type Selection */}
              <div className="space-y-2">
                {[
                  {
                    type: "link",
                    label: "Public Link",
                    desc: "Anyone with the link can view",
                    Icon: Link2,
                  },
                  {
                    type: "password",
                    label: "Password Protected",
                    desc: "Requires a password to access",
                    Icon: Lock,
                  },
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() =>
                      setShareType(option.type as "link" | "password")
                    }
                    className="w-full p-3 rounded-lg border transition-all text-left hover:opacity-90"
                    style={{
                      backgroundColor:
                        shareType === option.type ? "#1A1D20" : "transparent",
                      borderColor:
                        shareType === option.type ? colors.primary : "#374151",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <option.Icon
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{
                          color:
                            shareType === option.type
                              ? colors.primary
                              : "#6B7280",
                        }}
                      />
                      <div className="flex-1">
                        <p
                          className="text-xs font-medium"
                          style={{
                            color:
                              shareType === option.type ? "#F3F4F6" : "#D1D5DB",
                          }}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                          {option.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Password Input */}
              {shareType === "password" && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-medium" style={{ color: "#D1D5DB" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 rounded-lg border text-xs transition-all pr-8"
                      style={{
                        backgroundColor: "#1A1D20",
                        borderColor: "#374151",
                        color: "#E5E7EB",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: "#6B7280" }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    At least 6 characters
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-center py-2">
              <div className="text-sm font-medium" style={{ color: "#10B981" }}>
                ✓ Link created successfully
              </div>
              <div
                className="p-3 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: "#1A1D20",
                  borderColor: "#374151",
                  border: "1px solid #374151",
                }}
              >
                <p
                  className="text-xs break-all font-mono"
                  style={{ color: "#9CA3AF" }}
                >
                  {shareUrl}
                </p>
              </div>
              {shareType === "password" && (
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  Password protected: <strong>{password}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex gap-2"
          style={{
            borderColor: "#1F2124",
          }}
        >
          {step === "options" ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 text-xs font-medium rounded transition-all hover:opacity-90"
                style={{
                  backgroundColor: "transparent",
                  color: "#D1D5DB",
                  border: "1px solid #374151",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={
                  loading || (shareType === "password" && password.length < 6)
                }
                className="flex-1 py-2 px-3 text-xs font-medium rounded transition-all disabled:opacity-50 hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                  color: "white",
                }}
              >
                {loading ? "Creating..." : "Share"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-3 text-xs font-medium rounded transition-all hover:opacity-90"
                style={{
                  backgroundColor: "transparent",
                  color: "#D1D5DB",
                  border: "1px solid #374151",
                }}
              >
                New
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 text-xs font-medium rounded transition-all flex items-center justify-center gap-1 hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                  color: "white",
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
