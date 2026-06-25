"use server";

import { updateBrand } from "@/lib/queries";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function editBrand(id: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const manager = (formData.get("manager") as string)?.trim();
  const budget = Number(
    String(formData.get("budget") ?? "").replace(/,/g, "")
  );
  const description = (formData.get("description") as string)?.trim() ?? "";

  if (!name || !manager || isNaN(budget)) {
    throw new Error("브랜드명, 담당자, 연간예산은 필수입니다.");
  }

  await updateBrand({ id, name, manager, budget, description });

  revalidatePath("/brands");
  revalidatePath(`/brands/${id}`);
  redirect(`/brands/${id}`);
}
