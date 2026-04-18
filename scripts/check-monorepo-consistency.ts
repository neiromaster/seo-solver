import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const repoRoot = process.cwd();
const workspaceCondition = '@seo-solver/source';
const cliPackageDir = 'apps/seo-solver';
const privatePackageDirs = new Set(['packages/typescript-config']);

type PackageInfo = {
  dir: string;
  path: string;
  manifest: Record<string, unknown>;
};

type TsConfig = {
  extends?: string;
  compilerOptions?: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
  references?: Array<{ path?: string }>;
};

async function main(): Promise<void> {
  const errors: string[] = [];
  const workspacePackages = await getWorkspacePackages();
  const publishablePackages = workspacePackages.filter(
    (pkg) => pkg.dir.startsWith('packages/') && pkg.manifest.private !== true,
  );
  const tsconfigFiles = (await getFilesByName(repoRoot, 'tsconfig.json')).filter(
    (file) =>
      file.startsWith('apps/') ||
      file.startsWith('packages/') ||
      file === 'tsconfig.json' ||
      file === 'tsconfig.test.json',
  );
  const tsconfigBuildFiles = await getFilesByName(repoRoot, 'tsconfig.build.json');
  const tsupConfigs = await getFilesByName(repoRoot, 'tsup.config.ts');
  const tsdownConfigs = await getFilesByName(repoRoot, 'tsdown.config.ts');

  validateNoTsupConfigs(tsupConfigs, errors);
  validateTsdownCoverage(publishablePackages, tsdownConfigs, errors);

  await validateRootTsconfigReferences(publishablePackages, errors);
  await validateBuildConfigs(publishablePackages, tsconfigBuildFiles, errors);
  await validateNoPathsInTsconfigs(tsconfigFiles.concat(tsconfigBuildFiles), errors);

  for (const pkg of workspacePackages) {
    validateMetadataBaseline(pkg, errors);
    if (pkg.dir.startsWith('packages/') && pkg.manifest.private !== true) {
      validatePackageExports(pkg, errors);
    }
  }

  await validateCliPublicationContract(errors);
  await validateChangesetsContract(errors);
  validatePrivateHelpers(workspacePackages, errors);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Monorepo consistency check passed.');
}

function validateNoTsupConfigs(tsupConfigs: string[], errors: string[]): void {
  for (const file of tsupConfigs) {
    errors.push(`${file}: tsup config must be removed after the tsdown cutover.`);
  }
}

function validateTsdownCoverage(publishablePackages: PackageInfo[], tsdownConfigs: string[], errors: string[]): void {
  const expected = new Set<string>([
    ...publishablePackages.map((pkg) => `${pkg.dir}/tsdown.config.ts`),
    `${cliPackageDir}/tsdown.config.ts`,
  ]);
  const actual = new Set(tsdownConfigs);

  for (const file of expected) {
    if (!actual.has(file)) {
      errors.push(`${file}: tsdown config is required for every publishable package and the CLI app.`);
    }
  }
}

async function validateRootTsconfigReferences(publishablePackages: PackageInfo[], errors: string[]): Promise<void> {
  const root = (await readJson('tsconfig.json')) as TsConfig;
  const actualReferences = new Set((root.references ?? []).map((entry) => entry.path).filter(isString));
  const expectedReferences = new Set(publishablePackages.map((pkg) => `./${pkg.dir}/tsconfig.build.json`));

  for (const expected of expectedReferences) {
    if (!actualReferences.has(expected)) {
      errors.push(`tsconfig.json: missing root build reference ${expected}.`);
    }
  }

  for (const actual of actualReferences) {
    if (!expectedReferences.has(actual)) {
      errors.push(`tsconfig.json: unexpected root build reference ${actual}.`);
    }
  }
}

