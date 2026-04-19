---
name: cfbed-uploader
description: Upload files to CloudFlare ImgBed (cfbed) via its upload API using a bundled bun script. Use when user wants to upload a file, image, or any asset to cfbed image hosting, mentions "上传到图床", "upload to cfbed", "cfbed upload", "图床上传", or wants to get a hosted URL for a local file. Also triggers when user provides a file path and asks to "host it", "get a link", or "上传文件".
---

# CloudFlare ImgBed File Uploader

Upload local files to CloudFlare ImgBed via its REST API and return the hosted URL. Uses a bundled bun script for uploading.

## API Overview

- **Endpoint**: `https://blog-cloudflare-imgbed.pages.dev/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Authentication**: via `Authorization` request header (Bearer Token or raw Token)

## Environment Configuration

The upload script reads credentials from a `.env` file. Create a `.env` file in the skill directory or project root with:

```
CFBED_API_TOKEN=your_api_token_here
```

The API Token can be obtained from the CloudFlare ImgBed admin panel: **管理界面 → 系统设置 → 安全设置 → API Token管理**.

## How to Upload

Use the bundled bun upload script located at `scripts/upload.ts` relative to this skill's directory:

```bash
bun run <skill-dir>/scripts/upload.ts <FILE_PATH> [options]
```

### Script Options

| Option | Description | Default |
|---|---|---|
| `<FILE_PATH>` | Path to the file to upload (required, positional) | — |
| `--env <path>` | Path to `.env` file | `.env` in current working directory |
| `--channel <name>` | Upload channel: `telegram`, `cfr2`, `s3`, `discord`, `huggingface` | `telegram` |
| `--channel-name <name>` | Specific channel name for multi-channel scenarios | — |
| `--return-format <fmt>` | Response link format: `default` or `full` | `full` |
| `--name-type <type>` | File naming: `default`, `index`, `origin`, `short` | `default` |
| `--folder <path>` | Upload directory (relative path, e.g. `img/test`) | — |
| `--no-compress` | Disable server-side compression | compression enabled |
| `--no-retry` | Disable auto-retry on failure | retry enabled |

### Response Format

The API returns a JSON array. The uploaded file URL is in `[0].src`:

```json
[
  {
    "src": "/file/abc123_image.jpg"
  }
]
```

When `returnFormat=default`, prepend `https://blog-cloudflare-imgbed.pages.dev` to get the full URL. When `returnFormat=full`, the `src` field is the complete URL.

## Workflow

1. **Confirm the file path** exists and is accessible.
2. **Locate the `.env` file** — check the project root or the skill directory. If no `.env` is found and no token is available, ask the user for their API Token.
3. **Run the upload script**: `bun run <skill-dir>/scripts/upload.ts <FILE_PATH>`
4. **Parse the output** and present the full URL to the user.
5. If the upload fails, report the error and suggest fixes (invalid token, file too large, network issue, etc.).

## Example

```bash
bun run cfbed-uploader/scripts/upload.ts /path/to/image.png
```

Output on success:

```
✅ Upload successful!
URL: https://blog-cloudflare-imgbed.pages.dev/file/abc123_image.png
```

## Notes

- The script defaults to `returnFormat=full` so the returned URL is directly usable.
- Always verify the file exists before attempting upload.
- The `.env` file should never be committed to version control — add it to `.gitignore`.
- Requires `bun` to be installed. If not available, fall back to running the equivalent `curl` command manually.
