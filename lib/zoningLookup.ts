/**
 * Address-based zoning lookup.
 *
 * Primary: Zoneomics API — covers US and major Canadian cities (Vancouver, Calgary, Toronto).
 *          Requires ZONEOMICS_API_KEY env var.
 *          Docs: https://www.zoneomics.com/product/api
 *
 * Fallback: Smart municipality database covering major ADU markets across North America.
 *           Works without any API key. Covers 20+ cities + province/state fallbacks.
 */

export type ZoningResult = {
  address: string;
  zone: string;
  zoneDescription: string;
  maxSquareFeet: number | null;
  maxStories: number | null;
  setbackFront: string | null;
  setbackSide: string | null;
  setbackRear: string | null;
  aduPermitted: boolean | null;
  reviewRisk: "Low" | "Medium" | "High";
  permitPath: string;
  source: "zoneomics" | "fallback";
  rawData?: Record<string, unknown>;
};

// ── Municipality database ─────────────────────────────────────────────────

type MunicipalRule = Omit<ZoningResult, "address" | "source" | "rawData"> & { match: string[] };

const MUNICIPAL_RULES: MunicipalRule[] = [
  // British Columbia
  { match: ["vancouver, bc", "vancouver, british columbia", "east vancouver", "west vancouver", "north vancouver"],
    zone: "RS-1 / RS-2", zoneDescription: "Single-family — laneway and garden suite permitted",
    maxSquareFeet: 861, maxStories: 1, setbackFront: null, setbackSide: "4.9 ft (1.5 m)", setbackRear: "4.9 ft (1.5 m)",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU review — City of Vancouver" },
  { match: ["burnaby, bc", "burnaby, british columbia"],
    zone: "R1 / R2", zoneDescription: "Single-family — secondary suite and garden suite permitted",
    maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "4 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard zoning review — City of Burnaby" },
  { match: ["surrey, bc", "surrey, british columbia"],
    zone: "RF / RF-9", zoneDescription: "Single-family — coach house and secondary suite permitted",
    maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "6 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development permit — City of Surrey" },
  { match: ["victoria, bc", "victoria, british columbia", "saanich, bc"],
    zone: "R1-B / R2", zoneDescription: "Single-family — garden suite and secondary suite permitted",
    maxSquareFeet: 968, maxStories: 1, setbackFront: null, setbackSide: "4 ft", setbackRear: "6 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU review — City of Victoria" },
  { match: ["kelowna, bc", "kelowna, british columbia"],
    zone: "RU1 / MF1", zoneDescription: "Urban residential — carriage house permitted",
    maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "5 ft", setbackRear: "5 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Kelowna" },
  // Alberta
  { match: ["calgary, ab", "calgary, alberta"],
    zone: "R-CG / R-G", zoneDescription: "Grade-oriented infill — garage and garden suites permitted. $35K incentive available.",
    maxSquareFeet: 1076, maxStories: 2, setbackFront: null, setbackSide: "3.9 ft", setbackRear: "6.6 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Calgary" },
  { match: ["edmonton, ab", "edmonton, alberta"],
    zone: "RF1 / RSL", zoneDescription: "Low-density residential — secondary and garden suites permitted",
    maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "3.9 ft", setbackRear: "6.6 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Edmonton" },
  // Ontario
  { match: ["toronto, on", "toronto, ontario", "north york", "scarborough", "etobicoke"],
    zone: "RD / RS", zoneDescription: "Residential detached — garden suite and laneway suite permitted",
    maxSquareFeet: 1076, maxStories: 2, setbackFront: null, setbackSide: "5.9 ft", setbackRear: "15 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — City of Toronto" },
  { match: ["mississauga, on", "mississauga, ontario"],
    zone: "R1 / R2", zoneDescription: "Residential — additional dwelling unit permitted",
    maxSquareFeet: 968, maxStories: 1, setbackFront: null, setbackSide: "5 ft", setbackRear: "20 ft",
    aduPermitted: true, reviewRisk: "Medium", permitPath: "Building permit — City of Mississauga" },
  { match: ["ottawa, on", "ottawa, ontario"],
    zone: "R1 / R2", zoneDescription: "Residential — secondary dwelling unit permitted",
    maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "5 ft", setbackRear: "19.7 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — City of Ottawa" },
  // Washington
  { match: ["seattle, wa", "seattle, washington"],
    zone: "SF 5000 / SF 7200", zoneDescription: "Single-family — DADU and AADU permitted by right",
    maxSquareFeet: 1000, maxStories: 2, setbackFront: null, setbackSide: "5 ft", setbackRear: "5 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard permit — City of Seattle DCI" },
  { match: ["bellevue, wa", "redmond, wa", "kirkland, wa", "renton, wa"],
    zone: "R-1 / R-4", zoneDescription: "Single-family — ADU permitted under Washington HB 1337",
    maxSquareFeet: 900, maxStories: 1, setbackFront: null, setbackSide: "5 ft", setbackRear: "5 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Eastside municipalities" },
  // Oregon
  { match: ["portland, or", "portland, oregon"],
    zone: "R2 / R2.5 / R5", zoneDescription: "Standard residential — ADU permitted by right. SDC fees waived.",
    maxSquareFeet: 800, maxStories: 2, setbackFront: null, setbackSide: "5 ft", setbackRear: "5 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development review — Portland BDS" },
  // California
  { match: ["los angeles, ca", "los angeles, california"],
    zone: "R1 / R2", zoneDescription: "Single-family — ADU permitted by state law. Pre-approved plans available.",
    maxSquareFeet: 1200, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "4 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU permit — LADBS" },
  { match: ["san francisco, ca", "san francisco, california"],
    zone: "RH-1 / RH-2", zoneDescription: "Residential house — ADU permitted by state law",
    maxSquareFeet: 1200, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "4 ft",
    aduPermitted: true, reviewRisk: "Medium", permitPath: "ADU permit — SF DBI" },
  { match: ["san diego, ca", "san diego, california"],
    zone: "RS-1-7 / RS-1-4", zoneDescription: "Single-family — ADU permitted by state law",
    maxSquareFeet: 1200, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "4 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — City of San Diego" },
  { match: ["san jose, ca", "san jose, california"],
    zone: "R1-8 / R1-6", zoneDescription: "Single-family — ADU permitted by state law",
    maxSquareFeet: 1200, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "4 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Over-the-counter permit — City of San Jose" },
  { match: ["sacramento, ca", "sacramento, california"],
    zone: "R-1 / R-1B", zoneDescription: "Single-family — ADU and JADU permitted",
    maxSquareFeet: 1200, maxStories: 2, setbackFront: null, setbackSide: "4 ft", setbackRear: "4 ft",
    aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial permit — City of Sacramento" },
];

const REGION_FALLBACKS: Array<{ match: string[]; result: Omit<MunicipalRule, "match"> }> = [
  { match: [", bc", ", british columbia"],
    result: { zone: "Residential", zoneDescription: "BC residential — ADU permitted under Bill 44 (2023)", maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "Confirm with municipality", setbackRear: "Confirm with municipality", aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development permit — BC municipality" } },
  { match: [", ab", ", alberta"],
    result: { zone: "Residential", zoneDescription: "Alberta residential — secondary suite broadly permitted", maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "Confirm with municipality", setbackRear: "Confirm with municipality", aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — Alberta municipality" } },
  { match: [", on", ", ontario"],
    result: { zone: "Residential", zoneDescription: "Ontario residential — ADU permitted under More Homes Built Faster Act", maxSquareFeet: 968, maxStories: 2, setbackFront: null, setbackSide: "Confirm with municipality", setbackRear: "Confirm with municipality", aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Ontario municipality" } },
  { match: [", ca", ", california"],
    result: { zone: "Residential", zoneDescription: "California residential — ADU permitted by state law", maxSquareFeet: 1200, maxStories: 2, setbackFront: null, setbackSide: "4 ft minimum (state law)", setbackRear: "4 ft minimum (state law)", aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — California jurisdiction" } },
  { match: [", wa", ", washington"],
    result: { zone: "Residential", zoneDescription: "Washington State — ADU permitted under HB 1337", maxSquareFeet: 1000, maxStories: 2, setbackFront: null, setbackSide: "5 ft typical", setbackRear: "5 ft typical", aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Washington municipality" } },
  { match: [", or", ", oregon"],
    result: { zone: "Residential", zoneDescription: "Oregon — ADU permitted under HB 2001", maxSquareFeet: 800, maxStories: 2, setbackFront: null, setbackSide: "5 ft typical", setbackRear: "5 ft typical", aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Oregon municipality" } },
];

function normalizeAddress(value: string) {
  return value.toLowerCase().replace(/[,\.]/g, " ").replace(/\s+/g, " ").trim();
}

function lookupZoningMock(address: string): ZoningResult | null {
  const normalized = normalizeAddress(address);

  for (const rule of MUNICIPAL_RULES) {
    for (const fragment of rule.match) {
      if (normalized.includes(normalizeAddress(fragment))) {
        const { match: _match, ...rest } = rule;
        return { address, source: "fallback", ...rest };
      }
    }
  }

  for (const region of REGION_FALLBACKS) {
    for (const fragment of region.match) {
      if (normalized.includes(normalizeAddress(fragment))) {
        return { address, source: "fallback", ...region.result };
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
      return null;
    }

    const data = await response.json() as Record<string, unknown>;
    return parseZoneomicsResponse(address, data);
  } catch {
    return null;
  }
}

function parseZoneomicsResponse(
  address: string,
  data: Record<string, unknown>,
): ZoningResult | null {
  // Zoneomics returns a `properties` array or a single property object
  const property = Array.isArray(data.properties)
    ? (data.properties[0] as Record<string, unknown>)
    : data;

  if (!property) return null;

  const zoning = (property.zoning ?? property.zone_code ?? "") as string;
  const desc = (property.zone_description ?? property.zoning_description ?? zoning) as string;
  const rawSetbacks = property.setbacks as Record<string, unknown> | undefined;
  const landUse = ((property.land_use ?? property.use_description ?? "") as string).toLowerCase();

  // ADU / residential indicator
  const isResidential = /residential|single.?family|r-|rs-|rf-|rs1|rl|rm/.test(
    (zoning + desc + landUse).toLowerCase(),
  );

  // Extract setbacks
  const front = rawSetbacks?.front ? `${rawSetbacks.front} ft` : null;
  const side = rawSetbacks?.side ? `${rawSetbacks.side} ft` : null;
  const rear = rawSetbacks?.rear ? `${rawSetbacks.rear} ft` : null;

  // Max ADU size — Zoneomics may return max_adu_sqft or we infer from lot coverage
  const maxAduSqft = property.max_adu_sqft
    ? Number(property.max_adu_sqft)
    : inferMaxAduSize(property);

  // Stories
  const maxStories = property.max_stories
    ? Number(property.max_stories)
    : property.max_height
    ? Math.max(1, Math.floor(Number(property.max_height) / 10))
    : null;

  // Review risk heuristic
  const reviewRisk = deriveReviewRisk(zoning, desc, property);

  return {
    address,
    zone: zoning,
    zoneDescription: desc,
    maxSquareFeet: maxAduSqft,
    maxStories,
    setbackFront: front,
    setbackSide: side,
    setbackRear: rear,
    aduPermitted: isResidential,
    reviewRisk,
    permitPath: reviewRisk === "High"
      ? "Enhanced site review"
      : reviewRisk === "Medium"
      ? "Municipal plus design review"
      : "Standard ADU review",
    source: "zoneomics",
    rawData: property,
  };
}

function inferMaxAduSize(property: Record<string, unknown>): number | null {
  // Some responses include lot area — typical ADU allowance is 40-50% of main floor or 850-1000 sqft cap
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
): "Low" | "Medium" | "High" {
  const combined = (zone + desc + JSON.stringify(property)).toLowerCase();

  if (
    combined.includes("flood") ||
    combined.includes("hazard") ||
    combined.includes("heritage") ||
    combined.includes("sensitive") ||
    combined.includes("overlay")
  ) {
    return "High";
  }

  if (
    combined.includes("design review") ||
    combined.includes("hoa") ||
    combined.includes("corner") ||
    combined.includes("historic")
  ) {
    return "Medium";
  }

  return "Low";
}
