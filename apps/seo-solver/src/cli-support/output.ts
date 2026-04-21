import { writeFile } from 'node:fs/promises';

export async function writeOutput(content: string, outputPath: string | undefined): Promise<void> {
  if (outputPath) {
    await writeFile(outputPath, content, 'utf-8');
    console.error(`Report written to ${outputPath}`);
    return;
  }

  process.stdout.write(content);

  if (!content.endsWith('\n')) {
    process.stdout.write('\n');
  }
}
