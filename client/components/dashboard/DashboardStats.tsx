import { getThemeColors } from "@/lib/theme-colors";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText, Image, Video, Archive } from "lucide-react";

interface DashboardStatsProps {
  files: Array<{
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    shared: boolean;
  }>;
  theme: string;
  plan: {
    type: "free" | "premium";
    storageLimit: number;
    storageUsed: number;
  };
}

const getFileType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const docs = ["pdf", "doc", "docx", "txt", "xlsx", "xls", "ppt", "pptx"];
  const imgs = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const vids = ["mp4", "avi", "mkv", "mov", "wmv", "flv"];
  const archs = ["zip", "rar", "7z", "tar", "gz"];

  if (docs.includes(ext)) return "Documents";
  if (imgs.includes(ext)) return "Images";
  if (vids.includes(ext)) return "Videos";
  if (archs.includes(ext)) return "Archives";
  return "Other";
};

export function DashboardStats({ files, theme, plan }: DashboardStatsProps) {
  const colors = getThemeColors(theme);

  const totalFiles = files.length;
  const sharedFiles = files.filter((f) => f.shared).length;
  const storageUsedMB = plan.storageUsed / (1024 * 1024);
  const storageLimitMB = plan.storageLimit / (1024 * 1024);
  const storagePercent = (plan.storageUsed / plan.storageLimit) * 100;

  const fileTypeMap = {
    Documents: 0,
    Images: 0,
    Videos: 0,
    Archives: 0,
    Other: 0,
  };

  files.forEach((file) => {
    const type = getFileType(file.name);
    fileTypeMap[type as keyof typeof fileTypeMap]++;
  });

  const activityData = [
    { day: "Mon", uploads: 4 },
    { day: "Tue", uploads: 3 },
    { day: "Wed", uploads: 7 },
    { day: "Thu", uploads: 5 },
    { day: "Fri", uploads: 9 },
    { day: "Sat", uploads: 6 },
    { day: "Sun", uploads: 8 },
  ];

  const storageBreakdown = [
    { type: "Documents", count: fileTypeMap.Documents, color: "#3B82F6" },
    { type: "Images", count: fileTypeMap.Images, color: "#8B5CF6" },
    { type: "Videos", count: fileTypeMap.Videos, color: "#EC4899" },
    { type: "Archives", count: fileTypeMap.Archives, color: "#F59E0B" },
  ]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const lastUploadFile =
    files.length > 0 ? files[files.length - 1].uploadedAt : "—";

  return (
    <div className="space-y-6">
      {/* KPI LINE - COMPACT, PROFESSIONAL */}
      <div
        className="grid grid-cols-4 gap-8 pb-6 border-b"
        style={{ borderColor: colors.border }}
      >
        {/* Storage Used */}
        <div className="col-span-2">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: colors.textSecondary }}
          >
            Storage Used
          </p>
          <div className="mb-3">
            <p
              className="text-3xl font-bold tracking-tight mb-1"
              style={{ color: colors.text }}
            >
              {storageUsedMB.toFixed(1)}{" "}
              <span
                className="text-lg font-semibold"
                style={{ color: colors.textSecondary }}
              >
                MB
              </span>
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {storageLimitMB.toFixed(0)} MB limit
            </p>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{
              backgroundColor: colors.border,
            }}
          >
            <div
              className="h-1.5 transition-all duration-500"
              style={{
                width: `${Math.min(storagePercent, 100)}%`,
                backgroundColor:
                  storagePercent > 90
                    ? "#EF4444"
                    : storagePercent > 70
                      ? "#F59E0B"
                      : colors.primary,
              }}
            />
          </div>
          {plan.type === "premium" && (
            <p
              style={{ color: colors.primary }}
              className="text-xs mt-2 font-medium"
            >
              Premium Plan
            </p>
          )}
        </div>

        {/* Total Files */}
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-4"
            style={{ color: colors.textSecondary }}
          >
            Total Files
          </p>
          <p className="text-4xl font-bold" style={{ color: colors.text }}>
            {totalFiles}
          </p>
        </div>

        {/* Shared Files */}
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-4"
            style={{ color: colors.textSecondary }}
          >
            Shared
          </p>
          <p className="text-4xl font-bold" style={{ color: colors.primary }}>
            {sharedFiles}
          </p>
        </div>
      </div>

      {/* ACTIVITY CHART - AREA CHART, NO GRIDLINES */}
      <div>
        <p
          className="text-xs font-medium uppercase tracking-wider mb-4"
          style={{ color: colors.textSecondary }}
        >
          Activity
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={activityData}
            margin={{ top: 0, right: 0, left: -35, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.primary}
                  stopOpacity={0.3}
                />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke={colors.textSecondary}
              style={{ fontSize: "12px" }}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis
              stroke={colors.textSecondary}
              style={{ fontSize: "12px" }}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <CartesianGrid
              strokeDasharray="0"
              stroke={colors.border}
              vertical={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.sidebar,
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "13px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: colors.text }}
            />
            <Area
              type="monotone"
              dataKey="uploads"
              stroke={colors.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUploads)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
