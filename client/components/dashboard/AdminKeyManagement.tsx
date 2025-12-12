import { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  Crown,
  Zap,
} from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole, canCreateKeys } from "@/lib/auth-utils";
import { PremiumKeyData } from "@shared/api";

interface PremiumKey extends PremiumKeyData {
  id: string;
}

interface AdminKeyManagementProps {
  theme: string;
  userRole: UserRole;
  userId: string;
}

interface KeyForm {
  type: "monthly" | "yearly" | "lifetime";
  maxEmojis: number;
}

export function AdminKeyManagement({
  theme,
  userRole,
  userId,
}: AdminKeyManagementProps) {
  const colors = getThemeColors(theme);
  const [keys, setKeys] = useState<PremiumKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<KeyForm>({
    type: "monthly",
    maxEmojis: 1000,
  });

  useEffect(() => {
    if (!canCreateKeys(userRole)) return;

    const unsubscribe = onSnapshot(
      collection(db, "premiumKeys"),
      (snapshot) => {
        const keyList: PremiumKey[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            key: data.key,
            status: data.status || "unused",
            type: data.type || "monthly",
            maxEmojis: data.maxEmojis || 1000,
            assignedTo: data.assignedTo,
            assignedEmail: data.assignedEmail,
            isActive: data.isActive !== false,
            createdAt: data.createdAt,
            usedAt: data.usedAt,
            expiresAt: data.expiresAt,
            createdBy: data.createdBy,
          };
        });
        setKeys(keyList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading keys:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userRole]);

  const generateKey = async () => {
    if (!canCreateKeys(userRole)) {
      alert("You don't have permission to create keys");
      return;
    }

    setGeneratingKey(true);
    try {
      const generateRandomSegment = () => {
        return Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()
          .padEnd(4, "0");
      };
      const newKey = `PINPIN-${generateRandomSegment()}-${generateRandomSegment()}-${generateRandomSegment()}`;
      const now = new Date();
      let expiresAt: string | undefined;

      if (formData.type === "monthly") {
        const expires = new Date(now);
        expires.setMonth(expires.getMonth() + 1);
        expiresAt = expires.toISOString();
      } else if (formData.type === "yearly") {
        const expires = new Date(now);
        expires.setFullYear(expires.getFullYear() + 1);
        expiresAt = expires.toISOString();
      }

      await setDoc(doc(db, "premiumKeys", newKey), {
        key: newKey,
        status: "unused",
        type: formData.type,
        maxEmojis: formData.maxEmojis,
        isActive: true,
        used: false,
        createdAt: now.toISOString(),
        createdBy: userId,
      } as PremiumKeyData);

      setShowGenerateForm(false);
      setFormData({ type: "monthly", maxEmojis: 1000 });
    } catch (error) {
      console.error("Error generating key:", error);
      alert("Failed to generate key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const deleteKey = async (keyId: string, key: PremiumKey) => {
    try {
      await deleteDoc(doc(db, "premiumKeys", keyId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting key:", error);
      alert("Failed to delete key");
    }
  };

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    if (type === "lifetime") return <Crown className="w-4 h-4" />;
    if (type === "yearly") return <Zap className="w-4 h-4" />;
    return <Lock className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "lifetime") return "#A855F7";
    if (type === "yearly") return "#F59E0B";
    return colors.primary;
  };

  const getTypeBgColor = (type: string) => {
    if (type === "lifetime") return "rgba(168, 85, 247, 0.15)";
    if (type === "yearly") return "rgba(245, 158, 11, 0.15)";
    return "rgba(59, 130, 246, 0.15)";
  };

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold" style={{ color: colors.text }}>
            🔐 Premium Keys
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage license keys for premium access
          </p>
        </div>
        {canCreateKeys(userRole) && (
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            style={{
              backgroundColor: colors.accent,
              color: "#FFFFFF",
            }}
          >
            <Plus className="w-4 h-4" />
            {showGenerateForm ? "Cancel" : "Generate Key"}
          </button>
        )}
      </div>

      {/* Generate Key Form */}
      {showGenerateForm && canCreateKeys(userRole) && (
        <div
          className="p-6 rounded-xl border space-y-4 animate-fadeIn"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <h4 className="font-semibold text-lg" style={{ color: colors.text }}>
            ✨ Generate New Premium Key
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Key Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as KeyForm["type"],
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none transition-all"
                style={{
                  backgroundColor: colors.sidebar,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                <option value="monthly">📅 Monthly</option>
                <option value="yearly">📊 Yearly</option>
                <option value="lifetime">👑 Lifetime</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Max Emojis Allowed
              </label>
              <input
                type="number"
                value={formData.maxEmojis}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxEmojis: parseInt(e.target.value) || 0,
                  })
                }
                min="1"
                className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none transition-all"
                style={{
                  backgroundColor: colors.sidebar,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>
          </div>

          <button
            onClick={generateKey}
            disabled={generatingKey}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            style={{
              backgroundColor: colors.accent,
              color: "#FFFFFF",
            }}
          >
            {generatingKey ? "⏳ Generating..." : "🚀 Create Key"}
          </button>
        </div>
      )}

      {/* Keys Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-b-transparent"
            style={{ borderColor: colors.accent }}
          ></div>
        </div>
      ) : keys.length === 0 ? (
        <div
          className="p-12 rounded-xl border text-center"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p style={{ color: colors.textSecondary }}>
            No premium keys yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {keys.map((key) => {
            const isExpired =
              key.expiresAt && new Date(key.expiresAt) < new Date();
            const isUsed = key.status === "used";

            return (
              <div
                key={key.id}
                className="p-5 rounded-xl border transition-all duration-300 hover:shadow-lg transform hover:scale-105 group"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: isExpired ? 0.6 : 1,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: getTypeBgColor(key.type) }}
                    >
                      {getTypeIcon(key.type)}
                    </div>
                    <div>
                      <div
                        className="text-xs uppercase tracking-wide"
                        style={{ color: colors.textSecondary }}
                      >
                        {key.type === "lifetime"
                          ? "👑 Lifetime"
                          : key.type === "yearly"
                            ? "📊 Yearly"
                            : "📅 Monthly"}
                      </div>
                      <div
                        className="text-sm font-semibold mt-1"
                        style={{ color: colors.text }}
                      >
                        {key.maxEmojis.toLocaleString()} Emojis
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{
                      backgroundColor: isUsed
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(59, 130, 246, 0.15)",
                      color: isUsed ? "#22C55E" : colors.primary,
                    }}
                  >
                    {isUsed ? "✓ Used" : "○ Unused"}
                  </div>
                </div>

                {/* Key Code */}
                <div
                  className="p-3 rounded-lg mb-4 flex items-center justify-between group/key cursor-pointer"
                  style={{
                    backgroundColor: colors.sidebar,
                  }}
                  onClick={() => copyToClipboard(key.key, key.id)}
                >
                  <code
                    className="text-xs font-mono flex-1"
                    style={{ color: colors.accent }}
                  >
                    {key.key}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(key.key, key.id);
                    }}
                    className="ml-2 p-1 rounded transition-all opacity-60 group-hover/key:opacity-100"
                    title="Copy to clipboard"
                  >
                    {copiedId === key.id ? (
                      <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                    ) : (
                      <Copy
                        className="w-4 h-4"
                        style={{ color: colors.textSecondary }}
                      />
                    )}
                  </button>
                </div>

                {/* Meta Info */}
                <div
                  className="text-xs space-y-2 mb-4 pb-4 border-t"
                  style={{
                    color: colors.textSecondary,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex justify-between pt-3">
                    <span>Created</span>
                    <span>{new Date(key.createdAt).toLocaleDateString()}</span>
                  </div>
                  {key.expiresAt && (
                    <div className="flex justify-between">
                      <span>Expires</span>
                      <span
                        style={{
                          color: isExpired ? "#EF4444" : colors.textSecondary,
                        }}
                      >
                        {new Date(key.expiresAt).toLocaleDateString()}
                        {isExpired && " (Expired)"}
                      </span>
                    </div>
                  )}
                  {isUsed && key.usedAt && (
                    <div className="flex justify-between">
                      <span>Used</span>
                      <span>{new Date(key.usedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canCreateKeys(userRole) && (
                  <div>
                    {deleteConfirm === key.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteKey(key.id, key)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            color: "#EF4444",
                          }}
                        >
                          ⚠️ Confirm Delete
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
                        onClick={() => setDeleteConfirm(key.id)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          color: "#EF4444",
                        }}
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Total Keys
          </p>
          <p
            className="text-3xl font-bold mt-2"
            style={{ color: colors.accent }}
          >
            {keys.length}
          </p>
        </div>
        <div
          className="p-5 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Used
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#22C55E" }}>
            {keys.filter((k) => k.status === "used").length}
          </p>
        </div>
        <div
          className="p-5 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Unused
          </p>
          <p
            className="text-3xl font-bold mt-2"
            style={{ color: colors.primary }}
          >
            {keys.filter((k) => k.status === "unused").length}
          </p>
        </div>
        <div
          className="p-5 rounded-xl border transition-all hover:shadow-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p
            style={{ color: colors.textSecondary }}
            className="text-xs uppercase tracking-wide"
          >
            Lifetime Keys
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#A855F7" }}>
            {keys.filter((k) => k.type === "lifetime").length}
          </p>
        </div>
      </div>
    </div>
  );
}
