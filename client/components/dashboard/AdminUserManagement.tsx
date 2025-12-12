import { useState, useEffect } from "react";
import { Trash2, Shield, Award, Zap, User } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  UserRole,
  canPerformCriticalActions,
  canManageUsers,
} from "@/lib/auth-utils";

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  plan: "free" | "premium" | "lifetime";
  storageUsed: number;
  createdAt: string;
}

interface AdminUserManagementProps {
  theme: string;
  userRole: UserRole;
  currentUserId: string;
}

export function AdminUserManagement({
  theme,
  userRole,
  currentUserId,
}: AdminUserManagementProps) {
  const colors = getThemeColors(theme);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "userRoles"));
      const userList: AdminUser[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const roleData = userDoc.data();

        let plan: "free" | "premium" | "lifetime" = "free";
        let storageUsed = 0;
        try {
          const planDoc = await getDoc(doc(db, "userPlans", userId));
          if (planDoc.exists()) {
            plan = planDoc.data().type || "free";
            storageUsed = planDoc.data().storageUsed || 0;
          }
        } catch (error) {
          console.error(`Error loading plan for ${userId}:`, error);
        }

        let email = "";
        let name = "";
        try {
          const fileQuery = query(collection(db, "files"));
          const filesSnapshot = await getDocs(fileQuery);
          const userFile = filesSnapshot.docs.find(
            (doc) => doc.data().userId === userId,
          );
          if (userFile) {
          }
        } catch (error) {
          console.error(`Error loading user info for ${userId}:`, error);
        }

        userList.push({
          id: userId,
          email: email || `user_${userId.substring(0, 6)}`,
          name: name || "Unknown",
          role: roleData.role || "user",
          plan,
          storageUsed,
          createdAt: new Date().toLocaleDateString(),
        });
      }

      setUsers(userList);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserId) {
      alert("Cannot change your own role");
      return;
    }

    try {
      await updateDoc(doc(db, "userRoles", userId), { role: newRole });
      loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert("Cannot delete your own account");
      return;
    }

    if (!canPerformCriticalActions(userRole)) {
      alert("You don't have permission to delete users");
      return;
    }

    try {
      await deleteDoc(doc(db, "userRoles", userId));
      await deleteDoc(doc(db, "userPlans", userId));
      loadUsers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + "MB";
  };

  const getRoleInfo = (role: UserRole) => {
    const roleMap = {
      founder: { emoji: "👑", label: "Founder", color: "#22C55E" },
      admin: { emoji: "🔐", label: "Admin", color: colors.primary },
      user: { emoji: "👤", label: "User", color: colors.textSecondary },
    };
    return roleMap[role] || roleMap.user;
  };

  const getPlanInfo = (plan: string) => {
    const planMap = {
      lifetime: {
        emoji: "♾️",
        label: "Lifetime",
        color: "#A855F7",
        icon: Award,
      },
      premium: { emoji: "⭐", label: "Premium", color: "#22C55E", icon: Zap },
      free: { emoji: "🎯", label: "Free", color: colors.primary, icon: User },
    };
    return planMap[plan as keyof typeof planMap] || planMap.free;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold" style={{ color: colors.text }}>
          👥 User Management
        </h3>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Manage user roles, plans, and permissions
        </p>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-b-transparent"
            style={{ borderColor: colors.accent }}
          ></div>
        </div>
      ) : users.length === 0 ? (
        <div
          className="p-12 rounded-xl border text-center"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p style={{ color: colors.textSecondary }}>No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {users.map((user) => {
            const roleInfo = getRoleInfo(user.role);
            const planInfo = getPlanInfo(user.plan);
            const isCurrentUser = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className="p-5 rounded-xl border transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: isCurrentUser ? 0.8 : 1,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: colors.sidebar }}
                    >
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold truncate"
                        style={{ color: colors.text }}
                      >
                        {user.email}
                      </div>
                      {isCurrentUser && (
                        <div
                          className="text-xs mt-1 px-2 py-0.5 rounded inline-block"
                          style={{
                            backgroundColor: colors.accentLight,
                            color: colors.accent,
                          }}
                        >
                          You
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor:
                        roleInfo.label === "Founder"
                          ? "rgba(34, 197, 94, 0.15)"
                          : roleInfo.label === "Admin"
                            ? "rgba(59, 130, 246, 0.15)"
                            : "rgba(156, 163, 175, 0.15)",
                      color: roleInfo.color,
                    }}
                  >
                    <span>{roleInfo.emoji}</span>
                    <span>{roleInfo.label}</span>
                  </div>

                  {/* Plan Badge */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor:
                        user.plan === "lifetime"
                          ? "rgba(168, 85, 247, 0.15)"
                          : user.plan === "premium"
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(59, 130, 246, 0.15)",
                      color: planInfo.color,
                    }}
                  >
                    <span>{planInfo.emoji}</span>
                    <span>{planInfo.label}</span>
                  </div>
                </div>

                {/* Stats */}
                <div
                  className="p-3 rounded-lg space-y-2 mb-4"
                  style={{ backgroundColor: colors.sidebar }}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: colors.textSecondary }}>
                      Storage Used
                    </span>
                    <span
                      style={{ color: colors.text }}
                      className="font-semibold"
                    >
                      {formatStorage(user.storageUsed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: colors.textSecondary }}>Joined</span>
                    <span
                      style={{ color: colors.text }}
                      className="font-semibold"
                    >
                      {user.createdAt}
                    </span>
                  </div>
                </div>

                {/* Role Selector */}
                {canManageUsers(userRole) && !isCurrentUser && (
                  <div className="mb-4">
                    <label
                      className="text-xs block mb-2 uppercase tracking-wide"
                      style={{ color: colors.textSecondary }}
                    >
                      Change Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        updateUserRole(user.id, e.target.value as UserRole)
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none transition-all"
                      style={{
                        backgroundColor: colors.sidebar,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">🔐 Admin</option>
                      <option value="founder">👑 Founder</option>
                    </select>
                  </div>
                )}

                {/* Actions */}
                {canManageUsers(userRole) &&
                  canPerformCriticalActions(userRole) &&
                  !isCurrentUser && (
                    <div>
                      {deleteConfirm === user.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                            style={{
                              backgroundColor: "rgba(239, 68, 68, 0.2)",
                              color: "#EF4444",
                            }}
                          >
                            ⚠️ Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              backgroundColor: colors.sidebar,
                              color: colors.textSecondary,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#EF4444",
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete User
                        </button>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="p-6 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Total Users
          </p>
          <p
            className="text-4xl font-bold mt-3"
            style={{ color: colors.accent }}
          >
            {users.length}
          </p>
        </div>
        <div
          className="p-6 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Admins & Founders
          </p>
          <p
            className="text-4xl font-bold mt-3"
            style={{ color: colors.primary }}
          >
            {
              users.filter((u) => u.role === "admin" || u.role === "founder")
                .length
            }
          </p>
        </div>
        <div
          className="p-6 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Premium Users
          </p>
          <p className="text-4xl font-bold mt-3" style={{ color: "#22C55E" }}>
            {users.filter((u) => u.plan !== "free").length}
          </p>
        </div>
      </div>
    </div>
  );
}
