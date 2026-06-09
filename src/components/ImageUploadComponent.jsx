'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { validateFile, compressImage, formatImageMetadata } from '@/lib/imageUtils';
import { uploadImage } from '@/lib/supabaseStorageClient';

const ImageUploadComponent = ({ onImagesUploaded, propertyId }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files) => {
    if (!propertyId) {
      toast({
        title: "Error",
        description: "System error: Property ID missing for upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    const uploadedImages = [];
    const totalFiles = files.length;
    let processedCount = 0;

    for (const file of files) {
      // 1. Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "File Error",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
        processedCount++;
        continue;
      }

      try {
        // 2. Compress
        const compressedFile = await compressImage(file);
        
        // 3. Upload to Supabase
        const { url, path } = await uploadImage(compressedFile, propertyId);
        
        const imageData = formatImageMetadata(url, path, false);
        uploadedImages.push(imageData);
        
        processedCount++;
        setProgress(Math.round((processedCount / totalFiles) * 100));
        
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    if (uploadedImages.length > 0) {
      onImagesUploaded(uploadedImages);
      toast({
        title: "Success",
        description: `${uploadedImages.length} images uploaded successfully.`,
      });
    }

    setIsUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <h3 className="text-[#d4af37] font-semibold mb-3 flex items-center gap-2">
        <FileImage size={20} />
        {t.admin.upload.title}
      </h3>
      
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer overflow-hidden ${
          isDragging 
            ? 'border-[#d4af37] bg-[#d4af37]/10' 
            : 'border-[#d4af37]/30 hover:border-[#d4af37] bg-[#0f0f0f]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-4" />
            <p className="text-[#d4af37] font-medium">{t.admin.upload.uploading} {progress}%</p>
            <div className="w-48 h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-[#d4af37] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#d4af37]/20">
              <Upload className="w-8 h-8 text-[#d4af37]" />
            </div>
            <p className="text-gray-200 font-medium text-lg mb-2">
              {t.admin.upload.dropzone}
            </p>
            <p className="text-gray-500 text-sm">
              {t.admin.upload.supports}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadComponent;