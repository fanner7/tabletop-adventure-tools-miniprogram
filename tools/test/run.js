// tools/test/run.js — 测试入口：node tools/test/run.js（或 npm test）
const testFiles = [
  './coc7-gen.test.js',
  './data-integrity.test.js',
  './static.test.js',
];

const start = Date.now();
let failed = 0;
for (const f of testFiles) {
  try {
    const mod = require(f);
    failed += mod.run();
  } catch (e) {
    failed++;
    console.error('测试文件崩溃: ' + f);
    console.error(e && e.stack ? e.stack : e);
  }
}
const ms = Date.now() - start;
console.log('');
if (failed) {
  console.error('✗ 测试未通过（' + failed + ' 处失败，' + ms + 'ms）');
  process.exit(1);
} else {
  console.log('✓ 全部测试通过（' + ms + 'ms）');
}
