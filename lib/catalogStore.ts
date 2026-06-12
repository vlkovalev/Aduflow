import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defaultCatalog, type Model, type OptionChoice, type PricingCatalog } from "./pricingEngine";
import { getSupabaseServiceClient } from "./supabase";
import { getLocalStorePath } from "./localStoreHelper";

type ModelRow = {
  id?: string;
  builder_id?: string;
  model_name?: string;
  model_code?: string;
  square_feet?: number;
  base_price?: number;
  is_active?: boolean;
  sort_order?: number;
};

type OptionRow = {
  id?: string;
  builder_id?: string;
  option_name?: string;
  option_value?: string;
  option_detail?: string;
  option_category?: string;
  option_price?: number;
  is_active?: boolean;
  sort_order?: number;
};

const localModelsPath = getLocalStorePath("models.json");
const localOptionsPath = getLocalStorePath("options.json");

// -- Local File Helpers --

async function readLocalModels(): Promise<ModelRow[]> {
  try {
    const raw = await readFile(localModelsPath, "utf8");
    return JSON.parse(raw) as ModelRow[];
  } catch {
    const seeded = defaultCatalog.models.map((m, index) => ({
      id: m.code,
      model_name: m.name,
      model_code: m.code,
      square_feet: m.squareFeet,
      base_price: m.basePrice,
      is_active: true,
      sort_order: index + 1,
    }));
    await writeLocalModels(seeded);
    return seeded;
  }
}

async function writeLocalModels(data: ModelRow[]) {
  await mkdir(path.dirname(localModelsPath), { recursive: true });
  await writeFile(localModelsPath, JSON.stringify(data, null, 2));
}

async function readLocalOptions(): Promise<OptionRow[]> {
  try {
    const raw = await readFile(localOptionsPath, "utf8");
    return JSON.parse(raw) as OptionRow[];
  } catch {
    const seeded: OptionRow[] = [];
    let sortOrder = 1;
    for (const [category, choices] of Object.entries(defaultCatalog.optionGroups)) {
      for (const choice of choices) {
        seeded.push({
          id: `${category}-${choice.value}`,
          option_name: choice.label,
          option_value: choice.value,
          option_detail: choice.detail,
          option_category: category,
          option_price: choice.price,
          is_active: true,
          sort_order: sortOrder++,
        });
      }
    }
    await writeLocalOptions(seeded);
    return seeded;
  }
}

async function writeLocalOptions(data: OptionRow[]) {
  await mkdir(path.dirname(localOptionsPath), { recursive: true });
  await writeFile(localOptionsPath, JSON.stringify(data, null, 2));
}

// -- Main Exports --

export async function getPricingCatalog(builderId = "00000000-0000-0000-0000-000000000001"): Promise<PricingCatalog> {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const [modelsResult, optionsResult] = await Promise.all([
        supabase
          .from("models")
          .select("id, model_name, model_code, square_feet, base_price, is_active, sort_order, builder_id")
          .eq("is_active", true)
          .eq("builder_id", builderId)
          .order("sort_order"),
        supabase
          .from("options")
          .select("option_name, option_value, option_detail, option_category, option_price, is_active, sort_order, builder_id")
          .eq("is_active", true)
          .eq("builder_id", builderId)
          .order("sort_order"),
      ]);

      if (!modelsResult.error && !optionsResult.error && modelsResult.data?.length) {
        const catalogModels = (modelsResult.data as ModelRow[]).map(mapModelRow).filter(Boolean) as Model[];
        const catalogOptions = mapOptionRows((optionsResult.data as OptionRow[]) ?? []);

        return {
          models: catalogModels.length ? catalogModels : defaultCatalog.models,
          optionGroups: hasRequiredGroups(catalogOptions) ? catalogOptions : defaultCatalog.optionGroups,
        };
      }
    } catch (e) {
      console.warn("Supabase getPricingCatalog error, fallback to local:", e);
    }
  }

  // Local file fallback
  try {
    const localModels = await readLocalModels();
    const localOptions = await readLocalOptions();

    const activeModels = localModels.filter(
      (m) => m.is_active !== false && (m.builder_id || "00000000-0000-0000-0000-000000000001") === builderId
    );
    const activeOptions = localOptions.filter(
      (o) => o.is_active !== false && (o.builder_id || "00000000-0000-0000-0000-000000000001") === builderId
    );

    const catalogModels = activeModels.map(mapModelRow).filter(Boolean) as Model[];
    const catalogOptions = mapOptionRows(activeOptions);

    return {
      models: catalogModels.length ? catalogModels : defaultCatalog.models,
      optionGroups: hasRequiredGroups(catalogOptions) ? catalogOptions : defaultCatalog.optionGroups,
    };
  } catch {
    return defaultCatalog;
  }
}

