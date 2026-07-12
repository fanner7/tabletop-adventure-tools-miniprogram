# -*- coding: utf-8 -*-
"""Replace ALL_SKILLS in coc7-gen.js with the corrected data from skills_data_preview.js."""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Read the preview (correctly formatted skills)
with open('skills_data_preview.js', 'r', encoding='utf-8') as f:
    preview = f.read()

# Extract just the ALL_SKILLS block (skip the comment lines)
lines = preview.split('\n')
skills_start = None
skills_end = None
for i, line in enumerate(lines):
    if line.startswith('const ALL_SKILLS = ['):
        skills_start = i
    if skills_start is not None and line.strip() == '];':
        skills_end = i
        break

new_skills_block = '\n'.join(lines[skills_start:skills_end+1])
print(f"New ALL_SKILLS: {skills_end - skills_start + 1} lines")

# Read the target file
target_path = '../pages/coc7-gen/coc7-gen.js'
with open(target_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the ALL_SKILLS block in the target
start = content.find('const ALL_SKILLS = [')
if start == -1:
    print("ERROR: Cannot find ALL_SKILLS in target file")
    sys.exit(1)

end = content.find('];', start)
if end == -1:
    print("ERROR: Cannot find end of ALL_SKILLS")
    sys.exit(1)
end += 2  # include ];

print(f"Old ALL_SKILLS: start={start}, end={end}")

# Replace
new_content = content[:start] + new_skills_block + content[end:]

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("DONE - coc7-gen.js updated")
