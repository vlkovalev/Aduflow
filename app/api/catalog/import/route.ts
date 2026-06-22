import { NextResponse } from "next/server";
import { readSheet } from "read-excel-file/node";
import { importModels, importOptions } from "../../../../lib/catalogStore";
import { requireBuilder } from "../../../../lib/apiAuth";

export const runtime = "nodejs";

type ImportKind = "models" | "options";

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

type CsvRow = Record<string, string>;

type ValidationResult =
  | {
      kind: "models";
      rows: Array<{
        modelName: string;
        modelCode?: string;
        squareFeet: number;
        basePrice: number;
        isActive?: boolean;
        sortOrder?: number;
      }>;
      errors: string[];
    }
  | {
      kind: "options";
      rows: Array<{
        optionCategory: string;
        optionName: string;
        optionValue?: string;
        optionDetail?: string;
        optionPrice: number;
        isActive?: boolean;
        sortOrder?: number;
      }>;
      errors: string[];
    };

export async function POST(request: Request) {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const form = await request.formData();
    const kind = String(form.get("kind") ?? "") as ImportKind;
    const dryRun = String(form.get("dryRun") ?? "true") !== "false";
    const file = form.get("file");

    if (kind !== "models" && kind !== "options") {
      return NextResponse.json({ error: "kind must be models or options" }, { status: 400 });
    }

    if (!file || typeof file !== "object" || typeof (file as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: "CSV or XLSX file is required" }, { status: 400 });
    }

    if ((file as Blob).size > MAX_IMPORT_FILE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.` },
        { status: 400 },
      );
    }

    const parsedRows = await parseImportRows(file as Blob);
    const validation = kind === "models" ? validateModels(parsedRows) : validateOptions(parsedRows);

    if (validation.errors.length || dryRun) {
      return NextResponse.json({
        kind,
        dryRun,
        imported: false,
        validRows: validation.rows.length,
        previewRows: validation.rows.slice(0, 8),
        errors: validation.errors,
      });
    }

    const importedRows =
      validation.kind === "models"
        ? await importModels(validation.rows, auth.builderId)
        : await importOptions(validation.rows, auth.builderId);

    return NextResponse.json({
      kind,
      dryRun,
      imported: true,
      importedRows: importedRows.length,
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import catalog file" },
      { status: 400 },
    );
  }
}

async function parseImportRows(file: Blob): Promise<CsvRow[]> {
  const name = "name" in file ? String((file as { name?: string }).name ?? "") : "";
  const isExcel = name.toLowerCase().endsWith(".xlsx") || file.type.includes("spreadsheetml");

  if (isExcel) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return await parseXlsx(buffer);
  }

  const csv = await file.text();
  return parseCsv(csv);
}

function parseCsv(input: string): CsvRow[] {
  const rows = parseCsvRows(input.trim());
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row) => {
    return headers.reduce<CsvRow>((record, header, index) => {
      record[header] = (row[index] ?? "").trim();
      return record;
    }, {});
  });
}

async function parseXlsx(input: Buffer): Promise<CsvRow[]> {
  const rows = await readSheet(input);
  if (rows.length < 2) {
    throw new Error("The XLSX file does not contain a readable worksheet with data rows.");
  }

  const headers = rows[0].map((header) => normalizeHeader(String(header ?? "")));
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== null && String(cell).trim() !== ""))
    .map((row) => {
      return headers.reduce<CsvRow>((record, header, index) => {
        const cellValue = row[index];
        record[header] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : "";
        return record;
      }, {});
    });
}

function parseCsvRows(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);
  return rows;
}

function validateModels(rows: CsvRow[]): ValidationResult {
  const errors: string[] = [];
  const seenCodes = new Map<string, number>();
  const validRows = rows.map((row, index) => {
    const line = index + 2;
    const modelName = row.model_name || row.modelName;
    const modelCode = row.model_code || row.modelCode || slugify(modelName || "");
    const squareFeet = toNumber(row.square_feet || row.squareFeet);
    const basePrice = toNumber(row.base_price || row.basePrice);

    if (!modelName) errors.push(`Line ${line}: model_name is required.`);
    if (modelCode) {
      const firstLine = seenCodes.get(modelCode);
      if (firstLine) {
        errors.push(`Line ${line}: duplicate model code "${modelCode}" already appears on line ${firstLine}.`);
      } else {
        seenCodes.set(modelCode, line);
      }
    }
    if (!squareFeet || squareFeet <= 0) errors.push(`Line ${line}: square_feet must be greater than 0.`);
    if (!basePrice || basePrice <= 0) errors.push(`Line ${line}: base_price must be greater than 0.`);

    return {
      modelName,
      modelCode: row.model_code || row.modelCode || undefined,
      squareFeet,
      basePrice,
      isActive: toBoolean(row.is_active || row.isActive),
      sortOrder: toOptionalNumber(row.sort_order || row.sortOrder),
    };
  });

  return { kind: "models", rows: errors.length ? [] : validRows, errors };
}

function validateOptions(rows: CsvRow[]): ValidationResult {
  const errors: string[] = [];
  const validCategories = ["finish", "foundation", "utilities", "site"];
  const seenKeys = new Map<string, number>();
  const validRows = rows.map((row, index) => {
    const line = index + 2;
    const optionCategory = normalizeCategory(row.option_category || row.optionCategory);
    const optionName = row.option_name || row.optionName;
    const optionValue = row.option_value || row.optionValue || slugify(optionName || "");
    const optionKey = `${optionCategory}:${optionValue}`;
    const optionPrice = toNumber(row.option_price || row.optionPrice);

    if (!validCategories.includes(optionCategory)) {
      errors.push(`Line ${line}: option_category must be finish, foundation, utilities, or site.`);
    }
    if (!optionName) errors.push(`Line ${line}: option_name is required.`);
    if (optionName && optionValue) {
      const firstLine = seenKeys.get(optionKey);
      if (firstLine) {
        errors.push(`Line ${line}: duplicate option "${optionKey}" already appears on line ${firstLine}.`);
      } else {
        seenKeys.set(optionKey, line);
      }
    }
    if (Number.isNaN(optionPrice) || optionPrice < 0) errors.push(`Line ${line}: option_price must be 0 or greater.`);

    return {
      optionCategory,
      optionName,
      optionValue: row.option_value || row.optionValue || undefined,
      optionDetail: row.option_detail || row.optionDetail || undefined,
      optionPrice,
      isActive: toBoolean(row.is_active || row.isActive),
      sortOrder: toOptionalNumber(row.sort_order || row.sortOrder),
    };
  });

  return { kind: "options", rows: errors.length ? [] : validRows, errors };
}

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, "");
}

function normalizeCategory(value: string) {
  const normalized = value.toLowerCase().trim();
  if (normalized === "finishes") return "finish";
  if (normalized === "foundation") return "foundation";
  if (normalized === "utility") return "utilities";
  if (normalized === "site condition" || normalized === "site conditions") return "site";
  return normalized;
}

function toNumber(value: string) {
  return Number(String(value ?? "").replace(/[$,\s]/g, ""));
}

function toOptionalNumber(value: string) {
  if (!value) return undefined;
  const parsed = toNumber(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toBoolean(value: string) {
  if (!value) return undefined;
  return ["true", "yes", "1", "active"].includes(value.toLowerCase().trim());
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