// -- Models CRUD --

export async function listModels(builderId = "00000000-0000-0000-0000-000000000001"): Promise<ModelRow[]> {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("models")
        .select("id, model_name, model_code, square_feet, base_price, is_active, sort_order, builder_id")
        .eq("builder_id", builderId)
        .order("sort_order");
      if (!error && data) return data as ModelRow[];
    } catch (e) {
      console.warn("Supabase listModels error, fallback to local:", e);
    }
  }

  const local = await readLocalModels();
  return local.filter((m) => (m.builder_id || "00000000-0000-0000-0000-000000000001") === builderId);
}

export async function createModel(
  input: { modelName: string; squareFeet: number; basePrice: number },
  builderId = "00000000-0000-0000-0000-000000000001"
): Promise<ModelRow> {
  const modelCode = input.modelName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const record: ModelRow = {
    id: randomUUID(),
    builder_id: builderId,
    model_name: input.modelName,
    model_code: modelCode,
    square_feet: input.squareFeet,
    base_price: input.basePrice,
    is_active: true,
    sort_order: 99,
  };

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("models")
        .insert(record)
        .select()
        .single();
      if (!error && data) return data as ModelRow;
    } catch (e) {
      console.warn("Supabase createModel error, fallback to local:", e);
    }
  }

  const local = await readLocalModels();
  local.push(record);
  await writeLocalModels(local);
  return record;
}

export async function updateModel(
  id: string,
  updates: { modelName?: string; squareFeet?: number; basePrice?: number; isActive?: boolean; sortOrder?: number }
): Promise<ModelRow | null> {
  const mappedUpdates: Partial<ModelRow> = {};
  if (updates.modelName !== undefined) {
    mappedUpdates.model_name = updates.modelName;
    mappedUpdates.model_code = updates.modelName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (updates.squareFeet !== undefined) mappedUpdates.square_feet = updates.squareFeet;
  if (updates.basePrice !== undefined) mappedUpdates.base_price = updates.basePrice;
  if (updates.isActive !== undefined) mappedUpdates.is_active = updates.isActive;
  if (updates.sortOrder !== undefined) mappedUpdates.sort_order = updates.sortOrder;

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("models")
        .update(mappedUpdates)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as ModelRow;
    } catch (e) {
      console.warn("Supabase updateModel error, fallback to local:", e);
    }
  }

  const local = await readLocalModels();
  const index = local.findIndex((m) => m.id === id);
  if (index !== -1) {
    local[index] = { ...local[index], ...mappedUpdates };
    await writeLocalModels(local);
    return local[index];
  }
  return null;
}

export async function deleteModel(id: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { error } = await supabase.from("models").delete().eq("id", id);
      if (!error) return true;
    } catch (e) {
      console.warn("Supabase deleteModel error, fallback to local:", e);
    }
  }

  const local = await readLocalModels();
  const filtered = local.filter((m) => m.id !== id);
  await writeLocalModels(filtered);
  return true;
}

// -- Options CRUD --

export async function listOptions(builderId = "00000000-0000-0000-0000-000000000001"): Promise<OptionRow[]> {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("options")
        .select("id, option_name, option_value, option_detail, option_category, option_price, is_active, sort_order, builder_id")
        .eq("builder_id", builderId)
        .order("sort_order");
      if (!error && data) return data as OptionRow[];
    } catch (e) {
      console.warn("Supabase listOptions error, fallback to local:", e);
    }
  }

  const local = await readLocalOptions();
  return local.filter((o) => (o.builder_id || "00000000-0000-0000-0000-000000000001") === builderId);
}

