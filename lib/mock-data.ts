import type { DashboardStat, ParsedImportRow } from "@/lib/types";

export const sampleStudentStats: DashboardStat[] = [
  { label: "Overall score", value: "82%", helper: "Up 6% from last week" },
  { label: "Exams taken", value: "18", helper: "3 this week" },
  { label: "Flashcards mastered", value: "146", helper: "28 pending review" },
  { label: "Weak topics", value: "4", helper: "Focus on abnormal psych" }
];

export const sampleAdminStats: DashboardStat[] = [
  { label: "Total students", value: "482", helper: "42 active today" },
  { label: "Total questions", value: "3,248", helper: "Across 12 subjects" },
  { label: "Total uploads", value: "96", helper: "8 this month" },
  { label: "Failed imports", value: "13", helper: "Mostly invalid difficulty values" }
];

export const sampleInstructorStats: DashboardStat[] = [
  { label: "Question bank", value: "1,284", helper: "Filtered for your subjects" },
  { label: "Imports", value: "32", helper: "2 pending review" },
  { label: "Recent success rate", value: "91%", helper: "Last 5 uploads" },
  { label: "Students impacted", value: "211", helper: "Using your mock exams" }
];

export const performanceData = [
  { subject: "General Psychology", score: 88 },
  { subject: "Abnormal Psychology", score: 69 },
  { subject: "Industrial Psychology", score: 77 },
  { subject: "Psychological Assessment", score: 73 },
  { subject: "Theories of Personality", score: 84 }
];

export const weakTopics = [
  { topic: "Defense Mechanisms", accuracy: 58 },
  { topic: "DSM Disorders", accuracy: 61 },
  { topic: "Research Methods", accuracy: 66 },
  { topic: "Neuropsychology", accuracy: 68 }
];

export const recentExams = [
  { id: "exam-001", title: "General Psychology Mock 1", score: 84, date: "2026-03-20" },
  { id: "exam-002", title: "Psychological Assessment Drill", score: 76, date: "2026-03-18" },
  { id: "exam-003", title: "Abnormal Psychology Intensive", score: 71, date: "2026-03-15" }
];

export const sampleQuestions: ParsedImportRow[] = [
  {
    question_text: "What is the primary focus of psychology?",
    explanation: "Psychology studies both behavior and mental processes.",
    difficulty: "easy",
    subject: "General Psychology",
    topic: "Introduction",
    choices: [
      { choice_key: "A", choice_text: "Behavior", is_correct: false },
      { choice_key: "B", choice_text: "Mental processes", is_correct: false },
      { choice_key: "C", choice_text: "Both A and B", is_correct: true },
      { choice_key: "D", choice_text: "None of the above", is_correct: false }
    ]
  },
  {
    question_text: "Which lobe is mainly associated with decision-making?",
    explanation: "The frontal lobe plays a major role in planning and decision-making.",
    difficulty: "medium",
    subject: "Biological Psychology",
    topic: "Brain Functions",
    choices: [
      { choice_key: "A", choice_text: "Occipital lobe", is_correct: false },
      { choice_key: "B", choice_text: "Parietal lobe", is_correct: false },
      { choice_key: "C", choice_text: "Temporal lobe", is_correct: false },
      { choice_key: "D", choice_text: "Frontal lobe", is_correct: true }
    ]
  }
];
