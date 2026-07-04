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
  provider:
    | "edmonton_open_data"
    | "calgary_open_data"
    | "vancouver_open_data"
    | "surrey_open_data"
    | "courtenay_open_data"
    | "toronto_open_data"
    | "seattle_open_data"
    | "portland_open_data";
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
  const location = await geocodeAddress(address);
  if (!location) return null;

  const municipality = location.municipality.toLowerCase();
  if (municipality === "edmonton") return lookupEdmonton(location);
  if (municipality === "calgary") return lookupCalgary(location);
  if (municipality === "vancouver") return lookupVancouver(location);
  if (municipality === "surrey") return lookupSurrey(location);
  if (municipality === "courtenay") return lookupCourtenay(location);
  if (municipality === "toronto") return lookupToronto(location);
  if (municipality === "seattle") return lookupSeattle(location);
  if (municipality === "portland") return lookupPortland(location);
  return null;
}

async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  const cacheKey = createHash("sha256").update(address.trim().toLowerCase()).digest("hex");
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const query = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
    countrycodes: "ca,us",
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

async function lookupSurrey(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const source =
    "https://services5.arcgis.com/YRpe0VKTJytZSSIB/arcgis/rest/services/Zoning%20%20Boundaries/FeatureServer/0";
  const record = await queryArcGisPoint(
    source,
    location,
    "OBJECTID,ZONING_TEXT,ZONING,BY_LAW_01,BY_LAW_02,BY_LAW_03,BY_LAW_04,LOT_TYPE,WEBLINK",
  );
  if (!record) return null;

  return {
    provider: "surrey_open_data",
    jurisdiction: "Surrey, BC",
    zoneCode: firstText(record.ZONING_TEXT, record.ZONING) || "Unknown",
    zoneDescription: firstText(record.ZONING, record.LOT_TYPE) || "Surrey zoning district",
    sourceUrl: safeHttpUrl(record.WEBLINK) || "https://data.surrey.ca/datasets/zoning-boundaries/",
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function lookupCourtenay(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const source =
    "https://services3.arcgis.com/PwS5hVLYsEN2U36s/arcgis/rest/services/Zoning/FeatureServer/0";
  const record = await queryArcGisPoint(
    source,
    location,
    "OBJECTID,Zone,Description,Comments,details,Zonning_byl,last_edited_date",
  );
  if (!record) return null;

  return {
    provider: "courtenay_open_data",
    jurisdiction: "Courtenay, BC",
    zoneCode: firstText(record.Zone) || "Unknown",
    zoneDescription: firstText(record.Description, record.Comments) || "Courtenay zoning district",
    sourceUrl: safeHttpUrl(record.details) || "https://data-courtenay.opendata.arcgis.com/",
    dataUpdatedAt: arcGisDate(record.last_edited_date),
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function lookupToronto(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const source = "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial11/FeatureServer/3";
  const record = await queryArcGisPoint(
    source,
    location,
    "OBJECTID,ZN_ZONE,ZN_STRING,ZN_HOLDING,ZN_EXCPTN,ZN_EXCPTN_NO,ZBL_CHAPTER,ZBL_SECTION,ZBL_EXCPTN,ZN_FRONTAGE,ZN_UNIT_COUNT,ZN_FSI_DENSITY,ZN_COVERAGE,FSI_TOTAL",
  );
  if (!record) return null;

  return {
    provider: "toronto_open_data",
    jurisdiction: "Toronto, ON",
    zoneCode: firstText(record.ZN_STRING, record.ZN_ZONE) || "Unknown",
    zoneDescription: firstText(record.ZN_ZONE) || "Toronto zoning district",
    sourceUrl:
      "https://www.toronto.ca/city-government/planning-development/zoning-by-law-preliminary-zoning-reviews/zoning-by-law-569-2013-2/",
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function lookupSeattle(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const source =
    "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Current_Land_Use_Zoning_Detail_2/FeatureServer/0";
  const record = await queryArcGisPoint(
    source,
    location,
    "OBJECTID,ZONING,BASE_ZONE,ZONING_DESC,CLASS_DESC,CATEGORY_DESC,DETAIL_DESC,OVERLAY,HISTORIC,SHORELINE,LIGHTRAIL,EFFECTIVE,CHAPTER_LINK",
  );
  if (!record) return null;

  return {
    provider: "seattle_open_data",
    jurisdiction: "Seattle, WA",
    zoneCode: firstText(record.ZONING, record.BASE_ZONE) || "Unknown",
    zoneDescription:
      firstText(record.ZONING_DESC, record.DETAIL_DESC, record.CATEGORY_DESC) || "Seattle zoning district",
    sourceUrl: safeHttpUrl(record.CHAPTER_LINK) || "https://data.seattle.gov/dataset/Land-Use-Zoning/vckc-k5ef",
    dataUpdatedAt: arcGisDate(record.EFFECTIVE),
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function lookupPortland(location: GeocodedAddress): Promise<MunicipalOpenDataMatch | null> {
  const source = "https://www.portlandmaps.com/od/rest/services/COP_OpenData_ZoningCode/MapServer/16";
  const record = await queryArcGisPoint(
    source,
    location,
    "OBJECTID,ZONE,ZONE_DESC,OVRLY,OVRLY_DESC,PLDIST,PLDIST_DESC,HIST,HIST_DESC,CONSV,CONSV_DESC,UNINC",
  );
  if (!record) return null;

  return {
    provider: "portland_open_data",
    jurisdiction: "Portland, OR",
    zoneCode: firstText(record.ZONE) || "Unknown",
    zoneDescription: firstText(record.ZONE_DESC) || "Portland zoning district",
    sourceUrl: "https://www.portlandmaps.com/od/rest/services/COP_OpenData_ZoningCode/MapServer/16",
    geocodedAddress: location.displayName,
    rawData: record,
  };
}

async function queryArcGisPoint(
  layerUrl: string,
  location: GeocodedAddress,
  outFields: string,
): Promise<Record<string, unknown> | null> {
  const query = new URLSearchParams({
    f: "json",
    where: "1=1",
    geometry: `${location.longitude},${location.latitude}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields,
    returnGeometry: "false",
    resultRecordCount: "3",
  });
  const response = await fetch(`${layerUrl}/query?${query}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    features?: Array<{ attributes?: Record<string, unknown> }>;
    error?: unknown;
  };
  if (payload.error) return null;
  return payload.features?.[0]?.attributes ?? null;
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

function arcGisDate(value: unknown): string | undefined {
  const timestamp = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return undefined;
  return new Date(timestamp).toISOString();
}