async function validateBuildConfigs(
  publishablePackages: PackageInfo[],
  tsconfigBuildFiles: string[],
  errors: string[],
): Promise<void> {
  const buildFiles = new Set(tsconfigBuildFiles);
  const parsedBuildConfigs = new Map<string, TsConfig>();

  await Promise.all(
    publishablePackages
      .map((pkg) => `${pkg.dir}/tsconfig.build.json`)
      .filter((relPath) => buildFiles.has(relPath))
      .map(async (relPath) => {
        parsedBuildConfigs.set(relPath, (await readJson(relPath)) as TsConfig);
      }),
  );

  for (const pkg of publishablePackages) {
    const relPath = `${pkg.dir}/tsconfig.build.json`;
    if (!buildFiles.has(relPath)) {
      errors.push(`${relPath}: publishable package is missing tsconfig.build.json.`);
      continue;
    }

    const parsed = parsedBuildConfigs.get(relPath) as TsConfig;
    const compilerOptions = parsed.compilerOptions ?? {};
    const include = parsed.include ?? [];

    if (compilerOptions.composite !== true) {
      errors.push(`${relPath}: compilerOptions.composite must be true.`);
    }
    if (compilerOptions.emitDeclarationOnly !== true) {
      errors.push(`${relPath}: compilerOptions.emitDeclarationOnly must be true.`);
    }
    if (compilerOptions.noEmit !== false) {
      errors.push(`${relPath}: compilerOptions.noEmit must be false.`);
    }
    if (!include.every((value) => value.startsWith('src/'))) {
      errors.push(`${relPath}: include must be narrowed to src/** only.`);
    }
  }
}

async function validateNoPathsInTsconfigs(tsconfigFiles: string[], errors: string[]): Promise<void> {
  const parsedTsconfigs = await Promise.all(
    tsconfigFiles.map(async (file) => ({
      file,
      parsed: (await readJson(file)) as TsConfig,
    })),
  );

  for (const { file, parsed } of parsedTsconfigs) {
    const compilerOptions = parsed.compilerOptions ?? {};
    if ('paths' in compilerOptions) {
      errors.push(`${file}: compilerOptions.paths must not be present after the customConditions cutover.`);
    }
  }
}

function validateMetadataBaseline(pkg: PackageInfo, errors: string[]): void {
  if (privatePackageDirs.has(pkg.dir)) {
    return;
  }

  const requiredFields = ['description', 'license', 'repository', 'bugs', 'homepage'];
  for (const field of requiredFields) {
    if (!(field in pkg.manifest)) {
      errors.push(`${pkg.path}: missing required publish metadata field '${field}'.`);
    }
  }
}

function validatePackageExports(pkg: PackageInfo, errors: string[]): void {
  const exportsField = pkg.manifest.exports;
  if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) {
    errors.push(`${pkg.path}: publishable package must define exports.`);
    return;
  }

  const entries = Object.entries(exportsField as Record<string, unknown>);
  for (const [subpath, definition] of entries) {
    if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
      errors.push(`${pkg.path}: export '${subpath}' must use an object export map.`);
      continue;
    }

    const keys = Object.keys(definition as Record<string, unknown>);
    if (keys[0] !== workspaceCondition) {
      errors.push(`${pkg.path}: export '${subpath}' must list ${workspaceCondition} as the first condition.`);
    }
  }
}

