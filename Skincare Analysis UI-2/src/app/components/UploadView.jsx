import { useState, useRef } from "react";
import { Camera, Sparkles, Check, X } from "lucide-react";

export function UploadView({ onAnalyze }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium mb-5">
          <Sparkles size={12} /> AI Analysis
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground leading-tight mb-3">
          Upload your selfie
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Take a photo in natural light, no filters. Our AI will do the rest.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerUpload}
        className={`border-2 border-dashed rounded-2xl p-12 sm:p-16 text-center cursor-pointer transition-all duration-200 relative overflow-hidden min-h-[220px] flex items-center justify-center
          ${dragging ? "border-primary bg-secondary/60" : selectedFile ? "border-primary/50 bg-secondary/10" : "border-border hover:border-primary/30 hover:bg-secondary/20"}`}
      >
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
              <img src={previewUrl} alt="Selfie preview" className="w-full h-full object-cover" />
              <button
                onClick={removeFile}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow"
                title="Remove photo"
              >
                <X size={14} />
              </button>
            </div>
            <p className="font-semibold text-foreground mt-1">Photo selected!</p>
            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{selectedFile.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Camera size={28} className="text-primary" />
            </div>
            <p className="font-medium text-foreground">Drag your photo here</p>
            <p className="text-sm text-muted-foreground">or tap to select — JPG or PNG</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {["Good lighting", "No filters", "Face centered"].map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-lg px-2.5 py-2 justify-center">
            <Check size={11} className="text-primary flex-shrink-0" /> {t}
          </div>
        ))}
      </div>

      <button
        onClick={() => onAnalyze(selectedFile)} disabled={!selectedFile}
        className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
          ${selectedFile ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
      >
        <Sparkles size={16} /> Analyze My Skin
      </button>
      <p className="text-center text-xs text-muted-foreground mt-3">Your photo is processed locally for feature extraction.</p>
    </div>
  );
}
