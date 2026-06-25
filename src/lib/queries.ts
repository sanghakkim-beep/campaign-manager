import { and, eq, gt, inArray, lte, sql } from "drizzle-orm";
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

export interface DashboardData {
  summary: {
    brandCount: number;
    totalBudget: number;
    totalSpent: number;
    activeCampaignCount: number;
    upcomingMilestoneCount: number;
  };
  campaignStatusCounts: Record<string, number>;
  activeCampaigns: {
    id: string;
    name: string;
    brandName: string;
    endDate: string;
    progress: number;
    budgetRate: string;
  }[];
  upcomingMilestones: {
    id: string;
    name: string;
    campaignName: string;
    brandName: string;
    dueDate: string;
    manager: string;
  }[];
  brandBudgets: {
    id: string;
    name: string;
    budget: number;
    spent: number;
    spentRate: string;
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);
  const in14days = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

  const [summaryRows, statusRows, activeCampaignRows, upcomingRows, brandBudgetRows] =
    await Promise.all([
      // Summary totals
      db
        .select({
          brandCount:  sql<number>`COUNT(DISTINCT ${brands.id})`,
          totalBudget: sql<number>`COALESCE(SUM(DISTINCT ${brands.annualBudget}), 0)`,
          totalSpent:  sql<number>`COALESCE(SUM(${campaigns.actualBudget}), 0)`,
        })
        .from(brands)
        .leftJoin(campaigns, eq(campaigns.brandId, brands.id)),

      // Campaign counts by status
      db
        .select({ status: campaigns.status, count: sql<number>`COUNT(*)` })
        .from(campaigns)
        .groupBy(campaigns.status),

      // Active campaigns (진행중) with progress
      db
        .select({
          id:       campaigns.code,
          name:     campaigns.name,
          brandName: brands.name,
          endDate:  campaigns.endDate,
          progress: progressSql,
          plannedBudget: campaigns.plannedBudget,
          actualBudget:  campaigns.actualBudget,
        })
        .from(campaigns)
        .innerJoin(brands, eq(campaigns.brandId, brands.id))
        .leftJoin(milestones, eq(milestones.campaignId, campaigns.id))
        .where(eq(campaigns.status, "진행중"))
        .groupBy(campaigns.id, brands.id)
        .orderBy(campaigns.endDate),

      // Upcoming milestones (not completed, due within 14 days)
      db
        .select({
          id:           milestones.code,
          name:         milestones.name,
          campaignName: campaigns.name,
          brandName:    brands.name,
          dueDate:      milestones.dueDate,
          manager:      milestones.manager,
        })
        .from(milestones)
        .innerJoin(campaigns, eq(milestones.campaignId, campaigns.id))
        .innerJoin(brands, eq(campaigns.brandId, brands.id))
        .where(
          and(
            eq(milestones.completed, false),
            gt(milestones.dueDate, today),
            lte(milestones.dueDate, in14days),
          )
        )
        .orderBy(milestones.dueDate),

      // Brand budget overview
      db
        .select({
          id:     brands.code,
          name:   brands.name,
          budget: brands.annualBudget,
          spent:  sql<number>`COALESCE(SUM(${campaigns.actualBudget}), 0)`,
        })
        .from(brands)
        .leftJoin(campaigns, eq(campaigns.brandId, brands.id))
        .groupBy(brands.id)
        .orderBy(brands.code),
    ]);

  const summary = summaryRows[0];
  const activeCampaignCount = statusRows.find((r) => r.status === "진행중")?.count ?? 0;

  return {
    summary: {
      brandCount:             Number(summary.brandCount),
      totalBudget:            Number(summary.totalBudget),
      totalSpent:             Number(summary.totalSpent),
      activeCampaignCount:    Number(activeCampaignCount),
      upcomingMilestoneCount: upcomingRows.length,
    },
    campaignStatusCounts: Object.fromEntries(
      statusRows.map((r) => [r.status, Number(r.count)])
    ),
    activeCampaigns: activeCampaignRows.map((r) => ({
      id:        r.id,
      name:      r.name,
      brandName: r.brandName,
      endDate:   r.endDate ?? "",
      progress:  Number(r.progress),
      budgetRate: toBudgetRate(r.actualBudget, r.plannedBudget),
    })),
    upcomingMilestones: upcomingRows.map((r) => ({
      id:           r.id,
      name:         r.name,
      campaignName: r.campaignName,
      brandName:    r.brandName,
      dueDate:      r.dueDate ?? "",
      manager:      r.manager,
    })),
    brandBudgets: brandBudgetRows.map((r) => ({
      id:        r.id,
      name:      r.name,
      budget:    r.budget,
      spent:     Number(r.spent),
      spentRate: toSpentRate(Number(r.spent), r.budget),
    })),
  };
}