async function validateCliPublicationContract(errors: string[]): Promise<void> {
  const manifest = (await readJson(`${cliPackageDir}/package.json`)) as Record<string, unknown>;
  const scripts = asRecord(manifest.scripts);
  const dependencies = asRecord(manifest.dependencies);
  const peerDependencies = asRecord(manifest.peerDependencies);
  const peerDependenciesMeta = asRecord(manifest.peerDependenciesMeta);
  const devDependencies = asRecord(manifest.devDependencies);
  const tsdownConfig = await readText(`${cliPackageDir}/tsdown.config.ts`);
  const sourceFiles = await getFilesByExtension(join(repoRoot, cliPackageDir, 'src'), new Set(['.ts', '.tsx']));
  const importedSpecifiers = new Set<string>();

  const runtimeSourceFiles = sourceFiles
    .map((file) => ({ file, relPath: relative(repoRoot, file) }))
    .filter(({ relPath }) => !/\.test\.[cm]?tsx?$/.test(relPath) && !/\.spec\.[cm]?tsx?$/.test(relPath));
  const sourceContents = await Promise.all(
    runtimeSourceFiles.map(async ({ relPath }) => ({ relPath, content: await readText(relPath) })),
  );

  for (const { relPath, content } of sourceContents) {
    for (const specifier of extractImportSpecifiers(content)) {
      if (!specifier.startsWith('.') && !specifier.startsWith('node:')) {
        importedSpecifiers.add(specifier);
      }
    }

    if (content.match(/import\s+[^'";]+from\s+['"]@seo-solver\/fetch-playwright['"]/)) {
      errors.push(`${relPath}: @seo-solver/fetch-playwright must only be loaded via dynamic import().`);
    }
  }

  const workspaceImports = [...importedSpecifiers]
    .filter((specifier) => specifier.startsWith('@seo-solver/'))
    .map(toPackageName);
  const runtimeWorkspaceImports = new Set(workspaceImports.filter((pkg) => pkg !== '@seo-solver/fetch-playwright'));
  const thirdPartyImports = new Set(
    [...importedSpecifiers].filter((specifier) => !specifier.startsWith('@seo-solver/')).map(toPackageName),
  );

  for (const pkg of runtimeWorkspaceImports) {
    if (dependencies[pkg] !== 'workspace:^') {
      errors.push(`${cliPackageDir}/package.json: ${pkg} must be in dependencies with workspace:^.`);
    }
  }

  for (const pkg of thirdPartyImports) {
    if (!(pkg in dependencies)) {
      errors.push(
        `${cliPackageDir}/package.json: third-party runtime dependency ${pkg} must be listed in dependencies.`,
      );
    }
    if (!tsdownConfig.includes(`'${pkg}'`) && !tsdownConfig.includes(`"${pkg}"`)) {
      errors.push(`${cliPackageDir}/tsdown.config.ts: deps.alwaysBundle and deps.onlyBundle must include ${pkg}.`);
    }
  }

  if (peerDependencies['@seo-solver/fetch-playwright'] !== 'workspace:^') {
    errors.push(
      `${cliPackageDir}/package.json: @seo-solver/fetch-playwright must be an optional peerDependency with workspace:^.`,
    );
  }
  if ((asRecord(peerDependenciesMeta['@seo-solver/fetch-playwright'] ?? {}).optional as boolean | undefined) !== true) {
    errors.push(`${cliPackageDir}/package.json: @seo-solver/fetch-playwright peer dependency must be marked optional.`);
  }
  if (devDependencies['@seo-solver/fetch-playwright'] !== 'workspace:*') {
    errors.push(
      `${cliPackageDir}/package.json: @seo-solver/fetch-playwright must be mirrored in devDependencies with workspace:*.`,
    );
  }
  if (!tsdownConfig.includes('@seo-solver\\/(?!fetch-playwright$)')) {
    errors.push(
      `${cliPackageDir}/tsdown.config.ts: deps.alwaysBundle and deps.onlyBundle must include the workspace-package regex.`,
    );
  }
  if (
    !tsdownConfig.includes("'@seo-solver/fetch-playwright'") &&
    !tsdownConfig.includes('"@seo-solver/fetch-playwright"')
  ) {
    errors.push(`${cliPackageDir}/tsdown.config.ts: deps.neverBundle must include @seo-solver/fetch-playwright.`);
  }
  if (!tsdownConfig.includes('banner: {') || !tsdownConfig.includes("js: '#!/usr/bin/env node'")) {
    errors.push(`${cliPackageDir}/tsdown.config.ts: banner must be configured at the top level for the CLI shebang.`);
  }

  if (scripts.prepublishOnly !== 'pnpm run build && node scripts/strip-bundled-deps.mjs') {
    errors.push(`${cliPackageDir}/package.json: scripts.prepublishOnly must build then strip bundled dependencies.`);
  }
  if (scripts.postpublish !== 'node scripts/restore-package-json.mjs') {
    errors.push(`${cliPackageDir}/package.json: scripts.postpublish must restore package.json.`);
  }

  if (!(await exists(join(repoRoot, cliPackageDir, 'scripts/strip-bundled-deps.mjs')))) {
    errors.push(`${cliPackageDir}/scripts/strip-bundled-deps.mjs: required publish helper is missing.`);
  }
  if (!(await exists(join(repoRoot, cliPackageDir, 'scripts/restore-package-json.mjs')))) {
    errors.push(`${cliPackageDir}/scripts/restore-package-json.mjs: required publish helper is missing.`);
  }
}

