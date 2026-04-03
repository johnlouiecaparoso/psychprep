from __future__ import annotations

import csv
import re
import sys
from dataclasses import dataclass
from pathlib import Path


PDF_TEXT_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\psychological-assessment-short-quiz-from-pdf.txt")
OUTPUT_CSV_PATH = Path(r"C:\Users\Louie\Desktop\pyschprep\psychological-assessment-quiz-import-from-pdf.csv")

SUBJECT = "Psychological Assessment"
EXPECTED_QUESTIONS_PER_CHAPTER = 40


@dataclass
class QuestionRow:
    question: str
    choice_1: str
    choice_2: str
    choice_3: str
    choice_4: str
    correct_answer: int
    explanation: str
    difficulty: str
    subject: str
    chapter: str
    topic: str


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\f", " ")).strip()


def slugify(value: str) -> str:
    lowered = value.lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    return lowered.strip("-")


def extract_chapter_blocks(text: str) -> list[tuple[str, str, str]]:
    matches = list(
        re.finditer(
            r"Short Quiz:\s*Psychological Assessment\s*\nChapter\s+(\d+)\s+(.+)",
            text,
        )
    )
    if not matches:
        raise ValueError("No chapter headers were found in the extracted PDF text.")

    chapter_blocks: list[tuple[str, str, str]] = []
    seen_chapters: set[str] = set()

    for index, match in enumerate(matches):
        chapter_number = match.group(1).strip()
        chapter_title = normalize_whitespace(match.group(2))
        chapter_label = f"Chapter {chapter_number}"
        if chapter_label in seen_chapters:
            raise ValueError(f"Duplicate chapter detected: {chapter_label}")
        seen_chapters.add(chapter_label)

        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chapter_blocks.append((chapter_label, chapter_title, text[start:end]))

    return chapter_blocks


def extract_question_blocks(chapter_block: str, chapter_label: str) -> list[tuple[int, str]]:
    matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s", chapter_block))
    if not matches:
        raise ValueError(f"{chapter_label} has no detectable questions.")

    question_blocks: list[tuple[int, str]] = []
    seen_numbers: set[int] = set()

    for index, match in enumerate(matches):
        question_number = int(match.group(1))
        if question_number in seen_numbers:
            raise ValueError(f"{chapter_label} has a duplicate question number: {question_number}")
        seen_numbers.add(question_number)

        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(chapter_block)
        question_blocks.append((question_number, chapter_block[start:end]))

    expected_numbers = list(range(1, EXPECTED_QUESTIONS_PER_CHAPTER + 1))
    actual_numbers = [number for number, _ in question_blocks]
    if actual_numbers != expected_numbers:
        raise ValueError(
            f"{chapter_label} question numbering is incomplete or out of order. "
            f"Expected {expected_numbers[0]}-{expected_numbers[-1]}, got {actual_numbers}."
        )

    return question_blocks


def extract_section(pattern: str, block: str, label: str) -> tuple[str, str]:
    match = re.search(pattern, block, flags=re.DOTALL)
    if not match:
        raise ValueError(f"Unable to parse {label} from block:\n{block[:500]}")
    return match.group(1), match.group(2)


