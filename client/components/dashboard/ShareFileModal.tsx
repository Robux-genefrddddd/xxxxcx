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
        <div className="p-6 space-y-6">
          {step === "options" ? (
            <div className="space-y-6">
              {/* Share Type Selection */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: colors.text }}
                >
                  Share Type
                </label>
                <div className="space-y-2">
                  {[
                    {
                      type: "link",
                      label: "Public Link",
                      desc: "Anyone with the link can view",
                      icon: "🔗",
                    },
                    {
                      type: "password",
                      label: "Password Protected",
                      desc: "Requires a password to access",
                      icon: "🔐",
                    },
                  ].map((option) => (
                    <button
                      key={option.type}
                      onClick={() =>
                        setShareType(option.type as "link" | "password")
                      }
                      className="w-full p-3 rounded-xl border-2 transition-all text-left hover:opacity-80"
                      style={{
                        backgroundColor:
                          shareType === option.type
                            ? colors.accentLight
                            : "transparent",
                        borderColor:
                          shareType === option.type
                            ? colors.primary
                            : colors.border,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{option.icon}</span>
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: colors.text }}
                          >
                            {option.label}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: colors.textSecondary }}
                          >
                            {option.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Input */}
              {shareType === "password" && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      className="w-full px-4 py-3 rounded-xl border text-sm transition-all pr-10"
                      style={{
                        backgroundColor: colors.sidebar,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: colors.textSecondary }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p
                    className="text-xs mt-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Passwords should be at least 6 characters
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div
                className="p-3 rounded-xl border space-y-2"
                style={{
                  backgroundColor: colors.sidebar,
                  borderColor: colors.border,
                }}
              >
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  ✓ Shared files are only accessible via direct link
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  ✓ Recipients can download and view the file
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                }}
              >
                <Check className="w-8 h-8" style={{ color: "#22C55E" }} />
              </div>

              <div>
                <h3 className="font-bold text-lg" style={{ color: "#22C55E" }}>
                  Share Link Ready!
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  Your file is ready to share
                </p>
              </div>

              <div
                className="p-3 rounded-xl border-2 overflow-hidden"
                style={{
                  backgroundColor: colors.sidebar,
                  borderColor: colors.primary,
                }}
              >
                <p
                  className="text-xs break-all font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  {shareUrl}
                </p>
              </div>

              {shareType === "password" && (
                <div
                  className="p-3 rounded-xl border-l-4"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderLeftColor: colors.primary,
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Password protected with: <strong>{password}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t space-y-3"
          style={{
            borderColor: colors.border,
          }}
        >
          {step === "options" ? (
            <>
              <button
                onClick={handleShare}
                disabled={
                  loading || (shareType === "password" && password.length < 6)
                }
                className="w-full py-2 px-4 rounded-xl font-medium transition-all disabled:opacity-50 hover:opacity-90"
                style={{
                  backgroundColor: colors.accentLight,
                  color: colors.primary,
                }}
              >
                {loading ? "Creating share link..." : "Create Share Link"}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl font-medium transition-all border hover:opacity-80"
                style={{
                  backgroundColor: "transparent",
                  borderColor: colors.border,
                  color: colors.textSecondary,
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 hover:opacity-90"
                style={{
                  backgroundColor: colors.accentLight,
                  color: colors.primary,
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="w-full py-2 px-4 rounded-xl font-medium transition-all border hover:opacity-80"
                style={{
                  backgroundColor: "transparent",
                  borderColor: colors.border,
                  color: colors.textSecondary,
                }}
              >
                Create Another Link
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl font-medium transition-all border hover:opacity-80"
                style={{
                  backgroundColor: "transparent",
                  borderColor: colors.border,
                  color: colors.textSecondary,
                }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
