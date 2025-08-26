"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import useImageCache from "../hooks/useImageCache";
import useDateTime from "../hooks/useDateTime";

const LeafletMap = dynamic(() => import("../components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="map-loading-overlay">
      <div className="map-loading-content">
        <div className="map-loading-spinner"></div>
        <p className="map-loading-text">Memuat peta...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [activeFloor, setActiveFloor] = useState("1");
  const [activeTabFilter, setActiveTabFilter] = useState("all");
  const [allStoreData, setAllStoreData] = useState([]);
  // Fetch data ruangan dari API
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        setAllStoreData(data);
      } catch (err) {
        setAllStoreData([]);
      }
    }
    fetchRooms();
  }, []);
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Slideshow data - images only
  const slideshowData = [
    { fileName: "68a85171d8a30-foto1.jpg", type: "image" },
    { fileName: "68a8517b63dd9-foto2.jpg", type: "image" },
    { fileName: "68a8518551f5a-foto3.jpg", type: "image" },
    { fileName: "68a851ff32052-foto4.jpg", type: "image" },
  ];
  const [isSlideshowClosed, setIsSlideshowClosed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slideTimeoutRef = useRef(null);
  const storeListRef = useRef(null);

  const { date, time } = useDateTime();

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(`Error toggling fullscreen: ${err.message}`);
    }
  };
  const { preloadImages, isLoading, loadingProgress } = useImageCache();

  // Preload images
  useEffect(() => {
    const imagesToPreload = [
      "/peta/lantai_1.svg",
      "/peta/lantai_2.svg",
      "/peta/lantai_3.svg",
      "/peta/lantai_4.svg",
      ...allStoreData.map((room) => room.logo).filter(Boolean),
      ...slideshowData.map((media) => `/assets/slideshow/${media.fileName}`),
      "/images/here.gif",
      "/images/pin_map.gif",
      "/images/polri.png",
      "/images/Berau.png",
    ];
    preloadImages(imagesToPreload);
  }, [allStoreData, preloadImages]);

  // Filter data
  const getFilteredData = () => {
    let filtered = allStoreData.slice();
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch) {
      filtered = filtered.filter(
        (store) =>
          (store.name && store.name.toLowerCase().includes(trimmedSearch)) ||
          (store.description &&
            store.description.toLowerCase().includes(trimmedSearch))
      );
      // Saat search aktif, tab/floor filter tidak berlaku (seperti original)
      return filtered;
    }
    if (activeTabFilter === "everything") {
      // Tampilkan semua data
      return filtered;
    } else if (activeTabFilter === "2" || activeTabFilter === "0") {
      // Satuan (2) atau Umum (0)
      filtered = filtered.filter(
        (store) => String(store.isPoliceRoom) === String(activeTabFilter)
      );
      return filtered;
    } else if (activeTabFilter === "all") {
      // Default: filter by lantai
      filtered = filtered.filter(
        (store) => String(store.floor) === String(activeFloor)
      );
      return filtered;
    }
    // Fallback: tampilkan semua
    return filtered;
  };

  const handleFloorButtonClick = (floor) => {
    if (activeTabFilter !== "all") setActiveTabFilter("all");
    setActiveFloor(String(floor));
    setSelectedStore(null);
    setSearchTerm("");
  };

  const handleTabClick = (filterType) => {
    setActiveTabFilter(filterType);
    setSearchTerm("");
    setSelectedStore(null);
  };

  const handleStoreClick = (store) => {
    const targetFloor = String(store.floor);
    setSearchTerm("");
    setSelectedStore(store);
    if (String(activeFloor) !== targetFloor) {
      setActiveFloor(targetFloor);
      if (searchTerm.trim() !== "" || activeTabFilter === "everything") {
        setActiveTabFilter("all");
      }
    }
    // scrollToTop(storeListRef.current, 500); // Dihilangkan agar scroll tetap
  };

  const scrollToTop = (element, duration) => {
    if (!element) return;
    const start = element.scrollTop;
    const startTime = performance.now();
    const animateScroll = (timestamp) => {
      const timeElapsed = timestamp - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      element.scrollTop = start * (1 - progress);
      if (timeElapsed < duration) requestAnimationFrame(animateScroll);
    };
    requestAnimationFrame(animateScroll);
  };

  // Slideshow effect: handle images with 5 second interval
  useEffect(() => {
    if (slideshowData.length === 0 || isSlideshowClosed) return;

    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slideshowData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slideshowData.length, isSlideshowClosed]);

  const filteredData = getFilteredData();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2 className="loading-title">POLRES BERAU</h2>
          <p className="loading-subtitle">Memuat aplikasi peta lantai...</p>
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">{loadingProgress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222222] flex flex-col">
      {/* Header */}
      <nav className="sb-topnav navbar navbar-expand">
        <div className="header-left-controls">
          <div className="header-datetime-wrapper">
            <div id="date-display">{date}</div>
            <div id="time-display">{time}</div>
          </div>
        </div>
        <div className="header-center-title">
          <img
            src="/images/polri.png"
            alt="Logo Polri"
            className="logo-polri"
          />
          <h1>
            <div>POLRES BERAU</div>
            <div>KALIMANTAN TIMUR</div>
          </h1>
          <img
            src="/images/Berau.png"
            alt="Logo Berau"
            className="logo-berau"
          />
        </div>
        <div className="header-right-controls">
          {!isFullscreen && (
            <button
              id="fullscreenToggle"
              onClick={toggleFullscreen}
              className="icon-btn"
              title="Masuk Mode Fullscreen"
            >
              <i className="fas fa-expand"></i>
            </button>
          )}
          <button
            id="refreshButton"
            onClick={() => window.location.reload()}
            className="icon-btn"
            title="Segarkan Halaman"
          >
            <i className="fas fa-sync"></i>
          </button>
        </div>
      </nav>

      <div id="layoutSidenav">
        <div id="layoutSidenav_content">
          <main className="map-area">
            <div id="map-container">
              <div id="floor-display-label">
                <span id="floor-text">Lantai</span>
                <span id="floor-number">{activeFloor}</span>
              </div>
              <LeafletMap
                activeFloor={activeFloor}
                selectedStore={selectedStore}
              />
            </div>
          </main>
        </div>

        <div id="layoutSidenav_nav">
          {/* Floor Buttons */}
          <div className="buttons-scroll-container">
            {[1, 2, 3, 4].map((floor) => (
              <button
                key={floor}
                className={`floor-btn ${
                  String(activeFloor) === String(floor) ? "active" : ""
                }`}
                data-floor={floor}
                onClick={() => handleFloorButtonClick(floor)}
              >
                Lantai {floor}
              </button>
            ))}
          </div>

          {/* Bottom Panel */}
          <div
            className={`bottom-panel-container ${
              isSlideshowClosed ? "closed" : ""
            }`}
          >
            {/* Directory Panel */}
            <div className="directory-panel">
              <nav className="sb-sidenav accordion" id="sidenavAccordion">
                <div className="sb-sidenav">
                  <div className="sidebar-header-fixed">
                    <div className="search-container">
                      <input
                        type="text"
                        className="search-bar"
                        placeholder="Cari ruangan atau unit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="search-btn" id="searchButton">
                        <i className="fas fa-search"></i>
                      </button>
                    </div>
                  </div>

                  <ul
                    className="nav nav-pills nav-horizontal mb-3"
                    id="directoryTabs"
                    role="tablist"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "10px",
                      flexWrap: "nowrap",
                      overflowX: "auto",
                    }}
                  >
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTabFilter === "all" ? "active" : ""
                        }`}
                        id="floorTabButton"
                        data-filter-type="all"
                        type="button"
                        onClick={() => handleTabClick("all")}
                      >
                        Lantai <span id="floorTabNumber">{activeFloor}</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTabFilter === "2" ? "active" : ""
                        }`}
                        data-filter-type="2"
                        type="button"
                        onClick={() => handleTabClick("2")}
                      >
                        Satuan
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTabFilter === "0" ? "active" : ""
                        }`}
                        data-filter-type="0"
                        type="button"
                        onClick={() => handleTabClick("0")}
                      >
                        Umum
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTabFilter === "everything" ? "active" : ""
                        }`}
                        data-filter-type="everything"
                        type="button"
                        onClick={() => handleTabClick("everything")}
                      >
                        Semua
                      </button>
                    </li>
                  </ul>

                  <ul className="store-list" ref={storeListRef}>
                    {filteredData.length === 0 ? (
                      <li className="no-result">Data tidak ditemukan.</li>
                    ) : (
                      filteredData.map((store) => (
                        <li
                          key={store.id}
                          className={
                            selectedStore?.id === store.id ? "selected" : ""
                          }
                          onClick={() => handleStoreClick(store)}
                        >
                          <img
                            src={store.logo || "/assets/img/default-icon.png"}
                            alt={store.name}
                          />
                          <span>{store.name}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* Slideshow Toggle Button (selalu di atas slideshow) */}
      <button
        id="slideshowToggleButton"
        className={isSlideshowClosed ? "closed" : ""}
        onClick={() => setIsSlideshowClosed(!isSlideshowClosed)}
        title="Tutup/Buka Slideshow"
      >
        <i
          className={`fas ${
            isSlideshowClosed ? "fa-chevron-up" : "fa-chevron-down"
          }`}
        ></i>
      </button>

      {/* Slideshow Panel di bawah edge layar */}
      <div className={`slideshow-panel${isSlideshowClosed ? " closed" : ""}`}>
        <div className="slideshow-container">
          {slideshowData.length > 0 ? (
            slideshowData.map((media, idx) => (
              <div
                key={media.fileName}
                className={`slideshow-item${
                  currentSlide === idx ? " active" : ""
                }`}
              >
                <img
                  src={`/assets/slideshow/${media.fileName}`}
                  alt={media.fileName}
                  className="slideshow-media"
                  onError={(e) => {
                    console.error(`Error loading image: ${media.fileName}`);
                    e.target.src = "/assets/img/default-icon.png";
                  }}
                />
              </div>
            ))
          ) : (
            <div className="slideshow-item active">
              <img
                src="/assets/img/default-icon.png"
                alt="No media available"
                className="slideshow-media"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
