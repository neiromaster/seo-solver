import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const packageJsonPath = new URL('../package.json', import.meta.url);
const backupPath = new URL('../package.json.bak', import.meta.url);

if (existsSync(backupPath)) {
  throw new Error('package.json.bak already exists — restore it before publishing again.');
}

copyFileSync(packageJsonPath, backupPath);
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

delete packageJson.dependencies;

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
