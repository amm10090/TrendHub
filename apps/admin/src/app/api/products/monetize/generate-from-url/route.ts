import { NextResponse, NextRequest } from "next/server";

import { monetizeUrl } from "@/lib/services/sovrn.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await monetizeUrl({
      url,
      utm_source: "trendhub",
      utm_medium: "new_product",
      utm_campaign: "manual_creation",
    });

    if (result.success) {
      return NextResponse.json({ monetizedUrl: result.monetizedUrl });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to generate monetization link" },
        { status: 500 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}