async function validateChangesetsContract(errors: string[]): Promise<void> {
  const config = (await readJson('.changeset/config.json')) as Record<string, unknown>;
  if (config.updateInternalDependencies !== 'patch') {
    errors.push(`.changeset/config.json: updateInternalDependencies must be 'patch'.`);
  }
  if (config.bumpVersionsWithWorkspaceProtocolOnly !== true) {
    errors.push(`.changeset/config.json: bumpVersionsWithWorkspaceProtocolOnly must be true.`);
  }
}

function validatePrivateHelpers(workspacePackages: PackageInfo[], errors: string[]): void {
  for (const pkg of workspacePackages) {
    if (privatePackageDirs.has(pkg.dir) && pkg.manifest.private !== true) {
      errors.push(`${pkg.path}: internal helper package must remain private.`);
    }
  }
}

async function getWorkspacePackages(): Promise<PackageInfo[]> {
  const packageGroups = await Promise.all(
    ['apps', 'packages'].map(async (root) => {
      const rootPath = join(repoRoot, root);
      if (!(await exists(rootPath))) {
        return [] as PackageInfo[];
      }

      const entries = await readdir(rootPath, { withFileTypes: true });
      const manifests = await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => {
            const manifestPath = join(rootPath, entry.name, 'package.json');
            if (!(await exists(manifestPath))) {
              return null;
            }

            return {
              dir: relative(repoRoot, join(rootPath, entry.name)),
              path: relative(repoRoot, manifestPath),
              manifest: JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>,
            } satisfies PackageInfo;
          }),
      );

      return manifests.filter((manifest): manifest is PackageInfo => manifest !== null);
    }),
  );

  return packageGroups.flat();
}

async function getFilesByName(root: string, fileName: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nestedResults = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(root, entry.name);
      const relPath = relative(repoRoot, fullPath);
      if (entry.isDirectory()) {
        if (shouldSkipDirectory(relPath)) {
          return [] as string[];
        }

        return await getFilesByName(fullPath, fileName);
      }

      return entry.name === fileName ? [relPath] : [];
    }),
  );

  return nestedResults.flat().sort();
}

async function getFilesByExtension(root: string, extensions: Set<string>): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nestedResults = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(root, entry.name);
      if (entry.isDirectory()) {
        const relPath = relative(repoRoot, fullPath);
        if (shouldSkipDirectory(relPath)) {
          return [] as string[];
        }

        return await getFilesByExtension(fullPath, extensions);
      }

      const extension = entry.name.slice(entry.name.lastIndexOf('.'));
      return extensions.has(extension) ? [fullPath] : [];
    }),
  );

  return nestedResults.flat().sort();
}

function shouldSkipDirectory(relPath: string): boolean {
  return (
    relPath === 'node_modules' ||
    relPath.endsWith('/node_modules') ||
    relPath === 'dist' ||
    relPath.endsWith('/dist') ||
    relPath.startsWith('.git')
  );
}

function extractImportSpecifiers(content: string): string[] {
  const matches = Array.from(
    content.matchAll(
      /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?from\s+)?['"]([^'"]+)['"]|import\((?:'|")([^'"]+)(?:'|")\)/g,
    ),
  );

  return matches.map((match) => match[1] ?? match[2]).filter(isString);
}

function toPackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return `${scope}/${name}`;
  }
  return specifier.split('/')[0] ?? specifier;
}

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, string>;
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

async function readJson(relPath: string): Promise<unknown> {
  return JSON.parse(await readText(relPath));
}

async function readText(relPath: string): Promise<string> {
  return await readFile(join(repoRoot, relPath), 'utf8');
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

void main();
