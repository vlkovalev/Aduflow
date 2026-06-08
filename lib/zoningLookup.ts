/**
 * Address-based zoning lookup.
 *
 * Primary: Zoneomics API — covers US and major Canadian cities (Vancouver, Calgary, Toronto).
 *          Requires ZONEOMICS_API_KEY env var.
 *          Docs: https://www.zoneomics.com/product/api
 *
 * Fallback: Smart municipality database covering major ADU markets across North America.
 *           Works without any API key. Covers 20+ cities + province/state fallbacks.
 *           All fallback results are clearly labelled source: "municipal_fallback".
 */

// ── Canonical normalized schema ───────────────────────────────────────────

export type ZoningResult = {
  source: "zoneomics" | "regrid" | "lightbox" | "municipal_fallback" | "manual";
  jurisdiction: string;
  zoneCode: string;
  zoneDescription: string;
  parcelId?: string | number;
  lotAreaSqFt?: number;
  aduPermitted: boolean | null;
  maxAduSqFt: number | null;
  maxStories: number | null;
  maxHeightFt: number | null;
  frontSetback: string | null;
  sideSetback: string | null;
  rearSetback: string | null;
  parkingRequired: string | null;
  overlayRisks: string[];
  confidence: number;        // 0–1
  checkedAt: string;         // ISO timestamp
  rawData: unknown;
  // Computed backward-compat fields — derived from confidence + overlayRisks
  reviewRisk: "Low" | "Medium" | "High";
  permitPath: string;
};

// ── Municipality database ─────────────────────────────────────────────────

type MunicipalRule = {
  match: string[];
  zoneCode: string;
  zoneDescription: string;
  maxAduSqFt: number | null;
  maxStories: number | null;
  maxHeightFt: number | null;
  frontSetback: string | null;
  sideSetback: string | null;
  rearSetback: string | null;
  parkingRequired: string | null;
  overlayRisks: string[];
  aduPermitted: boolean | null;
  reviewRisk: "Low" | "Medium" | "High";
  permitPath: string;
};

