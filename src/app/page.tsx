import Link from "next/link";
import { getDashboardData } from "@/lib/queries";

function formatKRW(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
  return n.toLocaleString("ko-KR") + "원";
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400_000);
}

const STATUS_COLORS: Record<string, string> = {
  계획중: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  준비중: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  진행중: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  완료:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  취소:   "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { summary, campaignStatusCounts, activeCampaigns, upcomingMilestones, brandBudgets } = data;

  const totalBudgetSpentRate =
    summary.totalBudget > 0
      ? ((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)
      : "0.0";

  const statuses = ["계획중", "준비중", "진행중", "완료", "취소"] as const;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">대시보드</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 기준
          </p>
        </div>
        <Link
          href="/brands"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          브랜드 목록 →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 브랜드" value={`${summary.brandCount}개`} sub="등록된 브랜드" />
        <StatCard label="진행중 캠페인" value={`${summary.activeCampaignCount}개`} sub="현재 활성 캠페인" accent="blue" />
        <StatCard label="마감 임박 마일스톤" value={`${summary.upcomingMilestoneCount}개`} sub="향후 14일 내 마감" accent={summary.upcomingMilestoneCount > 0 ? "amber" : undefined} />
        <StatCard
          label="전체 예산 소진률"
          value={`${totalBudgetSpentRate}%`}
          sub={`${formatKRW(summary.totalSpent)} / ${formatKRW(summary.totalBudget)}`}
        />
      </div>

      {/* Campaign status breakdown */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">캠페인 현황</h2>
        <div className="flex flex-wrap gap-3">
          {statuses.map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${STATUS_COLORS[s]}`}
            >
              <span>{s}</span>
              <span className="font-semibold">{campaignStatusCounts[s] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active campaigns */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">진행중 캠페인</h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {activeCampaigns.length}개
            </span>
          </div>
          {activeCampaigns.length === 0 ? (
            <p className="text-sm text-zinc-400">진행중인 캠페인이 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {activeCampaigns.map((c) => (
                <li key={c.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.brandName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-500">예산 {c.budgetRate}</p>
                      {c.endDate && (
                        <p className={`text-xs ${daysUntil(c.endDate) <= 7 ? "text-red-500" : "text-zinc-400"}`}>
                          D-{daysUntil(c.endDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(c.progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-zinc-400">진행 {c.progress}%</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming milestones */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">마감 임박 마일스톤</h2>
            <span className="text-xs text-zinc-400">향후 14일</span>
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="text-sm text-zinc-400">이번 2주 내 마감 예정인 미완료 마일스톤이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingMilestones.map((m) => {
                const days = daysUntil(m.dueDate);
                return (
                  <li key={m.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{m.name}</p>
                      <p className="text-xs text-zinc-400">{m.brandName} · {m.campaignName}</p>
                      {m.manager && <p className="text-xs text-zinc-400">담당: {m.manager}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          days <= 3
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : days <= 7
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        D-{days}
                      </span>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {new Date(m.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Brand budget overview */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-5 text-base font-semibold text-zinc-900 dark:text-zinc-50">브랜드별 예산 현황</h2>
        {brandBudgets.length === 0 ? (
          <p className="text-sm text-zinc-400">등록된 브랜드가 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {brandBudgets.map((b) => {
              const pct = parseFloat(b.spentRate);
              return (
                <li key={b.id}>
                  <Link href={`/brands/${b.id}`} className="block group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 text-xs text-zinc-400 w-16">{b.id}</span>
                        <span className="truncate text-sm font-medium text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                          {b.name}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-4 text-sm">
                        <span className="text-zinc-400 text-xs">{formatKRW(b.spent)} / {formatKRW(b.budget)}</span>
                        <span className={`w-12 text-right text-xs font-semibold ${pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-600" : "text-zinc-600 dark:text-zinc-300"}`}>
                          {b.spentRate}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "blue" | "amber";
}) {
  const valueColor =
    accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{sub}</p>
    </div>
  );
}
