with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# State machine: replace \n (literal two-char sequence) with actual \n
# ONLY when outside of single-quoted strings
# Inside single-quoted strings, keep \n as-is (it's intentional escaping)

result = []
i = 0
in_single_quote = False
while i < len(content):
    ch = content[i]
    
    if not in_single_quote:
        if ch == "'":
            in_single_quote = True
            result.append(ch)
        elif ch == '\\' and i + 1 < len(content) and content[i + 1] == 'n':
            # Literal \n outside string → replace with actual newline
            # But only if not preceded by another backslash
            result.append('\n')
            i += 2
            continue
        else:
            result.append(ch)
    else:
        if ch == '\\':
            # Escape sequence inside string - keep as-is
            result.append(ch)
            i += 1
            if i < len(content):
                result.append(content[i])
        elif ch == "'":
            in_single_quote = False
            result.append(ch)
        else:
            result.append(ch)
    i += 1

fixed = ''.join(result)

# Write back
output_lines = fixed.split('\n')
print(f'Result: {len(output_lines)} lines')

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(fixed)
