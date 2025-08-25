import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

export async function GET(request) {
  const dbConfig = {
    host: "localhost",
    user: "root",
    password: "", // ganti jika ada password
    database: "polres_berau_floor",
  };
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        r.Id,
        r.TheFloorId,
        r.GroupId,
        r.Name,
        r.NameXcoor,
        r.NameYcoor,
        r.IsHide,
        r.JsonCoordinates,
        r.ShadingColor,
        r.Description,
        r.IsPoliceRoom,
        r.Logopath,
        g.Name AS GroupName
      FROM the_room r
      LEFT JOIN the_group g ON r.GroupId = g.Id
      ORDER BY 
        CASE 
          WHEN r.IsPoliceRoom = 2 THEN 0
          WHEN r.IsPoliceRoom = 1 THEN 1
          WHEN r.IsPoliceRoom = 3 THEN 2
          ELSE 3
        END,
        r.Id ASC
    `);
    await connection.end();

    const basePath = path.join(process.cwd(), "public/assets/img/the_room/");
    const defaultIcon = "/assets/img/default-icon.png";
    const rooms = rows.map((row) => {
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
    return new Response(JSON.stringify(rooms), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
