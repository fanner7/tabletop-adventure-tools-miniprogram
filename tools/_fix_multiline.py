import re

with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

result = []
i = 0
while i < len(lines):
    line = lines[i]
    fixed = False
    for prefix in ["desc: '", "usage: '"]:
        idx = line.find(prefix)
        if idx >= 0:
            after = line[idx + len(prefix):]
            # Check for closing quote patterns
            single_line = False
            for end_pat in ["'}," , "' },", "'}"]:
                if end_pat in after and after.find(end_pat) < 50:
                    single_line = True
                    break
            # Also check if ' appears near end of line
            stripped = after.rstrip('\n\r')
            if stripped.endswith("'") and not stripped.endswith("\\'"):
                single_line = True
                
            if not single_line:
                # Multi-line! Accumulate until closing
                accumulated = line.rstrip('\n\r')
                i += 1
                while i < len(lines):
                    next_line = lines[i]
                    acc_stripped = next_line.rstrip('\n\r')
                    end_found = False
                    for end_pat in ["'}," , "' },", "'}"]:
                        if end_pat in acc_stripped:
                            end_found = True
                            break
                    if not end_found and acc_stripped.endswith("'") and not acc_stripped.endswith("\\'"):
                        end_found = True
                    if end_found:
                        accumulated += '\\n' + acc_stripped
                        result.append(accumulated + '\n')
                        i += 1
                        fixed = True
                        break
                    else:
                        accumulated += '\\n' + acc_stripped
                        i += 1
                if fixed:
                    break
    if not fixed:
        result.append(line)
        i += 1

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.writelines(result)

# Verify
with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()
has_raw = '\n- 通过检查账簿' in content
has_esc = '\\n- 通过检查账簿' in content
# Actually the escape in Python string needs to be represented carefully
# Let's search for the literal two-char sequence backslash-n
has_esc = chr(92) + 'n- 通过检查账簿' in content
print(f"Raw newlines in desc: {has_raw}")
print(f"Escaped newlines in desc: {has_esc}")
