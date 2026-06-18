import { createSign } from "node:crypto";
import type { Brand } from "@/types";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const BRAND_SHEET_GID = "1415870910";

// ── CSV read (public) ──────────────────────────────────────────────────────

async function fetchCsv(gid?: string): Promise<string[][]> {
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export`
  );
  url.searchParams.set("format", "csv");
  if (gid) url.searchParams.set("gid", gid);

  const res = await fetch(url.toString(), { redirect: "follow" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  return parseCsv(await res.text());
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
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseNumber(val: string): number {
  return Number(val?.replace(/,/g, "").replace(/%$/, "") || 0);
}

// 브랜드 탭: 브랜드코드 | 브랜드명 | 담당자 | 연간예산 | 기집행예산 | 예산소진율 | 브랜드 소개
export async function getBrands(): Promise<Brand[]> {
  const rows = await fetchCsv(BRAND_SHEET_GID);
  // Row 0: title, Row 1: headers, data starts at Row 2
  return rows
    .slice(2)
    .filter((row) => row[0]?.match(/^BRD/))
    .map((row) => ({
      id: row[0],
      name: row[1],
      manager: row[2] ?? "",
      budget: parseNumber(row[3]),
      spent: parseNumber(row[4]),
      spentRate: row[5] ?? "0.0%",
      description: row[6] ?? "",
    }));
}

// ── Service account JWT auth ───────────────────────────────────────────────

function b64url(data: string): string {
  return Buffer.from(data).toString("base64url");
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const sig = signer.sign(PRIVATE_KEY!, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`,
    }),
  });

  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

// ── Write ──────────────────────────────────────────────────────────────────

export async function addBrand(
  brand: Omit<Brand, "spentRate">
): Promise<void> {
  const token = await getAccessToken();
  const spentRate =
    brand.budget > 0
      ? `${((brand.spent / brand.budget) * 100).toFixed(1)}%`
      : "0.0%";

  const values = [[
    brand.id,
    brand.name,
    brand.manager,
    brand.budget,
    brand.spent,
    spentRate,
    brand.description,
  ]];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent("브랜드!A:G")}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ majorDimension: "ROWS", values }),
    }
  );

  if (!res.ok) throw new Error(`Sheets append failed: ${await res.text()}`);
}
