import type { StudyTechnique } from "@/lib/types";

export function buildTechniqueTasks(technique: StudyTechnique, weakTopics: string[]) {
  if (technique === "active_recall") {
    return [
      weakTopics[0] ? `Recall ${weakTopics[0]} without looking at notes first.` : "Pick one weak topic and answer from memory first.",
      "Flip flashcards only after you commit to an answer.",
      "Repeat missed prompts before ending the session."
    ];
  }

  if (technique === "pomodoro") {
    return [
      "Finish one 25-minute focus round before taking a short break.",
      weakTopics[0] ? `Use your first round on ${weakTopics[0]}.` : "Use your first round on your weakest available topic.",
      "Log how many focus rounds you complete today."
    ];
  }

  return [
    "Run one timed set under exam-like conditions.",
    weakTopics[0] ? `Review mistakes from ${weakTopics[0]} after submission.` : "Review your mistakes after submission.",
    "Use shuffled questions to avoid memorizing sequence."
  ];
}

export function getTechniqueSessionMessage(technique: StudyTechnique, mode: "mock" | "quiz") {
  if (technique === "active_recall") {
    return mode === "quiz"
      ? "Active Recall mode is on. Answer from memory before moving to the next item."
      : "Active Recall mode is on. Treat each item like a retrieval prompt before checking your result later.";
  }

  if (technique === "pomodoro") {
    return "Pomodoro mode is on. Study in a focused block, then take your short break when the timer tells you to reset.";
  }

  return mode === "quiz"
    ? "Practice Test mode is on. Keep the pace steady and use this shorter run like a board-style drill."
    : "Practice Test mode is on. Work through this set like a real timed exam.";
}
