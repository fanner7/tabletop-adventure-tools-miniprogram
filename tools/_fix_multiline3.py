import re

with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Replace literal \n (two chars: backslash + n) between array elements
# Pattern: },\n  {  →  },\n  {
# The literal \n here is the two-char escape sequence in the file
# We need to find: '},\\n  { name:' and replace with '},\n  { name:'
# In Python string: the file has actual backslash + n between elements

# Find '},\n  {' in the content (where \n is literal backslash-n)
# In Python, this is: '},\\n  {'
content = content.replace('},\\n  { name:', '},\n  { name:')
content = content.replace('},\\n  { name:', '},\n  { name:')

# Also fix lines that only have \n between them (not inside desc strings)
# We need to be careful: desc strings have \n inside them (correctly escaped)
# The issue is \n BETWEEN array elements

# Better approach: find the ALL_SKILLS block, split by '},\n  {'
# But wait, desc strings also have \n inside...

# Actually the fix above is sufficient if the pattern is consistent
# Let me also check for other corrupted separators

# Count how many actual newlines we have now
start = content.find('const ALL_SKILLS = [')
end = content.find('];', start) + 2
block = content[start:end]
actual_newlines = block.count('\n')
total_skills = block.count("name: '")
print(f'After fix: {actual_newlines} newlines, {total_skills} skills in ALL_SKILLS')

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(content)
