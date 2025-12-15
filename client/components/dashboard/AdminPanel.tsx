import { useState } from "react";
import { Key, Users, AlertCircle, BarChart3 } from "lucide-react";
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
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b" style={{ borderColor: colors.border }}>
        <h2
          className="text-lg font-semibold pb-3"
          style={{ color: colors.text }}
        >
          Admin
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div
        className="flex gap-2 flex-wrap border-b"
        style={{ borderColor: colors.border }}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors border-b-2 -mb-1"
            style={{
              backgroundColor: "transparent",
              borderBottomColor:
                activeTab === tab.id ? colors.primary : "transparent",
              color: activeTab === tab.id ? colors.text : colors.textSecondary,
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline text-xs font-medium">
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
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
