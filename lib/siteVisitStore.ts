import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";

export type SiteVisitInput = {
  path: string;
  pageTitle?: string;
  referrer?: string;
  sessionId?: string;
  visitorHash?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

export type SiteVisitRecord = SiteVisitInput & {
  id: string;
  createdAt: string;
};

export async function recordSiteVisit(input: SiteVisitInput): Promise<SiteVisitRecord | null> {
  const visit: SiteVisitRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    path: input.path.slice(0, 500),
    pageTitle: input.pageTitle?.slice(0, 300) || "",
    referrer: input.referrer?.slice(0, 1000) || "",
    sessionId: input.sessionId?.slice(0, 120) || "",
    visitorHash: input.visitorHash?.slice(0, 128) || "",
    userAgent: input.userAgent?.slice(0, 500) || "",
    utmSource: input.utmSource?.slice(0, 200) || "",
    utmMedium: input.utmMedium?.slice(0, 200) || "",
    utmCampaign: input.utmCampaign?.slice(0, 200) || "",
    utmTerm: input.utmTerm?.slice(0, 200) || "",
    utmContent: input.utmContent?.slice(0, 200) || "",
  };

  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  const { error } = await supabase.from("site_visits").insert({
    id: visit.id,
    created_at: visit.createdAt,
    path: visit.path,
    page_title: visit.pageTitle,
    referrer: visit.referrer,
    session_id: visit.sessionId,
    visitor_hash: visit.visitorHash,
    user_agent: visit.userAgent,
    utm_source: visit.utmSource,
    utm_medium: visit.utmMedium,
    utm_campaign: visit.utmCampaign,
    utm_term: visit.utmTerm,
    utm_content: visit.utmContent,
  });

  if (error) {
    throw new Error(error.message);
  }

  return visit;
}
