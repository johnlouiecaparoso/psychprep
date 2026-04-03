from __future__ import annotations

import csv
import re
from pathlib import Path


TEXT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\industrial-organizational-psychology-quiz-from-pdf.txt")
CSV_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\industrial-organizational-psychology-quiz-import-from-pdf.csv")
REPORT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\industrial-organizational-psychology-quiz-import-report.txt")

SUBJECT = "Industrial/Organizational Psychology"
CHAPTER_ONE_TOPIC = "introduction-to-industrial-organizational-psychology"
EXPECTED_COUNTS = {
    1: 40,
    2: 40,
    3: 35,
    4: 0,
    5: 35,
    6: 35,
    7: 35,
    8: 35,
    9: 35,
    10: 35,
    11: 35,
    12: 35,
    13: 35,
    14: 35,
    15: 35,
}


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\f", " ")).strip()


def slugify(value: str) -> str:
    lowered = value.lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    return lowered.strip("-")


def chapter_markers(text: str) -> list[re.Match[str]]:
    return list(re.finditer(r"(?:(?<=\f)|^)CHAPTER\s+(\d+)\s*\f", text))


def chapter_title(block: str, chapter_number: int) -> str | None:
    if chapter_number == 1:
        return "Introduction to Industrial/Organizational Psychology"

    match = re.search(
        rf"Chapter\s*{chapter_number}\s*:\s*(.+?)(?:\f|\n{{2,}}|$)",
        block,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return None
    return normalize_whitespace(match.group(1))


def chapter_blocks(text: str) -> list[tuple[int, str]]:
    markers = chapter_markers(text)
    blocks: list[tuple[int, str]] = []
    for index, marker in enumerate(markers):
        start = marker.end()
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        blocks.append((int(marker.group(1)), text[start:end]))
    return blocks


def parse_chapter_one(block: str) -> list[dict[str, str | int]]:
    pattern = re.compile(
        r"Question\s+(\d+):\s*(.*?)\s*\(Answer:\s*([A-D])\.\s*(.*?)\)\s*"
        r"A\.\s*(.*?)\s*B\.\s*(.*?)\s*C\.\s*(.*?)\s*D\.\s*(.*?)\s*"
        r"Rationale:\s*(.*?)(?=(?:\f)?Question\s+\d+:|\Z)",
        flags=re.DOTALL | re.IGNORECASE,
    )

    rows: list[dict[str, str | int]] = []
    for match in pattern.finditer(block):
        rows.append(
            {
                "number": int(match.group(1)),
                "question": normalize_whitespace(match.group(2)),
                "choice_1": normalize_whitespace(match.group(5)),
                "choice_2": normalize_whitespace(match.group(6)),
                "choice_3": normalize_whitespace(match.group(7)),
                "choice_4": normalize_whitespace(match.group(8)),
                "correct": {"A": 1, "B": 2, "C": 3, "D": 4}[match.group(3).upper()],
                "explanation": normalize_whitespace(match.group(9)),
            }
        )
    return rows


def split_question_blocks(block: str) -> list[tuple[int, str]]:
    matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s", block))
    question_blocks: list[tuple[int, str]] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(block)
        question_blocks.append((int(match.group(1)), block[start:end]))
    return question_blocks


def parse_standard_question(question_number: int, block: str) -> dict[str, str | int]:
    cleaned = block.replace("\f", "\n")
    cleaned = re.sub(r"\nCHAPTER\s+\d+\s*\n", "\n", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r"\n(?:SHORT QUIZ:\s*)?Industrial/Organizational Psychology.*?\n",
        "\n",
        cleaned,
        flags=re.IGNORECASE,
    )

    match = re.search(
        rf"^\s*{question_number}\.\s*(.*?)\n\s*A\.\s*(.*?)\n\s*B\.\s*(.*?)\n\s*C\.\s*(.*?)\n\s*D\.\s*(.*?)\n\s*Answer:\s*([A-D])\.\s*(.*?)\n\s*Rationale:\s*(.*)$",
        cleaned,
        flags=re.DOTALL,
    )
    if not match:
        raise ValueError(f"Unable to parse question {question_number}.")

    return {
        "number": question_number,
        "question": normalize_whitespace(match.group(1)),
        "choice_1": normalize_whitespace(match.group(2)),
        "choice_2": normalize_whitespace(match.group(3)),
        "choice_3": normalize_whitespace(match.group(4)),
        "choice_4": normalize_whitespace(match.group(5)),
        "correct": {"A": 1, "B": 2, "C": 3, "D": 4}[match.group(6).upper()],
        "explanation": normalize_whitespace(match.group(8)),
    }


def parse_standard_chapter(block: str) -> list[dict[str, str | int]]:
    rows: list[dict[str, str | int]] = []
    for question_number, question_block in split_question_blocks(block):
        rows.append(parse_standard_question(question_number, question_block))
    return rows


def validate_rows(chapter_number: int, rows: list[dict[str, str | int]]) -> None:
    expected_count = EXPECTED_COUNTS[chapter_number]
    actual_numbers = [int(row["number"]) for row in rows]
    expected_numbers = list(range(1, expected_count + 1))
    if actual_numbers != expected_numbers:
        raise ValueError(
            f"Chapter {chapter_number} numbering mismatch. Expected {expected_numbers}, got {actual_numbers}."
        )
    if len(rows) != expected_count:
        raise ValueError(f"Chapter {chapter_number} count mismatch. Expected {expected_count}, got {len(rows)}.")


def build_rows(text: str) -> tuple[list[list[str | int]], list[str]]:
    csv_rows: list[list[str | int]] = []
    report_lines: list[str] = []

    for chapter_number, block in chapter_blocks(text):
        title = chapter_title(block, chapter_number)
        if chapter_number == 4:
            report_lines.append(
                "Chapter 4 title was found as 'Employee Selection: Recruiting and Interviewing', "
                "but no question content was recoverable from the PDF text extraction."
            )
            continue

        if title is None:
            raise ValueError(f"Missing title for Chapter {chapter_number}.")

        topic_slug = CHAPTER_ONE_TOPIC if chapter_number == 1 else slugify(title)
        chapter_label = f"Chapter {chapter_number}"
        parsed = parse_chapter_one(block) if chapter_number == 1 else parse_standard_chapter(block)
        validate_rows(chapter_number, parsed)

        for row in parsed:
            csv_rows.append(
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
                    chapter_label,
                    topic_slug,
                ]
            )

        report_lines.append(f"{chapter_label}: {len(parsed)} questions | topic `{topic_slug}`")

    return csv_rows, report_lines


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
    content = ["Industrial/Organizational Psychology PDF import report", f"Total exported rows: {total_rows}", ""]
    content.extend(lines)
    REPORT_PATH.write_text("\n".join(content), encoding="utf-8")


def main() -> None:
    text = TEXT_PATH.read_text(encoding="utf-8", errors="replace")
    rows, report_lines = build_rows(text)
    write_csv(rows)
    write_report(report_lines, len(rows))
    print(f"Wrote {len(rows)} rows to {CSV_PATH}")
    print(f"Report saved to {REPORT_PATH}")


if __name__ == "__main__":
    main()
