import { NextResponse } from "next/server";
import { inflateRawSync } from "node:zlib";
import { importModels, importOptions } from "../../../../lib/catalogStore";
import { requireBuilder } from "../../../../lib/apiAuth";

export const runtime = "nodejs";

type ImportKind = "models" | "options";

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

type CsvRow = Record<string, string>;
type WorkbookFile = {
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
};

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
    return parseXlsx(buffer);
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

function parseXlsx(input: Buffer): CsvRow[] {
  const files = readZipFiles(input);
  const sharedStrings = parseSharedStrings(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "");
  const sheetPath = getFirstWorksheetPath(files) ?? "xl/worksheets/sheet1.xml";
  const sheetXml = files.get(sheetPath)?.toString("utf8");

  if (!sheetXml) {
    throw new Error("The XLSX file does not contain a readable first worksheet.");
  }

  const rows = parseWorksheetRows(sheetXml, sharedStrings);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row) => {
    return headers.reduce<CsvRow>((record, header, index) => {
      record[header] = (row[index] ?? "").trim();
      return record;
    }, {});
  });
}

function readZipFiles(input: Buffer) {
  const directory = readCentralDirectory(input);
  const files = new Map<string, Buffer>();

  for (const [name, entry] of directory) {
    const localHeader = entry.localHeaderOffset;
    if (input.readUInt32LE(localHeader) !== 0x04034b50) continue;

    const fileNameLength = input.readUInt16LE(localHeader + 26);
    const extraLength = input.readUInt16LE(localHeader + 28);
    const dataStart = localHeader + 30 + fileNameLength + extraLength;
    const compressed = input.subarray(dataStart, dataStart + entry.compressedSize);

    if (entry.method === 0) {
      files.set(name, compressed);
    } else if (entry.method === 8) {
      files.set(name, inflateRawSync(compressed));
    }
  }

  return files;
}

function readCentralDirectory(input: Buffer) {
  const entries = new Map<string, WorkbookFile>();
  const eocdOffset = findEndOfCentralDirectory(input);
  const entryCount = input.readUInt16LE(eocdOffset + 10);
  let offset = input.readUInt32LE(eocdOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (input.readUInt32LE(offset) !== 0x02014b50) break;

    const method = input.readUInt16LE(offset + 10);
    const compressedSize = input.readUInt32LE(offset + 20);
    const fileNameLength = input.readUInt16LE(offset + 28);
    const extraLength = input.readUInt16LE(offset + 30);
    const commentLength = input.readUInt16LE(offset + 32);
    const localHeaderOffset = input.readUInt32LE(offset + 42);
    const name = input.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8").replaceAll("\\", "/");

    entries.set(name, { method, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(input: Buffer) {
  for (let offset = input.length - 22; offset >= Math.max(0, input.length - 66000); offset -= 1) {
    if (input.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("The XLSX file is not a valid workbook.");
}

function getFirstWorksheetPath(files: Map<string, Buffer>) {
  const workbookXml = files.get("xl/workbook.xml")?.toString("utf8");
  const relsXml = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbookXml || !relsXml) return null;

  const sheetMatch = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"/);
  const relId = sheetMatch?.[1];
  if (!relId) return null;

  const relRegex = /<Relationship\b([^>]*)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = relRegex.exec(relsXml))) {
    const attrs = match[1];
    if (readXmlAttr(attrs, "Id") !== relId) continue;
    const target = readXmlAttr(attrs, "Target");
    if (!target) return null;
    return target.startsWith("/") ? target.replace(/^\/+/, "") : `xl/${target.replace(/^\/?/, "")}`;
  }

  return null;
}

function parseSharedStrings(xml: string) {
  const strings: string[] = [];
  const siRegex = /<si\b[\s\S]*?<\/si>/g;
  let match: RegExpExecArray | null;

  while ((match = siRegex.exec(xml))) {
    const textParts = [...match[0].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1]));
    strings.push(textParts.join(""));
  }

  return strings;
}

function parseWorksheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml))) {
    const cells = new Map<number, string>();
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = readXmlAttr(attrs, "r");
      const columnIndex = ref ? columnToIndex(ref.replace(/\d+/g, "")) : cells.size;
      cells.set(columnIndex, readCellValue(attrs, body, sharedStrings));
    }

    if (cells.size) {
      const maxIndex = Math.max(...cells.keys());
      rows.push(Array.from({ length: maxIndex + 1 }, (_, index) => cells.get(index) ?? ""));
    }
  }

  return rows;
}

function readCellValue(attrs: string, body: string, sharedStrings: string[]) {
  const type = readXmlAttr(attrs, "t");
  if (type === "s") {
    const index = Number(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
    return sharedStrings[index] ?? "";
  }

  if (type === "inlineStr") {
    return decodeXml([...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join(""));
  }

  return decodeXml(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
}

function readXmlAttr(attrs: string, name: string) {
  return attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
}

function columnToIndex(column: string) {
  return column.split("").reduce((total, letter) => total * 26 + letter.toUpperCase().charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
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
  const validRows = rows.map((row, index) => {
    const line = index + 2;
    const modelName = row.model_name || row.modelName;
    const squareFeet = toNumber(row.square_feet || row.squareFeet);
    const basePrice = toNumber(row.base_price || row.basePrice);

    if (!modelName) errors.push(`Line ${line}: model_name is required.`);
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
  const validRows = rows.map((row, index) => {
    const line = index + 2;
    const optionCategory = normalizeCategory(row.option_category || row.optionCategory);
    const optionName = row.option_name || row.optionName;
    const optionPrice = toNumber(row.option_price || row.optionPrice);

    if (!validCategories.includes(optionCategory)) {
      errors.push(`Line ${line}: option_category must be finish, foundation, utilities, or site.`);
    }
    if (!optionName) errors.push(`Line ${line}: option_name is required.`);
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
