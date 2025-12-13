import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Download,
  ArrowLeft,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface SharedFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  shared: boolean;
  sharePassword?: string;
}

export default function Share() {
  const { fileId } = useParams<{ fileId: string }>();
  const [file, setFile] = useState<SharedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedFile();
  }, [fileId]);

  const loadSharedFile = async () => {
    if (!fileId) {
      setError("No file ID provided");
      setLoading(false);
      return;
    }

    try {
      const fileRef = doc(db, "files", fileId);
      const fileSnap = await getDoc(fileRef);

      if (!fileSnap.exists()) {
        setError("File not found");
        setLoading(false);
        return;
      }

      const fileData = fileSnap.data();
      if (!fileData.shared) {
        setError("This file is not shared");
        setLoading(false);
        return;
      }

      setFile({
        id: fileSnap.id,
        name: fileData.name,
        size: fileData.size,
        uploadedAt: new Date(fileData.uploadedAt).toLocaleDateString(),
        shared: fileData.shared,
        sharePassword: fileData.sharePassword,
      });

      // Check if file is password protected
      if (fileData.sharePassword) {
        setIsPasswordProtected(true);
        setPasswordVerified(false);
      } else {
        setPasswordVerified(true);
      }
    } catch (err) {
      console.error("Error loading file:", err);
      setError("Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (enteredPassword === file?.sharePassword) {
      setPasswordVerified(true);
    } else {
      setPasswordError("Incorrect password");
      setEnteredPassword("");
    }
  };

  const handleDownload = async () => {
    if (!file || !fileId) return;

    setDownloading(true);
    try {
      const fileRef = doc(db, "files", fileId);
      const fileSnap = await getDoc(fileRef);
      const fileData = fileSnap.data();

      if (fileData?.storagePath) {
        const response = await fetch("/api/files/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ storagePath: fileData.storagePath }),
        });

        if (!response.ok) {
          throw new Error("Failed to download file");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        backgroundColor: "#0E0E0F",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222223' fill-opacity='0.08'%3E%3Cpath d='M29 30l-1-1 1-1 1 1-1 1M30 29l-1-1 1-1 1 1-1 1M30 31l-1 1 1 1 1-1-1-1M31 30l 1-1-1-1-1 1 1 1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Shared File</h1>
          <Link
            to="/"
            className="text-slate-400 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </Link>
        </div>

        {/* Content Card */}
        {loading ? (
          <div
            className="rounded-lg p-8 text-center border"
            style={{
              backgroundColor: "#111214",
              borderColor: "#1F2124",
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-400">Loading file...</p>
          </div>
        ) : error ? (
          <div
            className="rounded-lg p-8 border"
            style={{
              backgroundColor: "rgba(31, 19, 21, 0.5)",
              borderColor: "#4A2428",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-500 mb-1">
                  Access Denied
                </h3>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <Link
                  to="/"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Go back to home
                </Link>
              </div>
            </div>
          </div>
        ) : file ? (
          <div
            className="rounded-lg p-8 border space-y-6"
            style={{
              backgroundColor: "#111214",
              borderColor: "#1F2124",
            }}
          >
            {/* Password Form - Show if password protected and not verified */}
            {isPasswordProtected && !passwordVerified ? (
              <>
                {/* Lock Icon */}
                <div className="flex justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <Lock className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* File Name (without password) */}
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                    Protected File
                  </p>
                  <p className="text-lg font-semibold text-white break-all">
                    {file.name}
                  </p>
                </div>

                {/* Password Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Enter Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={enteredPassword}
                        onChange={(e) => setEnteredPassword(e.target.value)}
                        placeholder="Password required"
                        className="w-full px-4 py-3 rounded-lg border bg-slate-900 text-white placeholder-slate-500 transition-all focus:outline-none"
                        style={{
                          borderColor: passwordError ? "#EF4444" : "#334155",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-red-400 text-xs mt-2">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)`,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    Unlock & Download
                  </button>
                </form>

                <p className="text-xs text-slate-500 text-center">
                  This file is password protected. Enter the password to
                  proceed.
                </p>
              </>
            ) : (
              <>
                {/* File Icon */}
                <div className="flex justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <Lock className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* File Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Filename
                    </p>
                    <p className="text-lg font-semibold text-white break-all">
                      {file.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                        File Size
                      </p>
                      <p className="text-white font-medium">{file.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                        Uploaded
                      </p>
                      <p className="text-white font-medium">
                        {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, #1A2647 0%, #0F0F10 100%)`,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Downloading..." : "Download File"}
                </button>

                {/* Info Message */}
                <p className="text-xs text-slate-500 text-center">
                  {isPasswordProtected ? "Password-protected share. " : ""}This
                  file was securely shared with you. Download link expires after
                  a period of inactivity.
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
