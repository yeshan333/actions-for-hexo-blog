import { parseArgs } from "util";
import { resolve, basename } from "path";
import { existsSync, readFileSync } from "fs";

const BASE_URL = "https://blog-cloudflare-imgbed.pages.dev";

interface UploadResponse {
  src: string;
}

function loadEnv(envPath: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  if (!existsSync(envPath)) {
    return envVars;
  }
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
  return envVars;
}

function printUsage(): void {
  console.log(`
Usage: bun run upload.ts <FILE_PATH> [options]

Options:
  --env <path>            Path to .env file (default: .env in cwd)
  --channel <name>        Upload channel: telegram, cfr2, s3, discord, huggingface (default: telegram)
  --channel-name <name>   Specific channel name for multi-channel scenarios
  --return-format <fmt>   Response link format: default, full (default: full)
  --name-type <type>      File naming: default, index, origin, short (default: default)
  --folder <path>         Upload directory (relative path)
  --no-compress           Disable server-side compression
  --no-retry              Disable auto-retry on failure
  --help                  Show this help message
`);
}

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    env: { type: "string", default: "" },
    channel: { type: "string", default: "telegram" },
    "channel-name": { type: "string", default: "" },
    "return-format": { type: "string", default: "full" },
    "name-type": { type: "string", default: "default" },
    folder: { type: "string", default: "" },
    "no-compress": { type: "boolean", default: false },
    "no-retry": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

if (values.help || positionals.length === 0) {
  printUsage();
  process.exit(values.help ? 0 : 1);
}

const filePath = resolve(positionals[0]);

if (!existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const envPath = values.env || resolve(process.cwd(), ".env");
const envVars = loadEnv(envPath);
const apiToken = envVars.CFBED_API_TOKEN || process.env.CFBED_API_TOKEN || "";

if (!apiToken) {
  console.error("❌ No API token found. Set CFBED_API_TOKEN in your .env file or environment.");
  console.error(`   Looked for .env at: ${envPath}`);
  process.exit(1);
}

const queryParams = new URLSearchParams();
queryParams.set("returnFormat", values["return-format"]!);
queryParams.set("uploadChannel", values.channel!);
queryParams.set("uploadNameType", values["name-type"]!);

if (values["channel-name"]) {
  queryParams.set("channelName", values["channel-name"]);
}
if (values.folder) {
  queryParams.set("uploadFolder", values.folder);
}
if (values["no-compress"]) {
  queryParams.set("serverCompress", "false");
}
if (values["no-retry"]) {
  queryParams.set("autoRetry", "false");
}

const uploadUrl = `${BASE_URL}/upload?${queryParams.toString()}`;

const file = Bun.file(filePath);
const formData = new FormData();
formData.append("file", file, basename(filePath));

console.log(`📤 Uploading: ${filePath}`);
console.log(`   → ${uploadUrl}`);

try {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Upload failed (HTTP ${response.status}): ${errorText}`);
    process.exit(1);
  }

  const result = (await response.json()) as UploadResponse[];

  if (!Array.isArray(result) || result.length === 0 || !result[0].src) {
    console.error("❌ Unexpected response format:", JSON.stringify(result));
    process.exit(1);
  }

  const fileUrl = result[0].src.startsWith("http") ? result[0].src : `${BASE_URL}${result[0].src}`;

  console.log(`\n✅ Upload successful!`);
  console.log(`URL: ${fileUrl}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`❌ Upload failed: ${errorMessage}`);
  process.exit(1);
}
