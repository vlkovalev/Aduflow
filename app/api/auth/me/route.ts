import { NextResponse } from "next/server";
import { getAuthenticatedBuilderId } from "../../../../lib/auth";
import { getBuilderById } from "../../../../lib/builderStore";

export const runtime = "nodejs";

export async function GET() {
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const builder = await getBuilderById(builderId);
  return NextResponse.json({
    authenticated: true,
    builder: builder
      ? { id: builder.id, companyName: builder.companyName, email: builder.email }
      : { id: builderId },
  });
}
