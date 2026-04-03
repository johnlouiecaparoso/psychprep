from __future__ import annotations

import csv
import re
from pathlib import Path


TEXT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\io-mock-exam-from-pdf.txt")
CSV_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\industrial-organizational-psychology-mock-exam-import-exam-sets.csv")
REPORT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\industrial-organizational-psychology-mock-exam-import-exam-sets-report.txt")

SUBJECT = "Industrial/Organizational Psychology"
EXPECTED_EXAMS = list(range(1, 11))
EXPECTED_QUESTIONS_PER_EXAM = 100


def clean_text(value: str) -> str:
    value = value.replace("\f", " ").replace("\ufffd", "").replace("Â­", "")
    return re.sub(r"\s+", " ", value).strip()


def clean_choice_text(value: str) -> str:
    return re.sub(r"^[A-D]\.\s*", "", clean_text(value))


def exam_anchors(text: str) -> list[tuple[int, int, int]]:
    return [
        (int(match.group(1)), match.start(), match.end())
        for match in re.finditer(r"(?mi)^EXAM\s+(\d+)\s*$", text)
    ]


def exam_blocks(text: str) -> dict[int, str]:
    anchors = exam_anchors(text)
    blocks: dict[int, str] = {}
    for index, (exam_number, _start, end_marker) in enumerate(anchors):
        end = anchors[index + 1][1] if index + 1 < len(anchors) else len(text)
        blocks[exam_number] = text[end_marker:end]
    return blocks


def split_question_blocks(block: str) -> list[tuple[int, str]]:
    matches = list(re.finditer(r"(?m)^\s*((?:[1-9]|[1-9]\d|100))\.\s+", block))
    question_blocks: list[tuple[int, str]] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(block)
        question_blocks.append((int(match.group(1)), block[start:end]))
    return question_blocks


def parse_question(question_number: int, block: str) -> dict[str, str | int]:
    cleaned = block.replace("\f", "\n")
    cleaned = re.sub(r"\nMOCK EXAM I/O PSYCHOLOGY EXAM \d+\n", "\n", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\nMOCK EXAM I/O PSYCHOLOGY\n", "\n", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\nEXAM \d+\n", "\n", cleaned, flags=re.IGNORECASE)

    answer_split = re.split(r"Answer:\s*", cleaned, maxsplit=1, flags=re.IGNORECASE)
    if len(answer_split) != 2:
        raise ValueError(f"Unable to parse question {question_number}.")
    question_part, answer_part = answer_split

    rationale_split = re.split(r"Rationale:\s*", answer_part, maxsplit=1, flags=re.IGNORECASE)
    if len(rationale_split) != 2:
        raise ValueError(f"Unable to parse question {question_number}.")
    answer_line, rationale_text = rationale_split

    match = re.search(
        rf"^\s*{question_number}\.\s*(.*?)\n\s*A\.\s*(.*?)\n\s*B\.\s*(.*?)\n\s*C\.\s*(.*?)\n\s*D\.\s*(.*)$",
        question_part,
        flags=re.DOTALL,
    )
    if not match:
        raise ValueError(f"Unable to parse question {question_number}.")

    answer_match = re.match(r"\s*([A-D])\.\s*(.*)$", answer_line, flags=re.DOTALL)
    if not answer_match:
        raise ValueError(f"Unable to parse answer line for question {question_number}.")

    return {
        "number": question_number,
        "question": clean_text(match.group(1)),
        "choice_1": clean_choice_text(match.group(2)),
        "choice_2": clean_choice_text(match.group(3)),
        "choice_3": clean_choice_text(match.group(4)),
        "choice_4": clean_choice_text(match.group(5)),
        "correct": {"A": 1, "B": 2, "C": 3, "D": 4}[answer_match.group(1)],
        "explanation": clean_text(rationale_text),
    }


def parse_exam(exam_number: int, block: str) -> list[dict[str, str | int]]:
    rows = [parse_question(number, question_block) for number, question_block in split_question_blocks(block)]
    expected_numbers = list(range(1, EXPECTED_QUESTIONS_PER_EXAM + 1))
    actual_numbers = [int(row["number"]) for row in rows]
    if actual_numbers != expected_numbers:
        raise ValueError(f"Exam {exam_number} numbering mismatch. Expected 1-100, got {actual_numbers}.")
    return rows


def build_rows(text: str) -> tuple[list[list[str | int]], list[str]]:
    blocks = exam_blocks(text)
    missing = [exam for exam in EXPECTED_EXAMS if exam not in blocks]
    if missing:
        raise ValueError(f"Missing exam blocks: {missing}")

    rows: list[list[str | int]] = []
    report: list[str] = []

    for exam_number in EXPECTED_EXAMS:
        parsed_rows = parse_exam(exam_number, blocks[exam_number])
        exam_label = f"Exam {exam_number}"
        for row in parsed_rows:
            rows.append(
                [
                    row["question"],
                    row["choice_1"],
                    row["choice_2"],
                    row["choice_3"],
                    row["choice_4"],
                    row["correct"],
                    row["explanation"],
                    "Medium",
                    SUBJECT,
                    exam_label,
                    exam_label,
                ]
            )
        report.append(f"{exam_label}: {len(parsed_rows)} questions")

    return rows, report


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


def write_report(lines: list[str], total_rows: int) -> None:
    content = [
        "Industrial/Organizational Psychology mock exam PDF import report",
        f"Total exported rows: {total_rows}",
        "",
    ]
    content.extend(lines)
    content.append("Chapter and Topic were both set to `Exam N` because this import is organized by exam set, not by chapter or subtopic.")
    REPORT_PATH.write_text("\n".join(content), encoding="utf-8")


def main() -> None:
    text = TEXT_PATH.read_text(encoding="utf-8", errors="replace")
    rows, report = build_rows(text)
    write_csv(rows)
    write_report(report, len(rows))
    print(f"Wrote {len(rows)} rows to {CSV_PATH}")
    print(f"Report saved to {REPORT_PATH}")


if __name__ == "__main__":
    main()
