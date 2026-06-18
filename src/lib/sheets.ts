import type { Brand } from "@/types";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

async function fetchCsv(gid?: string): Promise<string[][]> {
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export`
  );
  url.searchParams.set("format", "csv");
  if (gid) url.searchParams.set("gid", gid);

  const res = await fetch(url.toString(), { redirect: "follow" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);

  const text = await res.text();
  return parseCsv(text);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    rows.push(parseCsvLine(trimmed));
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseNumber(val: string): number {
  return Number(val.replace(/,/g, "").replace(/%$/, "") || 0);
}

export async function getBrands(): Promise<Brand[]> {
  const rows = await fetchCsv();

  // Row 0: title, Row 1: headers, data starts at Row 2
  return rows
    .slice(2)
    .filter((row) => row[0]?.match(/^BRD/))
    .map((row) => ({
      id: row[0],
      name: row[1],
      budget: parseNumber(row[2]),
      spent: parseNumber(row[3]),
      spentRate: row[4],
      remaining: parseNumber(row[5]),
    }));
}
