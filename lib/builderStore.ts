import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServiceClient } from "./supabase";

export type BuilderCredentials = {
  companyName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  insuranceCarrier: string;
  insuranceLimit: number;
  insuranceExpiration: string;
  bondProvider: string;
  bondAmount: number;
  warrantyInfo: string;
  serviceRegion: string;
};

const DEFAULT_CREDENTIALS: BuilderCredentials = {
  companyName: "Apex Modular Builders",
  email: "info@apexmodular.com",
  phone: "(604) 555-0199",
  licenseNumber: "BC-GC-998822",
  insuranceCarrier: "Pacific Underwriters Ltd.",
  insuranceLimit: 2000000,
  insuranceExpiration: "2027-04-15",
  bondProvider: "Surety First Assurance",
  bondAmount: 100000,
  warrantyInfo: "2-5-10 Year New Home Warranty Protection Program",
  serviceRegion: "Metro Vancouver, Fraser Valley, and Southern Vancouver Island",
};

const localStorePath = path.join(process.cwd(), ".data", "builder.json");

export async function getBuilderCredentials(): Promise<BuilderCredentials> {
  const supabase = getSupabaseServiceClient();

  // Load from local store first as primary source of credentials
  let localData: BuilderCredentials | null = null;
  try {
    const raw = await readFile(localStorePath, "utf8");
    localData = JSON.parse(raw) as BuilderCredentials;
  } catch {
    // If local store doesn't exist, we will use default credentials
  }

  if (supabase) {
    try {
      // Sync or retrieve from builders table if configured
      const { data, error } = await supabase
        .from("builders")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        // Merge Supabase base values with local extra credentials
        return {
          ...DEFAULT_CREDENTIALS,
          ...localData,
          companyName: data.company_name || localData?.companyName || DEFAULT_CREDENTIALS.companyName,
          email: data.email || localData?.email || DEFAULT_CREDENTIALS.email,
          phone: data.phone || localData?.phone || DEFAULT_CREDENTIALS.phone,
        };
      }
    } catch {
      // Fallback to local
    }
  }

  return localData ?? DEFAULT_CREDENTIALS;
}

export async function updateBuilderCredentials(input: Partial<BuilderCredentials>): Promise<BuilderCredentials> {
  const current = await getBuilderCredentials();
  const updated = { ...current, ...input };

  // 1. Write to local JSON store
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(updated, null, 2));

  // 2. Sync base fields to Supabase if configured
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("builders")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("builders")
          .update({
            company_name: updated.companyName,
            email: updated.email,
            phone: updated.phone,
          })
          .eq("id", existing.id);
      } else {
        // Insert a new default UUID row
        await supabase
          .from("builders")
          .insert({
            id: "00000000-0000-0000-0000-000000000001",
            company_name: updated.companyName,
            email: updated.email,
            phone: updated.phone,
          });
      }
    } catch {
      // Ignore sync failures
    }
  }

  return updated;
}
