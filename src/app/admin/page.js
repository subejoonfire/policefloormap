"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminPage() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMedia();
    // Check authentication
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/check");
      if (!res.ok) {
        router.push("/login");
      }
    } catch (error) {
      router.push("/login");
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/slideshow?action=get");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMediaItems(data);
    } catch (error) {
      setError("Failed to load media items");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch("/api/slideshow?action=upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await fetchMedia();
      e.target.reset();
    } catch (error) {
      setError("Failed to upload file");
    }
  };

  const handleDelete = async (mediaId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch("/api/slideshow?action=delete&id=" + mediaId, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");
      await fetchMedia();
    } catch (error) {
      setError("Failed to delete item");
    }
  };

  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex) => {
    if (draggedItem === null) return;
    if (draggedItem === dropIndex) return;

    const newItems = [...mediaItems];
    const [movedItem] = newItems.splice(draggedItem, 1);
    newItems.splice(dropIndex, 0, movedItem);
    setMediaItems(newItems);
    setDraggedItem(null);
  };

  const handleReorder = async (newOrder) => {
    try {
      const res = await fetch("/api/slideshow?action=reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: newOrder }),
      });

      if (!res.ok) throw new Error("Reorder failed");

      await fetchMedia();
    } catch (error) {
      setError("Failed to reorder items");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      setError("Logout failed");
    }
  };

  // Slideshow preview functionality
  useEffect(() => {
    if (mediaItems.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [mediaItems]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/images/polri.png"
              alt="Logo Polri"
              width={50}
              height={50}
            />
            <div>
              <h1 className="text-xl font-bold">ADMIN PANEL POLRES BERAU</h1>
              <div className="text-sm">KALIMANTAN TIMUR</div>
            </div>
            <Image
              src="/images/Berau.png"
              alt="Logo Berau"
              width={50}
              height={50}
            />
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto mt-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">
                <i className="fas fa-upload mr-2"></i> Upload Media Baru
              </h3>
              <form onSubmit={handleUpload}>
                <input
                  type="file"
                  name="media"
                  accept="image/*,video/*"
                  className="w-full mb-4"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Upload
                </button>
              </form>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-xl font-semibold mb-4">
                <i className="fas fa-play-circle mr-2"></i> Pratinjau Slideshow
              </h3>
              <div className="aspect-video bg-gray-900 relative overflow-hidden rounded">
                {mediaItems.length > 0 && (
                  <div className="absolute inset-0">
                    {mediaItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={
                          "absolute inset-0 transition-opacity duration-500 " +
                          (index === currentSlide ? "opacity-100" : "opacity-0")
                        }
                      >
                        {item.type === "video" ? (
                          <video
                            src={"/assets/slideshow/" + item.filename}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <Image
                              src={"/assets/slideshow/" + item.filename}
                              alt={item.filename}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Media List Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2">
                <i className="fas fa-list mr-2"></i> Daftar Media Slideshow
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Seret dan lepas media untuk mengubah urutan, lalu klik simpan.
              </p>

              {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {mediaItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={
                      "flex items-center gap-4 p-3 rounded border transition-colors " +
                      (draggedItem === index ? "bg-blue-50" : "bg-gray-50")
                    }
                    draggable="true"
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                  >
                    <div className="cursor-move">
                      <i className="fas fa-grip-vertical text-gray-400"></i>
                    </div>
                    <div className="flex-1">{item.filename}</div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleReorder}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                <i className="fas fa-save mr-2"></i> Simpan Urutan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
