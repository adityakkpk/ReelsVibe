import { IKUpload } from "imagekitio-next";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  onSuccess: (response: IKUploadResponse) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
}

export default function FileUpload({
  onSuccess,
  onProgress,
  fileType = "image",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onError = (err: { message: string }) => {
    setError(err.message);
    console.log("Error", err);
    setUploading(false);
  };

  const handleSuccess = (res: IKUploadResponse) => {
    console.log("Success", res);
    setUploading(false);
    setError(null);
    onSuccess(res);
  };

  const handleProgress = (evt: ProgressEvent) => {
    if (evt.lengthComputable && onProgress) {
      const percentComplete = (evt.loaded / evt.total) * 100;
      onProgress(Math.round(percentComplete));
    }
  };

  const handleStartUpload = () => {
    setUploading(true);
    setError(null);
  };

  const validateFile = (file: File) => {
    if (fileType === "video") {
      if (!file.type.startsWith("video/")) {
        setError("Please Upload a video file!");
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("Video must be less than 100mb");
        return false;
      }
    } else {
      const validTypes = ["image/jpeg", "image/png", "image.jpg", "image/webp"];

      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid file (JPEG, PNG, webp)");
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5mb");
        return false;
      }
    }

    return false;
  };

  return (
    <div className="space-y-2">
      <IKUpload
        fileName={
          fileType === "video" ? `video-${Date.now()}` : `image-${Date.now()}`
        }
        useUniqueFileName={true}
        validateFile={validateFile}
        folder={fileType === "video" ? `/reels_video` : `/reels_image`}
        onError={onError}
        onSuccess={handleSuccess}
        onUploadProgress={handleProgress}
        onUploadStart={handleStartUpload}
        accept={fileType === "video" ? `video/*` : `image/*`}
        className="file-input file-input-bordered w-full"
      />
      {uploading && (
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="animate-spin w-16 h-16" />
        </div>
      )}
      {error && <div className="text-error text-sm">{error}</div>}
    </div>
  );
}
