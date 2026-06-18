"use server";

import { getBrands, addBrand } from "@/lib/sheets";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBrand(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const manager = (formData.get("manager") as string)?.trim();
  const budget = Number(
    String(formData.get("budget") ?? "").replace(/,/g, "")
  );
  const description = (formData.get("description") as string)?.trim() ?? "";

  if (!name || !manager || !budget) {
    throw new Error("브랜드명, 담당자, 연간예산은 필수입니다.");
  }

  const brands = await getBrands();
  const nextNum = brands.length + 1;
  const id = `BRD${String(nextNum).padStart(3, "0")}`;

  await addBrand({ id, name, manager, budget, spent: 0, description });

  revalidatePath("/brands");
  redirect("/brands");
}
