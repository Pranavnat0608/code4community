import { NextResponse } from "next/server";
import { requireClubHubAdminFromRequest } from "@/lib/club-hub/clubHubAdminRouteAuth";
import { createCustomClub } from "@/lib/club-hub/customClubsServer";
import { withRateLimit } from "@/utils/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function postHandler(request) {
  const auth = await requireClubHubAdminFromRequest(request);
  if (auth.error) return auth.error;

  /** @type {{ name?: string, meetingDay?: string, sponsors?: { name?: string, email?: string }[] }} */
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const club = await createCustomClub(auth.db, {
      name: body.name || "",
      meetingDay: body.meetingDay || "",
      sponsors: body.sponsors || [],
      adminUid: auth.uid,
    });
    return NextResponse.json({ ok: true, club });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create club." },
      { status: 400 },
    );
  }
}

export const POST = withRateLimit(postHandler, { preset: "syncWebhook" });
