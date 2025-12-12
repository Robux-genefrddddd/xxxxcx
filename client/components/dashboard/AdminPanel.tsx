import { useState } from "react";
import { Key, Users, AlertCircle, BarChart3, Sparkles } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import { AdminKeyManagement } from "./AdminKeyManagement";
import { AdminUserManagement } from "./AdminUserManagement";
import { AdminMaintenanceMode } from "./AdminMaintenanceMode";
import { AdminGlobalStats } from "./AdminGlobalStats";
import {
  UserRole,
  canAccessAdmin,
  canManageKeys,
  canManageUsers,
  canViewStats,
} from "@/lib/auth-utils";

interface AdminPanelProps {
  theme: string;
  userRole: UserRole;
  userId: string;
}

type AdminTab = "keys" | "users" | "maintenance" | "stats";

export function AdminPanel({ theme, userRole, userId }: AdminPanelProps) {
  const colors = getThemeColors(theme);
  const [activeTab, setActiveTab] = useState<AdminTab>("keys");

  if (!canAccessAdmin(userRole)) {
    return null;
  }

  const adminTabs: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }> = [
    {
      id: "keys",
      label: "Premium Keys",
      icon: <Key className="w-5 h-5" />,
      visible: canManageKeys(userRole),
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      visible: canManageUsers(userRole),
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: <AlertCircle className="w-5 h-5" />,
      visible: true,
    },
    {
      id: "stats",
      label: "Statistics",
      icon: <BarChart3 className="w-5 h-5" />,
      visible: canViewStats(userRole),
    },
  ];

  const visibleTabs = adminTabs.filter((tab) => tab.visible);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: colors.accentLight }}
        >
          <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
          Admin Console
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div
        className="border rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div
          className="flex gap-1 p-3 flex-wrap"
          style={{
            backgroundColor: colors.sidebar,
            borderBottomColor: colors.border,
          }}
        >
          {visibleTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 relative group"
              style={{
                backgroundColor:
                  activeTab === tab.id ? colors.accent : "transparent",
                color: activeTab === tab.id ? "#FFFFFF" : colors.textSecondary,
              }}
            >
              <div
                className="transition-transform duration-300"
                style={{
                  transform:
                    activeTab === tab.id
                      ? "scale(1.2) rotate(10deg)"
                      : "scale(1)",
                }}
              >
                {tab.icon}
              </div>
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.accent }}
                ></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "keys" && canManageKeys(userRole) && (
          <AdminKeyManagement
            theme={theme}
            userRole={userRole}
            userId={userId}
          />
        )}

        {activeTab === "users" && canManageUsers(userRole) && (
          <AdminUserManagement
            theme={theme}
            userRole={userRole}
            currentUserId={userId}
          />
        )}

        {activeTab === "maintenance" && (
          <AdminMaintenanceMode theme={theme} userRole={userRole} />
        )}

        {activeTab === "stats" && canViewStats(userRole) && (
          <AdminGlobalStats theme={theme} userRole={userRole} />
        )}
      </div>
    </div>
  );
}
