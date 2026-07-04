import { createHash } from "node:crypto";

type GeocodedAddress = {
  latitude: number;
  longitude: number;
  municipality: string;
  region: string;
  countryCode: string;
  displayName: string;
};

export type MunicipalOpenDataMatch = {
  provider: "edmonton_open_data" | "calgary_open_data" | "vancouver_open_data";
  jurisdiction: string;
  zoneCode: string;
  zoneDescription: string;
  sourceUrl: string;
  dataUpdatedAt?: string;
  geocodedAddress: string;
  rawData: Record<string, unknown>;
};

const USER_AGENT = "ADUflow/0.1 (https://aduflow.ca; support@aduflow.ca)";
const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const geocodeCache = new Map<string, { expiresAt: number; value: GeocodedAddress | null }>();
let geocodeQueue: Promise<void> = Promise.resolve();
let lastGeocodeStartedAt = 0;

export async function lookupMunicipalOpenData(
  address: string,
): Promise<MunicipalOpenDataMatch | null> {
  const location = await geocodeCanadianAddress(address);
  if (!location || location.countryCode !== "ca") return null;

  const municipality = location.municipality.toLowerCase();
  if (municipality === "edmonton") return lookupEdmonton(location);
  if (municipality === "calgary") return lookupCalgary(location);
  if (municipality === "vancouver") return lookupVancouver(location);
  return null;
}

async function geocodeCanadianAddress(address: string): Promise<GeocodedAddress | null> {
  const cacheKey = createHash("sha256").update(address.trim().toLowerCase()).digest("hex");
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const query = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
    countrycodes: "ca",
    q: address,
  });
  const records = await queuedGeocodeFetch(
    `https://nominatim.openstreetmap.org/search?${query}`,
  );
  const record = records[0];
  if (!record) {
    rememberGeocode(cacheKey, null);
    return null;
  }
  const details = (record.address ?? {}) as Record<string, unknown>;
  const latitude = Number(record.lat);
  const longitude = Number(record.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    rememberGeocode(cacheKey, null);
    return null;
  }

  const municipality = firstText(details.city, details.town, details.municipality, details.village);
  if (!municipality) {
    rememberGeocode(cacheKey, null);
    return null;
  }

  const result = {
    latitude,
    longitude,
    municipality,
    region: firstText(details.state, details.province),
    countryCode: firstText(details.country_code).toLowerCase(),
    displayName: firstText(record.display_name) || address,
  };
  rememberGeocode(cacheKey, result);
  return result;
}

async function queuedGeocodeFetch(url: string): Promise<Array<Record<string, unknown>>> {
  let releaseQueue: () => void = () => undefined;
  const previous = geocodeQueue;
  geocodeQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });
  await previous;

  try {
    const waitMs = Math.max(0, 1000 - (Date.now() - lastGeocodeStartedAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastGeocodeStartedAt = Date.now();
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    return (await response.json()) as Array<Record<string, unknown>>;
  } finally {
    releaseQueue();
  }
}

function rememberGeocode(key: string, value: GeocodedAddress | null) {
  if (geocodeCache.size >= 500) {
    const oldestKey = geocodeCache.keys().next().value as string | undefined;
    if (oldestKey) geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(key, { expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS, value });
}

async function lookupEdmonton(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const point = `POINT (${location.longitude} ${location.latitude})`;
  const query = new URLSearchParams({
    "$select": "id,zoning,description,date_ext,url",
    "$where": `intersects(geometry_multipolygon, '${point}')`,
    "$limit": "3",
  });
  const records = await fetchRecords(`https://data.edmonton.ca/resource/fixa-tstc.json?${query}`);
  const record = records[0];
  if (!record) return null;

  return {
    provider: "edmonton_open_data",
    jurisdiction: "Edmonton, AB",
    zoneCode: firstText(record.zoning) || "Unknown",
    zoneDescription: firstText(record.description) || firstText(record.zoning) || "Edmonton zoning district",
    sourceUrl: safeHttpUrl(record.url) || "https://data.edmonton.ca/d/fixa-tstc",
    dataUpdatedAt: firstText(record.date_ext) || undefined,
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function lookupCalgary(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const point = `POINT (${location.longitude} ${location.latitude})`;
  const query = new URLSearchParams({
    "$select": "lu_code,label,description,major,generalize,height,far,lu_bylaw,dc_bylaw,dc_site_no",
    "$where": `intersects(multipolygon, '${point}')`,
    "$limit": "3",
  });
  const records = await fetchRecords(`https://data.calgary.ca/resource/qe6k-p9nh.json?${query}`);
  const record = records[0];
  if (!record) return null;

  return {
    provider: "calgary_open_data",
    jurisdiction: "Calgary, AB",
    zoneCode: firstText(record.lu_code, record.label) || "Unknown",
    zoneDescription:
      firstText(record.description, record.major, record.generalize) || "Calgary land-use district",
    sourceUrl: "https://data.calgary.ca/d/qe6k-p9nh",
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function lookupVancouver(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const query = new URLSearchParams({
    select: "object_id,zoning_classification,zoning_category,zoning_district,cd_1_number",
    where: `within_distance(geom, geom'POINT(${location.longitude} ${location.latitude})', 1m)`,
    limit: "3",
  });
  const response = await fetch(
    `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/zoning-districts-and-labels/records?${query}`,
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000), cache: "no-store" },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
  const record = payload.results?.[0];
  if (!record) return null;

  return {
    provider: "vancouver_open_data",
    jurisdiction: "Vancouver, BC",
    zoneCode: firstText(record.zoning_district, record.zoning_category) || "Unknown",
    zoneDescription:
      firstText(record.zoning_classification, record.zoning_category) || "Vancouver zoning district",
    sourceUrl: "https://opendata.vancouver.ca/explore/dataset/zoning-districts-and-labels/",
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function fetchRecords(url: string): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return [];
  return (await response.json()) as Array<Record<string, unknown>>;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function safeHttpUrl(value: unknown): string {
  const text = firstText(value);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}
