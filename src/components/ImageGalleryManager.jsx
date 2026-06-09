'use client';

import React, { useState } from 'react';
import { Trash2, Star, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { deleteImage } from '@/lib/supabaseStorageClient';
import { useToast } from '@/components/ui/use-toast';

const ImageGalleryManager = ({ images, onUpdateImages }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!images || images.length === 0) return null;

  const handleSetFeatured = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      featured: i === index
    }));
    onUpdateImages(newImages);
  };

  const handleDelete = async (index) => {
    if (window.confirm(t.admin.upload.confirmDelete)) {
      setLoading(true);
      try {
        const imageToDelete = images[index];
        // Delete from storage if it has a path/url
        if (imageToDelete.path || imageToDelete.url) {
          const path = imageToDelete.path || imageToDelete.url;
          await deleteImage(path);
        }
        
        const newImages = images.filter((_, i) => i !== index);
        onUpdateImages(newImages);
        toast({
          title: "Deleted",
          description: "Image deleted successfully."
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Error",
          description: "Failed to delete image from storage.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const moveImage = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === images.length - 1)) return;
    
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index + direction];
    newImages[index + direction] = temp;
    onUpdateImages(newImages);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#d4af37] font-semibold">{t.admin.upload.galleryTitle}</h3>
        <div className="text-xs text-gray-500 flex gap-3">
          <span>{t.admin.upload.count}: {images.length}</span>
          {loading && <Loader2 className="animate-spin h-3 w-3" />}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img, index) => (
          <div 
            key={index} 
            className={`relative group rounded-lg overflow-hidden border-2 bg-[#0f0f0f] ${
              img.featured ? 'border-[#d4af37]' : 'border-[#d4af37]/20 hover:border-[#d4af37]/50'
            }`}
          >
            <div className="aspect-square relative">
              <img 
                src={img.url} 
                alt={`Property ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.preventDefault(); handleSetFeatured(index); }}
                  className={`w-full h-8 text-xs ${img.featured ? 'text-[#d4af37]' : 'text-white hover:text-[#d4af37]'}`}
                >
                  {img.featured ? (
                    <><Check size={14} className="mr-1" /> {t.admin.upload.featured}</>
                  ) : (
                    <><Star size={14} className="mr-1" /> {t.admin.upload.setFeatured}</>
                  )}
                </Button>
                
                <div className="flex gap-1 w-full justify-center">
                  <Button 
                     size="icon" 
                     variant="ghost" 
                     className="h-8 w-8 text-white hover:text-white hover:bg-white/10"
                     onClick={(e) => { e.preventDefault(); moveImage(index, -1); }}
                     disabled={index === 0}
                  >
                    ←
                  </Button>
                  <Button 
                     size="icon" 
                     variant="ghost" 
                     className="h-8 w-8 text-white hover:text-white hover:bg-white/10"
                     onClick={(e) => { e.preventDefault(); moveImage(index, 1); }}
                     disabled={index === images.length - 1}
                  >
                    →
                  </Button>
                </div>

                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={(e) => { e.preventDefault(); handleDelete(index); }}
                  disabled={loading}
                  className="w-full h-8 text-xs bg-red-900/80 hover:bg-red-800"
                >
                  <Trash2 size={14} className="mr-1" /> {t.admin.upload.delete}
                </Button>
              </div>
            </div>
            {img.featured && (
              <div className="absolute top-2 left-2 bg-[#d4af37] text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                <Star size={10} fill="black" /> {t.admin.upload.featured}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGalleryManager;