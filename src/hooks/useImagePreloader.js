"use client";
import { useState, useEffect } from 'react';

export function useImagePreloader() {
  const [preloadedImages, setPreloadedImages] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.has(src)) {
        resolve(preloadedImages.get(src));
        return;
      }

      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Map(prev.set(src, img)));
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  const preloadImages = async (imageSources) => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    const total = imageSources.length;
    let loaded = 0;

    const promises = imageSources.map(async (src) => {
      try {
        await preloadImage(src);
        loaded++;
        setLoadingProgress((loaded / total) * 100);
      } catch (error) {
        console.warn(`Gagal memuat gambar: ${src}`, error);
        loaded++;
        setLoadingProgress((loaded / total) * 100);
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  };

  const getPreloadedImage = (src) => {
    return preloadedImages.get(src);
  };

  return {
    preloadImages,
    preloadImage,
    getPreloadedImage,
    isLoading,
    loadingProgress,
    preloadedImages
  };
}