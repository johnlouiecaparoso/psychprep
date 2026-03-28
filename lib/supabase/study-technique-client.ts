import { createClient } from "@/lib/supabase/client";
import type { StudyTechnique } from "@/lib/types";
import {
  type CurrentStudyTechnique,
  type StudyTechniqueRecord,
  STUDY_TECHNIQUE_FIELDS,
  getCurrentTechniqueByUserId,
  normalizeTechnique
} from "@/lib/supabase/study-technique-types";

export class StudyTechniqueService {
  private client = createClient();

  async getStudyTechniques(): Promise<StudyTechniqueRecord[]> {
    const { data, error } = await this.client
      .from("study_techniques")
      .select(STUDY_TECHNIQUE_FIELDS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeTechnique);
  }

  async getCurrentStudyTechnique(userId: string): Promise<CurrentStudyTechnique | null> {
    return getCurrentTechniqueByUserId(this.client, userId);
  }

  async applyTechnique(techniqueSlug: StudyTechnique) {
    const { error } = await this.client.rpc("set_current_study_technique", {
      p_technique_slug: techniqueSlug
    });

    if (error) {
      throw error;
    }
  }
}
