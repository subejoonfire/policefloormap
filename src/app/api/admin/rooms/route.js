import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper function to read and write JSON data
async function readJsonData() {
  const jsonPath = path.join(process.cwd(), "src/data/polres_berau_floor.json");
  const jsonData = await fs.promises.readFile(jsonPath, "utf-8");
  return JSON.parse(jsonData);
}

async function writeJsonData(data) {
  const jsonPath = path.join(process.cwd(), "src/data/polres_berau_floor.json");
  await fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2));
}

// GET - List all rooms (admin view)
export async function GET() {
  try {
    const data = await readJsonData();
    const rooms = data.find((table) => table.name === "the_room")?.data || [];
    const groups = data.find((table) => table.name === "the_group")?.data || [];

    return NextResponse.json({ success: true, rooms, groups });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST - Create a new room
export async function POST(request) {
  try {
    const newRoom = await request.json();
    const data = await readJsonData();
    const roomTable = data.find((table) => table.name === "the_room");

    if (!roomTable) {
      return NextResponse.json(
        { success: false, message: "Room table not found" },
        { status: 404 }
      );
    }

    // Generate new ID
    const maxId = Math.max(
      ...roomTable.data.map((room) => parseInt(room.Id)),
      0
    );
    newRoom.Id = String(maxId + 1);

    roomTable.data.push(newRoom);
    await writeJsonData(data);

    return NextResponse.json({ success: true, room: newRoom });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create room" },
      { status: 500 }
    );
  }
}

// PUT - Update a room
export async function PUT(request) {
  try {
    const updatedRoom = await request.json();
    const data = await readJsonData();
    const roomTable = data.find((table) => table.name === "the_room");

    if (!roomTable) {
      return NextResponse.json(
        { success: false, message: "Room table not found" },
        { status: 404 }
      );
    }

    const index = roomTable.data.findIndex(
      (room) => room.Id === updatedRoom.Id
    );
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    roomTable.data[index] = updatedRoom;
    await writeJsonData(data);

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a room
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const data = await readJsonData();
    const roomTable = data.find((table) => table.name === "the_room");

    if (!roomTable) {
      return NextResponse.json(
        { success: false, message: "Room table not found" },
        { status: 404 }
      );
    }

    const index = roomTable.data.findIndex((room) => room.Id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    roomTable.data.splice(index, 1);
    await writeJsonData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete room" },
      { status: 500 }
    );
  }
}
