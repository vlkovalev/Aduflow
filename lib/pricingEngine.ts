export type Model = {
  code: string;
  name: string;
  squareFeet: number;
  basePrice: number;
};

export type ProjectInput = {
  parcelType: string;
  modelCode: string;
  finish: string;
  foundation: string;
  utilities: string;
  site: string;
  zoningMaxSqFt?: number | null;
  zoningMaxStories?: number | null;
  zoningSetbackSide?: string | null;
  zoningSetbackRear?: string | null;
  zoningReviewRisk?: "Low" | "Medium" | "High" | null;
};

export type OptionChoice = {
  value: string;
  label: string;
  detail: string;
  price: number;
};

export type PricingCatalog = {
  models: Model[];
  optionGroups: Record<string, OptionChoice[]>;
};

export type ParcelScenario = {
  value: string;
  label: string;
  detail: string;
  maxSquareFeet: number;
  maxStories: number;
  setback: string;
  permitPath: string;
  reviewRisk: "Low" | "Medium" | "High";
};

export type ZoningSnapshot = {
  zoneCode: string;
  zoneDescription: string;
  maxAduSqFt: number | null;
  maxStories: number | null;
  frontSetback: string | null;
  sideSetback: string | null;
  rearSetback: string | null;
  aduPermitted: boolean | null;
  reviewRisk: "Low" | "Medium" | "High";
  permitPath: string;
  source?: string;
};

export const parcelScenarios: ParcelScenario[] = [
  {
    value: "urban-lane",
    label: "Urban lot with lane",
    detail: "Best fit for detached ADU or garden suite",
    maxSquareFeet: 860,
    maxStories: 2,
    setback: "4 ft side and rear target",
    permitPath: "Standard ADU review",
    reviewRisk: "Low",
  },
  {
    value: "suburban-deep",
    label: "Deep suburban lot",
    detail: "Usually supports larger detached backyard units",
    maxSquareFeet: 1000,
    maxStories: 2,
    setback: "5 ft side and 6 ft rear target",
    permitPath: "Standard zoning review",
    reviewRisk: "Low",
  },
  {
    value: "corner-hoa",
    label: "Corner lot or HOA",
    detail: "Needs design guideline and privacy review",
    maxSquareFeet: 720,
    maxStories: 1,
    setback: "Confirm sightline and HOA rules",
    permitPath: "Municipal plus design review",
    reviewRisk: "Medium",
  },
  {
    value: "tight-servicing",
    label: "Tight services",
    detail: "Constrained access or utility upgrade likely",
    maxSquareFeet: 624,
    maxStories: 1,
    setback: "Survey required before design",
    permitPath: "Enhanced site review",
    reviewRisk: "High",
  },
];

export const models: Model[] = [
  {
    code: "studio-312",
    name: "Backyard Studio 312",
    squareFeet: 312,
    basePrice: 72000,
  },
  {
    code: "suite-624",
    name: "Garden Suite 624",
    squareFeet: 624,
    basePrice: 154000,
  },
  {
    code: "adu-816",
    name: "Two-Bed ADU 816",
    squareFeet: 816,
    basePrice: 196000,
  },
];

export const optionGroups: Record<string, OptionChoice[]> = {
  finish: [
    { value: "essential", label: "Essential", detail: "Durable rental-ready finish", price: 0 },
    { value: "comfort", label: "Comfort", detail: "Upgraded kitchen and bath package", price: 18500 },
    { value: "premium", label: "Premium", detail: "Higher-end millwork and fixtures", price: 34500 },
  ],
  foundation: [
    { value: "slab", label: "Slab", detail: "Simple prepared urban site", price: 22000 },
    { value: "helical", label: "Helical piles", detail: "Lower disturbance backyard install", price: 28500 },
    { value: "crawl", label: "Crawlspace", detail: "Best for servicing and cold climates", price: 42000 },
  ],
  utilities: [
    { value: "basic", label: "Basic tie-in", detail: "Short utility run allowance", price: 14500 },
    { value: "standard", label: "Standard tie-in", detail: "Typical water, sewer, power scope", price: 26500 },
    { value: "complex", label: "Complex tie-in", detail: "Long run or panel upgrade allowance", price: 48500 },
  ],
  site: [
    { value: "urban", label: "Urban lot", detail: "Lane or driveway access", price: 8500 },
    { value: "tight", label: "Tight access", detail: "Crane planning or smaller modules", price: 18500 },
    { value: "rural", label: "Rural lot", detail: "Delivery distance and site prep allowance", price: 24500 },
  ],
};

