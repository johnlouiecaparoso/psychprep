from __future__ import annotations

import csv
import re
from pathlib import Path


TEXT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\psychological-assessment-chapter-1-2-from-pdf.txt")
CSV_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\psychological-assessment-chapter-1-2-import-from-pdf.csv")
REPORT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\psychological-assessment-chapter-1-2-import-report.txt")

SUBJECT = "Psychological Assessment"


def clean_text(value: str) -> str:
    value = value.replace("\f", " ").replace("?", "").replace("­", "")
    return re.sub(r"\s+", " ", value).strip()


def clean_choice_text(value: str) -> str:
    return re.sub(r"^[A-D]\.\s*", "", clean_text(value))


def chapter_for_question(number: int) -> str:
    return "Chapter 1" if number <= 19 else "Chapter 2"


def topic_for_question(number: int) -> str:
    return chapter_for_question(number)


def parse_questions(text: str) -> list[dict[str, str]]:
    question_section = text.split("PART 2: ANSWER KEY", 1)[0]
    matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s*", question_section))
    rows: list[dict[str, str]] = []

    for index, match in enumerate(matches):
        number = int(match.group(1))
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(question_section)
        block = question_section[start:end]

        parsed = re.search(
            rf"^\s*{number}\.\s*(.*?)\n\s*A\.\s*(.*?)\n\s*B\.\s*(.*?)\n\s*C\.\s*(.*?)\n\s*D\.\s*(.*)$",
            block.replace("\f", "\n"),
            flags=re.DOTALL,
        )
        if not parsed:
            raise ValueError(f"Unable to parse question {number}.")

        rows.append(
            {
                "number": str(number),
                "question": clean_text(parsed.group(1)),
                "choice_1": clean_choice_text(parsed.group(2)),
                "choice_2": clean_choice_text(parsed.group(3)),
                "choice_3": clean_choice_text(parsed.group(4)),
                "choice_4": clean_choice_text(parsed.group(5)),
            }
        )

    expected = [str(i) for i in range(1, 41)]
    actual = [row["number"] for row in rows]
    if actual != expected:
        raise ValueError(f"Question numbering mismatch. Expected 1-40, got {actual}.")

    return rows


def parse_answer_key(text: str) -> dict[int, str]:
    if "PART 2: ANSWER KEY" not in text:
        raise ValueError("Answer key section not found.")

    answer_key_section = text.split("PART 2: ANSWER KEY", 1)[1].split("PART 3: RATIONALE", 1)[0]
    answers = {int(number): letter for number, letter in re.findall(r"(?m)^\s*(\d+)\.\s*([A-D])\s*$", answer_key_section)}
    if sorted(answers) != list(range(1, 41)):
        raise ValueError(f"Answer key incomplete. Parsed answers for: {sorted(answers)}")
    return answers


def parse_rationales(text: str) -> dict[int, str]:
    if "PART 3: RATIONALE" not in text:
        raise ValueError("Rationale section not found.")

    rationale_section = text.split("PART 3: RATIONALE", 1)[1]
    matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s*Correct Answer:\s*([A-D])\s*$", rationale_section))
    rationales: dict[int, str] = {}

    for index, match in enumerate(matches):
        number = int(match.group(1))
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(rationale_section)
        block = rationale_section[start:end]
        rationale_match = re.search(r"Rationale:\s*(.*?)(?=(?:Incorrect Choices:|High-Yield Concept:|$))", block, flags=re.DOTALL)
        if not rationale_match:
            raise ValueError(f"Missing rationale for question {number}.")
        rationales[number] = clean_text(rationale_match.group(1))

    if sorted(rationales) != list(range(1, 41)):
        raise ValueError(f"Rationales incomplete. Parsed: {sorted(rationales)}")
    return rationales


def build_rows(text: str) -> list[list[str | int]]:
    questions = parse_questions(text)
    answers = parse_answer_key(text)
    rationales = parse_rationales(text)

    rows: list[list[str | int]] = []
    for question in questions:
        number = int(question["number"])
        correct = {"A": 1, "B": 2, "C": 3, "D": 4}[answers[number]]
        rows.append(
            [
                question["question"],
                question["choice_1"],
                question["choice_2"],
                question["choice_3"],
                question["choice_4"],
                correct,
                rationales[number],
                "Medium",
                SUBJECT,
                chapter_for_question(number),
                topic_for_question(number),
            ]
        )
    return rows


def write_csv(rows: list[list[str | int]]) -> None:
    with CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "Question",
                "Choice 1",
                "Choice 2",
                "Choice 3",
                "Choice 4",
                "Correct Answer (1-4)",
                "Explanation",
                "Difficulty",
                "Subject",
                "Chapter",
                "Topic",
            ]
        )
        writer.writerows(rows)


def write_report() -> None:
    lines = [
        "Psychological Assessment Chapter 1-2 PDF import report",
        "Total exported rows: 40",
        "",
        "Chapter 1: 19 questions | topic `Chapter 1`",
        "Chapter 2: 21 questions | topic `Chapter 2`",
        "Topic was kept equal to the chapter name because the PDF does not provide a separate subtopic.",
        "Chapter split was inferred from content progression: questions 1-19 align with Chapter 1 assessment fundamentals, while questions 20-40 shift into Chapter 2 historical and legal-ethical content.",
    ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    text = TEXT_PATH.read_text(encoding="utf-8", errors="replace")
    rows = build_rows(text)
    write_csv(rows)
    write_report()
    print(f"Wrote {len(rows)} rows to {CSV_PATH}")
    print(f"Report saved to {REPORT_PATH}")


if __name__ == "__main__":
    main()
