with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Two-pass fix:
# Pass 1: Replace literal \n (two chars) OUTSIDE strings with actual newlines
#         (undoes the corruption from my first script)
# Pass 2: Replace raw newlines INSIDE strings with \n escape

result = []
i = 0
in_single = False
while i < len(content):
    ch = content[i]
    
    if not in_single:
        if ch == "'":
            in_single = True
            result.append(ch)
        elif ch == '\\' and i + 1 < len(content) and content[i + 1] == 'n':
            # Literal \n outside string → actual newline
            result.append('\n')
            i += 2
            continue
        else:
            result.append(ch)
    else:
        if ch == '\\':
            # Keep escape sequences as-is
            result.append(ch)
            i += 1
            if i < len(content):
                result.append(content[i])
        elif ch == '\n':
            # Raw newline inside string → escape it
            result.append('\\n')
        elif ch == "'":
            in_single = False
            result.append(ch)
        else:
            result.append(ch)
    i += 1

fixed = ''.join(result)

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(fixed)

print(f'Done: {len(fixed.splitlines())} lines')
