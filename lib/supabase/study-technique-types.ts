import type { StudyTechnique } from "@/lib/types";

export type StudyTechniqueRecord = {
  id: string;
  slug: StudyTechnique;
  name: string;
  description: string;
  impact_summary: string;
  dashboard_task_label: string;
  recommended_href: string;
  recommended_action_label: string;
  session_message: string;
  is_active: boolean;
  sort_order: number;
};

export type CurrentStudyTechnique = StudyTechniqueRecord & {
  selected_at: string;
};

export const STUDY_TECHNIQUE_FIELDS =
  "id, slug, name, description, impact_summary, dashboard_task_label, recommended_href, recommended_action_label, session_message, is_active, sort_order";

export function normalizeTechnique(row: any): StudyTechniqueRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    impact_summary: row.impact_summary,
    dashboard_task_label: row.dashboard_task_label,
    recommended_href: row.recommended_href,
    recommended_action_label: row.recommended_action_label,
    session_message: row.session_message,
    is_active: row.is_active,
    sort_order: row.sort_order ?? 0
  };
}

export async function getCurrentTechniqueByUserId(client: any, userId: string): Promise<CurrentStudyTechnique | null> {
  const { data: currentSelection, error: selectionError } = await client
    .from("user_technique_selections")
    .select("technique_id, selected_at")
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("selected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectionError) {
    throw selectionError;
  }

  if (!currentSelection?.technique_id) {
    return null;
  }

  const { data: technique, error: techniqueError } = await client
    .from("study_techniques")
    .select(STUDY_TECHNIQUE_FIELDS)
    .eq("id", currentSelection.technique_id)
    .maybeSingle();

  if (techniqueError) {
    throw techniqueError;
  }

  if (!technique) {
    return null;
  }

  return {
    ...normalizeTechnique(technique),
    selected_at: currentSelection.selected_at
  };
}
