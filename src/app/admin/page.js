"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sortable from "sortablejs";
import Swal from "sweetalert2";

export default function AdminPage() {
	const [mediaItems, setMediaItems] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [savingOrder, setSavingOrder] = useState(false);
	const listRef = useRef(null);
	const demoRef = useRef(null);
	const demoIndexRef = useRef(0);
	const demoTimeoutRef = useRef(null);

	async function fetchMedia() {
		try {
			const res = await fetch("/api/slideshow?action=get", { cache: "no-store" });
			const data = await res.json();
			setMediaItems(data);
			setTimeout(runDemoSlideshow, 0);
		} catch (e) {
			Swal.fire("Error", "Gagal memuat daftar media.", "error");
		}
	}

	useEffect(() => {
		// auth check
		(async () => {
			try {
				const res = await fetch("/api/auth/check", { cache: "no-store" });
				if (!res.ok) {
					window.location.href = "/login";
					return;
				}
				fetchMedia();
			} catch {
				window.location.href = "/login";
			}
		})();
	}, []);

	useEffect(() => {
		if (listRef.current) {
			Sortable.create(listRef.current, {
				handle: ".handle",
				animation: 150,
				ghostClass: "sortable-ghost",
				onEnd: () => {
					// keep state order in sync with DOM order
					const ids = Array.from(listRef.current.querySelectorAll(".media-item")).map((el) => el.getAttribute("data-id"));
					setMediaItems((prev) => ids.map((id) => prev.find((p) => String(p.id) === String(id))));
				},
			});
		}
		return () => {
			if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
		};
	}, [listRef.current]);

	async function handleUpload(e) {
		e.preventDefault();
		const file = e.target.mediaFile.files[0];
		if (!file) return;
		setUploading(true);
		const formData = new FormData();
		formData.append("mediaFile", file);
		try {
			const res = await fetch("/api/slideshow?action=upload", { method: "POST", body: formData });
			const result = await res.json();
			if (result.success) {
				Swal.fire("Berhasil!", "File berhasil diupload.", "success");
				e.target.reset();
				fetchMedia();
			} else {
				Swal.fire("Gagal!", `Gagal upload: ${result.message}`, "error");
			}
		} catch {
			Swal.fire("Gagal!", "Terjadi kesalahan saat upload.", "error");
		} finally {
			setUploading(false);
		}
	}

	async function handleDelete(id) {
		const confirm = await Swal.fire({
			title: "Hapus media ini?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#C0A062",
			confirmButtonText: "Ya, hapus",
			cancelButtonText: "Batal",
		});
		if (!confirm.isConfirmed) return;
		const res = await fetch("/api/slideshow?action=delete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		const result = await res.json();
		if (result.success) {
			Swal.fire("Terhapus", "Media berhasil dihapus.", "success");
			fetchMedia();
		} else {
			Swal.fire("Gagal", result.message || "Gagal menghapus.", "error");
		}
	}

	async function handleReorderSave() {
		setSavingOrder(true);
		const ids = mediaItems.map((m) => m.id);
		const res = await fetch("/api/slideshow?action=reorder", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ order: ids }),
		});
		const result = await res.json();
		setSavingOrder(false);
		if (result.success) {
			Swal.fire("Tersimpan", "Urutan berhasil disimpan.", "success");
			fetchMedia();
		} else {
			Swal.fire("Gagal", result.message || "Gagal menyimpan urutan.", "error");
		}
	}

	function runDemoSlideshow() {
		const container = demoRef.current;
		if (!container) return;
		const slides = container.querySelectorAll(".slideshow-item");
		if (!slides.length) return;
		clearTimeout(demoTimeoutRef.current);
		slides.forEach((slide, i) => slide.classList.toggle("active", i === demoIndexRef.current));
		const activeItem = slides[demoIndexRef.current];
		const video = activeItem.querySelector("video");
		const moveToNext = () => {
			demoIndexRef.current = (demoIndexRef.current + 1) % slides.length;
			runDemoSlideshow();
		};
		if (video) {
			video.loop = false;
			video.currentTime = 0;
			const onVideoEnd = () => {
				video.removeEventListener("ended", onVideoEnd);
				moveToNext();
			};
			video.addEventListener("ended", onVideoEnd, { once: true });
			video.play().catch(() => moveToNext());
		} else {
			demoTimeoutRef.current = setTimeout(moveToNext, 10000);
		}
	}

	return (
		<>
			<nav className="navbar navbar-expand-lg navbar-dark">
				<div className="container-fluid">
					<a className="navbar-brand" href="#">
						<Image src="/images/polri.png" alt="Logo Polri" width={60} height={60} />
						<h1>
							<div>ADMIN PANEL POLRES BERAU</div>
							<div>KALIMANTAN TIMUR</div>
						</h1>
						<Image src="/images/Berau.png" alt="Logo Berau" width={60} height={60} />
					</a>
					<a href="/api/auth/logout" className="btn btn-danger logout-btn">Logout</a>
				</div>
			</nav>

			<div className="admin-main-container">
				<div className="admin-sidebar">
					<div className="upload-section">
						<div className="card">
							<div className="card-header">
								<h3><i className="fas fa-upload" /> Upload Media Baru</h3>
							</div>
							<div className="card-body">
								<form id="uploadForm" onSubmit={handleUpload} encType="multipart/form-data">
									<div className="mb-3">
										<label htmlFor="mediaFile" className="form-label">Pilih file (JPG, PNG, MP4)</label>
										<input className="form-control" type="file" id="mediaFile" name="mediaFile" accept="image/jpeg,image/png,video/mp4" required />
									</div>
									<button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? "Mengupload..." : "Upload File"}</button>
								</form>
							</div>
						</div>
					</div>

					<div className="demo-section">
						<div className="card">
							<div className="card-header">
								<h3><i className="fas fa-play-circle" /> Pratinjau Slideshow</h3>
							</div>
							<div className="card-body">
								<div id="demoSlideshow" className="slideshow-container" ref={demoRef}>
									{mediaItems.length === 0 ? (
										<p className="text-white text-center small p-3">Tidak ada media untuk ditampilkan.</p>
									) : (
										mediaItems.map((item, idx) => (
											<div key={item.id} className={`slideshow-item ${idx === 0 ? "active" : ""}`}>
												{item.file_type === "video" ? (
													<video src={`/assets/slideshow/${item.file_name}`} muted />
												) : (
													<img src={`/assets/slideshow/${item.file_name}`} alt={item.file_name} />
												)}
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="admin-content">
					<div className="list-section">
						<div className="card">
							<div className="card-header">
								<h3 className="mb-0"><i className="fas fa-list" /> Daftar Media Slideshow</h3>
								<p className="text-muted mb-0 small">Seret dan lepas media untuk mengubah urutan, lalu klik simpan.</p>
							</div>
							<div className="card-body" id="slideshow-list-container">
								<div id="slideshow-list" ref={listRef}>
									{mediaItems.map((item) => (
										<div
											className="media-item"
											key={item.id}
											data-id={item.id}
										>
											<i className="fas fa-grip-vertical handle" />
											{item.file_type === "video" ? (
												<video src={`/assets/slideshow/${item.file_name}`} muted />
											) : (
												<img src={`/assets/slideshow/${item.file_name}`} alt={item.file_name} />
											)}
											<div className="info">{item.file_name}</div>
											<div className="actions">
												<button className="btn btn-danger btn-sm delete-btn" onClick={() => handleDelete(item.id)}>
													<i className="fas fa-trash" />
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
							<div className="card-footer">
								<button id="saveOrderBtn" className="btn btn-success w-100" onClick={handleReorderSave} disabled={savingOrder}>
									<i className="fas fa-save" /> {savingOrder ? "Menyimpan..." : "Simpan Urutan"}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}