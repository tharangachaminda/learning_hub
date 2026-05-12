#!/usr/bin/env python3
"""Extract a curriculum PDF into reviewable markdown.

This is a one-off maintenance script used during curriculum extraction work.
If you need to rerun it, install the external dependency first:

    python3 -m pip install pypdf
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

try:
    from pypdf import PdfReader  # pyright: ignore[reportMissingImports]
except ImportError as exc:  # pragma: no cover - runtime guard for local tooling
    raise SystemExit(
        'Missing dependency: pypdf. Install it with "python3 -m pip install pypdf" '
        'before running scripts/extract_math_curriculum.py.'
    ) from exc


def normalize_text(text: str) -> str:
    text = text.replace('\u00a0', ' ')
    text = re.sub(r'\r\n?', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [line.rstrip() for line in text.splitlines()]
    return '\n'.join(lines).strip()


def extract_pdf_to_markdown(pdf_path: Path, output_path: Path) -> None:
    reader = PdfReader(str(pdf_path))
    sections: list[str] = [
        '# Mathematics and Statistics Curriculum Extract',
        '',
        f'Source PDF: `{pdf_path.name}`',
        f'Total pages: {len(reader.pages)}',
        '',
        '> Auto-generated from the PDF to support curriculum review and structured extraction.',
        '',
    ]

    for index, page in enumerate(reader.pages, start=1):
        raw_text = page.extract_text() or ''
        text = normalize_text(raw_text)
        sections.extend([f'## Page {index}', '', text or '_No extractable text on this page._', ''])

    output_path.write_text('\n'.join(sections).rstrip() + '\n', encoding='utf-8')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Extract a PDF into a reviewable markdown file.'
    )
    parser.add_argument('pdf', type=Path, help='Path to the source PDF file')
    parser.add_argument('output', type=Path, help='Path to the markdown output file')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    extract_pdf_to_markdown(args.pdf, args.output)


if __name__ == '__main__':
    main()