export const defaultCatalog: PricingCatalog = {
  models,
  optionGroups,
};

export function calculatePrice(basePrice: number, options: number[]) {
  const optionTotal = options.reduce((total, option) => total + option, 0);
  return basePrice + optionTotal;
}

export function calculateProjectPrice(input: ProjectInput, catalog: PricingCatalog = defaultCatalog) {
  const model = catalog.models.find((item) => item.code === input.modelCode) ?? catalog.models[0] ?? models[0];
  const feasibility = calculateFeasibility(input.parcelType, model, input);
  const selectedOptions = [
    findOption(catalog.optionGroups, "finish", input.finish),
    findOption(catalog.optionGroups, "foundation", input.foundation),
    findOption(catalog.optionGroups, "utilities", input.utilities),
    findOption(catalog.optionGroups, "site", input.site),
  ];
  const total = calculatePrice(
    model.basePrice,
    selectedOptions.map((option) => option.price),
  );
  const siteComplexity = input.site === "tight" || input.utilities === "complex";

  return {
    total,
    low: Math.round(total * 0.92),
    high: Math.round(total * 1.14),
    factoryCost: Math.round(model.basePrice + findOption(catalog.optionGroups, "finish", input.finish).price),
    siteCost: Math.round(total - model.basePrice - findOption(catalog.optionGroups, "finish", input.finish).price),
    model,
    timelineWeeks: siteComplexity ? 30 : 24,
    feasibility,
    permitPath: siteComplexity ? "Enhanced review" : feasibility.permitPath,
    bom: [
      "Structure and envelope",
      "Foundation",
      "MEP rough-in",
      "Interior finish",
      "Site work",
      "Delivery and install",
    ],
    checklist: [
      "Zoning and setback screen",
      "Preliminary budget and allowances",
      "Contractor scope draft",
      "Permit drawing package requirements",
      "Construction milestone payment schedule",
    ],
    drawMilestones: [
      { stage: "Deposit and permit package", percent: 10 },
      { stage: "Foundation ready", percent: 20 },
      { stage: "Factory completion", percent: 35 },
      { stage: "Set and weather-tight", percent: 20 },
      { stage: "Final inspection", percent: 15 },
    ],
  };
}

function findOption(groups: PricingCatalog["optionGroups"], group: string, value: string) {
  const options = groups[group] ?? optionGroups[group] ?? [];
  return options.find((option) => option.value === value) ?? options[0] ?? { value, label: value, detail: "", price: 0 };
}

