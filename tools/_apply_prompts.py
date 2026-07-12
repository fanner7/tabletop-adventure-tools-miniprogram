import openpyxl, re, json

# 1. Load Excel prompts
wb = openpyxl.load_workbook('tools/COC7空白卡CY2lusFinal (1).xlsx')
ws = wb['人物卡']
prompt_map = {}
for dv in ws.data_validations.dataValidation:
    if dv.prompt and str(dv.sqref):
        first_cell = str(dv.sqref).split(':')[0].replace('$', '')
        prompt_map[first_cell] = dv.prompt.strip()

# 2. Cell -> base skill name
cell_to_base = {
    'F16': '会计', 'F17': '人类学', 'F18': '估价', 'F19': '考古学',
    'AB35': '侦查', 'AB18': '聆听', 'AB40': '追踪', 'AB17': '图书馆使用',
    'F25': '计算机使用', 'F26': '信用评级', 'F27': '克苏鲁神话',
    'AB19': '锁匠', 'AB34': '妙手', 'AB23': '导航', 'F33': '话术',
    'AB26': '说服', 'F44': '恐吓', 'F23': '取悦', 'F28': '乔装',
    'AB29': '心理学',
    'F34': '格斗', 'F38': '射击',
    'AB39': '投掷', 'F29': '闪避', 'F24': '攀爬', 'F45': '跳跃',
    'AB38': '游泳', 'AB36': '潜行',
    'F30': '驾驶', 'AB27': '驾驶',
    'AB30': '骑术', 'F42': '急救', 'AB21': '医学', 'AB28': '精神分析',
    'F20': '技艺', 'F21': '技艺',
    'F31': '电气维修', 'F32': '电子学', 'AB16': '法律', 'F43': '历史',
    'F46': '外语', 'F49': '母语', 'AB20': '机械维修', 'AB22': '博物学',
    'AB24': '神秘学', 'AB25': '操作重型机械',
    'AB31': '科学',
    'AB45': '催眠', 'AB44': '读唇', 'AB43': '爆破', 'AB42': '潜水',
    'AB41': '动物驯养', 'AB46': '炮术',
}

# 3. Multi-slot expansion
multi = {
    '格斗': ['格斗①','格斗②','格斗③'],
    '射击': ['射击①','射击②','射击③'],
    '技艺': ['技艺①','技艺②','技艺③'],
    '外语': ['外语①','外语②','外语③'],
    '驾驶': ['驾驶①'],
    '科学': ['科学'],
}

base_to_prompt = {}
for cell, base in cell_to_base.items():
    if cell in prompt_map:
        p = prompt_map[cell]
        p = p.replace('_x000a_', '\\n')
        p = p.strip()
        if p.startswith('- '):
            p = p[2:]
        # Escape for JS single-quoted string
        p = p.replace('\\', '\\\\')
        p = p.replace("'", "\\'")
        p = p.replace('\n', '\\n')
        base_to_prompt[base] = p

# Expand multi-slot
full_prompts = {}
for base, names in multi.items():
    if base in base_to_prompt:
        for name in names:
            full_prompts[name] = base_to_prompt[base]
for base, prompt in base_to_prompt.items():
    if base not in multi:
        full_prompts[base] = prompt

# 4. Read current JS file and extract ALL_SKILLS entries
with open('pages/coc7-gen/coc7-gen.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Find ALL_SKILLS block
start = code.find('const ALL_SKILLS = [')
end = code.find('];', start) + 2

# Parse current skills to get their structure (keep everything except desc)
skills_block = code[start:end]

# For each skill in the block, replace desc with the new prompt
def replacer(m):
    name = m.group(1)
    rest_before_desc = m.group(2)
    old_desc = m.group(3)
    rest_after = m.group(4)
    if name in full_prompts:
        return f"{{ name: '{name}'{rest_before_desc}desc: '{full_prompts[name]}'{rest_after}"
    return m.group(0)

new_block = re.sub(
    r"\{ name: '([^']+)'(.*?)desc: '([^']*)'(\s*[,\}])",
    replacer,
    skills_block,
    flags=re.DOTALL
)

code = code[:start] + new_block + code[end:]

with open('pages/coc7-gen/coc7-gen.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Print stats
replaced_count = 0
for name in full_prompts:
    if re.search(rf"name: '{re.escape(name)}'.*?desc: '.+?'", new_block, re.DOTALL):
        replaced_count += 1
print(f'Replaced {replaced_count} skill descriptions')
