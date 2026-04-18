import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const scriptPath = path.join(repoRoot, "skills", "baoyu-article-illustrator", "scripts", "build-batch.ts");

async function makeFixture(): Promise<{
  root: string;
  outlinePath: string;
  promptsDir: string;
  outputPath: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "baoyu-article-illustrator-build-batch-"));
  const outlinePath = path.join(root, "outline.md");
  const promptsDir = path.join(root, "prompts");
  const outputPath = path.join(root, "batch.json");

  await fs.mkdir(promptsDir, { recursive: true });
  await fs.writeFile(
    outlinePath,
    `## Illustration 1
**Position**: demo
**Purpose**: demo
**Visual Content**: demo
**Filename**: 01-demo.png
`,
  );
  await fs.writeFile(path.join(promptsDir, "01-demo.md"), "A demo prompt\n");

  return { root, outlinePath, promptsDir, outputPath };
}

async function runBuildBatch(args: string[]): Promise<void> {
  await execFileAsync(process.execPath, ["--import", "tsx", scriptPath, ...args], {
    cwd: repoRoot,
  });
}

test("build-batch omits default model so baoyu-imagine can resolve env or EXTEND defaults", async () => {
  const fixture = await makeFixture();

  await runBuildBatch([
    "--outline",
    fixture.outlinePath,
    "--prompts",
    fixture.promptsDir,
    "--output",
    fixture.outputPath,
  ]);

  const batch = JSON.parse(await fs.readFile(fixture.outputPath, "utf8")) as {
    tasks: Array<Record<string, unknown>>;
  };

  assert.equal(batch.tasks.length, 1);
  assert.equal(batch.tasks[0]?.provider, "replicate");
  assert.equal(Object.hasOwn(batch.tasks[0]!, "model"), false);
});

test("build-batch preserves explicit model overrides", async () => {
  const fixture = await makeFixture();

  await runBuildBatch([
    "--outline",
    fixture.outlinePath,
    "--prompts",
    fixture.promptsDir,
    "--output",
    fixture.outputPath,
    "--model",
    "acme/custom-model",
  ]);

  const batch = JSON.parse(await fs.readFile(fixture.outputPath, "utf8")) as {
    tasks: Array<Record<string, unknown>>;
  };

  assert.equal(batch.tasks[0]?.model, "acme/custom-model");
});
