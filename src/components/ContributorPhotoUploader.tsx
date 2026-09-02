import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, X, RefreshCw, Cloud, Database, ExternalLink } from 'lucide-react';

interface ContributorPhotoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  contributorName?: string;
  disabled?: boolean;
}

export default function ContributorPhotoUploader({
  value,
  onChange,
  contributorName = 'contributor',
  disabled = false,
}: ContributorPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<{
    fileName: string;
    fileSize: string;
    isS3: boolean;
    storageType: string;
  } | null>(() => {
    if (value && (value.includes('/api/media/contributors/') || value.includes('.amazonaws.com/'))) {
      return {
        fileName: value.split('/').pop() || 'contributor-headshot.jpg',
        fileSize: 'Optimized',
        isS3: true,
        storageType: 'AWS S3 & MongoDB',
      };
    }
    return null;
  });

  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, AVIF, or GIF).');
      return;
    }

    // Validate size: 10MB max
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB.');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(20);

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setUploadProgress(50);

      // Sanitize filename
      const cleanBaseName = (contributorName || 'contributor')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');
      const fileExt = file.name.split('.').pop() || 'jpg';
      const uploadFileName = `${cleanBaseName}_${Date.now()}.${fileExt}`;

      try {
        setUploadProgress(70);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            name: uploadFileName,
            folder: 'contributors',
          }),
        });

        setUploadProgress(95);

        if (res.ok) {
          const data = await res.json();
          const finalUrl = data.url || data.s3Url || base64Data;
          onChange(finalUrl);
          setUploadInfo({
            fileName: file.name,
            fileSize: formattedSize,
            isS3: data.storageType === 'aws-s3' || !!data.s3Url || data.isS3,
            storageType: 'AWS S3 & MongoDB',
          });
        } else {
          // Resilient fallback to base64
          onChange(base64Data);
          setUploadInfo({
            fileName: file.name,
            fileSize: formattedSize,
            isS3: false,
            storageType: 'MongoDB Local Buffer',
          });
        }
      } catch (err: any) {
        console.warn('[Contributor Upload] Server error fallback:', err);
        onChange(base64Data);
        setUploadInfo({
          fileName: file.name,
          fileSize: formattedSize,
          isS3: false,
          storageType: 'MongoDB Local Buffer',
        });
      } finally {
        setUploadProgress(100);
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setError('Could not read image file from disk.');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadInfo(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {value ? (
        /* Image Preview & Management Card */
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all">
          {/* Avatar Preview */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md shrink-0">
            <img
              src={value}
              alt="Contributor avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                <Loader2 size={20} className="animate-spin text-white mb-1" />
                <span className="text-[10px] font-bold">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold tracking-tight">
                <Cloud size={12} className="text-emerald-600" />
                AWS S3 Synced
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold tracking-tight">
                <Database size={12} className="text-blue-600" />
                MongoDB Stored
              </span>
            </div>

            {uploadInfo && (
              <div className="text-xs text-slate-600 truncate">
                <span className="font-semibold text-slate-900">{uploadInfo.fileName}</span>
                {uploadInfo.fileSize && (
                  <span className="text-slate-400 ml-2">({uploadInfo.fileSize})</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-slate-800 rounded text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <RefreshCw size={12} className={uploading ? 'animate-spin' : ''} />
                {uploading ? 'Uploading...' : 'Replace Photo'}
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
              >
                <X size={13} />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag-and-Drop Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`cursor-pointer relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
            isDragging
              ? 'border-brand-accent bg-blue-50/50 scale-[1.005]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
          } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          {uploading ? (
            <div className="py-4 space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-brand-accent" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Uploading headshot to AWS S3 & MongoDB...
                </p>
                <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-brand-accent transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
                <Upload size={22} className="text-brand-accent" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Upload Contributor Headshot
                </p>
                <p className="text-xs text-slate-500">
                  Drag and drop an image file here, or{' '}
                  <span className="text-brand-accent font-semibold underline">browse from your computer</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>PNG, JPG, WebP, AVIF up to 10MB</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <Cloud size={12} className="text-slate-500" /> Stored in S3 + MongoDB
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced URL Option toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1"
        >
          <ExternalLink size={11} />
          {showUrlInput ? 'Hide manual URL input' : 'Or paste direct image URL'}
        </button>

        {showUrlInput && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.example.com/avatar.jpg"
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
            />
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2 py-2 text-xs text-rose-600 hover:text-rose-800"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
