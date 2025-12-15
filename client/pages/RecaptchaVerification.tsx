import { useState, useEffect } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        execute: (key: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

const RECAPTCHA_KEY = "6Lf6tSksAAAAACrv64btZy5rTd6XsfFDjdLOL-bi";

interface LocationState {
  email?: string;
}

export default function RecaptchaVerification() {
  const [verifying, setVerifying] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const email = state.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/");
    }
  }, [email, navigate]);

  useEffect(() => {
    const executeRecaptcha = async () => {
      try {
        if (!window.grecaptcha?.enterprise) {
          throw new Error("reCAPTCHA Enterprise not loaded");
        }

        const token = await window.grecaptcha.enterprise.execute(
          RECAPTCHA_KEY,
          { action: "login" },
        );

        console.log("reCAPTCHA Enterprise token generated:", token);
        setRecaptchaToken(token);
        setVerifying(false);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || "Failed to verify with reCAPTCHA");
        setVerifying(false);
      }
    };

    if (email) {
      executeRecaptcha();
    }
  }, [email]);

  const handleContinue = async () => {
    if (!recaptchaToken) {
      setError("Verification failed. Please try again.");
      return;
    }

    setVerificationComplete(true);

    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  if (!email) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        backgroundColor: "#0E0E0F",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222223' fill-opacity='0.08'%3E%3Cpath d='M29 30l-1-1 1-1 1 1-1 1M30 29l-1-1 1-1 1 1-1 1M30 31l-1 1 1 1 1-1-1-1M31 30l 1-1-1-1-1 1 1 1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }}
    >
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12 text-slate-400">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F91e2732f1c03487e879c66ee97e72712%2Fee08390eccc04e8dbea3ce5415d97e92?format=webp&width=800"
            alt="PinPinCloud"
            className="w-6 h-6"
          />
          <span className="text-sm font-medium">PinPinCloud</span>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-8 space-y-6 border"
          style={{
            backgroundColor: "#111214",
            borderColor: "#1F2124",
          }}
        >
          {!verificationComplete ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                  {verifying ? "Verifying Identity" : "Identity Verified"}
                </h1>
                <p className="text-slate-400 text-base">
                  {verifying
                    ? "Please wait while we verify your identity..."
                    : "Your identity has been verified successfully"}
                </p>
              </div>

              {/* Email Display */}
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "#141518",
                  borderColor: "#1F2124",
                }}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Signing in as
                    </p>
                    <p className="text-white font-medium text-sm">{email}</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="px-4 py-3 rounded text-sm border"
                  style={{
                    backgroundColor: "#1F1315",
                    borderColor: "#4A2428",
                    color: "#FF6B6B",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Verification Status */}
              {verifying && (
                <div
                  className="p-4 rounded-lg border flex items-center gap-3"
                  style={{
                    backgroundColor: "#141518",
                    borderColor: "#1F2124",
                  }}
                >
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="text-sm text-slate-300">
                      Running security checks...
                    </p>
                    <p className="text-xs text-slate-500">
                      Powered by reCAPTCHA Enterprise
                    </p>
                  </div>
                </div>
              )}

              {!verifying && !error && (
                <div
                  className="p-4 rounded-lg border flex items-center gap-3"
                  style={{
                    backgroundColor: "#141518",
                    borderColor: "#1F2124",
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-300">
                      Verification complete
                    </p>
                    <p className="text-xs text-slate-500">
                      Ready to access your account
                    </p>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                disabled={verifying || !!error}
                className="w-full py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative"
                style={{
                  background: `linear-gradient(135deg, #1A2647 0%, #0F0F10 100%)`,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                }}
              >
                <span>Continue to Dashboard</span>
              </button>

              {/* Back to Login */}
              <div
                className="text-center pt-4 border-t"
                style={{ borderColor: "#1F2124" }}
              >
                <button
                  onClick={() => navigate("/")}
                  className="text-slate-400 hover:text-slate-200 text-sm font-medium transition"
                >
                  Back to Sign In
                </button>
              </div>

              {/* reCAPTCHA Badge Info */}
              <p className="text-xs text-slate-500 text-center">
                This site is protected by reCAPTCHA and the Google{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="underline"
                >
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="https://policies.google.com/terms"
                  className="underline"
                >
                  Terms of Service
                </a>{" "}
                apply.
              </p>
            </>
          ) : (
            <div className="text-center space-y-6 py-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
                <p className="text-slate-400 text-sm">
                  You have been verified successfully. Redirecting to
                  dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
