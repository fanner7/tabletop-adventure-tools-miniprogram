import re

with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Approach: 
# 1. Find all desc: '...' and usage: '...' strings  
# 2. Replace raw newlines inside them with PLACEHOLDER
# 3. Then replace ALL literal \n (outside strings) with actual newlines
# 4. Restore placeholders to \n

# But we need the ORIGINAL file, not the corrupted one.
# The current file has literal \n (two chars) everywhere.
# 
# Better: process the file as a single string:
# - Inside desc/usage strings, raw newlines → \n (escape)
# - Outside strings, literal \n (two chars) → actual newline
# - Outside strings, raw newlines stay as-is

# State machine with proper handling
PLACEHOLDER = '\x00ESCN\x00'
PLACEHOLDER_NL = '\x00NL\x00'

def fix_file(text):
    result = []
    i = 0
    in_single = False
    in_desc_or_usage = False
    desc_start = 0
    
    while i < len(text):
        ch = text[i]
        
        if not in_single:
            # Check for desc: ' or usage: '
            if not in_desc_or_usage:
                for prefix in ["desc: '", "usage: '"]:
                    if text[i:i+len(prefix)] == prefix:
                        in_desc_or_usage = True
                        desc_start = i
                        break
            
            if ch == "'":
                in_single = True
            elif ch == '\\' and i + 1 < len(text) and text[i + 1] == 'n':
                # literal \n outside string → actual newline
                result.append('\n')
                i += 2
                continue
            
            result.append(ch)
        else:
            # Inside string
            if ch == '\\':
                result.append(ch)
                i += 1
                if i < len(text):
                    result.append(text[i])
            elif ch == '\n':
                # Raw newline inside string → escaping needed
                result.append('\\n')
            elif ch == "'":
                in_single = False
                if in_desc_or_usage:
                    # Check if this closing quote is for desc/usage
                    # It should be followed by } or ,
                    after = text[i+1:i+5].strip()
                    in_desc_or_usage = False
                result.append(ch)
            else:
                result.append(ch)
        i += 1
    
    return ''.join(result)

fixed = fix_file(content)

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(fixed)

print(f'Lines: {len(fixed.splitlines())}')
