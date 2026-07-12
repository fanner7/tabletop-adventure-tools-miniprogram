with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find end of ALL_SKILLS (the rebuilt section)
end_of_skills = content.find('\n];\n\n// ---------- 工具函数')
if end_of_skills == -1:
    end_of_skills = content.find('];\n\nconst OCCUPATIONS')
if end_of_skills == -1:
    # Try to find '];' after ALL_SKILLS
    idx = content.find('const ALL_SKILLS = [')
    brace = 0
    i = idx
    while i < len(content):
        if content[i] == '[': brace += 1
        elif content[i] == ']': 
            brace -= 1
            if brace == 0:
                end_of_skills = i + 1
                break
        i += 1

print(f"ALL_SKILLS ends at position {end_of_skills}")

# Split at end of ALL_SKILLS
before = content[:end_of_skills]
after = content[end_of_skills:]

# Fix the 'after' portion: replace literal \n (outside strings) with actual newlines
def fix_section(text):
    result = []
    i = 0
    in_single = False
    while i < len(text):
        ch = text[i]
        if not in_single:
            if ch == "'":
                in_single = True
                result.append(ch)
            elif ch == '\\' and i + 1 < len(text) and text[i + 1] == 'n':
                # literal \n outside string → actual newline
                result.append('\n')
                i += 2
                continue
            else:
                result.append(ch)
        else:
            if ch == '\\':
                result.append(ch)
                i += 1
                if i < len(text):
                    result.append(text[i])
            elif ch == '\n':
                # raw newline inside string → escape
                result.append('\\n')
            elif ch == "'":
                in_single = False
                result.append(ch)
            else:
                result.append(ch)
        i += 1
    return ''.join(result)

fixed_after = fix_section(after)

# Write back
with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(before + fixed_after)

lines = (before + fixed_after).split('\n')
print(f'Total lines: {len(lines)}')