def parse_question_block(
    question_number: int,
    block: str,
    chapter_label: str,
    topic_slug: str,
) -> QuestionRow:
    cleaned_block = block.replace("\f", "\n")
    cleaned_block = re.sub(r"\nCHAPTER\s+\d+\s*\n", "\n", cleaned_block, flags=re.IGNORECASE)
    cleaned_block = re.sub(
        r"\nShort Quiz:\s*Psychological Assessment\s*\nChapter\s+\d+\s+.+?\n",
        "\n",
        cleaned_block,
        flags=re.IGNORECASE,
    )

    question_part, remainder = extract_section(
        rf"^\s*{question_number}\.\s*(.*?)\n\s*A\.\s*(.*)$",
        cleaned_block,
        f"{chapter_label} question {question_number} stem",
    )
    choice_1, remainder = extract_section(
        r"^(.*?)\n\s*B\.\s*(.*)$",
        remainder,
        f"{chapter_label} question {question_number} choice A",
    )
    choice_2, remainder = extract_section(
        r"^(.*?)\n\s*C\.\s*(.*)$",
        remainder,
        f"{chapter_label} question {question_number} choice B",
    )
    choice_3, remainder = extract_section(
        r"^(.*?)\n\s*D\.\s*(.*)$",
        remainder,
        f"{chapter_label} question {question_number} choice C",
    )
    answer_match = re.search(
        r"^(.*?)\n\s*Answer:\s*([A-D])\.\s*(.*?)\n\s*Rationale:\s*(.*)$",
        remainder,
        flags=re.DOTALL,
    )
    if not answer_match:
        raise ValueError(f"Unable to parse {chapter_label} question {question_number} choice D / answer / rationale.")

    choice_4 = answer_match.group(1)
    correct_letter = answer_match.group(2)
    rationale = answer_match.group(4)
    correct_answer = {"A": 1, "B": 2, "C": 3, "D": 4}[correct_letter]

    choices = {
        1: normalize_whitespace(choice_1),
        2: normalize_whitespace(choice_2),
        3: normalize_whitespace(choice_3),
        4: normalize_whitespace(choice_4),
    }
    if not all(choices.values()):
        raise ValueError(f"{chapter_label} question {question_number} has an empty answer choice.")

    explanation = normalize_whitespace(rationale)
    if not explanation:
        raise ValueError(f"{chapter_label} question {question_number} is missing a rationale.")

    return QuestionRow(
        question=normalize_whitespace(question_part),
        choice_1=choices[1],
        choice_2=choices[2],
        choice_3=choices[3],
        choice_4=choices[4],
        correct_answer=correct_answer,
        explanation=explanation,
        difficulty="Medium",
        subject=SUBJECT,
        chapter=chapter_label,
        topic=topic_slug,
    )


def build_rows(text: str) -> list[QuestionRow]:
    rows: list[QuestionRow] = []
    topic_slugs_seen: set[str] = set()

    for chapter_label, chapter_title, block in extract_chapter_blocks(text):
        topic_slug = slugify(chapter_title)
        if topic_slug in topic_slugs_seen:
            raise ValueError(f"Duplicate topic slug detected: {topic_slug}")
        topic_slugs_seen.add(topic_slug)

        question_blocks = extract_question_blocks(block, chapter_label)
        if len(question_blocks) != EXPECTED_QUESTIONS_PER_CHAPTER:
            raise ValueError(
                f"{chapter_label} should have {EXPECTED_QUESTIONS_PER_CHAPTER} questions, "
                f"but {len(question_blocks)} were parsed."
            )

        chapter_rows = [
            parse_question_block(question_number, question_block, chapter_label, topic_slug)
            for question_number, question_block in question_blocks
        ]

        duplicate_questions = {
            row.question for row in chapter_rows if sum(1 for item in chapter_rows if item.question == row.question) > 1
        }
        if duplicate_questions:
            raise ValueError(
                f"{chapter_label} contains duplicated question text: {sorted(duplicate_questions)[:3]}"
            )

        rows.extend(chapter_rows)

    return rows


def write_csv(rows: list[QuestionRow], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.writer(csv_file)
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
        for row in rows:
            writer.writerow(
                [
                    row.question,
                    row.choice_1,
                    row.choice_2,
                    row.choice_3,
                    row.choice_4,
                    row.correct_answer,
                    row.explanation,
                    row.difficulty,
                    row.subject,
                    row.chapter,
                    row.topic,
                ]
            )


def main() -> int:
    if not PDF_TEXT_PATH.exists():
        print(f"Missing extracted text file: {PDF_TEXT_PATH}", file=sys.stderr)
        return 1

    text = PDF_TEXT_PATH.read_text(encoding="utf-8", errors="replace")
    rows = build_rows(text)
    expected_total = 15 * EXPECTED_QUESTIONS_PER_CHAPTER
    if len(rows) != expected_total:
        raise ValueError(f"Expected {expected_total} total questions, but parsed {len(rows)}.")

    write_csv(rows, OUTPUT_CSV_PATH)

    chapter_counts: dict[str, int] = {}
    for row in rows:
        chapter_counts[row.chapter] = chapter_counts.get(row.chapter, 0) + 1

    print(f"Wrote {len(rows)} rows to {OUTPUT_CSV_PATH}")
    for chapter_label in sorted(chapter_counts, key=lambda value: int(value.split()[1])):
        print(f"{chapter_label}: {chapter_counts[chapter_label]} questions")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
