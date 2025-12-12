import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { FilesList } from "@/components/dashboard/FilesList";
import { SharedFilesList } from "@/components/dashboard/SharedFilesList";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { ThemeSelector } from "@/components/dashboard/ThemeSelector";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UploadModal, MAX_FILE_SIZE } from "@/components/dashboard/UploadModal";
import { PlanUpgradeModal } from "@/components/dashboard/PlanUpgradeModal";
import { ShareFileModal } from "@/components/dashboard/ShareFileModal";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { auth, db, storage } from "@/lib/firebase";
import { getThemeColors, getThemeBackgroundImage } from "@/lib/theme-colors";
import { getUserRole, UserRole } from "@/lib/auth-utils";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  shared: boolean;
  shareUrl?: string;
  storagePath?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface UserPlan {
  type: "free" | "premium";
  storageLimit: number;
  storageUsed: number;
  validatedAt?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("files");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<
    "validating" | "uploading" | "processing" | "complete" | "error"
  >("validating");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [planUpgradeModalOpen, setPlanUpgradeModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [shareFileName, setShareFileName] = useState("");
  const [userPlan, setUserPlan] = useState<UserPlan>({
    type: "free",
    storageLimit: 1024 * 1024 * 1024, // 1 TB
    storageUsed: 0,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName || "User");
        setUserEmail(user.email || "");

        // Load user role
        try {
          const role = await getUserRole(user.uid);
          setUserRole(role);
        } catch (error) {
          console.error("Error loading user role:", error);
          setUserRole("user");
        }

        // Load user plan
        try {
          const planRef = doc(db, "userPlans", user.uid);
          const planDoc = await getDoc(planRef);
          if (planDoc.exists()) {
            setUserPlan(planDoc.data() as UserPlan);
          } else {
            // Initialize free plan for new users
            const initialPlan: UserPlan = {
              type: "free",
              storageLimit: 1024 * 1024 * 1024, // 1 TB
              storageUsed: 0,
            };
            await setDoc(planRef, initialPlan);
            setUserPlan(initialPlan);
          }
        } catch (error) {
          console.error("Error loading user plan:", error);
        }

        const savedTheme = localStorage.getItem("app-theme") || "dark";
        setTheme(savedTheme);
        loadFiles();
        loadUsers();
      } else {
        navigate("/login");
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // ============= FILES MANAGEMENT =============
  const loadFiles = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;
      const q = query(
        collection(db, "files"),
        where("userId", "==", auth.currentUser.uid),
      );
      const docs = await getDocs(q);
      const fileList: FileItem[] = docs.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        size: doc.data().size,
        uploadedAt: new Date(doc.data().uploadedAt).toLocaleDateString(),
        shared: doc.data().shared || false,
        shareUrl: doc.data().shareUrl,
        storagePath: doc.data().storagePath,
      }));
      setFiles(fileList);

      // Calculate storage used
      let totalSize = 0;
      fileList.forEach((file) => {
        const sizeStr = file.size;
        if (sizeStr.includes("MB")) {
          totalSize += parseFloat(sizeStr) * 1024 * 1024;
        } else if (sizeStr.includes("KB")) {
          totalSize += parseFloat(sizeStr) * 1024;
        }
      });

      // Update user plan storage used and persist to Firestore
      if (userId) {
        const updatedPlan = {
          ...userPlan,
          storageUsed: totalSize,
        };
        setUserPlan(updatedPlan);

        // Persist storage to Firestore so it doesn't reset on reload
        try {
          const planRef = doc(db, "userPlans", userId);
          await updateDoc(planRef, { storageUsed: totalSize });
        } catch (error) {
          console.error("Error updating storage in Firestore:", error);
        }
      }
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !auth.currentUser) return;

    // Reset upload state
    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploadStage("validating");
    setUploadError(null);
    setUploadModalOpen(true);
    setUploading(true);

    try {
      // Stage 1: Validate file
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check file size (100MB limit)
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `File size exceeds 100MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        );
        setUploadStage("error");
        setUploading(false);
        return;
      }

      // Check storage limit
      const newStorageTotal = userPlan.storageUsed + file.size;
      if (newStorageTotal > userPlan.storageLimit) {
        const remainingStorage =
          (userPlan.storageLimit - userPlan.storageUsed) / (1024 * 1024);
        setUploadError(
          `Storage limit exceeded. You have ${remainingStorage.toFixed(1)}MB remaining but this file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        );
        setUploadStage("error");
        setUploading(false);
        return;
      }

      setUploadProgress(20);

      // Stage 2: Upload to storage
      setUploadStage("uploading");
      const fileRef = ref(
        storage,
        `files/${auth.currentUser.uid}/${Date.now()}_${file.name}`,
      );

      // Simulate upload progress
      let lastProgress = 20;
      const progressInterval = setInterval(() => {
        if (lastProgress < 80) {
          lastProgress += Math.random() * 30;
          setUploadProgress(Math.min(lastProgress, 80));
        }
      }, 500);

      await uploadBytes(fileRef, file);
      clearInterval(progressInterval);
      setUploadProgress(85);

      const fileSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)}MB`
          : `${(file.size / 1024).toFixed(2)}KB`;

      // Stage 3: Process file
      setUploadStage("processing");
      await new Promise((resolve) => setTimeout(resolve, 800));

      await addDoc(collection(db, "files"), {
        userId: auth.currentUser.uid,
        name: file.name,
        size: fileSize,
        uploadedAt: new Date().toISOString(),
        shared: false,
        storagePath: fileRef.fullPath,
      });

      // Update storage used in Firestore
      try {
        const planRef = doc(db, "userPlans", auth.currentUser.uid);
        const newStorageUsed = userPlan.storageUsed + file.size;
        await updateDoc(planRef, { storageUsed: newStorageUsed });
      } catch (error) {
        console.error("Error updating storage after upload:", error);
      }

      // Complete
      setUploadProgress(100);
      setUploadStage("complete");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      loadFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Upload failed. Please try again.");
      setUploadStage("error");
    } finally {
      setUploading(false);
    }
  };

  const handleShareFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file) {
      setShareFileId(fileId);
      setShareFileName(file.name);
      setShareModalOpen(true);
    }
  };

  const handleUnshareFile = async (fileId: string) => {
    if (!confirm("Remove sharing for this file?")) return;

    try {
      await updateDoc(doc(db, "files", fileId), {
        shared: false,
        shareUrl: null,
      });
      loadFiles();
    } catch (error) {
      console.error("Error unsharing file:", error);
      alert("Failed to remove sharing. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!confirm("Delete this file? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "files", fileId));
      if (file?.storagePath) {
        const fileRef = ref(storage, file.storagePath);
        await deleteObject(fileRef);
      }

      // Update storage used in Firestore
      if (file && auth.currentUser) {
        try {
          let fileSizeBytes = 0;
          const sizeStr = file.size;
          if (sizeStr.includes("MB")) {
            fileSizeBytes = parseFloat(sizeStr) * 1024 * 1024;
          } else if (sizeStr.includes("KB")) {
            fileSizeBytes = parseFloat(sizeStr) * 1024;
          }

          const planRef = doc(db, "userPlans", auth.currentUser.uid);
          const newStorageUsed = Math.max(
            0,
            userPlan.storageUsed - fileSizeBytes,
          );
          await updateDoc(planRef, { storageUsed: newStorageUsed });
        } catch (error) {
          console.error("Error updating storage after deletion:", error);
        }
      }

      loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // ============= USERS MANAGEMENT =============
  const loadUsers = async () => {
    try {
      const docs = await getDocs(collection(db, "users"));
      const userList: User[] = docs.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        role: doc.data().role || "user",
      }));
      setUsers(userList);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleAddUser = async (
    name: string,
    email: string,
    role: "admin" | "user",
  ) => {
    try {
      await addDoc(collection(db, "users"), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      });
      loadUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleUpdateUserRole = async (
    userId: string,
    newRole: "admin" | "user",
  ) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // ============= THEME MANAGEMENT =============
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  const handleCloseUploadModal = () => {
    if (
      uploadStage !== "uploading" &&
      uploadStage !== "validating" &&
      uploadStage !== "processing"
    ) {
      setUploadModalOpen(false);
      setUploadProgress(0);
      setUploadStage("validating");
      setUploadFileName("");
      setUploadError(null);
    }
  };

  // Apply theme to document root
  useEffect(() => {
    const colors = getThemeColors(theme);
    document.documentElement.style.backgroundColor = colors.background;
    document.documentElement.style.color = colors.text;
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }, [theme]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const themeColors = getThemeColors(theme);

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundColor: themeColors.background,
        backgroundImage: getThemeBackgroundImage(theme),
      }}
    >
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={userName}
        userEmail={userEmail}
        theme={theme}
        userPlan={userPlan}
        onUpgradeClick={() => setPlanUpgradeModalOpen(true)}
        userRole={userRole}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header
          className="border-b px-10 py-8 sticky top-0 z-40"
          style={{
            backgroundColor: themeColors.background,
            borderColor: themeColors.border,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: themeColors.text }}
            >
              {activeTab === "files" && "Files"}
              {activeTab === "shared" && "Shared Files"}
              {activeTab === "users" && "User Management"}
              {activeTab === "theme" && "Appearance"}
              {activeTab === "admin" && "Admin Panel"}
            </h1>
            <p style={{ color: themeColors.textSecondary }} className="text-sm">
              {activeTab === "files" &&
                "Manage, share, and organize your cloud storage"}
              {activeTab === "shared" &&
                "View and manage all your shared files"}
              {activeTab === "users" &&
                "Control team members and access permissions"}
              {activeTab === "theme" &&
                "Customize the look and feel of your dashboard"}
              {activeTab === "admin" &&
                "System administration and configuration"}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div
          className="p-10"
          style={{ backgroundColor: themeColors.background }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Files Tab */}
            {activeTab === "files" && (
              <div className="space-y-6 animate-slideInUp">
                <DashboardStats files={files} theme={theme} plan={userPlan} />
                <FileUpload
                  onFileSelected={handleFileUpload}
                  uploading={uploading}
                  theme={theme}
                />
                <FilesList
                  files={files}
                  loading={loading}
                  theme={theme}
                  onShare={handleShareFile}
                  onDelete={handleDeleteFile}
                  onCopyShareLink={(url) => {
                    alert("Share link copied to clipboard!");
                  }}
                />
              </div>
            )}

            {/* Shared Tab */}
            {activeTab === "shared" && (
              <div className="space-y-6">
                <SharedFilesList
                  files={files}
                  loading={loading}
                  theme={theme}
                  onUnshare={handleUnshareFile}
                  onCopyShareLink={(url) => {
                    alert("Share link copied to clipboard!");
                  }}
                />
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <UserManagement
                users={users}
                theme={theme}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onUpdateUserRole={handleUpdateUserRole}
              />
            )}

            {/* Theme Tab */}
            {activeTab === "theme" && (
              <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
            )}

            {/* Admin Tab */}
            {activeTab === "admin" && (
              <AdminPanel
                theme={theme}
                userRole={userRole}
                userId={userId || ""}
              />
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        fileName={uploadFileName}
        progress={uploadProgress}
        stage={uploadStage}
        error={uploadError || undefined}
        onClose={handleCloseUploadModal}
        theme={theme}
      />

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={planUpgradeModalOpen}
        onClose={() => setPlanUpgradeModalOpen(false)}
        theme={theme}
        userId={userId || ""}
        onUpgradePlan={(plan) => setUserPlan(plan)}
      />

      {/* Share File Modal */}
      {shareFileId && (
        <ShareFileModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareFileId(null);
            setShareFileName("");
            loadFiles();
          }}
          fileId={shareFileId}
          fileName={shareFileName}
          theme={theme}
          onShareComplete={() => {
            loadFiles();
          }}
        />
      )}
    </div>
  );
}
