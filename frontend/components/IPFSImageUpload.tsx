"use client";

import React, { useState, useRef } from "react";
import { Upload, FileImage, AlertCircle, CheckCircle } from "lucide-react";
import { useIPFS, resolveIPFS } from "../hooks/useIPFS";
import LoadingSpinner from "./LoadingSpinner";

interface IPFSImageUploadProps {
  onUploadSuccess: (ipfsHash: string) => void;
  label?: string;
  required?: boolean;
}

export const IPFSImageUpload: React.FC<IPFSImageUploadProps> = ({
  onUploadSuccess,
  label = "Upload Item Image",
  required = false
}) => {
  const { uploadToIPFS, isUploading, uploadError } = useIPFS();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.).");
      return;
    }

    // Show temporary client-side preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const hash = await uploadToIPFS(file);
      setUploadedHash(hash);
      onUploadSuccess(hash);
    } catch (err) {
      console.error("Failed to upload image:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-300 mb-2">
        {label} {required && <span className="text-saffron">*</span>}
      </label>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`relative flex flex-col items-center justify-center min-h-[180px] p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-saffron bg-saffron/5 shadow-[0_0_20px_rgba(255,107,0,0.15)]"
            : uploadedHash
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/10 hover:border-saffron/40 bg-slate-900/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-sm font-medium text-slate-300">Uploading to IPFS network...</p>
          </div>
        ) : uploadedHash ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
            <p className="text-sm font-semibold text-slate-200">Image successfully uploaded to IPFS!</p>
            <p className="text-[10px] font-mono text-slate-500 bg-black/30 px-3 py-1 rounded max-w-xs truncate">
              {uploadedHash}
            </p>
          </div>
        ) : previewUrl ? (
          <div className="relative w-full max-h-[160px] flex justify-center items-center overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveIPFS(previewUrl)}
              alt="Preview"
              className="max-h-[160px] object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="p-3 bg-slate-800/40 rounded-full text-slate-400 group-hover:text-saffron">
              <FileImage className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Drag &amp; Drop or click to upload
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPEG, PNG, WEBP (Max 5MB)
              </p>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPFSImageUpload;
