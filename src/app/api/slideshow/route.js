import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper to read JSON file
const readJsonDb = () => {
  const filePath = path.join(process.cwd(), "src/data/polres_berau_floor.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
};

// Helper to write JSON file
const writeJsonDb = (data) => {
  const filePath = path.join(process.cwd(), "src/data/polres_berau_floor.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Get slideshow media data from JSON
const getMediaData = () => {
  const db = readJsonDb();
  const mediaTable = db.find((item) => item.name === "slideshow_media");
  return mediaTable?.data || [];
};

// Update slideshow media data in JSON
const updateMediaData = (newData) => {
  const db = readJsonDb();
  const mediaTableIndex = db.findIndex(
    (item) => item.name === "slideshow_media"
  );
  if (mediaTableIndex !== -1) {
    db[mediaTableIndex].data = newData;
    writeJsonDb(db);
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "get") {
    try {
      const media = getMediaData();
      return NextResponse.json(media);
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch media" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "upload") {
    try {
      const formData = await request.formData();
      const file = formData.get("media");

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      // Handle file upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = timestamp + "-" + file.name;

      // Save file
      const uploadDir = path.join(process.cwd(), "public/assets/slideshow");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, filename), buffer);

      // Update JSON
      const media = getMediaData();
      const newMedia = {
        id: timestamp.toString(),
        filename,
        type: file.type.startsWith("video/") ? "video" : "image",
        display_order: media.length + 1,
      };

      media.push(newMedia);
      updateMediaData(media);

      return NextResponse.json({ success: true, media: newMedia });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }
  }

  if (action === "reorder") {
    try {
      const { order } = await request.json();
      const media = getMediaData();

      // Reorder based on the new order
      const reorderedMedia = order.map((id, index) => {
        const item = media.find((m) => m.id === id);
        return { ...item, display_order: index + 1 };
      });

      updateMediaData(reorderedMedia);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to reorder media" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  if (action === "delete" && id) {
    try {
      const media = getMediaData();
      const mediaItem = media.find((m) => m.id === id);

      if (mediaItem) {
        // Delete file
        const filePath = path.join(
          process.cwd(),
          "public/assets/slideshow",
          mediaItem.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        // Update JSON
        const updatedMedia = media.filter((m) => m.id !== id);
        updateMediaData(updatedMedia);

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to delete media" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