export function calculateFeasibility(parcelType: string, model: Model, input?: Partial<ProjectInput>) {
  const scenario = parcelScenarios.find((item) => item.value === parcelType) ?? parcelScenarios[0];
  
  // Dynamic overrides
  const maxSquareFeet = input?.zoningMaxSqFt !== undefined && input?.zoningMaxSqFt !== null
    ? input.zoningMaxSqFt
    : scenario.maxSquareFeet;

  const maxStories = input?.zoningMaxStories !== undefined && input?.zoningMaxStories !== null
    ? input.zoningMaxStories
    : scenario.maxStories;

  const reviewRisk = input?.zoningReviewRisk !== undefined && input?.zoningReviewRisk !== null
    ? input.zoningReviewRisk
    : scenario.reviewRisk;

  const setback = (input?.zoningSetbackSide || input?.zoningSetbackRear)
    ? `Side: ${input.zoningSetbackSide || "Confirm"}, Rear: ${input.zoningSetbackRear || "Confirm"}`
    : scenario.setback;

  const fitsSize = model.squareFeet <= maxSquareFeet;
  const sizeRatio = model.squareFeet / maxSquareFeet;
  const sizePenalty = fitsSize ? Math.max(0, Math.round((sizeRatio - 0.72) * 35)) : 28;
  const storyPenalty = maxStories === 1 && model.squareFeet > 700 ? 8 : 0;
  const riskPenalty = reviewRisk === "High" ? 22 : reviewRisk === "Medium" ? 12 : 0;
  const hoaPenalty = scenario.value.includes("hoa") ? 8 : 0;
  const utilityPenalty = input?.utilities === "complex" ? 12 : input?.utilities === "standard" ? 4 : 0;
  const sitePenalty = input?.site === "tight" ? 12 : input?.site === "rural" ? 6 : 0;
  const foundationCredit = input?.foundation === "helical" && input?.site === "tight" ? 4 : 0;
  const confidence = Math.max(
    18,
    Math.min(92, 92 - sizePenalty - storyPenalty - riskPenalty - hoaPenalty - utilityPenalty - sitePenalty + foundationCredit),
  );

  return {
    value: scenario.value,
    label: input?.zoningMaxSqFt !== undefined && input?.zoningMaxSqFt !== null ? "Address Specific Zoning" : scenario.label,
    detail: scenario.detail,
    maxSquareFeet,
    maxStories,
    setback,
    permitPath: scenario.permitPath,
    reviewRisk,
    fitsSize,
    confidence,
    result: fitsSize && confidence >= 60 ? "Likely feasible" : fitsSize ? "Needs review" : "Needs redesign",
    note: fitsSize
      ? `${model.name} fits the envelope (${maxSquareFeet} sq ft max) with ${reviewRisk.toLowerCase()} review risk.`
      : `${model.name} (${model.squareFeet} sq ft) exceeds the maximum allowed ADU size of ${maxSquareFeet} sq ft for this property.`,
  };
}

export function calculateFeasibilityFromZoning(
  zoning: ZoningSnapshot,
  model: Model,
  input?: Partial<ProjectInput>,
) {
  const maxSquareFeet = zoning.maxAduSqFt ?? 800;
  const maxStories = zoning.maxStories ?? 1;
  const fitsSize = zoning.aduPermitted !== false && model.squareFeet <= maxSquareFeet;
  const reviewPenalty = zoning.reviewRisk === "High" ? 24 : zoning.reviewRisk === "Medium" ? 12 : 0;
  const permissionPenalty = zoning.aduPermitted === false ? 45 : zoning.aduPermitted === null ? 8 : 0;
  const sizePenalty = fitsSize ? Math.max(0, Math.round((model.squareFeet / maxSquareFeet - 0.75) * 30)) : 32;
  const utilityPenalty = input?.utilities === "complex" ? 10 : input?.utilities === "standard" ? 4 : 0;
  const sitePenalty = input?.site === "tight" ? 10 : input?.site === "rural" ? 5 : 0;
  const confidence = Math.max(
    12,
    Math.min(94, 94 - reviewPenalty - permissionPenalty - sizePenalty - utilityPenalty - sitePenalty),
  );
  const setbackParts = [
    zoning.frontSetback ? `front ${zoning.frontSetback}` : null,
    zoning.sideSetback ? `side ${zoning.sideSetback}` : null,
    zoning.rearSetback ? `rear ${zoning.rearSetback}` : null,
  ].filter(Boolean);

  return {
    value: "address-zoning",
    label: zoning.zoneCode || "Address zoning",
    detail: zoning.zoneDescription || "Address-based zoning result",
    maxSquareFeet,
    maxStories,
    setback: setbackParts.length ? setbackParts.join(" / ") : "Confirm with municipality",
    permitPath: zoning.permitPath,
    reviewRisk: zoning.reviewRisk,
    fitsSize,
    confidence,
    result: fitsSize && confidence >= 65 ? "Likely feasible" : fitsSize ? "Needs review" : "Needs redesign",
    note: fitsSize
      ? `${model.name} fits the address-based ${zoning.zoneCode || "zoning"} envelope from ${zoning.source ?? "zoning lookup"}.`
      : `${model.name} does not fit the current address-based zoning envelope.`,
  };
}
