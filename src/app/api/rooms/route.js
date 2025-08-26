import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-here";

// Helper function to read JSON data
async function readJsonData() {
  const jsonPath = path.join(process.cwd(), "src/data/polres_berau_floor.json");
  const jsonData = await fs.promises.readFile(jsonPath, "utf-8");
  const data = JSON.parse(jsonData);

  // Find the relevant tables
  const rooms = data.find((table) => table.name === "the_room")?.data || [];
  const groups = data.find((table) => table.name === "the_group")?.data || [];

  return { rooms, groups };
}

export async function GET(request) {
  try {
    const { rooms, groups } = await readJsonData();

    // Combine room data with group data
    const rows = rooms.map((room) => ({
      ...room,
      GroupName: groups.find((g) => g.Id === room.GroupId)?.Name || null,
    }));

    // Sort rooms based on IsPoliceRoom
    rows.sort((a, b) => {
      const getPriority = (isPoliceRoom) => {
        switch (parseInt(isPoliceRoom)) {
          case 2:
            return 0;
          case 1:
            return 1;
          case 3:
            return 2;
          default:
            return 3;
        }
      };
      return (
        getPriority(a.IsPoliceRoom) - getPriority(b.IsPoliceRoom) ||
        parseInt(a.Id) - parseInt(b.Id)
      );
    });

    const basePath = path.join(process.cwd(), "public/assets/img/the_room/");
    const defaultIcon = "/assets/img/default-icon.png";
    const formattedRooms = rows.map((row) => {
      let mapCoords = null;
      try {
        const coords = JSON.parse(row.JsonCoordinates);
        if (
          Array.isArray(coords) &&
          coords.length > 0 &&
          Array.isArray(coords[0])
        ) {
          mapCoords = [coords[0][1], coords[0][0]];
        }
      } catch {}

      let logoPath = defaultIcon;
      if (row.Logopath) {
        const pngPath = path.join(basePath, `${row.Logopath}.png`);
        const jpgPath = path.join(basePath, `${row.Logopath}.jpg`);
        if (fs.existsSync(pngPath)) {
          logoPath = `/assets/img/the_room/${row.Logopath}.png`;
        } else if (fs.existsSync(jpgPath)) {
          logoPath = `/assets/img/the_room/${row.Logopath}.jpg`;
        }
      }
      if (logoPath === defaultIcon) {
        const idPng = path.join(basePath, `${row.Id}.png`);
        const idJpg = path.join(basePath, `${row.Id}.jpg`);
        if (fs.existsSync(idPng)) {
          logoPath = `/assets/img/the_room/${row.Id}.png`;
        } else if (fs.existsSync(idJpg)) {
          logoPath = `/assets/img/the_room/${row.Id}.jpg`;
        }
      }

      let isPoliceRoom = 0;
      if (row.IsPoliceRoom == 2) isPoliceRoom = 1;
      else if (row.IsPoliceRoom == 1 || row.IsPoliceRoom == 3) isPoliceRoom = 2;

      return {
        id: Number(row.Id),
        name: row.Name,
        group: row.GroupName,
        floor: String(row.TheFloorId),
        nameXcoor: Number(row.NameXcoor),
        nameYcoor: Number(row.NameYcoor),
        isHide: Boolean(row.IsHide),
        shadingColor: row.ShadingColor,
        description: row.Description,
        isPoliceRoom,
        logo: logoPath,
        mapCoords,
      };
    });
    return NextResponse.json(formattedRooms);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
