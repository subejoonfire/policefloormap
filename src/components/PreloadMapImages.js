"use client";
import { useEffect } from "react";
import useImageCache from "../hooks/useImageCache";

// List all floor images to preload
const floorImages = [
  "/peta/lantai_1.svg",
  "/peta/lantai_2.svg",
  "/peta/lantai_3.svg",
  "/peta/lantai_4.svg",
  "/images/here.gif",
  "/images/pin_map.gif",
  // Tambahkan gambar lain yang sering dipakai di map
];

export default function PreloadMapImages() {
  const { preloadImages } = useImageCache();

  useEffect(() => {
    preloadImages(floorImages);
  }, []);

  return null;
}
