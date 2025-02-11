"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  PhotoIcon,
  XMarkIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import axios from "axios";
import { cn } from "@/lib/utils";

interface CompressedImage {
  originalSize: number;
  compressedSize: number;
  compressedDataUrl: string;
  name: string;
  format: string;
  previewVisible: boolean;
}

const DOWNLOAD_FORMATS = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
];

export default function Home() {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);
      const newImages: CompressedImage[] = [];

      try {
        for (const file of acceptedFiles) {
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} is not an image file`);
            continue;
          }

          const formData = new FormData();
          formData.append("image", file);
          formData.append("compressionLevel", compressionLevel);

          const response = await axios.post("/api/compress", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          newImages.push({
            originalSize: file.size,
            compressedSize: response.data.size,
            compressedDataUrl: response.data.compressedDataUrl,
            name: file.name,
            format: response.data.format,
            previewVisible: false,
          });
        }

        setImages((prev) => [...prev, ...newImages]);
        toast.success("Images compressed successfully!");
      } catch (error) {
        console.error("Error compressing images:", error);
        toast.error("Failed to compress images. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [compressionLevel]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const togglePreview = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, previewVisible: !img.previewVisible } : img
      )
    );
  };

  const deleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed successfully!");
  };

  const downloadImage = (image: CompressedImage) => {
    try {
      const link = document.createElement("a");
      link.href = image.compressedDataUrl;
      link.download = `compressed-${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Image Compressor
          </h1>
          <p className="text-lg text-gray-600">
            Compress your images while maintaining quality. Supports PNG, JPG,
            JPEG, and WebP formats.
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compression Level
          </label>
          <div className="flex gap-4">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setCompressionLevel(level)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  compressionLevel === level
                    ? "bg-primary-500 text-white"
                    : "bg-white text-gray-700 hover:bg-primary-50"
                )}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div
          {...getRootProps()}
          className={cn("dropzone", isDragActive && "active", "mb-8")}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <PhotoIcon className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                Drop your images here
              </p>
              <p className="text-sm text-gray-500">or click to select files</p>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="mb-8">
            <div className="progress-bar">
              <div
                className="progress-bar-fill animate-pulse-slow"
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              Processing your images...
            </p>
          </div>
        )}

        {images.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Compressed Images
            </h2>
            {images.map((image, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{image.name}</p>
                    <p className="text-sm text-gray-500">
                      Original: {formatSize(image.originalSize)} → Compressed:{" "}
                      {formatSize(image.compressedSize)} (
                      {Math.round(
                        (1 - image.compressedSize / image.originalSize) * 100
                      )}
                      % reduction)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePreview(index)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label={
                        image.previewVisible ? "Hide preview" : "Show preview"
                      }
                    >
                      {image.previewVisible ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => downloadImage(image)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteImage(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Delete image"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {image.previewVisible && (
                  <div className="mt-4">
                    <img
                      src={image.compressedDataUrl}
                      alt={`Preview of ${image.name}`}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
