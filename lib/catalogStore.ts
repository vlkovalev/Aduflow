import { defaultCatalog, type Model, type OptionChoice, type PricingCatalog } from "./pricingEngine";
import { getSupabaseServiceClient } from "./supabase";

type ModelRow = {
  id?: string;
  model_name?: string;
  model_code?: string;
  square_feet?: number;
  base_price?: number;
  is_active?: boolean;
};

type OptionRow = {
  option_name?: string;
  option_value?: string;
  option_detail?: string;
  option_category?: string;
  option_price?: number;
  is_active?: boolean;
};

export async function getPricingCatalog(): Promise<PricingCatalog> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return defaultCatalog;
  }

  try {
    const [modelsResult, optionsResult] = await Promise.all([
      supabase
        .from("models")
        .select("id, model_name, model_code, square_feet, base_price, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("options")
        .select("option_name, option_value, option_detail, option_category, option_price, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    if (modelsResult.error || optionsResult.error || !modelsResult.data?.length) {
      return defaultCatalog;
    }

    const catalogModels = (modelsResult.data as ModelRow[]).map(mapModelRow).filter(Boolean) as Model[];
    const catalogOptions = mapOptionRows((optionsResult.data as OptionRow[]) ?? []);

    return {
      models: catalogModels.length ? catalogModels : defaultCatalog.models,
      optionGroups: hasRequiredGroups(catalogOptions) ? catalogOptions : defaultCatalog.optionGroups,
    };
  } catch {
    return defaultCatalog;
  }
}

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
