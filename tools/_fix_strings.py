with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
fixed_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.rstrip()
    
    # Check if this line has an unclosed single-quote string
    # (odd number of single quotes, not counting escaped quotes)
    quotes = 0
    j = 0
    while j < len(stripped):
        if stripped[j] == '\\':
            j += 2
            continue
        if stripped[j] == "'":
            quotes += 1
        j += 1
    
    if quotes % 2 == 1 and i + 1 < len(lines):
        # Unclosed string - merge with next line
        next_line = lines[i + 1]
        merged = line + '\\n' + next_line
        # Continue checking if MORE lines need merging
        i += 1
        while i + 1 < len(lines):
            # Count quotes in current merged state
            q = 0
            k = 0
            while k < len(merged.rstrip()):
                if merged.rstrip()[k] == '\\':
                    k += 2
                    continue
                if merged.rstrip()[k] == "'":
                    q += 1
                k += 1
            if q % 2 == 1:
                # Still unclosed
                i += 1
                merged = merged + '\\n' + lines[i]
            else:
                break
        fixed_lines.append(merged)
        i += 1
    else:
        fixed_lines.append(line)
    i += 1

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(fixed_lines))

print(f'Fixed: {len(content.splitlines())} -> {len(fixed_lines)} lines')
