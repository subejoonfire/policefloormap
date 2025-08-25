"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Advanced Image Cache Hook for Police Floor Map
 * Features:
 * - Preload all images on app start
 * - Store in memory cache for instant access
 * - Support for different image types (SVG, PNG, JPG, GIF)
 * - Progress tracking
 * - Retry failed loads
 * - Memory management
 */

const useImageCache = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const imageCache = useRef(new Map());
  const loadingPromises = useRef(new Map());
  const retryCount = useRef(new Map());
  
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Preload a single image with retry logic
  const preloadImage = useCallback((src, maxRetries = MAX_RETRIES) => {
    // Return cached promise if already loading
    if (loadingPromises.current.has(src)) {
      return loadingPromises.current.get(src);
    }

    // Return cached image if already loaded
    if (imageCache.current.has(src)) {
      return Promise.resolve(imageCache.current.get(src));
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      const onLoad = () => {
        // Cache the loaded image
        imageCache.current.set(src, {
          src,
          image: img,
          loadedAt: Date.now(),
          blob: null
        });
        
        // Clean up
        loadingPromises.current.delete(src);
        retryCount.current.delete(src);
        
        resolve(img);
      };

      const onError = () => {
        const currentRetries = retryCount.current.get(src) || 0;
        
        if (currentRetries < maxRetries) {
          retryCount.current.set(src, currentRetries + 1);
          
          // Retry after delay
          setTimeout(() => {
            loadingPromises.current.delete(src);
            preloadImage(src, maxRetries)
              .then(resolve)
              .catch(reject);
          }, RETRY_DELAY * (currentRetries + 1));
        } else {
          loadingPromises.current.delete(src);
          retryCount.current.delete(src);
          reject(new Error(`Failed to load image after ${maxRetries} retries: ${src}`));
        }
      };

      img.onload = onLoad;
      img.onerror = onError;
      img.src = src;
    });

    loadingPromises.current.set(src, promise);
    return promise;
  }, []);

  // Preload multiple images with progress tracking
  const preloadImages = useCallback(async (imageSources) => {
    if (!Array.isArray(imageSources) || imageSources.length === 0) {
      setIsLoading(false);
      setLoadingProgress(100);
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);

    let loadedCount = 0;
    const totalImages = imageSources.length;
    const loadPromises = [];

    for (const src of imageSources) {
      if (src && typeof src === 'string') {
        const promise = preloadImage(src)
          .then((img) => {
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
            return img;
          })
          .catch((error) => {
            console.warn(`Failed to preload image: ${src}`, error);
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
            return null;
          });
        
        loadPromises.push(promise);
      }
    }

    try {
      await Promise.all(loadPromises);
      setIsLoading(false);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error during image preloading:', error);
      setError(error);
      setIsLoading(false);
    }
  }, [preloadImage]);

  // Get cached image
  const getCachedImage = useCallback((src) => {
    return imageCache.current.get(src);
  }, []);

  // Check if image is cached
  const isCached = useCallback((src) => {
    return imageCache.current.has(src);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    imageCache.current.clear();
    loadingPromises.current.clear();
    retryCount.current.clear();
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return {
      totalCached: imageCache.current.size,
      loading: loadingPromises.current.size,
      retrying: retryCount.current.size
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  return {
    preloadImages,
    preloadImage,
    getCachedImage,
    isCached,
    clearCache,
    getCacheStats,
    isLoading,
    loadingProgress,
    error
  };
};

export default useImageCache;