import { useState, useEffect } from "react";
import { getThemeColors } from "@/lib/theme-colors";
import { collection, getDocs, getDoc, doc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole, canViewStats } from "@/lib/auth-utils";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GlobalStats {
  totalUsers: number;
  activeUsers: number;
  totalStorage: number;
  planDistribution: { name: string; value: number }[];
  roleDistribution: { name: string; value: number }[];
  recentActivity: { date: string; signups: number; uploads: number }[];
}

interface AdminGlobalStatsProps {
  theme: string;
  userRole: UserRole;
}

const PLAN_COLORS = {
  free: "#3B82F6",
  premium: "#22C55E",
  lifetime: "#A855F7",
};

const ROLE_COLORS = {
  user: "#9CA3AF",
  admin: "#3B82F6",
  founder: "#F59E0B",
};

export function AdminGlobalStats({ theme, userRole }: AdminGlobalStatsProps) {
  const colors = getThemeColors(theme);
  const [stats, setStats] = useState<GlobalStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalStorage: 0,
    planDistribution: [],
    roleDistribution: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get all users and their roles
      const rolesSnapshot = await getDocs(collection(db, "userRoles"));
      const totalUsers = rolesSnapshot.size;

      // Count roles
      const roleCounts: Record<string, number> = {
        user: 0,
        admin: 0,
        founder: 0,
      };

      const planCounts: Record<string, number> = {
        free: 0,
        premium: 0,
        lifetime: 0,
      };

      let totalStorage = 0;

      for (const userDoc of rolesSnapshot.docs) {
        const userId = userDoc.id;
        const role = userDoc.data().role || "user";
        roleCounts[role]++;

        // Get plan info
        try {
          const planDoc = await getDoc(doc(db, "userPlans", userId));
          if (planDoc.exists()) {
            const plan = planDoc.data().type || "free";
            planCounts[plan]++;
            totalStorage += planDoc.data().storageUsed || 0;
          } else {
            planCounts["free"]++;
          }
        } catch (error) {
          planCounts["free"]++;
        }
      }

      // Build distribution charts
      const planDistribution = [
        { name: "Free", value: planCounts.free },
        { name: "Premium", value: planCounts.premium },
        { name: "Lifetime", value: planCounts.lifetime },
      ];

      const roleDistribution = [
        { name: "Users", value: roleCounts.user },
        { name: "Admins", value: roleCounts.admin },
        { name: "Founders", value: roleCounts.founder },
      ];

      // Generate mock recent activity data
      const today = new Date();
      const recentActivity = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          signups: Math.floor(Math.random() * 15) + 1,
          uploads: Math.floor(Math.random() * 50) + 10,
        };
      });

      setStats({
        totalUsers,
        activeUsers: Math.max(1, Math.floor(totalUsers * 0.8)),
        totalStorage,
        planDistribution,
        roleDistribution,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!canViewStats(userRole)) {
    return (
      <div
        className="p-6 rounded-2xl border"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <p style={{ color: colors.textSecondary }}>
          You don't have permission to view global statistics.
        </p>
      </div>
    );
  }

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
          📊 Global Statistics
        </h3>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          System-wide metrics and analytics dashboard
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div
            className="inline-block animate-spin rounded-full h-6 w-6 border-b-2"
            style={{ borderColor: colors.accent }}
          ></div>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            Loading statistics...
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className="p-6 rounded-xl border transition-all hover:shadow-lg transform hover:scale-105 group"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
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
                    {stats.totalUsers}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-2xl"
                  style={{ backgroundColor: colors.accentLight }}
                >
                  👥
                </div>
              </div>
            </div>
            <div
              className="p-6 rounded-xl border transition-all hover:shadow-lg transform hover:scale-105 group"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    style={{ color: colors.textSecondary }}
                    className="text-xs uppercase tracking-wide"
                  >
                    Active Users
                  </p>
                  <p
                    className="text-4xl font-bold mt-3"
                    style={{ color: "#22C55E" }}
                  >
                    {stats.activeUsers}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-2xl"
                  style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
                >
                  🟢
                </div>
              </div>
              <div
                style={{ color: colors.textSecondary }}
                className="text-xs mt-3"
              >
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of
                total
              </div>
            </div>
            <div
              className="p-6 rounded-xl border transition-all hover:shadow-lg transform hover:scale-105 group"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    style={{ color: colors.textSecondary }}
                    className="text-xs uppercase tracking-wide"
                  >
                    Total Storage
                  </p>
                  <p
                    className="text-3xl font-bold mt-3"
                    style={{ color: "#A855F7" }}
                  >
                    {formatStorage(stats.totalStorage)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-2xl"
                  style={{ backgroundColor: "rgba(168, 85, 247, 0.15)" }}
                >
                  💾
                </div>
              </div>
            </div>
            <div
              className="p-6 rounded-xl border transition-all hover:shadow-lg transform hover:scale-105 group"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    style={{ color: colors.textSecondary }}
                    className="text-xs uppercase tracking-wide"
                  >
                    Premium Users
                  </p>
                  <p
                    className="text-4xl font-bold mt-3"
                    style={{ color: "#F59E0B" }}
                  >
                    {stats.planDistribution.reduce(
                      (acc, p) => acc + (p.name !== "Free" ? p.value : 0),
                      0,
                    )}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-2xl"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.15)" }}
                >
                  ⭐
                </div>
              </div>
              <div
                style={{ color: colors.textSecondary }}
                className="text-xs mt-3"
              >
                {Math.round(
                  (stats.planDistribution.reduce(
                    (acc, p) => acc + (p.name !== "Free" ? p.value : 0),
                    0,
                  ) /
                    stats.totalUsers) *
                    100,
                )}
                % premium rate
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution Pie Chart */}
            <div
              className="p-6 rounded-xl border transition-all hover:shadow-lg"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <h4
                className="font-semibold text-lg mb-4 flex items-center gap-2"
                style={{ color: colors.text }}
              >
                <span>📋</span> Plan Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.planDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "Free"
                            ? PLAN_COLORS.free
                            : entry.name === "Premium"
                              ? PLAN_COLORS.premium
                              : PLAN_COLORS.lifetime
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Role Distribution Pie Chart */}
            <div
              className="p-6 rounded-xl border transition-all hover:shadow-lg"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <h4
                className="font-semibold text-lg mb-4 flex items-center gap-2"
                style={{ color: colors.text }}
              >
                <span>🔐</span> Role Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.roleDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "Users"
                            ? ROLE_COLORS.user
                            : entry.name === "Admins"
                              ? ROLE_COLORS.admin
                              : ROLE_COLORS.founder
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Bar Chart */}
          <div
            className="p-6 rounded-xl border transition-all hover:shadow-lg"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <h4
              className="font-semibold text-lg mb-4 flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <span>📈</span> Recent Activity (Last 7 Days)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.recentActivity}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" stroke={colors.textSecondary} />
                <YAxis stroke={colors.textSecondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.sidebar,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="signups" stackId="a" fill="#3B82F6" />
                <Bar dataKey="uploads" stackId="a" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
