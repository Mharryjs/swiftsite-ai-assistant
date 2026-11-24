import { NextResponse } from "next/server";
import { runTool } from "@/lib/tools";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { command?: unknown; input?: unknown };
    if (typeof body.command !== "string" || typeof body.input !== "string") {
      return NextResponse.json({ error: "Command and input are required." }, { status: 400 });
    }
    return NextResponse.json(runTool(body.command, body.input));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The tool could not run.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
