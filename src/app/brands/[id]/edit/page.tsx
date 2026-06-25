import { notFound } from "next/navigation";
import { getBrand } from "@/lib/queries";
import EditBrandForm from "./EditBrandForm";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();
  return <EditBrandForm brand={brand} />;
}
