import { diffCommand, validateCommand } from './commands';

const args = process.argv.slice(2);

const KNOWN_FLAGS = new Set(['--vscode', '-v', '--curl', '-c', '--og', '-o', '--validate', '-V']);
const unknownFlags = args.filter((a) => a.startsWith('-') && !KNOWN_FLAGS.has(a));
if (unknownFlags.length > 0) {
  console.error(`Unknown flag(s): ${unknownFlags.join(', ')}`);
  console.error('Known flags: --vscode (-v), --curl (-c), --og (-o), --validate (-V)');
  process.exit(1);
}

const vscodeDiff = args.includes('--vscode') || args.includes('-v');
const useCurl = args.includes('--curl') || args.includes('-c');
const useOg = args.includes('--og') || args.includes('-o');
const useValidate = args.includes('--validate') || args.includes('-V');
const urls = args.filter((a) => !a.startsWith('-'));
const [url1, url2] = urls;

if (useValidate) {
  if (!url1 || url2) {
    console.error('Validation mode requires exactly one URL');
    console.error('Usage: seo-solver <url> --validate|-V [--curl|-c]');
    process.exit(1);
  }
  await validateCommand(url1, { useCurl, useOg });
} else {
  if (!url1 || !url2) {
    console.error('Usage: seo-solver <url1> <url2> [--vscode|-v] [--curl|-c] [--og|-o]');
    process.exit(1);
  }
  await diffCommand(url1, url2, { useCurl, useOg, vscodeDiff });
}
