import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { uploadVideo } from "@/services/videoProcessing";
import { toast } from "sonner";
import { formatBytes, formatDuration } from "@/lib/format";
import type { UploadedVideo } from "@/services/types";

interface Props {
  onUploaded: (v: UploadedVideo) => void;
}

export function UploadDropzone({ onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const handle = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setProgress("Reading video metadata…");
    try {
      const result = await uploadVideo(file);
      setProgress("Uploaded");
      toast.success("Video uploaded");
      onUploaded(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handle,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-surface px-6 py-16 text-center transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-elevated/40"
      } ${uploading ? "pointer-events-none opacity-70" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-elevated text-primary ring-1 ring-border">
        {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold">
        {uploading ? progress : isDragActive ? "Drop it here" : "Drop your video to start"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">MP4, MOV, AVI, MKV — up to 500 MB</p>
      <button
        type="button"
        disabled={uploading}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
      >
        Choose a file
      </button>
    </div>
  );
}

export function VideoMetaBar({ video }: { video: UploadedVideo }) {
  const items = [
    ["Filename", video.filename],
    ["Duration", formatDuration(video.meta.durationSec)],
    ["Resolution", `${video.meta.width} × ${video.meta.height}`],
    ["FPS", String(video.meta.fps)],
    ["Size", formatBytes(video.meta.sizeBytes)],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium text-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}
