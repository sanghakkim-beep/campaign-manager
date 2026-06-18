import { getBrands } from "@/lib/sheets";
import type { Brand } from "@/types";

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function BrandCard({ brand }: { brand: Brand }) {
  const spentPercent = parseFloat(brand.spentRate);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">{brand.id}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {brand.name}
          </h2>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          소진 {brand.spentRate}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-zinc-400">연간예산</dt>
          <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
            {formatKRW(brand.budget)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-400">집행액</dt>
          <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
            {formatKRW(brand.spent)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-400">잔여예산</dt>
          <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
            {formatKRW(brand.remaining)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          브랜드
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          총 {brands.length}개 브랜드의 예산 현황입니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </main>
  );
}
