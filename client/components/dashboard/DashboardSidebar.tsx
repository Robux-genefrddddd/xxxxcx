import { Link } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getThemeColors } from "@/lib/theme-colors";
import { UserRole, canAccessAdmin } from "@/lib/auth-utils";

interface UserPlan {
  type: "free" | "premium";
  storageLimit: number;
  storageUsed: number;
}

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName: string;
  userEmail: string;
  theme: string;
  userPlan?: UserPlan;
  onUpgradeClick?: () => void;
  userRole?: UserRole;
}

const getNavItems = (userRole?: UserRole) => {
  const items = [
    {
      id: "files",
      label: "Files",
      icon: null,
      imageUrl:
        "https://cdn-icons-png.freepik.com/256/7795/7795785.png?semt=ais_white_label",
    },
    {
      id: "shared",
      label: "Shared",
      icon: null,
      imageUrl: "https://cdn-icons-png.flaticon.com/512/666/666175.png",
    },
    {
      id: "users",
      label: "Manage Users",
      icon: null,
      imageUrl:
        "https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png",
    },
    {
      id: "theme",
      label: "Theme",
      icon: null,
      imageUrl: "https://cdn-icons-png.flaticon.com/512/3159/3159205.png",
    },
  ];

  if (userRole && canAccessAdmin(userRole)) {
    items.push({ id: "admin", label: "Admin Panel", icon: Shield });
  }

  return items;
};

export function DashboardSidebar({
  activeTab,
  onTabChange,
  userName,
  userEmail,
  theme,
  userPlan,
  onUpgradeClick,
  userRole,
}: DashboardSidebarProps) {
  const colors = getThemeColors(theme);
  const storageUsedMB = userPlan ? userPlan.storageUsed / (1024 * 1024) : 0;
  const storagePercentage =
    userPlan && userPlan.storageLimit !== Infinity
      ? (userPlan.storageUsed / userPlan.storageLimit) * 100
      : 0;

  const getStorageLimitDisplay = () => {
    if (!userPlan) return { text: "1 T", showLimit: true };
    if (userPlan.type === "premium")
      return { text: "Unlimited", showLimit: false };
    const limitTB = userPlan.storageLimit / (1024 * 1024 * 1024 * 1024);
    if (limitTB >= 1)
      return { text: `${limitTB.toFixed(0)} T`, showLimit: true };
    const limitGB = userPlan.storageLimit / (1024 * 1024 * 1024);
    if (limitGB >= 1)
      return { text: `${limitGB.toFixed(0)} GB`, showLimit: true };
    return { text: `${(limitGB * 1024).toFixed(0)} MB`, showLimit: true };
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = getNavItems(userRole);

  return (
    <aside
      className="w-64 text-white p-6 flex flex-col fixed left-0 top-0 h-screen overflow-y-auto border-r"
      style={{
        backgroundColor: colors.sidebar,
        borderColor: colors.border,
        color: colors.sidebarForeground,
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 mb-12 hover:opacity-75 transition-opacity"
      >
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F91e2732f1c03487e879c66ee97e72712%2Fee08390eccc04e8dbea3ce5415d97e92?format=webp&width=800"
          alt="PinPinCloud"
          className="w-8 h-8"
        />
        <span
          className="text-base font-bold tracking-tight"
          style={{ color: colors.sidebarForeground }}
        >
          PinPinCloud
        </span>
      </Link>

      {/* Navigation */}
      <nav className="space-y-0.5 flex-1 mb-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors text-left border-l-2.5 rounded-lg"
              style={{
                backgroundColor: isActive
                  ? `${colors.primary}15`
                  : "transparent",
                borderColor: isActive ? colors.primary : "transparent",
                color: isActive
                  ? colors.sidebarForeground
                  : colors.textSecondary,
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="w-4 h-4 object-contain"
                  style={{
                    filter:
                      item.id === "files"
                        ? "brightness(1) invert(1)"
                        : isActive
                          ? "brightness(1) invert(1)"
                          : "brightness(1.5) invert(1) opacity(0.9)",
                  }}
                />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div
        className="pt-6 border-t space-y-4"
        style={{ borderColor: colors.border }}
      >
        {/* User Card */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: "transparent",
            }}
          >
            <img
              src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
              alt="User Avatar"
              className="w-6 h-6 object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: colors.sidebarForeground }}
            >
              {userName}
            </p>
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              {userEmail}
            </p>
          </div>
        </div>

        {/* Storage Info */}
        {userPlan ? (
          <div className="space-y-2 bg-black bg-opacity-20 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <p
                className="text-xs uppercase font-medium tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Storage
              </p>
              <p
                className="text-xs font-semibold"
                style={{ color: colors.sidebarForeground }}
              >
                {storageUsedMB.toFixed(0)} MB
              </p>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{
                backgroundColor: colors.border,
              }}
            >
              <div
                className="h-1.5 transition-all duration-500"
                style={{
                  width: `${Math.min(storagePercentage, 100)}%`,
                  backgroundColor:
                    storagePercentage > 90
                      ? "#EF4444"
                      : storagePercentage > 70
                        ? "#F59E0B"
                        : colors.primary,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {(() => {
                  const limit = getStorageLimitDisplay();
                  return limit.showLimit ? `${limit.text} limit` : limit.text;
                })()}
              </p>
              <p
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor:
                    userPlan.type === "premium"
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(100, 116, 139, 0.15)",
                  color:
                    userPlan.type === "premium" ? "#22C55E" : colors.primary,
                }}
              >
                {userPlan.type === "premium" ? "Premium" : "Free"}
              </p>
            </div>
          </div>
        ) : null}

        {userPlan && userPlan.type === "free" && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="w-full px-3 py-2 text-xs font-semibold transition-colors border rounded-lg"
            style={{
              backgroundColor: colors.accentLight,
              color: colors.primary,
              borderColor: colors.primary,
            }}
          >
            Upgrade
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-xs transition-colors border rounded-lg flex items-center justify-center gap-2"
          style={{
            backgroundColor: "transparent",
            borderColor: colors.border,
            color: colors.textSecondary,
          }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
