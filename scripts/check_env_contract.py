#!/usr/bin/env python3
"""Verify required environment variables for runtime modes.

Exits with code 0 when required variables present, 1 and prints missing names otherwise.
Does NOT print values.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import List, Mapping

from dotenv import load_dotenv

REQUIRED = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
]

OPTIONAL = []


def check_env(env: Mapping[str, str]) -> List[str]:
    missing = []
    for name in REQUIRED:
        if not env.get(name):
            missing.append(name)
    # If SCORING_ENGINE expects embeddings, require GEMINI_API_KEY
    scoring = env.get("SCORING_ENGINE", "").lower()
    if scoring == "embeddings":
        if not env.get("GEMINI_API_KEY"):
            missing.append("GEMINI_API_KEY")
    return missing


def main():
    # Load .env from the uploaditin_backend directory (sibling of scripts/)
    _env_path = Path(__file__).resolve().parents[1] / "uploaditin_backend" / ".env"
    load_dotenv(dotenv_path=_env_path, override=False)

    missing = check_env(os.environ)
    if missing:
        print("Missing required environment variables:", file=sys.stderr)
        for name in missing:
            print("-", name, file=sys.stderr)
        return 1
    print("All required environment variables present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
