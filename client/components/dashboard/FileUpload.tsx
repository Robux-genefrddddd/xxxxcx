import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  uploading: boolean;
  theme: string;
  maxFileSize?: number; // in MB
}

export function FileUpload({
  onFileSelected,
  uploading,
  theme,
  maxFileSize = 300,
}: FileUploadProps) {
  const colors = getThemeColors(theme);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  return (
    <div
      className="border rounded-2xl p-12 text-center transition-all duration-200"
      style={{
        backgroundColor: dragActive ? colors.accentLight : colors.card,
        borderColor: dragActive ? colors.primary : colors.border,
        borderWidth: dragActive ? "2px" : "1px",
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        disabled={uploading}
        className="hidden"
        accept="*/*"
      />

      <div className="flex flex-col items-center gap-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: dragActive ? colors.primary : colors.sidebar,
          }}
        >
          <Upload
            className="w-6 h-6"
            style={{
              color: dragActive ? colors.card : colors.primary,
            }}
          />
        </div>

        <div>
          <p
            className="text-base font-semibold mb-1"
            style={{
              color: colors.text,
            }}
          >
            {dragActive ? "Drop file here" : "Upload a file"}
          </p>
          <p
            className="text-sm"
            style={{
              color: colors.textSecondary,
            }}
          >
            Drag and drop or{" "}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="font-semibold underline hover:opacity-80 disabled:opacity-50 transition-opacity"
              style={{
                color: colors.primary,
              }}
            >
              browse your files
            </button>
          </p>
        </div>

        <p
          className="text-xs font-medium"
          style={{
            color: colors.textSecondary,
          }}
        >
          Maximum file size: {maxFileSize} MB
        </p>
      </div>
    </div>
  );
}
