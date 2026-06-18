import Link from "next/link";
import { getBrands } from "@/lib/sheets";
import type { Brand } from "@/types";

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function BrandCard({ brand }: { brand: Brand }) {
  const spentPercent = parseFloat(brand.spentRate);
  const remaining = brand.budget - brand.spent;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md cursor-pointer dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">{brand.id}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {brand.name}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">{brand.manager}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          소진 {brand.spentRate}
        </span>
      </div>

      {brand.description && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {brand.description}
        </p>
      )}

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
            {formatKRW(remaining)}
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            브랜드
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            총 {brands.length}개 브랜드의 예산 현황입니다.
          </p>
        </div>
        <Link
          href="/brands/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + 브랜드 추가
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/brands/${brand.id}`} className="block">
            <BrandCard brand={brand} />
          </Link>
        ))}
      </div>
    </main>
  );
}
