import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand, getCampaigns, getMilestones } from "@/lib/queries";
import type { CampaignStatus, Milestone } from "@/types";

const STATUS_BADGE: Record<CampaignStatus, { label: string; className: string }> = {
  "계획중": { label: "계획중", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
  "준비중": { label: "준비중", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "진행중": { label: "진행중", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "완료":   { label: "완료",   className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  "취소":   { label: "취소",   className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          milestone.completed
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
        }`}
      >
        {milestone.completed ? "✓" : "○"}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${milestone.completed ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>
          {milestone.name}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-400">
          {milestone.dueDate && <span>마감 {milestone.dueDate}</span>}
          {milestone.manager && <span>담당 {milestone.manager}</span>}
          {milestone.notes && <span className="text-zinc-300 dark:text-zinc-500">· {milestone.notes}</span>}
        </div>
      </div>
    </div>
  );
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [brand, campaigns] = await Promise.all([
    getBrand(id),
    getCampaigns(id),
  ]);

  if (!brand) notFound();

  const milestones = await getMilestones(campaigns.map((c) => c.id));

  const spentPercent = parseFloat(brand.spentRate);
  const remaining = brand.budget - brand.spent;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/brands"
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← 브랜드 목록
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {brand.id}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {brand.name}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">{brand.manager}</p>
        </div>
        <Link
          href={`/brands/${brand.id}/edit`}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          편집
        </Link>
      </div>

      {/* Budget card */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">예산 현황</h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            소진 {brand.spentRate}
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-zinc-400">연간예산</dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">{formatKRW(brand.budget)}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">집행액</dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">{formatKRW(brand.spent)}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">잔여예산</dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">{formatKRW(remaining)}</dd>
          </div>
        </dl>
        {brand.description && (
          <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {brand.description}
          </p>
        )}
      </div>

      {/* Campaigns */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          캠페인{" "}
          <span className="text-sm font-normal text-zinc-400">{campaigns.length}개</span>
        </h2>

        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
            연결된 캠페인이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const badge = STATUS_BADGE[campaign.status] ?? STATUS_BADGE["계획중"];
              const campMilestones = milestones.filter(
                (m) => m.campaignId === campaign.id
              );
              const doneCount = campMilestones.filter((m) => m.completed).length;
              const progressPercent = parseFloat(campaign.progress);

              return (
                <div
                  key={campaign.id}
                  className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Campaign header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400">{campaign.id}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {campaign.name}
                        </h3>
                        {(campaign.startDate || campaign.endDate) && (
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {campaign.startDate} ~ {campaign.endDate}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-400">예산집행률</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{campaign.budgetRate}</p>
                      </div>
                    </div>

                    {/* Budget + progress bars */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-zinc-500">
                      <div>
                        <div className="mb-1 flex justify-between">
                          <span>계획예산</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatKRW(campaign.plannedBudget)}</span>
                        </div>
                        <div className="mb-1 flex justify-between">
                          <span>실집행예산</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatKRW(campaign.actualBudget)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between">
                          <span>진행률</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{campaign.progress}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.min(progressPercent || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  {campMilestones.length > 0 && (
                    <div className="border-t border-zinc-100 px-5 pb-3 dark:border-zinc-800">
                      <p className="mb-1 mt-3 text-xs font-medium text-zinc-400">
                        마일스톤 {doneCount}/{campMilestones.length}
                      </p>
                      <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {campMilestones.map((m) => (
                          <MilestoneRow key={m.id} milestone={m} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
