#!/usr/bin/env python3
"""
Maths Mate Skill Builder PDF Extractor
=======================================
Reads all Maths Mate PDFs from source_materials/ and outputs structured JSON
suitable for vector indexing.

For questions that require a diagram or visual element (number lines, arrays,
fraction shapes, etc.) a `visual_component` block is added describing what
needs to be implemented before indexing.

Usage:
    python3 scripts/extract_pdf_questions.py [--pdf <filename>] [--sample]

Output:
    dev_resources/extracted_questions/
        Skill_Builder_Orange_Rose.json
        Skill_Builder_Blue_Green.json
        Skill_Builder_Mauve_Lime-1.json
        Skill_Builder_Yellow_Red-2.json
        all_questions.json
        extraction_summary.json
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("pdfplumber not installed. Run: pip install pdfplumber")

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

SOURCE_DIR = Path("source_materials")
OUTPUT_DIR = Path("dev_resources/extracted_questions")

# Approximate NZ Year level per color (confirm with school context)
COLOR_YEAR_MAP: dict[str, int] = {
    "yellow": 2,
    "red":    3,
    "orange": 4,
    "rose":   5,
    "blue":   6,
    "green":  7,
    "mauve":  8,
    "lime":   8,
}

# Maps each PDF filename to its two color levels (lower, higher)
PDF_COLOR_MAP: dict[str, list[str]] = {
    "Skill_Builder_Yellow_Red-2.pdf": ["yellow", "red"],
    "Skill_Builder_Orange_Rose.pdf":  ["orange", "rose"],
    "Skill_Builder_Blue_Green.pdf":   ["blue",   "green"],
    "Skill_Builder_Mauve_Lime-1.pdf": ["mauve",  "lime"],
}

# ═══════════════════════════════════════════════════════════════
# VISUAL COMPONENT DETECTION RULES
#
# Each rule maps keyword triggers (checked against the lowercase
# combined skill_description + question_text) to a visual type
# and a human-readable description of what needs to be rendered.
# ═══════════════════════════════════════════════════════════════

VISUAL_RULES: list[dict] = [
    {
        "type": "number_line",
        "description": (
            "A number line is displayed on screen. The student marks a starting "
            "position and drags/taps to count forwards or backwards along it."
        ),
        "triggers": [
            "number line", "on a number line", "0 1 2 3 4 5 6 7 8 9 10",
        ],
    },
    {
        "type": "base_10_blocks",
        "description": (
            "Base-10 block diagrams (unit cubes, rods, flats, large cubes) represent "
            "a number. The student reads the total value shown or drags blocks to "
            "model a calculation."
        ),
        "triggers": [
            "base 10 block", "base10", "base-10 block", "using base 10",
            "base 10 blocks",
        ],
    },
    {
        "type": "abacus",
        "description": (
            "An abacus is shown with beads on place-value columns (thousands, "
            "hundreds, tens, ones). The student reads the number represented."
        ),
        "triggers": ["abacus"],
    },
    {
        "type": "dot_array",
        "description": (
            "A rectangular grid of dots is displayed. The student circles equal "
            "groups by tapping/dragging to model multiplication or division."
        ),
        "triggers": [
            "using arrays", "by using arrays", "using an array",
            "arranging objects in equal groups", "arranging an equal number",
            "arranging objects in equal", "modelling division by arranging",
            "modelling multiplication",
        ],
    },
    {
        "type": "picture_groups",
        "description": (
            "An illustration shows equal groups of real-world objects (e.g., keys, "
            "books, paintbrushes). The student counts the number of groups and the "
            "number of objects per group."
        ),
        "triggers": [
            "counting equal groups", "groups of equal numbers of objects",
            "counting groups", "recognising and counting groups",
        ],
    },
    {
        "type": "fraction_shape_shade",
        "description": (
            "A shape (circle, rectangle, or polygon) divided into equal parts is "
            "shown. The student taps parts to shade them and represent a given "
            "fraction of the whole."
        ),
        "triggers": [
            "illustrating fractions as part of a whole by shading",
            "illustrating fractions as part of a group by shading",
            "shading parts of a diagram",
        ],
    },
    {
        "type": "fraction_shape_divide",
        "description": (
            "An undivided shape is shown. The student draws dividing lines (by "
            "dragging) to split it into equal parts representing the required "
            "fraction."
        ),
        "triggers": [
            "illustrating fractions as part of a whole by drawing dividing lines",
            "drawing dividing lines in a diagram",
        ],
    },
    {
        "type": "fraction_shape_recognise",
        "description": (
            "Several shapes (some divided into equal parts, some not) are shown. "
            "The student taps the shape that correctly represents the given fraction."
        ),
        "triggers": [
            "recognising fractions as part of a whole",
            "matching fractions to diagrams",
        ],
    },
    {
        "type": "fraction_number_line",
        "description": (
            "A 0-to-1 number line is displayed. The student reads the fraction "
            "indicated by an arrow, or taps a point to place an arrow at a given "
            "fraction position."
        ),
        "triggers": [
            "fractions on a number line",
            "reading and illustrating fractions on a number line",
        ],
    },
    {
        "type": "mixed_number_number_line",
        "description": (
            "A number line spanning multiple whole numbers is displayed. The student "
            "reads or marks the position of a mixed number."
        ),
        "triggers": [
            "mixed numbers on a number line",
            "reading and illustrating mixed numbers on a number line",
        ],
    },
    {
        "type": "fraction_bar_compare",
        "description": (
            "Two shaded fraction-bar strips are shown side by side. The student "
            "compares their shaded areas and selects <, = or > to complete the "
            "statement."
        ),
        "triggers": [
            "fraction bar", "using fraction bars",
            "comparing two fractions with the same denominators",
            "comparing two fractions with the same numerators",
        ],
    },
    {
        "type": "geometry_2d_shapes",
        "description": (
            "2D shape diagrams are displayed. The student identifies, names, or "
            "classifies shapes based on the number of sides, angles, or other "
            "properties."
        ),
        "triggers": [
            "recognising 2d", "naming 2d", "identifying 2d",
            "properties of 2d", "polygon", "triangle", "quadrilateral",
            "pentagon", "hexagon", "heptagon", "octagon",
            "2d shape", "two-dimensional",
        ],
    },
    {
        "type": "geometry_3d_shapes",
        "description": (
            "3D solid shape diagrams are displayed. The student identifies, names, "
            "or counts faces, edges and vertices."
        ),
        "triggers": [
            "recognising 3d", "naming 3d", "identifying 3d",
            "properties of 3d", "prism", "pyramid", "cylinder", "cone", "sphere",
            "3d shape", "three-dimensional", "faces, edges",
        ],
    },
    {
        "type": "symmetry_diagram",
        "description": (
            "A shape or image is shown. The student draws lines of symmetry by "
            "dragging, or completes the reflected half of a figure."
        ),
        "triggers": [
            "line of symmetry", "lines of symmetry", "symmetry",
            "completing a symmetrical figure", "reflecting",
        ],
    },
    {
        "type": "angle_diagram",
        "description": (
            "An angle or rotation diagram is shown. The student classifies the angle "
            "(acute, right, obtuse, reflex) or uses a virtual protractor to measure "
            "it."
        ),
        "triggers": [
            "angle", "right angle", "protractor", "rotation",
            "measuring angles", "classifying angles",
        ],
    },
    {
        "type": "grid_map_coordinates",
        "description": (
            "A labelled grid map is displayed. The student reads grid references "
            "(letters and numbers) to find locations, or plots points on the grid."
        ),
        "triggers": [
            "grid reference", "coordinates", "mapping", "compass direction",
            "reading a map", "plotting on a grid",
        ],
    },
    {
        "type": "location_scene",
        "description": (
            "An illustrated scene is shown with objects in various positions. The "
            "student taps the correct object or position described using spatial "
            "language (above, below, inside, outside, in front, behind, next to)."
        ),
        "triggers": [
            "naming the position of objects",
            "position of objects",
            "describing position",
        ],
    },
    {
        "type": "picture_graph",
        "description": (
            "A picture graph is shown where each symbol represents one (or more) "
            "items. The student counts symbols to answer data questions."
        ),
        "triggers": [
            "picture graph", "interpreting picture graphs",
            "one-to-one correspondence",
        ],
    },
    {
        "type": "bar_graph",
        "description": (
            "A bar or column graph is displayed. The student reads bar heights/lengths "
            "to answer questions about the data."
        ),
        "triggers": [
            "bar graph", "column graph", "interpreting bar",
        ],
    },
    {
        "type": "tally_chart",
        "description": (
            "A tally chart is shown. The student counts tally marks (groups of 5) "
            "to determine the frequency for each category."
        ),
        "triggers": ["tally chart", "tally marks", "reading tally"],
    },
    {
        "type": "clock_face",
        "description": (
            "An analogue clock face diagram is shown. The student reads the time "
            "displayed, or drags clock hands to show a given time."
        ),
        "triggers": [
            "analogue time", "reading the time on a clock",
            "time on a clock", "reading a clock", "reading analogue",
            "telling time", "showing time on a clock",
        ],
    },
    {
        "type": "calendar",
        "description": (
            "A monthly calendar is displayed. The student reads dates, counts days "
            "between dates, or identifies the day of the week for a given date."
        ),
        "triggers": ["calendar", "reading a calendar"],
    },
    {
        "type": "ruler",
        "description": (
            "A ruler (or tape measure) is shown next to an object. The student "
            "reads the measurement by identifying the correct graduation on the "
            "scale."
        ),
        "triggers": [
            "ruler", "measuring length with a ruler",
            "reading a ruler",
        ],
    },
    {
        "type": "thermometer",
        "description": (
            "A thermometer diagram is shown. The student reads the temperature "
            "value from the scale."
        ),
        "triggers": ["thermometer", "reading a thermometer"],
    },
    {
        "type": "weighing_scale",
        "description": (
            "A weighing scale (balance or dial scale) is shown. The student reads "
            "the mass/weight displayed."
        ),
        "triggers": [
            "reading scales", "reading a scale", "weighing scale",
        ],
    },
    {
        "type": "coins_and_notes",
        "description": (
            "Images of New Zealand coins and/or banknotes are displayed. The student "
            "counts the total value, makes up an amount, or calculates change by "
            "tapping the correct coins/notes."
        ),
        "triggers": [
            "recognising coins", "recognising banknotes",
            "counting collections of coins", "adding values of coins",
        ],
    },
    {
        "type": "number_line_addition_subtraction",
        "description": (
            "A number line is shown with a marked starting point and arc jumps "
            "illustrating the addition or subtraction. The student counts the jumps "
            "to find the result."
        ),
        "triggers": [
            "adding the numbers from 1 to 10 by counting forwards on a number line",
            "subtracting the numbers from 1 to 10 by counting backwards on a number line",
            "counting forwards on a number line",
            "counting backwards on a number line",
        ],
    },
    {
        "type": "place_value_table",
        "description": (
            "A place-value table (columns for thousands, hundreds, tens, ones) is "
            "shown. The student reads the digit in a specified column or completes "
            "the expansion of a number."
        ),
        "triggers": [
            "place value", "identifying the digit in each place",
            "place values of each digit", "place of a digit",
        ],
    },
    {
        "type": "venn_diagram",
        "description": (
            "A Venn diagram with two or more overlapping circles is shown. The "
            "student places items in the correct regions or reads values from it."
        ),
        "triggers": ["venn diagram"],
    },
    {
        "type": "carroll_diagram",
        "description": (
            "A Carroll diagram (2×2 sorting grid) is shown. The student places items "
            "into the correct cells based on two attributes."
        ),
        "triggers": ["carroll diagram"],
    },
]

# ═══════════════════════════════════════════════════════════════
# COMPILED REGEXES
# ═══════════════════════════════════════════════════════════════

_COLOR_NAMES = "|".join(COLOR_YEAR_MAP.keys())

# Color header line, e.g. "Orange 11223344" or "Rose 1 1 2 2 3 3 4 4"
_COLOR_HDR_RE = re.compile(
    rf"^(?:{_COLOR_NAMES})\s+[\d\s]+$",
    re.IGNORECASE | re.MULTILINE,
)

# Page footer, e.g. "page 10 © Maths Mate Orange/Rose Skill Builder 1"
_FOOTER_RE = re.compile(
    r"^page\s+[ivxlcdmIVXLCDM\d]+\s+©.*?skill\s+builder.*$",
    re.IGNORECASE | re.MULTILINE,
)

# Skill header, e.g. "Skill 2.13 Subtracting ..."
_SKILL_HDR_RE = re.compile(
    r"Skill\s+(\d+\.\d+)\s+(.+?)(?=\n)",
    re.IGNORECASE | re.DOTALL,
)

# Strand section divider, e.g. "9. [Fractions]"
_STRAND_RE = re.compile(r"^(\d+)\.\s+\[([^\]]+)\]", re.MULTILINE)

# Q. A. worked-example marker (two-column header)
_QA_RE = re.compile(r"\bQ\.\s+A\.")

# Individual practice question label: a) ... z), A) ... Z)
_QLABEL_RE = re.compile(r"(?m)^([a-zA-Z])\)\s")
# Paired labels on same line: "a) b)" or "c) d)"
_PAIRED_LABEL_RE = re.compile(r"^([a-zA-Z])\)\s+([a-zA-Z])\)\s*$")
# Label-only line: "a)" with nothing else
_SOLO_LABEL_RE = re.compile(r"^([a-zA-Z])\)\s*$")
# Label with inline text: "a) Count on by 3s from 90."
_INLINE_LABEL_RE = re.compile(r"^([a-zA-Z])\)\s+(.+)")

# Continuation marker "(2)." "(3)." at end of skill description
_CONT_RE = re.compile(r"\((\d+)\)\.?\s*$")

# Section markers for page classification
_ANSWERS_RE = re.compile(r"^ANSWERS\s*$", re.MULTILINE | re.IGNORECASE)
_GLOSSARY_RE = re.compile(r"GLOSSARY", re.IGNORECASE)
_FACTS_RE = re.compile(r"MATHS\s+FACT", re.IGNORECASE)
_SKILL_RE = re.compile(r"Skill\s+\d+\.\d+", re.IGNORECASE)

# Proper skill practice page: color header must appear in first ~5 lines
# (distinguishes real skill pages from front-matter that mentions skill IDs in tables)
_TOP_COLOR_RE = re.compile(
    rf"(?:{'|'.join(COLOR_YEAR_MAP.keys())})\s+[\d\s]+",
    re.IGNORECASE,
)

# Color fragments inside skill description, e.g. " Rose 11223344" or "Rose11223344"
_INLINE_COLOR_RE = re.compile(
    rf"\s*(?:{'|'.join(COLOR_YEAR_MAP.keys())})\s*[\d\s]+",
    re.IGNORECASE,
)


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def detect_visual(skill_description: str, question_text: str) -> dict | None:
    """Return the first matching visual component rule, or None."""
    combined = (skill_description + " " + question_text).lower()
    for rule in VISUAL_RULES:
        if any(t in combined for t in rule["triggers"]):
            return {
                "type": rule["type"],
                "description": rule["description"],
            }
    return None


def clean_page_text(raw: str) -> str:
    """Strip color header lines and page footers."""
    text = _COLOR_HDR_RE.sub("", raw)
    text = _FOOTER_RE.sub("", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def classify_page(text: str) -> str:
    if not text or len(text.strip()) < 10:
        return "blank"
    if _ANSWERS_RE.search(text):
        return "answers"
    if _GLOSSARY_RE.search(text):
        return "glossary"
    if _FACTS_RE.search(text):
        return "maths_facts"
    if _SKILL_RE.search(text):
        # A real skill-practice page must have the color header in the first 5 lines
        # (front-matter record sheets mention "Skill X.Y" but don't lead with a color header)
        first_lines = "\n".join(text.splitlines()[:6])
        if _TOP_COLOR_RE.search(first_lines):
            return "skill"
        return "other"
    return "other"


# ═══════════════════════════════════════════════════════════════
# ANSWERS SECTION PARSER
# ═══════════════════════════════════════════════════════════════

def parse_answers_section(answers_text: str) -> dict[str, dict[str, str]]:
    """
    Parse the compact answers pages at the back of the book.

    Returns:
        {skill_id: {label: answer_value}}
        e.g. {"1.1": {"a": "7", "b": "5", ...}}

    Notes:
        - Some answers are sequences ("12, 13, 14") — kept as a string.
        - Visual answers (diagrams) appear as blank entries.
    """
    result: dict[str, dict[str, str]] = {}

    # Split into per-skill blocks on "Skill X.Y"
    blocks = re.split(r"(?=Skill\s+\d+\.\d+)", answers_text)
    for block in blocks:
        m = re.match(r"Skill\s+(\d+\.\d+)\s+(.*)", block, re.DOTALL)
        if not m:
            continue
        skill_id = m.group(1)
        body = m.group(2).strip()

        # Find each label position
        positions = [(lm.group(1), lm.start(), lm.end())
                     for lm in re.finditer(r"([a-zA-Z])\)", body)]
        label_answers: dict[str, str] = {}
        for idx, (label, start, end) in enumerate(positions):
            next_start = positions[idx + 1][1] if idx + 1 < len(positions) else len(body)
            raw_val = body[end:next_start].strip().rstrip(",").strip()
            # Collapse whitespace but keep the value
            raw_val = re.sub(r"\s+", " ", raw_val)
            # Trim trailing skill reference noise
            raw_val = re.sub(r"\s*Skill\s+\d+\.\d+.*", "", raw_val).strip()
            if raw_val:
                label_answers[label] = raw_val
        if label_answers:
            result.setdefault(skill_id, {}).update(label_answers)

    return result


# ═══════════════════════════════════════════════════════════════
# TWO-COLUMN QUESTION BLOCK PARSER
# ═══════════════════════════════════════════════════════════════

# Imperative/question words that signal an instruction line (not data)
_INSTRUCTION_STARTERS = (
    "circle", "write", "count", "find", "complete", "draw", "shade",
    "match", "mark", "order", "sort", "list", "label", "name", "identify",
    "how many", "what is", "what are", "which", "is the", "use", "add",
    "subtract", "multiply", "divide", "colour", "color", "fill", "place",
    "round", "expand", "convert", "calculate", "show", "illustrate",
)


def _looks_like_instruction(line: str) -> bool:
    """Return True if line looks like a question instruction rather than data."""
    stripped = line.strip()
    if not stripped:
        return False
    lower = stripped.lower()
    if any(lower.startswith(s) for s in _INSTRUCTION_STARTERS):
        return True
    if stripped.endswith("?"):
        return True
    return False


def _split_instruction(text: str) -> tuple[str, str]:
    """
    Split a merged two-column instruction into left and right halves.
    e.g. "How many dolphins? How many presents?" → ("How many dolphins?", "How many presents?")
    """
    if not text:
        return "", ""
    # Split at sentence boundary: period/? followed by whitespace + capital letter
    m = re.search(r"([.?!])\s+(?=[A-Z])", text)
    if m:
        return text[: m.start() + 1].strip(), text[m.end() :].strip()
    # Fallback: split at midpoint word boundary
    words = text.split()
    mid = len(words) // 2
    return " ".join(words[:mid]), " ".join(words[mid:])


def _is_any_label_line(line: str) -> bool:
    return bool(
        _PAIRED_LABEL_RE.match(line)
        or _SOLO_LABEL_RE.match(line)
        or _INLINE_LABEL_RE.match(line)
    )


def _parse_questions_from_block(
    block: str, initial_pending: list[str] | None = None
) -> list[dict]:
    """
    Line-by-line parser for the practice-questions block.

    Handles:
    - Paired two-column labels:  "a) b)"  →  two separate question records
    - Solo label lines:          "a)"     →  one record
    - Inline label:              "a) Count on by 3s from 90."  →  one record

    For paired labels, the instruction line preceding "a) b)" is split into
    left and right halves and assigned to questions a and b respectively.
    Data lines (numbers, expressions) following the label line are captured
    as content; lines that look like instructions are held as pending context
    for the next label pair.
    """
    questions: list[dict] = []
    lines = [l.strip() for l in block.splitlines() if l.strip()]
    i = 0
    pending: list[str] = list(initial_pending) if initial_pending else []

    while i < len(lines):
        line = lines[i]

        paired_m = _PAIRED_LABEL_RE.match(line)
        solo_m   = _SOLO_LABEL_RE.match(line)
        inline_m = _INLINE_LABEL_RE.match(line)

        if paired_m:
            label_a, label_b = paired_m.group(1), paired_m.group(2)
            instruction = " ".join(pending).strip()
            left_instr, right_instr = _split_instruction(instruction)

            # Collect data lines after the label pair
            content_lines: list[str] = []
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if _is_any_label_line(nxt):
                    break
                if _looks_like_instruction(nxt):
                    # Instruction line for the NEXT label; hold it as pending
                    pending = [nxt]
                    i += 1
                    break
                content_lines.append(nxt)
                i += 1
            else:
                pending = []

            # If we exited the inner loop without hitting an instruction, clear pending
            if not _looks_like_instruction(lines[i - 1]) if i > 0 else True:
                if not pending:
                    pending = []

            content = " ".join(content_lines).strip()
            questions.append({
                "label": label_a,
                "question_text": f"{left_instr} {content}".strip() if content else left_instr,
                "paired_with": label_b,
            })
            questions.append({
                "label": label_b,
                "question_text": f"{right_instr} {content}".strip() if content else right_instr,
                "paired_with": label_a,
            })
            continue

        elif solo_m:
            label = solo_m.group(1)
            instruction = " ".join(pending).strip()
            content_lines = []
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if _is_any_label_line(nxt):
                    break
                if _looks_like_instruction(nxt):
                    pending = [nxt]
                    i += 1
                    break
                content_lines.append(nxt)
                i += 1
            else:
                pending = []

            content = " ".join(content_lines).strip()
            q_text = f"{instruction} {content}".strip() if content else instruction
            questions.append({"label": label, "question_text": q_text, "paired_with": None})
            continue

        elif inline_m:
            label = inline_m.group(1)
            inline_content = inline_m.group(2).strip()
            instruction = " ".join(pending).strip()
            content_lines = [inline_content]
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if _is_any_label_line(nxt):
                    break
                if _looks_like_instruction(nxt):
                    pending = [nxt]
                    i += 1
                    break
                content_lines.append(nxt)
                i += 1
            else:
                pending = []

            content = " ".join(content_lines).strip()
            q_text = f"{instruction} {content}".strip() if instruction else content
            questions.append({"label": label, "question_text": q_text, "paired_with": None})
            continue

        else:
            # Regular instruction/context line – accumulate for next label
            pending.append(line)
            i += 1

    return questions


# ═══════════════════════════════════════════════════════════════
# SKILL PAGE PARSER
# ═══════════════════════════════════════════════════════════════

def parse_skill_page(raw_text: str, current_strand: str) -> dict | None:
    """
    Parse one skill page and return structured data.

    Returns None if no skill header is found.
    """
    # Update current_strand from any strand divider on this page
    strand_m = _STRAND_RE.search(raw_text)
    if strand_m:
        current_strand = strand_m.group(2).strip()

    cleaned = clean_page_text(raw_text)

    skill_m = _SKILL_HDR_RE.search(cleaned)
    if not skill_m:
        return None

    skill_id = skill_m.group(1)
    raw_desc = skill_m.group(2).strip()

    # Handle line-wrapped descriptions (color header injected mid-line):
    # e.g. "Subtracting 1-digit and 2-digit numbers by using base Rose 11223344\n10 blocks"
    # After cleaning the color header is gone but we may have a stray newline.
    raw_desc = re.sub(r"\s+", " ", raw_desc)
    # Remove any inline color-header fragments that leaked into the description
    # e.g. "Counting objects. Rose 11223344" → "Counting objects."
    raw_desc = _INLINE_COLOR_RE.sub("", raw_desc).strip()

    # Strip continuation number: "(1)." "(2)." from description
    cont_m = _CONT_RE.search(raw_desc)
    continuation = int(cont_m.group(1)) if cont_m else 1
    skill_description = _CONT_RE.sub("", raw_desc).rstrip(". ").strip()

    # ── Extract instruction block and worked example ───────────
    body_start = skill_m.end()
    body = cleaned[body_start:]

    qa_m = _QA_RE.search(body)
    worked_example: dict | None = None
    instruction_text = ""

    if qa_m:
        pre_qa = body[: qa_m.start()].strip()
        post_qa = body[qa_m.end() :].strip()

        # The last non-empty line before Q./A. is the worked-example question prompt.
        pre_lines = [l.strip() for l in pre_qa.splitlines() if l.strip()]
        instruction_text = "\n".join(pre_lines[:-1]) if len(pre_lines) > 1 else ""
        we_question_prompt = pre_lines[-1] if pre_lines else ""

        # Everything after "Q. A." until the first practice label = answer block
        first_q_m = _QLABEL_RE.search(post_qa)
        if first_q_m:
            we_answer_block = post_qa[: first_q_m.start()].strip()
            questions_block = post_qa[first_q_m.start() :]
        else:
            we_answer_block = post_qa
            questions_block = ""

        worked_example = {
            "question_prompt": we_question_prompt,
            "full_block": re.sub(r"\s+", " ", we_answer_block),
        }

        # The last instruction-like lines of we_answer_block are really the
        # instruction for the FIRST practice question pair (a/b). Strip them
        # from the worked example and pass them as initial pending to the parser.
        we_lines = we_answer_block.splitlines()
        initial_pending: list[str] = []
        while we_lines and _looks_like_instruction(we_lines[-1].strip()):
            initial_pending.insert(0, we_lines.pop().strip())
        if initial_pending:
            worked_example["full_block"] = re.sub(
                r"\s+", " ", "\n".join(we_lines)
            ).strip()
    else:
        # Continuation page — no worked example, directly has practice questions
        first_q_m = _QLABEL_RE.search(body)
        if first_q_m:
            instruction_text = body[: first_q_m.start()].strip()
            questions_block = body[first_q_m.start() :]
        else:
            instruction_text = body.strip()
            questions_block = ""
        initial_pending = []

    # ── Extract individual practice questions ──────────────────
    questions: list[dict] = []
    if questions_block:
        questions = _parse_questions_from_block(questions_block, initial_pending)

    return {
        "strand":            current_strand,
        "skill_id":          skill_id,
        "skill_description": skill_description,
        "continuation":      continuation,
        "instruction":       re.sub(r"\s+", " ", instruction_text).strip(),
        "worked_example":    worked_example,
        "questions":         questions,
    }


# ═══════════════════════════════════════════════════════════════
# MAIN PDF EXTRACTION
# ═══════════════════════════════════════════════════════════════

def extract_pdf(
    pdf_path: Path,
    colors: list[str],
    sample_only: bool = False,
) -> tuple[list[dict], dict]:
    """
    Extract all questions from one PDF.

    Returns:
        (question_records, stats)
    """
    records: list[dict] = []
    stats: dict = {
        "file": pdf_path.name,
        "total_pages": 0,
        "skill_pages": 0,
        "skills_found": 0,
        "questions_extracted": 0,
        "questions_with_visual": 0,
        "questions_with_answer": 0,
    }

    current_strand = "Unknown"

    with pdfplumber.open(pdf_path) as pdf:
        stats["total_pages"] = len(pdf.pages)
        page_texts: list[tuple[int, str]] = []

        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            page_texts.append((i + 1, text))
            if sample_only and i >= 50:
                break

        # ── Pass 1: collect the full answers section ───────────
        in_answers = False
        answers_parts: list[str] = []
        for _, text in page_texts:
            if classify_page(text) == "answers":
                in_answers = True
            if in_answers and text:
                answers_parts.append(text)
        answers_map = parse_answers_section("\n".join(answers_parts))

        # ── Pass 2: extract skill pages ───────────────────────
        skills_seen: set[str] = set()

        for page_num, text in page_texts:
            ptype = classify_page(text)

            # Keep strand current even on non-skill pages
            strand_m = _STRAND_RE.search(text)
            if strand_m:
                current_strand = strand_m.group(2).strip()

            if ptype != "skill":
                continue

            stats["skill_pages"] += 1
            skill_data = parse_skill_page(text, current_strand)
            if not skill_data:
                continue

            sid = skill_data["skill_id"]
            if sid not in skills_seen:
                skills_seen.add(sid)
                stats["skills_found"] += 1

            skill_answers = answers_map.get(sid, {})

            for q in skill_data["questions"]:
                label = q["label"]
                answer = skill_answers.get(label)
                visual = detect_visual(
                    skill_data["skill_description"], q["question_text"]
                )

                record: dict = {
                    "id": f"{'_'.join(colors)}_{sid}_{label}",
                    "source_file":       pdf_path.name,
                    "color_levels":      colors,
                    "nz_year_levels":    [COLOR_YEAR_MAP[c] for c in colors],
                    "strand":            skill_data["strand"],
                    "skill_id":          sid,
                    "skill_description": skill_data["skill_description"],
                    "continuation_page": skill_data["continuation"],
                    "question_label":    label,
                    "question_text":     q["question_text"],
                    "answer":            answer,
                    "requires_visual":   visual is not None,
                    "visual_component":  visual,
                    "page_number":       page_num,
                    # Full context for vector embedding
                    "embedding_text": (
                        f"[{skill_data['strand']}] "
                        f"Skill {sid}: {skill_data['skill_description']}. "
                        f"{skill_data['instruction']} "
                        f"{q['question_text']}"
                    ).strip(),
                }
                records.append(record)
                stats["questions_extracted"] += 1
                if visual:
                    stats["questions_with_visual"] += 1
                if answer:
                    stats["questions_with_answer"] += 1

    stats["skills_found"] = len(skills_seen)
    return records, stats


# ═══════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(description="Extract Maths Mate PDF questions")
    parser.add_argument(
        "--pdf",
        metavar="FILENAME",
        help="Process only this PDF filename (e.g. Skill_Builder_Orange_Rose.pdf)",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Only process the first 50 pages of each PDF (fast test run)",
    )
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    target_pdfs = (
        {args.pdf: PDF_COLOR_MAP[args.pdf]}
        if args.pdf and args.pdf in PDF_COLOR_MAP
        else PDF_COLOR_MAP
    )

    all_questions: list[dict] = []
    all_stats: list[dict] = []

    for filename, colors in target_pdfs.items():
        pdf_path = SOURCE_DIR / filename
        if not pdf_path.exists():
            print(f"  [SKIP] {pdf_path} not found")
            continue

        print(f"\nProcessing: {filename}")
        print(f"  Colors: {colors}")

        questions, stats = extract_pdf(pdf_path, colors, sample_only=args.sample)
        all_questions.extend(questions)
        all_stats.append(stats)

        # Per-book output
        out_file = OUTPUT_DIR / (pdf_path.stem + ".json")
        out_file.write_text(
            json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        print(f"  Pages:            {stats['total_pages']}")
        print(f"  Skill pages:      {stats['skill_pages']}")
        print(f"  Unique skills:    {stats['skills_found']}")
        print(f"  Questions:        {stats['questions_extracted']}")
        print(f"  With visual:      {stats['questions_with_visual']}")
        print(f"  Answers matched:  {stats['questions_with_answer']}")
        print(f"  → {out_file}")

    # Combined output
    all_file = OUTPUT_DIR / "all_questions.json"
    all_file.write_text(
        json.dumps(all_questions, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    summary_file = OUTPUT_DIR / "extraction_summary.json"
    summary = {
        "total_questions": len(all_questions),
        "visual_breakdown": _visual_breakdown(all_questions),
        "strand_breakdown": _strand_breakdown(all_questions),
        "year_level_breakdown": _year_breakdown(all_questions),
        "per_file": all_stats,
    }
    summary_file.write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\n{'─'*50}")
    print(f"Total questions:   {len(all_questions)}")
    print(f"Require visual:    {sum(1 for q in all_questions if q['requires_visual'])}")
    print(f"Answers matched:   {sum(1 for q in all_questions if q['answer'])}")
    print(f"All questions  →   {all_file}")
    print(f"Summary        →   {summary_file}")


def _visual_breakdown(questions: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for q in questions:
        if q["visual_component"]:
            vtype = q["visual_component"]["type"]
            counts[vtype] = counts.get(vtype, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: -x[1]))


def _strand_breakdown(questions: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for q in questions:
        s = q["strand"]
        counts[s] = counts.get(s, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: -x[1]))


def _year_breakdown(questions: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for q in questions:
        for yr in q["nz_year_levels"]:
            k = f"year_{yr}"
            counts[k] = counts.get(k, 0) + 1
    return dict(sorted(counts.items()))


if __name__ == "__main__":
    main()
