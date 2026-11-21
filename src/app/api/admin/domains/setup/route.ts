import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  customDomainInfraStatus,
  ensureCustomDomainInfrastructure,
} from "@/lib/cloudflare-domains";

async function isAdmin() {
  const store = await cookies();
  return store.get("bp_admin")?.value === "1";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const status = await customDomainInfraStatus();
  return NextResponse.json(status);
}

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const result = await ensureCustomDomainInfrastructure();
  const status = await customDomainInfraStatus();

  return NextResponse.json({ ...status, result, message: result.message });
}
