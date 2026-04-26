import { NextResponse } from "next/server";

import { db } from "@/lib/db/client";

export async function GET() {
  try {
    db.run("SELECT 1");

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Database connection failed",
      },
      { status: 503 },
    );
  }
}
