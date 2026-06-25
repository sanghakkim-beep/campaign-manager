import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, campaigns, milestones } from "../../drizzle/schema";
import type { Brand, Campaign, CampaignStatus, Milestone } from "@/types";

function toSpentRate(spent: number, budget: number): string {
  return budget > 0 ? `${((spent / budget) * 100).toFixed(1)}%` : "0.0%";
}

function toBudgetRate(actual: number, planned: number): string {
  return planned > 0 ? `${((actual / planned) * 100).toFixed(1)}%` : "0.0%";
}

const progressSql = sql<number>`
  CASE WHEN COUNT(${milestones.id}) = 0 THEN 0
  ELSE ROUND(
    COUNT(*) FILTER (WHERE ${milestones.completed} = true) * 100.0
    / COUNT(${milestones.id})
  ) END
`;

export async function getBrands(): Promise<Brand[]> {
  const rows = await db
    .select({
      id:          brands.code,
      name:        brands.name,
      manager:     brands.manager,
      budget:      brands.annualBudget,
      spent:       sql<number>`COALESCE(SUM(${campaigns.actualBudget}), 0)`,
      description: brands.description,
    })
    .from(brands)
    .leftJoin(campaigns, eq(campaigns.brandId, brands.id))
    .groupBy(brands.id)
    .orderBy(brands.code);

  return rows.map((r) => ({ ...r, spentRate: toSpentRate(r.spent, r.budget) }));
}

export async function getBrand(id: string): Promise<Brand | null> {
  const rows = await db
    .select({
      id:          brands.code,
      name:        brands.name,
      manager:     brands.manager,
      budget:      brands.annualBudget,
      spent:       sql<number>`COALESCE(SUM(${campaigns.actualBudget}), 0)`,
      description: brands.description,
    })
    .from(brands)
    .leftJoin(campaigns, eq(campaigns.brandId, brands.id))
    .where(eq(brands.code, id))
    .groupBy(brands.id);

  const r = rows[0];
  if (!r) return null;
  return { ...r, spentRate: toSpentRate(r.spent, r.budget) };
}

export async function getCampaigns(brandId?: string): Promise<Campaign[]> {
  const rows = await db
    .select({
      id:            campaigns.code,
      brandId:       brands.code,
      name:          campaigns.name,
      startDate:     campaigns.startDate,
      endDate:       campaigns.endDate,
      plannedBudget: campaigns.plannedBudget,
      actualBudget:  campaigns.actualBudget,
      status:        campaigns.status,
      progress:      progressSql,
    })
    .from(campaigns)
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .leftJoin(milestones, eq(milestones.campaignId, campaigns.id))
    .where(brandId ? eq(brands.code, brandId) : undefined)
    .groupBy(campaigns.id, brands.id)
    .orderBy(campaigns.code);

  return rows.map((r) => ({
    id:            r.id,
    brandId:       r.brandId,
    name:          r.name,
    startDate:     r.startDate ?? "",
    endDate:       r.endDate ?? "",
    plannedBudget: r.plannedBudget,
    actualBudget:  r.actualBudget,
    budgetRate:    toBudgetRate(r.actualBudget, r.plannedBudget),
    status:        r.status as CampaignStatus,
    progress:      `${r.progress}%`,
  }));
}

export async function getMilestones(campaignIds: string[]): Promise<Milestone[]> {
  if (campaignIds.length === 0) return [];

  const rows = await db
    .select({
      id:           milestones.code,
      campaignId:   campaigns.code,
      name:         milestones.name,
      dueDate:      milestones.dueDate,
      manager:      milestones.manager,
      completed:    milestones.completed,
      campaignName: campaigns.name,
      notes:        milestones.notes,
    })
    .from(milestones)
    .innerJoin(campaigns, eq(milestones.campaignId, campaigns.id))
    .where(inArray(campaigns.code, campaignIds))
    .orderBy(milestones.code);

  return rows.map((r) => ({ ...r, dueDate: r.dueDate ?? "" }));
}

export async function getNextBrandCode(): Promise<string> {
  const rows = await db
    .select({ maxCode: sql<string | null>`MAX(${brands.code})` })
    .from(brands);
  const maxCode = rows[0]?.maxCode;
  const nextNum = maxCode ? parseInt(maxCode.slice(3), 10) + 1 : 1;
  return `BRD${String(nextNum).padStart(3, "0")}`;
}

export async function addBrand(brand: Omit<Brand, "spentRate">): Promise<void> {
  await db.insert(brands).values({
    code:         brand.id,
    name:         brand.name,
    manager:      brand.manager,
    annualBudget: brand.budget,
    description:  brand.description,
  });
}

export async function updateBrand(
  brand: Pick<Brand, "id" | "name" | "manager" | "budget" | "description">
): Promise<void> {
  await db
    .update(brands)
    .set({
      name:         brand.name,
      manager:      brand.manager,
      annualBudget: brand.budget,
      description:  brand.description,
    })
    .where(eq(brands.code, brand.id));
}
