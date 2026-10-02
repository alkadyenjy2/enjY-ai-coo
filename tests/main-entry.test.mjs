import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('main entry mounts AppRoot into the root element', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/main.tsx'), 'utf8');

  assert.match(source, /createRoot\(document\.getElementById\(['"]root['"]\)!\)\.render\(\s*<StrictMode>\s*<AppRoot\s*\/?>\s*<\/StrictMode>\s*\)/s);
});
