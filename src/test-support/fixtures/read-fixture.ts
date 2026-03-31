export async function readFixture(name: string): Promise<string> {
  return Bun.file(new URL(`./${name}`, import.meta.url)).text();
}
