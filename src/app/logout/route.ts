import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await destroyCurrentSession();
  return NextResponse.redirect(new URL("/", request.url));
}