const MUNICIPAL_RULES: MunicipalRule[] = [
  // British Columbia
  {
    match: ["vancouver, bc", "vancouver, british columbia", "east vancouver", "west vancouver", "north vancouver"],
    zoneCode: "RS-1 / RS-2", zoneDescription: "Single-family — laneway and garden suite permitted",
    maxAduSqFt: 861, maxStories: 1, maxHeightFt: null,
    frontSetback: null, sideSetback: "4.9 ft (1.5 m)", rearSetback: "4.9 ft (1.5 m)",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU review — City of Vancouver",
  },
  {
    match: ["burnaby, bc", "burnaby, british columbia"],
    zoneCode: "R1 / R2", zoneDescription: "Single-family — secondary suite and garden suite permitted",
    maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard zoning review — City of Burnaby",
  },
  {
    match: ["surrey, bc", "surrey, british columbia"],
    zoneCode: "RF / RF-9", zoneDescription: "Single-family — coach house and secondary suite permitted",
    maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "6 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development permit — City of Surrey",
  },
  {
    match: ["victoria, bc", "victoria, british columbia", "saanich, bc"],
    zoneCode: "R1-B / R2", zoneDescription: "Single-family — garden suite and secondary suite permitted",
    maxAduSqFt: 968, maxStories: 1, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "6 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU review — City of Victoria",
  },
  {
    match: ["kelowna, bc", "kelowna, british columbia"],
    zoneCode: "RU1 / MF1", zoneDescription: "Urban residential — carriage house permitted",
    maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Kelowna",
  },
  // Alberta
  {
    match: ["calgary, ab", "calgary, alberta"],
    zoneCode: "R-CG / R-G", zoneDescription: "Grade-oriented infill — garage and garden suites permitted. $35K incentive available.",
    maxAduSqFt: 1076, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "3.9 ft", rearSetback: "6.6 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Calgary",
  },
  {
    match: ["edmonton, ab", "edmonton, alberta"],
    zoneCode: "RF1 / RSL", zoneDescription: "Low-density residential — secondary and garden suites permitted",
    maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "3.9 ft", rearSetback: "6.6 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Edmonton",
  },
  // Ontario
  {
    match: ["toronto, on", "toronto, ontario", "north york", "scarborough", "etobicoke"],
    zoneCode: "RD / RS", zoneDescription: "Residential detached — garden suite and laneway suite permitted",
    maxAduSqFt: 1076, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "5.9 ft", rearSetback: "15 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — City of Toronto",
  },
  {
    match: ["mississauga, on", "mississauga, ontario"],
    zoneCode: "R1 / R2", zoneDescription: "Residential — additional dwelling unit permitted",
    maxAduSqFt: 968, maxStories: 1, maxHeightFt: null,
    frontSetback: null, sideSetback: "5 ft", rearSetback: "20 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Medium", permitPath: "Building permit — City of Mississauga",
  },
  {
    match: ["ottawa, on", "ottawa, ontario"],
    zoneCode: "R1 / R2", zoneDescription: "Residential — secondary dwelling unit permitted",
    maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "5 ft", rearSetback: "19.7 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — City of Ottawa",
  },
  // Washington
  {
    match: ["seattle, wa", "seattle, washington"],
    zoneCode: "SF 5000 / SF 7200", zoneDescription: "Single-family — DADU and AADU permitted by right",
    maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard permit — City of Seattle DCI",
  },
  {
    match: ["bellevue, wa", "redmond, wa", "kirkland, wa", "renton, wa"],
    zoneCode: "R-1 / R-4", zoneDescription: "Single-family — ADU permitted under Washington HB 1337",
    maxAduSqFt: 900, maxStories: 1, maxHeightFt: null,
    frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Eastside municipalities",
  },
  // Oregon
  {
    match: ["portland, or", "portland, oregon"],
    zoneCode: "R2 / R2.5 / R5", zoneDescription: "Standard residential — ADU permitted by right. SDC fees waived.",
    maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development review — Portland BDS",
  },
  // California
  {
    match: ["los angeles, ca", "los angeles, california"],
    zoneCode: "R1 / R2", zoneDescription: "Single-family — ADU permitted by state law. Pre-approved plans available.",
    maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU permit — LADBS",
  },
  {
    match: ["san francisco, ca", "san francisco, california"],
    zoneCode: "RH-1 / RH-2", zoneDescription: "Residential house — ADU permitted by state law",
    maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Medium", permitPath: "ADU permit — SF DBI",
  },
  {
    match: ["san diego, ca", "san diego, california"],
    zoneCode: "RS-1-7 / RS-1-4", zoneDescription: "Single-family — ADU permitted by state law",
    maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — City of San Diego",
  },
  {
    match: ["san jose, ca", "san jose, california"],
    zoneCode: "R1-8 / R1-6", zoneDescription: "Single-family — ADU permitted by state law",
    maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Over-the-counter permit — City of San Jose",
  },
  {
    match: ["sacramento, ca", "sacramento, california"],
    zoneCode: "R-1 / R-1B", zoneDescription: "Single-family — ADU and JADU permitted",
    maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
    frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
    parkingRequired: null, overlayRisks: [],
    aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial permit — City of Sacramento",
  },
];

