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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: colors.text }}>
          Admin Console
        </h2>
        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          System administration and configuration
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 border"
            style={{
              backgroundColor:
                activeTab === tab.id ? colors.primary : "transparent",
              borderColor:
                activeTab === tab.id ? colors.primary : colors.border,
              color: activeTab === tab.id ? "#FFFFFF" : colors.textSecondary,
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline text-xs">{tab.label}</span>
          </button>
        ))}
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
