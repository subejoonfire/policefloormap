"use client";
import { useEffect, useRef, useState } from "react";

let L;
let leafletLoaded = false;

const loadLeaflet = async () => {
  if (leafletLoaded || typeof window === "undefined") return true;

  try {
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    cssLink.crossOrigin = "";

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      document.head.appendChild(cssLink);
    }

    L = await import("leaflet");
    L = L.default || L;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    leafletLoaded = true;
    return true;
  } catch (error) {
    console.error("Error loading Leaflet:", error);
    return false;
  }
};

const LeafletMap = ({ activeFloor, selectedStore }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentImageOverlayRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const permanentMarkersRef = useRef([]);

  const [leafletReady, setLeafletReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const bounds = [
    [0, 0],
    [800, 1200],
  ];

  const permanentMarkers = [
    {
      coords: [420, 300],
      label: "Anda Disini",
      image: "/images/here.gif",
      style: "background-color: #d9534f; color: white;",
    },
  ];

  useEffect(() => {
    const initLeaflet = async () => {
      const loaded = await loadLeaflet();
      if (loaded) setLeafletReady(true);
    };
    initLeaflet();
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !L || !leafletReady)
      return;

    try {
      const map = L.map(mapRef.current, {
        crs: L.CRS.Simple,
        zoomControl: false,
        scrollWheelZoom: true,
        touchZoom: true,
        minZoom: -1,
        maxZoom: 3,
        zoomSnap: 0.5,
        center: [0, 0],
        attributionControl: false,
      });

      map.fitBounds(bounds);
      map.setView([400, 600], 0);

      mapInstanceRef.current = map;
      setIsMapReady(true);

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setIsMapReady(false);
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [leafletReady]);

  const removePermanentMarkers = () => {
    if (mapInstanceRef.current && permanentMarkersRef.current.length > 0) {
      permanentMarkersRef.current.forEach((marker) => {
        try {
          if (mapInstanceRef.current && marker) {
            mapInstanceRef.current.removeLayer(marker);
          }
        } catch (error) {
          console.warn("Error removing permanent marker:", error);
        }
      });
      permanentMarkersRef.current = [];
    }
  };

  const addPermanentMarkers = () => {
    if (!mapInstanceRef.current || !L) return;

    permanentMarkers.forEach((data) => {
      try {
        const iconWidth = data.label === "Anda Disini" ? 60 : 80;
        const iconHeight = data.label === "Anda Disini" ? 85 : 65;

        const iconHtml = `
          <div style="text-align: center; width: ${iconWidth}px;">
            <div class="name-map" style="${data.style || ""}">${
          data.label
        }</div>
            <img src="${data.image}" style="width: 100%; height: auto;" />
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [iconWidth, iconHeight],
          iconAnchor: [iconWidth / 2, iconHeight],
        });

        const marker = L.marker(data.coords, { icon: customIcon });

        if (mapInstanceRef.current) {
          marker.addTo(mapInstanceRef.current);
          permanentMarkersRef.current.push(marker);
        }
      } catch (error) {
        console.warn("Error adding permanent marker:", error);
      }
    });
  };

  const loadMapImage = (floor, callback) => {
    if (!mapInstanceRef.current || !L) return;

    removePermanentMarkers();

    if (currentImageOverlayRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(currentImageOverlayRef.current);
    }

    if (currentMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(currentMarkerRef.current);
    }

    const imageUrl = `/peta/lantai_${floor}.svg`;
    const imageOverlay = L.imageOverlay(imageUrl, bounds);

    imageOverlay.once("load", () => {
      if (!mapInstanceRef.current) return;

      try {
        mapInstanceRef.current.setView([400, 600], 0);

        const imageElement = imageOverlay.getElement();
        if (imageElement) {
          imageElement.classList.add("map-animation-zoom-in");
        }

        if (String(floor) === "1") {
          addPermanentMarkers();
        }

        if (callback) callback();
      } catch (error) {
        console.error("Error during image load callback:", error);
      }
    });

    if (mapInstanceRef.current) {
      imageOverlay.addTo(mapInstanceRef.current);
      currentImageOverlayRef.current = imageOverlay;
    }
  };

  const flyToMarker = (store) => {
    if (!mapInstanceRef.current || !L || !store?.mapCoords) return;

    try {
      if (currentMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(currentMarkerRef.current);
        currentMarkerRef.current = null;
      }

      const iconHtml = `
        <div style="text-align: center;">
          <div class="name-map">${store.name}</div>
          <img src="/images/pin_map.gif" style="width:100px;height:auto;" />
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [50, 50],
        iconAnchor: [50, 65],
      });

      const marker = L.marker(store.mapCoords, { icon: customIcon });

      if (mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
        currentMarkerRef.current = marker;
        mapInstanceRef.current.setView(
          store.mapCoords,
          mapInstanceRef.current.getZoom()
        );
      }
    } catch (error) {
      console.error("Error adding store marker:", error);
    }
  };

  useEffect(() => {
    if (!isMapReady || !activeFloor || !L) return;

    // Reset marker jika pindah lantai
    if (currentMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(currentMarkerRef.current);
      currentMarkerRef.current = null;
    }

    const currentImageElement = currentImageOverlayRef.current?.getElement();
    if (currentImageElement) {
      currentImageElement.classList.add("map-animation-fade-out");
    }

    // Instan tanpa delay
    loadMapImage(activeFloor);
  }, [activeFloor, isMapReady]);

  useEffect(() => {
    if (!isMapReady || !selectedStore || !selectedStore.mapCoords) return;
    flyToMarker(selectedStore);
  }, [selectedStore, isMapReady]);

  useEffect(() => {
    if (isMapReady && activeFloor && L) {
      loadMapImage(activeFloor);
    }
  }, [isMapReady]);

  return (
    <div className="w-full h-full relative">
      {!leafletReady && (
        <div className="map-loading-overlay">
          <div className="map-loading-content">
            <div className="map-loading-spinner"></div>
            <p className="map-loading-text">Memuat peta...</p>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ background: "#222222" }}
      />
    </div>
  );
};

export default LeafletMap;
