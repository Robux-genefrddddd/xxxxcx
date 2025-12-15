import { X, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  theme: string;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  theme,
  loading = false,
}: ConfirmDialogProps) {
  const colors = getThemeColors(theme);

  if (!isOpen) return null;

  const Icon = isDangerous ? Trash2 : CheckCircle;
  const iconColor = isDangerous ? "#EF4444" : colors.primary;
  const iconBgColor = isDangerous
    ? "rgba(239, 68, 68, 0.1)"
    : `${colors.primary}15`;
  const confirmBgColor = isDangerous ? "#EF4444" : colors.accentLight;
  const confirmTextColor = isDangerous ? "white" : colors.primary;

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
        className="w-full max-w-xs animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: "#111214",
          border: "1px solid #1F2124",
          borderRadius: "16px",
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "#1F2124" }}>
          <h2
            className="text-sm font-semibold"
            style={{ color: "#E5E7EB", letterSpacing: "-0.01em" }}
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        {description && (
          <div className="px-5 py-3">
            <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
              {description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div
          className="px-5 py-3 flex gap-2 border-t"
          style={{ borderColor: "#1F2124" }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-3 text-xs font-medium transition-all disabled:opacity-50 hover:opacity-90"
            style={{
              backgroundColor: "transparent",
              color: "#D1D5DB",
              border: "1px solid #374151",
              borderRadius: "10px",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 px-3 text-xs font-medium transition-all disabled:opacity-50 hover:opacity-90"
            style={{
              backgroundColor: isDangerous ? "#DC2626" : colors.primary,
              color: "white",
              borderRadius: "10px",
            }}
          >
            {loading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
