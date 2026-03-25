import type { ReviewMaterial } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getReviewMaterials(supabase: ServerClient): Promise<ReviewMaterial[]> {
  const { data, error } = await supabase
    .from("review_materials")
    .select("id, title, description, file_name, created_at, subjects(name), topics(name)")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    subject: item.subjects?.name ?? "General",
    topic: item.topics?.name ?? "Reading",
    fileName: item.file_name,
    createdAt: item.created_at
  }));
}
