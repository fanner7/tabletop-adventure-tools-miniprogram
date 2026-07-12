import re, json

with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find ALL_SKILLS start and end
skills_start = content.find('const ALL_SKILLS = [')
skills_end = content.find('];', skills_start) + 2

before = content[:skills_start]
skills_block = content[skills_start:skills_end]
after = content[skills_end:]

# Strategy: find each skill object and extract as JSON-like structure
# Each skill is roughly: { name: '...', base: ..., cat: '...', ... }
# We need to handle multi-line desc strings

# First, normalize: ensure each skill object starts on a new line with '{ name:'
# Then parse each one

# Simpler approach: just use the original raw file before my bad fix
# Since we can't recover, let me extract all skills using regex

# Pattern: { name: 'NAME', ... spec: {...} } or { name: 'NAME', ... }
# We'll find the boundaries of each skill object

# First let's collapse multi-line desc strings in the skills block
# Replace raw newlines within strings (between desc: ' and the closing ')
# We need to find desc: '...' where ... may contain newlines

def escape_multiline_strings(text):
    """Replace raw newlines within string literals with \\n"""
    result = []
    i = 0
    in_string = False
    string_char = None
    while i < len(text):
        ch = text[i]
        if not in_string:
            if ch in ("'", '"'):
                in_string = True
                string_char = ch
            result.append(ch)
        else:
            if ch == '\\':
                result.append(ch)
                i += 1
                if i < len(text):
                    result.append(text[i])
            elif ch == string_char:
                in_string = False
                result.append(ch)
            elif ch == '\n':
                result.append('\\n')
            else:
                result.append(ch)
        i += 1
    return ''.join(result)

fixed_block = escape_multiline_strings(skills_block)

# Rebuild the file
new_content = before + fixed_block + after

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done. Length:', len(new_content))