const REGION_FALLBACKS: Array<{ match: string[]; result: Omit<MunicipalRule, "match"> }> = [
  {
    match: [", bc", ", british columbia"],
    result: {
      zoneCode: "Residential", zoneDescription: "BC residential — ADU permitted under Bill 44 (2023)",
      maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
      frontSetback: null, sideSetback: "Confirm with municipality", rearSetback: "Confirm with municipality",
      parkingRequired: null, overlayRisks: [],
      aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development permit — BC municipality",
    },
  },
  {
    match: [", ab", ", alberta"],
    result: {
      zoneCode: "Residential", zoneDescription: "Alberta residential — secondary suite broadly permitted",
      maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
      frontSetback: null, sideSetback: "Confirm with municipality", rearSetback: "Confirm with municipality",
      parkingRequired: null, overlayRisks: [],
      aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — Alberta municipality",
    },
  },
  {
    match: [", on", ", ontario"],
    result: {
      zoneCode: "Residential", zoneDescription: "Ontario residential — ADU permitted under More Homes Built Faster Act",
      maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
      frontSetback: null, sideSetback: "Confirm with municipality", rearSetback: "Confirm with municipality",
      parkingRequired: null, overlayRisks: [],
      aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Ontario municipality",
    },
  },
  {
    match: [", ca", ", california"],
    result: {
      zoneCode: "Residential", zoneDescription: "California residential — ADU permitted by state law",
      maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
      frontSetback: null, sideSetback: "4 ft minimum (state law)", rearSetback: "4 ft minimum (state law)",
      parkingRequired: null, overlayRisks: [],
      aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — California jurisdiction",
    },
  },
  {
    match: [", wa", ", washington"],
    result: {
      zoneCode: "Residential", zoneDescription: "Washington State — ADU permitted under HB 1337",
      maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
      frontSetback: null, sideSetback: "5 ft typical", rearSetback: "5 ft typical",
      parkingRequired: null, overlayRisks: [],
      aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Washington municipality",
    },
  },
  {
    match: [", or", ", oregon"],
    result: {
      zoneCode: "Residential", zoneDescription: "Oregon — ADU permitted under HB 2001",
      maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
      frontSetback: null, sideSetback: "5 ft typical", rearSetback: "5 ft typical",
      parkingRequired: null, overlayRisks: [],
      aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Oregon municipality",
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function normalizeAddress(value: string) {
  return value.toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
}

/** Convert reviewRisk to a 0–1 confidence score for municipal fallback results. */
function confidenceFromRisk(risk: "Low" | "Medium" | "High"): number {
  if (risk === "Low") return 0.70;
  if (risk === "Medium") return 0.50;
  return 0.30;
}

/** Derive a human-readable jurisdiction from the first match fragment. */
function jurisdictionFromMatch(fragment: string): string {
  return fragment
    .split(",")
    .map((s) => {
      const t = s.trim();
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(", ");
}

// ── Municipal fallback lookup ─────────────────────────────────────────────

function lookupZoningMock(address: string): ZoningResult | null {
  const normalized = normalizeAddress(address);
  const checkedAt = new Date().toISOString();

  for (const rule of MUNICIPAL_RULES) {
    for (const fragment of rule.match) {
      if (normalized.includes(normalizeAddress(fragment))) {
        const { match: _match, reviewRisk, permitPath, ...fields } = rule;
        return {
          source: "municipal_fallback",
          jurisdiction: jurisdictionFromMatch(fragment),
          confidence: confidenceFromRisk(reviewRisk),
          checkedAt,
          rawData: null,
          reviewRisk,
          permitPath,
          ...fields,
        };
      }
    }
  }

  for (const region of REGION_FALLBACKS) {
    for (const fragment of region.match) {
      if (normalized.includes(normalizeAddress(fragment))) {
        const { reviewRisk, permitPath, ...fields } = region.result;
        return {
          source: "municipal_fallback",
          jurisdiction: jurisdictionFromMatch(fragment),
          confidence: confidenceFromRisk(reviewRisk),
          checkedAt,
          rawData: null,
          reviewRisk,
          permitPath,
          ...fields,
        };
      }
    }
  }

  return null;
}

// ── Main export ───────────────────────────────────────────────────────────

export async function lookupZoning(address: string): Promise<ZoningResult | null> {
  const apiKey = process.env.ZONEOMICS_API_KEY;

  if (!apiKey) {
    return lookupZoningMock(address);
  }

  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://app.zoneomics.com/api/v2/properties/?address=${encoded}`,
      {
        headers: {
          Authorization: `Token ${apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(6000),
      },
    );

    if (!response.ok) {
      return lookupZoningMock(address);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return parseZoneomicsResponse(address, data);
  } catch {
    return lookupZoningMock(address);
  }
}

// ── Zoneomics response parser ─────────────────────────────────────────────

function parseZoneomicsResponse(
  address: string,
  data: Record<string, unknown>,
): ZoningResult | null {
  // Zoneomics returns a `properties` array or a single property object
  const property = Array.isArray(data.properties)
    ? (data.properties[0] as Record<string, unknown>)
    : data;

  if (!property) return null;

  const zoneCode = (property.zoning ?? property.zone_code ?? "") as string;
  const desc = (property.zone_description ?? property.zoning_description ?? zoneCode) as string;
  const rawSetbacks = property.setbacks as Record<string, unknown> | undefined;
  const landUse = ((property.land_use ?? property.use_description ?? "") as string).toLowerCase();

  // ADU / residential indicator
  const isResidential = /residential|single.?family|r-|rs-|rf-|rs1|rl|rm/.test(
    (zoneCode + desc + landUse).toLowerCase(),
  );

  // Extract setbacks
  const frontSetback = rawSetbacks?.front ? `${rawSetbacks.front} ft` : null;
  const sideSetback = rawSetbacks?.side ? `${rawSetbacks.side} ft` : null;
  const rearSetback = rawSetbacks?.rear ? `${rawSetbacks.rear} ft` : null;

  // Max ADU size — Zoneomics may return max_adu_sqft or we infer from lot coverage
  const maxAduSqFt = property.max_adu_sqft
    ? Number(property.max_adu_sqft)
    : inferMaxAduSize(property);

  // Stories
  const maxStories = property.max_stories
    ? Number(property.max_stories)
    : property.max_height
    ? Math.max(1, Math.floor(Number(property.max_height) / 10))
    : null;

  // Height
  const maxHeightFt = property.max_height ? Number(property.max_height) : null;

  // Lot area
  const lotAreaSqFt = property.lot_area_sqft ? Number(property.lot_area_sqft) : undefined;

  // Parcel ID
  const parcelId = property.parcel_id
    ? String(property.parcel_id)
    : property.apn
    ? String(property.apn)
    : undefined;

  // Jurisdiction
  const jurisdiction = (property.jurisdiction ?? property.city ?? property.municipality ?? address) as string;

  // Overlay risks + review risk
  const { reviewRisk, overlayRisks } = deriveReviewRisk(zoneCode, desc, property);

  const permitPath =
    reviewRisk === "High"
      ? "Enhanced site review"
      : reviewRisk === "Medium"
      ? "Municipal plus design review"
      : "Standard ADU review";

  return {
    source: "zoneomics",
    jurisdiction: String(jurisdiction),
    zoneCode,
    zoneDescription: desc,
    parcelId,
    lotAreaSqFt,
    aduPermitted: isResidential,
    maxAduSqFt,
    maxStories,
    maxHeightFt,
    frontSetback,
    sideSetback,
    rearSetback,
    parkingRequired: null,
    overlayRisks,
    confidence: 0.85,
    checkedAt: new Date().toISOString(),
    rawData: property,
    reviewRisk,
    permitPath,
  };
}

function inferMaxAduSize(property: Record<string, unknown>): number | null {
  // Some responses include lot area — typical ADU allowance is ~15% of lot or 1000 sqft cap
  const lotArea = property.lot_area_sqft ? Number(property.lot_area_sqft) : null;
  if (lotArea && lotArea > 0) {
    return Math.min(1000, Math.round(lotArea * 0.15));
  }
  return null;
}

function deriveReviewRisk(
  zone: string,
  desc: string,
  property: Record<string, unknown>,
): { reviewRisk: "Low" | "Medium" | "High"; overlayRisks: string[] } {
  const combined = (zone + desc + JSON.stringify(property)).toLowerCase();
  const overlayRisks: string[] = [];

  if (combined.includes("flood")) overlayRisks.push("flood zone");
  if (combined.includes("hazard")) overlayRisks.push("hazard overlay");
  if (combined.includes("heritage")) overlayRisks.push("heritage designation");
  if (combined.includes("sensitive")) overlayRisks.push("sensitive area");
  if (combined.includes("overlay") && overlayRisks.length === 0) overlayRisks.push("overlay zone");

  if (overlayRisks.length > 0) {
    return { reviewRisk: "High", overlayRisks };
  }

  if (
    combined.includes("design review") ||
    combined.includes("hoa") ||
    combined.includes("corner") ||
    combined.includes("historic")
  ) {
    return { reviewRisk: "Medium", overlayRisks };
  }

  return { reviewRisk: "Low", overlayRisks };
}
