"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { editBrand } from "../actions";
import type { Brand } from "@/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}

export default function EditBrandForm({ brand }: { brand: Brand }) {
  const boundAction = editBrand.bind(null, brand.id);

  const [error, action] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await boundAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "오류가 발생했습니다.";
      }
    },
    null
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/brands/${brand.id}`}
          className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← {brand.name}
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {brand.id}
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          브랜드 편집
        </h1>
      </div>

      <form action={action} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            브랜드명 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={brand.name}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            담당자 <span className="text-red-500">*</span>
          </label>
          <input
            name="manager"
            type="text"
            required
            defaultValue={brand.manager}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            연간예산(원) <span className="text-red-500">*</span>
          </label>
          <input
            name="budget"
            type="number"
            required
            min={0}
            defaultValue={brand.budget}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            브랜드 소개
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={brand.description}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton />
          <Link
            href={`/brands/${brand.id}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            취소
          </Link>
        </div>
      </form>
    </main>
  );
}
