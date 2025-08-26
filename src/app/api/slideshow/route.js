import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const JSON_PATH = path.join(process.cwd(), "src/data/polres_berau_floor.json");
const UPLOAD_DIR = path.join(process.cwd(), "public/assets/slideshow");

function ensureUploadDir() {
	if (!fs.existsSync(UPLOAD_DIR)) {
		fs.mkdirSync(UPLOAD_DIR, { recursive: true });
	}
}

function readDb() {
	const raw = fs.readFileSync(JSON_PATH, "utf8");
	return JSON.parse(raw);
}

function writeDb(db) {
	fs.writeFileSync(JSON_PATH, JSON.stringify(db, null, 2));
}

function getTable(db, name) {
	return db.find((t) => t.type === "table" && t.name === name);
}

function getSlideshowTable(db) {
	let table = getTable(db, "slideshow_media");
	if (!table) {
		table = { type: "table", name: "slideshow_media", database: "polres_berau_floor", data: [] };
		db.push(table);
	}
	if (!Array.isArray(table.data)) table.data = [];
	return table;
}

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const action = searchParams.get("action") || "get";
	try {
		if (action === "get") {
			const db = readDb();
			const slideshow = getSlideshowTable(db).data.slice();
			// Sort by numeric display_order ascending, fallback 0
			slideshow.sort((a, b) => (parseInt(a.display_order || 0) - parseInt(b.display_order || 0)));
			return NextResponse.json(slideshow);
		}
		return NextResponse.json({ success: false, message: "Aksi tidak valid." }, { status: 400 });
	} catch (e) {
		return NextResponse.json({ success: false, message: e.message }, { status: 500 });
	}
}

export async function POST(request) {
	const { searchParams } = new URL(request.url);
	const action = searchParams.get("action");
	try {
		if (action === "upload") {
			const formData = await request.formData();
			const file = formData.get("mediaFile");
			if (!file || typeof file === "string") {
				return NextResponse.json({ success: false, message: "File tidak ditemukan" }, { status: 400 });
			}
			ensureUploadDir();
			const originalName = file.name.replace(/\s+/g, "_");
			const arrayBuffer = await file.arrayBuffer();
			// Persist file with original name prefixed by timestamp to avoid collisions
			const safeName = `${Date.now().toString(16)}-${originalName}`;
			fs.writeFileSync(path.join(UPLOAD_DIR, safeName), Buffer.from(arrayBuffer));

			const ext = path.extname(safeName).toLowerCase();
			const mediaType = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) ? "image" : "video";

			const db = readDb();
			const table = getSlideshowTable(db);
			const maxId = table.data.reduce((m, it) => Math.max(m, parseInt(it.id || 0)), 0);
			const maxOrder = table.data.reduce((m, it) => Math.max(m, parseInt(it.display_order || 0)), 0);
			const newItem = {
				id: String(maxId + 1),
				file_name: safeName,
				file_type: mediaType,
				display_order: String(maxOrder + 1),
			};
			table.data.push(newItem);
			writeDb(db);
			return NextResponse.json({ success: true });
		}

		if (action === "delete") {
			const body = await request.json();
			const id = String(body.id);
			const db = readDb();
			const table = getSlideshowTable(db);
			const idx = table.data.findIndex((i) => String(i.id) === id);
			if (idx === -1) return NextResponse.json({ success: false, message: "ID tidak ditemukan" }, { status: 404 });
			const item = table.data[idx];
			const filepath = path.join(UPLOAD_DIR, item.file_name);
			if (fs.existsSync(filepath)) {
				try { fs.unlinkSync(filepath); } catch {}
			}
			table.data.splice(idx, 1);
			writeDb(db);
			return NextResponse.json({ success: true });
		}

		if (action === "reorder") {
			const body = await request.json();
			const order = Array.isArray(body.order) ? body.order.map(String) : [];
			const db = readDb();
			const table = getSlideshowTable(db);
			const idToItem = new Map(table.data.map((i) => [String(i.id), i]));
			order.forEach((id, idx) => {
				const it = idToItem.get(id);
				if (it) it.display_order = String(idx + 1);
			});
			// normalize ordering for any leftover
			let next = table.data.reduce((m, it) => Math.max(m, parseInt(it.display_order || 0)), 0) + 1;
			table.data.forEach((it) => { if (!it.display_order) it.display_order = String(next++); });
			writeDb(db);
			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ success: false, message: "Aksi tidak valid." }, { status: 400 });
	} catch (e) {
		return NextResponse.json({ success: false, message: e.message }, { status: 500 });
	}
}