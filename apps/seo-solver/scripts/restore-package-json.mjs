import { copyFileSync, existsSync, rmSync } from 'node:fs';

const packageJsonPath = new URL('../package.json', import.meta.url);
const backupPath = new URL('../package.json.bak', import.meta.url);

if (!existsSync(backupPath)) {
  process.exit(0);
}

copyFileSync(backupPath, packageJsonPath);
rmSync(backupPath);