export async function createOption(
  input: { optionName: string; detail: string; price: number; category: string },
  builderId = "00000000-0000-0000-0000-000000000001"
): Promise<OptionRow> {
  const optionValue = input.optionName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const record: OptionRow = {
    id: randomUUID(),
    builder_id: builderId,
    option_name: input.optionName,
    option_value: optionValue,
    option_detail: input.detail,
    option_category: input.category,
    option_price: input.price,
    is_active: true,
    sort_order: 99,
  };

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("options")
        .insert(record)
        .select()
        .single();
      if (!error && data) return data as OptionRow;
    } catch (e) {
      console.warn("Supabase createOption error, fallback to local:", e);
    }
  }

  const local = await readLocalOptions();
  local.push(record);
  await writeLocalOptions(local);
  return record;
}

export async function updateOption(
  id: string,
  updates: { optionName?: string; detail?: string; price?: number; isActive?: boolean; sortOrder?: number }
): Promise<OptionRow | null> {
  const mappedUpdates: Partial<OptionRow> = {};
  if (updates.optionName !== undefined) {
    mappedUpdates.option_name = updates.optionName;
    mappedUpdates.option_value = updates.optionName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (updates.detail !== undefined) mappedUpdates.option_detail = updates.detail;
  if (updates.price !== undefined) mappedUpdates.option_price = updates.price;
  if (updates.isActive !== undefined) mappedUpdates.is_active = updates.isActive;
  if (updates.sortOrder !== undefined) mappedUpdates.sort_order = updates.sortOrder;

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("options")
        .update(mappedUpdates)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as OptionRow;
    } catch (e) {
      console.warn("Supabase updateOption error, fallback to local:", e);
    }
  }

  const local = await readLocalOptions();
  const index = local.findIndex((o) => o.id === id);
  if (index !== -1) {
    local[index] = { ...local[index], ...mappedUpdates };
    await writeLocalOptions(local);
    return local[index];
  }
  return null;
}

export async function deleteOption(id: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { error } = await supabase.from("options").delete().eq("id", id);
      if (!error) return true;
    } catch (e) {
      console.warn("Supabase deleteOption error, fallback to local:", e);
    }
  }

  const local = await readLocalOptions();
  const filtered = local.filter((o) => o.id !== id);
  await writeLocalOptions(filtered);
  return true;
}

// -- Mapping Helpers --

function mapModelRow(row: ModelRow) {
  if (!row.model_code || !row.model_name) {
    return null;
  }

  return {
    code: row.model_code,
    name: row.model_name,
    squareFeet: Number(row.square_feet ?? 0),
    basePrice: Number(row.base_price ?? 0),
  } satisfies Model;
}

function mapOptionRows(rows: OptionRow[]) {
  return rows.reduce<Record<string, OptionChoice[]>>((groups, row) => {
    const category = normalizeCategory(row.option_category ?? "");

    if (!category || !row.option_name) {
      return groups;
    }

    groups[category] = groups[category] ?? [];
    groups[category].push({
      value: row.option_value || slugify(row.option_name),
      label: row.option_name,
      detail: row.option_detail || `${row.option_name} package`,
      price: Number(row.option_price ?? 0),
    });

    return groups;
  }, {});
}

function hasRequiredGroups(groups: Record<string, OptionChoice[]>) {
  return ["finish", "foundation", "utilities", "site"].every((group) => groups[group]?.length);
}

function normalizeCategory(category: string) {
  const normalized = category.toLowerCase().trim();

  if (["finish", "finishes"].includes(normalized)) return "finish";
  if (["foundation", "foundations"].includes(normalized)) return "foundation";
  if (["utility", "utilities"].includes(normalized)) return "utilities";
  if (["site", "site condition", "site conditions"].includes(normalized)) return "site";

  return normalized;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
