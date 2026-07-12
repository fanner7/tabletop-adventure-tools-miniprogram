# -*- coding: utf-8 -*-
"""Find and report all raw newlines in single-quoted strings in a JS file."""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = '../pages/coc7-gen/coc7-gen.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find lines that have unescaped newlines within single-quoted strings
# A single-quoted string starts with ' and ends with ' on the same line (in valid JS)
# If a line has an opening ' but no closing ' on the same line, it might have a raw newline
print("=== Lines with potential raw newlines in strings ===")
for i, line in enumerate(lines, 1):
    stripped = line.rstrip('\n\r')
    # Count single quotes
    quotes = stripped.count("'")
    # If odd number of quotes, string might be unclosed
    if quotes % 2 != 0:
        print(f"Line {i} (odd quotes={quotes}): {stripped[:120]}")
