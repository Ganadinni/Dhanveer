import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      app: "Dhanveer",
      version: process.env.npm_package_version ?? "0.1.0",
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
