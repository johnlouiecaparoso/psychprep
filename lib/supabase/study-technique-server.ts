import { createClient } from "@/lib/supabase/server";
import {
  type CurrentStudyTechnique,
  type StudyTechniqueRecord,
  STUDY_TECHNIQUE_FIELDS,
  getCurrentTechniqueByUserId,
  normalizeTechnique
} from "@/lib/supabase/study-technique-types";

export async function getStudyTechniquesServer(): Promise<StudyTechniqueRecord[]> {
  const client = await createClient();
  const { data, error } = await client
    .from("study_techniques")
    .select(STUDY_TECHNIQUE_FIELDS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeTechnique);
}

export async function getCurrentStudyTechniqueServer(userId: string): Promise<CurrentStudyTechnique | null> {
  const client = await createClient();
  return getCurrentTechniqueByUserId(client, userId);
}
