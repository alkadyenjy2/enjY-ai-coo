import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('main entry mounts AppRoot into the root element and guards missing root', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/main.tsx'), 'utf8');

  assert.match(source, /function AppRoot\(\)\s*\{\s*return <App\s*\/>;\s*\}/s);
  assert.match(source, /const rootElement = document\.getElementById\(['"]root['"]\);/);
  assert.match(source, /if \(!rootElement\)\s*\{\s*throw new Error\(['"]JARVIS application root element was not found\.['"]\);\s*\}/s);
  assert.match(source, /createRoot\(rootElement\)\.render\(\s*<StrictMode>\s*<AppRoot\s*\/>\s*<\/StrictMode>,?\s*\)/s);
});
