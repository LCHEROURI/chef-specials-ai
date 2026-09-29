const fs = require('fs');
const path = require('path');

const ciPath = path.resolve(__dirname, '../../../.github/workflows/ci.yml');
const content = fs.readFileSync(ciPath, 'utf8');

// Try requiring js-yaml or using npx
console.log('--- Testing JavaScript YAML parsers ---');
try {
  const yaml = require('js-yaml');
  const parsed = yaml.load(content);
  console.log('Parsed concurrency:', parsed.concurrency);
  console.log('cancel-in-progress value:', parsed.concurrency['cancel-in-progress'], 'type:', typeof parsed.concurrency['cancel-in-progress']);
  if (parsed.concurrency['cancel-in-progress'] !== true || typeof parsed.concurrency['cancel-in-progress'] !== 'boolean') {
    throw new Error('cancel-in-progress is not boolean true');
  }
  console.log('js-yaml successfully parsed cancel-in-progress as native boolean true.');
} catch (e) {
  console.error('js-yaml require error:', e.message);
  process.exit(1);
}
