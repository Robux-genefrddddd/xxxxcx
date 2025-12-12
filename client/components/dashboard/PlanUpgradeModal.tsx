import { X, CheckCircle, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { getThemeColors } from "@/lib/theme-colors";
import { db } from "@/lib/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import Confetti from "react-confetti-boom";
import { motion, AnimatePresence } from "framer-motion";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  userId: string;
  onUpgradePlan: (plan: any) => void;
}

export function PlanUpgradeModal({
  isOpen,
  onClose,
  theme,
  userId,
  onUpgradePlan,
}: PlanUpgradeModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const colors = getThemeColors(theme);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
        setKeyInput("");
        setSuccess(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleValidateKey = async () => {
    if (!keyInput.trim()) {
      setError("Please enter a premium key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Validate key format (example: PINPIN-XXXX-XXXX-XXXX)
      if (!/^PINPIN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(keyInput)) {
        setError("Invalid key format. Expected: PINPIN-XXXX-XXXX-XXXX");
        setLoading(false);
        return;
      }

      // Check if key exists and is not used
      const keysRef = doc(db, "premiumKeys", keyInput);
      const keyDoc = await getDoc(keysRef);

      if (!keyDoc.exists()) {
        setError("Premium key not found");
        setLoading(false);
        return;
      }

      const keyData = keyDoc.data();
      if (keyData.used) {
        setError("This key has already been used");
        setLoading(false);
        return;
      }

      // Update user plan to premium
      const userPlanRef = doc(db, "userPlans", userId);
      const userPlanDoc = await getDoc(userPlanRef);

      if (userPlanDoc.exists()) {
        await updateDoc(userPlanRef, {
          type: "premium",
          storageLimit: Infinity, // Unlimited storage
          validatedAt: new Date().toISOString(),
        });
      }

      // Mark key as used
      await updateDoc(keysRef, {
        used: true,
        usedBy: userId,
        usedAt: new Date().toISOString(),
      });

      onUpgradePlan({
        type: "premium",
        storageLimit: Infinity, // Unlimited storage
        storageUsed: 0,
        validatedAt: new Date().toISOString(),
      });

      setSuccess(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      console.error("Error validating key:", err);
      setError("Error validating key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
        >
          {showConfetti && (
            <>
              <Confetti
                particleCount={150}
                spread={120}
                colors={["#22C55E", "#10B981", "#059669", "#FBBF24", "#F59E0B"]}
              />
              <Confetti particleCount={80} spread={180} y={-200} />
            </>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border shadow-2xl overflow-hidden"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Premium Gradient Background */}
            <motion.div
              className="absolute inset-0 opacity-0"
              animate={{ opacity: success ? 0.05 : 0 }}
              style={{
                background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)",
              }}
            />

            {/* Header */}
            <motion.div
              className="flex items-center justify-between p-6 border-b relative z-10"
              style={{
                borderColor: colors.border,
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                {!success && (
                  <Star className="w-5 h-5" style={{ color: "#FBBF24" }} />
                )}
                <h2
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  {success ? "Plan Upgraded!" : "Upgrade to Premium"}
                </h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-1 rounded hover:opacity-60 transition-opacity"
                style={{
                  color: colors.textSecondary,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Content */}
            <div className="p-6 space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <p
                        className="text-sm mb-4"
                        style={{
                          color: colors.textSecondary,
                        }}
                      >
                        Enter your premium activation key to unlock unlimited
                        storage and advanced features.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{
                          color: colors.text,
                        }}
                      >
                        Premium Key
                      </label>
                      <motion.input
                        type="text"
                        value={keyInput}
                        onChange={(e) =>
                          setKeyInput(e.target.value.toUpperCase())
                        }
                        placeholder="PINPIN-XXXX-XXXX-XXXX"
                        className="w-full px-4 py-3 rounded-lg border text-sm font-mono transition-all"
                        style={{
                          backgroundColor: colors.accentLight,
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                        disabled={loading}
                        whileFocus={{
                          scale: 1.02,
                          boxShadow: `0 0 0 3px ${colors.primary}33`,
                        }}
                      />
                    </motion.div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 rounded-lg text-sm border"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            borderColor: "rgba(239, 68, 68, 0.3)",
                            color: "#EF4444",
                          }}
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <h3
                        className="font-semibold text-sm flex items-center gap-2"
                        style={{ color: colors.text }}
                      >
                        <Star
                          className="w-4 h-4"
                          style={{ color: "#FBBF24" }}
                        />
                        Premium Benefits:
                      </h3>
                      <ul
                        className="space-y-2 text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {[
                          "1 GB Storage (vs 100 MB free)",
                          "Priority Support",
                          "Advanced File Management",
                          "Unlimited Share Links",
                        ].map((benefit, idx) => (
                          <motion.li
                            key={idx}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                delay: 0.35 + idx * 0.05,
                                duration: 0.6,
                              }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </motion.div>
                            <span>{benefit}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center space-y-4 py-8"
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))",
                        boxShadow:
                          "0 0 40px rgba(34, 197, 94, 0.3), inset 0 0 40px rgba(34, 197, 94, 0.1)",
                      }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 150,
                        damping: 12,
                        delay: 0.1,
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 0.8,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: 0.5,
                        }}
                      >
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3
                        className="font-bold text-2xl"
                        style={{ color: "#22C55E" }}
                      >
                        Premium Activated! 🎉
                      </h3>
                      <p
                        className="text-sm mt-2"
                        style={{
                          color: colors.textSecondary,
                        }}
                      >
                        Your account has been upgraded to premium.
                      </p>
                      <p
                        className="text-xs mt-3"
                        style={{
                          color: colors.textSecondary,
                        }}
                      >
                        Closing in a moment...
                      </p>
                    </motion.div>

                    <motion.div
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="space-y-2">
                        {[
                          "✓ 1 GB Storage unlocked",
                          "✓ Priority Support enabled",
                          "✓ Advanced Features available",
                        ].map((item, idx) => (
                          <motion.p
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            {item}
                          </motion.p>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <AnimatePresence>
              {!success && (
                <motion.div
                  className="px-6 py-4 border-t relative z-10"
                  style={{
                    borderColor: colors.border,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    onClick={handleValidateKey}
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-all"
                    style={{
                      backgroundColor: colors.accentLight,
                      color: colors.primary,
                    }}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      >
                        Validating...
                      </motion.span>
                    ) : (
                      "Activate Key"
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
