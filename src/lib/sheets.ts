import { createSign } from "node:crypto";
import type { Brand, Campaign, CampaignStatus, Milestone } from "@/types";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const BRAND_SHEET_GID = "1415870910";
const CAMPAIGN_SHEET_GID = "1538415676";
const MILESTONE_SHEET_GID = "1220187465";

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

export async function getBrand(id: string): Promise<Brand | null> {
  const brands = await getBrands();
  return brands.find((b) => b.id === id) ?? null;
}

// 캠페인 탭: 캠페인코드 | 브랜드코드 | 캠페인명 | 시작일 | 종료일 | 계획예산 | 실집행예산 | 예산집행률 | 상태 | 진행률
export async function getCampaigns(brandId?: string): Promise<Campaign[]> {
  const rows = await fetchCsv(CAMPAIGN_SHEET_GID);
  return rows
    .slice(2)
    .filter((row) => row[0]?.match(/^CMP/))
    .filter((row) => !brandId || row[1] === brandId)
    .map((row) => ({
      id: row[0],
      brandId: row[1],
      name: row[2],
      startDate: row[3] ?? "",
      endDate: row[4] ?? "",
      plannedBudget: parseNumber(row[5]),
      actualBudget: parseNumber(row[6]),
      budgetRate: row[7] ?? "0.0%",
      status: (row[8] ?? "계획중") as CampaignStatus,
      progress: row[9] ?? "0%",
    }));
}

// 마일스톤 탭: 마일스톤ID | 캠페인코드 | 마일스톤명 | 마감일 | 담당자 | 완료여부(Y/N) | 캠페인명(참조) | 비고
export async function getMilestones(campaignIds: string[]): Promise<Milestone[]> {
  if (campaignIds.length === 0) return [];
  const rows = await fetchCsv(MILESTONE_SHEET_GID);
  const idSet = new Set(campaignIds);
  return rows
    .slice(2)
    .filter((row) => row[0]?.match(/^M/) && idSet.has(row[1]))
    .map((row) => ({
      id: row[0],
      campaignId: row[1],
      name: row[2],
      dueDate: row[3] ?? "",
      manager: row[4] ?? "",
      completed: row[5]?.toUpperCase() === "Y",
      campaignName: row[6] ?? "",
      notes: row[7] ?? "",
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

export async function updateBrand(
  brand: Pick<Brand, "id" | "name" | "manager" | "budget" | "description">
): Promise<void> {
  const rows = await fetchCsv(BRAND_SHEET_GID);
  const dataRows = rows.slice(2);
  const physicalIndex = dataRows.findIndex((r) => r[0] === brand.id);
  if (physicalIndex === -1) throw new Error(`Brand not found: ${brand.id}`);

  const spent = parseNumber(dataRows[physicalIndex][4]);
  const spentRate =
    brand.budget > 0
      ? `${((spent / brand.budget) * 100).toFixed(1)}%`
      : "0.0%";

  // rows[0]=title, rows[1]=headers, data starts at rows[2]
  // Sheets API is 1-indexed: physicalIndex 0 = row 3
  const sheetsRow = physicalIndex + 3;
  const range = encodeURIComponent(`브랜드!A${sheetsRow}:G${sheetsRow}`);

  const token = await getAccessToken();
  const values = [[
    brand.id,
    brand.name,
    brand.manager,
    brand.budget,
    spent,
    spentRate,
    brand.description,
  ]];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ majorDimension: "ROWS", values }),
    }
  );

  if (!res.ok) throw new Error(`Sheets update failed: ${await res.text()}`);
}
