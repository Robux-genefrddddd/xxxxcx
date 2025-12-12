import { useState, useEffect } from "react";
import { AlertCircle, Save, Zap, Shield } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole, canToggleMaintenance } from "@/lib/auth-utils";

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  mode: "warning" | "global";
}

interface AdminMaintenanceModeProps {
  theme: string;
  userRole: UserRole;
}

export function AdminMaintenanceMode({
  theme,
  userRole,
}: AdminMaintenanceModeProps) {
  const colors = getThemeColors(theme);
  const [config, setConfig] = useState<MaintenanceConfig>({
    enabled: false,
    message:
      "The system is currently under maintenance. Please try again later.",
    mode: "warning",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const configDoc = await getDoc(doc(db, "appConfig", "maintenance"));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setConfig({
          enabled: data.enabled || false,
          message:
            data.message ||
            "The system is currently under maintenance. Please try again later.",
          mode: data.mode || "warning",
        });
      }
    } catch (error) {
      console.error("Error loading maintenance config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: MaintenanceConfig) => {
    try {
      await setDoc(doc(db, "appConfig", "maintenance"), {
        enabled: newConfig.enabled,
        message: newConfig.message,
        mode: newConfig.mode,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving maintenance config:", error);
    }
  };

  const handleToggleMaintenance = () => {
    if (!canToggleMaintenance(userRole)) {
      alert("You don't have permission to toggle maintenance mode");
      return;
    }
    const newConfig = { ...config, enabled: !config.enabled };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleMessageChange = (newMessage: string) => {
    const newConfig = { ...config, message: newMessage };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleModeChange = (newMode: "warning" | "global") => {
    if (!canToggleMaintenance(userRole)) {
      alert("You don't have permission to change maintenance mode");
      return;
    }
    const newConfig = { ...config, mode: newMode };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  if (!canToggleMaintenance(userRole)) {
    return (
      <div
        className="p-8 rounded-xl border"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
          >
            <Shield className="w-6 h-6" style={{ color: "#EF4444" }} />
          </div>
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ color: colors.text }}
            >
              Access Denied
            </h3>
            <p style={{ color: colors.textSecondary }} className="text-sm mt-2">
              Only founders can manage maintenance mode.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold" style={{ color: colors.text }}>
          🔧 Maintenance Mode
        </h3>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Control site-wide maintenance settings and user notifications
        </p>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Enable Switch */}
        <div
          className="p-6 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold" style={{ color: colors.text }}>
                Status
              </h4>
              <p
                style={{ color: colors.textSecondary }}
                className="text-sm mt-1"
              >
                Enable maintenance mode
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            className="relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: config.enabled
                ? "rgba(34, 197, 94, 0.2)"
                : colors.sidebar,
              border: `2px solid ${config.enabled ? "#22C55E" : colors.border}`,
            }}
          >
            <span
              className="inline-block h-8 w-8 transform rounded-full bg-gradient-to-r transition-all duration-300"
              style={{
                background: config.enabled
                  ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
                  : colors.sidebar,
                transform: config.enabled
                  ? "translateX(38px)"
                  : "translateX(2px)",
              }}
            />
          </button>
          <div className="mt-4">
            <div
              className="text-sm font-semibold"
              style={{
                color: config.enabled ? "#22C55E" : colors.textSecondary,
              }}
            >
              {config.enabled ? "🟢 Active" : "⚫ Inactive"}
            </div>
          </div>
        </div>

        {/* Mode Selector - Warning */}
        <div
          className={`p-6 rounded-xl border transition-all cursor-pointer ${
            config.mode === "warning" ? "hover:shadow-lg" : "opacity-60"
          }`}
          style={{
            backgroundColor: colors.card,
            borderColor:
              config.mode === "warning" ? colors.accent : colors.border,
            boxShadow:
              config.mode === "warning"
                ? `0 0 0 2px ${colors.accent}33`
                : "none",
          }}
          onClick={() => handleModeChange("warning")}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: colors.accentLight,
              }}
            >
              <AlertCircle
                className="w-5 h-5"
                style={{ color: colors.accent }}
              />
            </div>
            <h4 className="font-semibold" style={{ color: colors.text }}>
              Warning Modal
            </h4>
          </div>
          <p style={{ color: colors.textSecondary }} className="text-sm">
            Shows a popup. Users can dismiss it and continue
          </p>
        </div>

        {/* Mode Selector - Global */}
        <div
          className={`p-6 rounded-xl border transition-all cursor-pointer ${
            config.mode === "global" ? "hover:shadow-lg" : "opacity-60"
          }`}
          style={{
            backgroundColor: colors.card,
            borderColor:
              config.mode === "global" ? colors.accent : colors.border,
            boxShadow:
              config.mode === "global"
                ? `0 0 0 2px ${colors.accent}33`
                : "none",
          }}
          onClick={() => handleModeChange("global")}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
              }}
            >
              <Zap className="w-5 h-5" style={{ color: "#EF4444" }} />
            </div>
            <h4 className="font-semibold" style={{ color: colors.text }}>
              Global Block
            </h4>
          </div>
          <p style={{ color: colors.textSecondary }} className="text-sm">
            Full site blackout - entire site becomes inaccessible
          </p>
        </div>
      </div>

      {/* Message Editor */}
      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <label
          className="block font-semibold mb-3 flex items-center gap-2"
          style={{ color: colors.text }}
        >
          <span>✉️ Maintenance Message</span>
          <span
            className="text-xs uppercase tracking-wide px-2 py-1 rounded"
            style={{
              backgroundColor: colors.accentLight,
              color: colors.accent,
            }}
          >
            {config.mode}
          </span>
        </label>
        <textarea
          value={config.message}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="Enter the message users will see during maintenance..."
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none resize-none transition-all"
          rows={4}
          style={{
            backgroundColor: colors.sidebar,
            borderColor: colors.border,
            color: colors.text,
          }}
        />
        <p style={{ color: colors.textSecondary }} className="text-xs mt-3">
          This message will be displayed to all users when maintenance mode is
          enabled.
        </p>
      </div>

      {/* Info Box */}
      {config.enabled && (
        <div
          className="p-6 rounded-xl border flex items-start gap-4 animate-pulse"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderColor: "rgba(59, 130, 246, 0.3)",
          }}
        >
          <div
            className="p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
          >
            <AlertCircle
              className="w-5 h-5"
              style={{ color: colors.primary }}
            />
          </div>
          <div>
            <p className="font-semibold" style={{ color: colors.text }}>
              ⚡ Maintenance Mode Active
            </p>
            <p style={{ color: colors.textSecondary }} className="text-sm mt-2">
              Users will see the{" "}
              {config.mode === "warning"
                ? "warning modal"
                : "maintenance screen"}
              . Admins can press{" "}
              <kbd
                style={{
                  backgroundColor: colors.sidebar,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                F12
              </kbd>{" "}
              to bypass the maintenance screen and access the admin panel.
            </p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {config.enabled && (
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: colors.sidebar,
            borderColor: colors.border,
          }}
        >
          <h4 className="font-semibold mb-4" style={{ color: colors.text }}>
            👁️ Live Preview
          </h4>
          <div
            className="p-8 rounded-lg border text-center"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: "#EF4444" }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: "#EF4444" }}>
              {config.mode === "global"
                ? "Site Under Maintenance"
                : "Maintenance Notice"}
            </h3>
            <p style={{ color: colors.text }} className="max-w-sm mx-auto">
              {config.message}
            </p>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div
        className="p-4 rounded-lg border flex items-center justify-between"
        style={{
          backgroundColor: colors.sidebar,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: config.enabled
                ? "#22C55E"
                : colors.textSecondary,
            }}
          />
          <span style={{ color: colors.text }} className="text-sm font-medium">
            Status:{" "}
            {config.enabled ? "🟢 Maintenance Active" : "⚫ System Normal"}
          </span>
        </div>
        <span style={{ color: colors.textSecondary }} className="text-xs">
          Mode:{" "}
          {config.mode === "global" ? "🚫 Global Block" : "⚠️ Warning Modal"}
        </span>
      </div>
    </div>
  );
}
