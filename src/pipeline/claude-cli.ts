import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Runs a model call through Claude Code in non-interactive mode (`claude -p`), signed in
 * with your Claude Pro/Max account. Usage counts against your plan's limits (shared with
 * the Claude apps), not pay-as-you-go API billing.
 *
 * Isolation for a no-human, data-only call:
 *  - runs in an empty temp folder (only the screenshots for this call are in it)
 *  - --safe-mode: no CLAUDE.md, hooks, skills, plugins or MCP servers, but login still works
 *    (--bare would skip the subscription login, so it is NOT used)
 *  - --system-prompt-file replaces Claude Code's coding prompt with ours
 *  - --tools "" (or "Read" when there are screenshots), MCP tools denied, no prompts answered
 *  - ANTHROPIC_API_KEY is removed from the child's environment; if it were set,
 *    Claude Code would bill the API key instead of your plan
 */

export class UsageLimitError extends Error {}

export interface CliCall {
  system: string;
  prompt: string; // short instruction, passed as the -p argument
  stdin?: string; // the material, piped in (10 MB cap)
  schema: object; // JSON Schema for the answer
  images?: { mediaType: string; base64: string; label: string }[];
  model?: string;
  timeoutMs?: number;
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

export async function claudeCli<T>(call: CliCall): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "eas-ingest-"));
  try {
    const sysFile = path.join(dir, "system.txt");
    await writeFile(sysFile, call.system, "utf8");

    const imageNames: string[] = [];
    for (const [i, img] of (call.images ?? []).entries()) {
      const name = `image-${i + 1}.${EXT[img.mediaType] ?? "png"}`;
      await writeFile(path.join(dir, name), Buffer.from(img.base64, "base64"));
      imageNames.push(name);
    }
    const prompt = imageNames.length
      ? `${call.prompt}\n\nThe material also includes these images in the current folder; open each with the Read tool: ${imageNames.join(", ")}`
      : call.prompt;

    const args = [
      "-p", prompt,
      "--output-format", "json",
      "--json-schema", JSON.stringify(call.schema),
      "--system-prompt-file", sysFile,
      "--safe-mode",
      "--tools", imageNames.length ? "Read" : "",
      "--disallowedTools", "mcp__*",
      "--strict-mcp-config",
      "--permission-prompts", "none",
      "--no-session-persistence",
      "--max-turns", imageNames.length ? String(imageNames.length + 3) : "3",
      "--model", call.model ?? process.env.PIPELINE_CLI_MODEL ?? "sonnet",
    ];

    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // never fall back to API billing

    const out = await new Promise<string>((resolve, reject) => {
      const child = spawn(process.env.CLAUDE_BIN ?? "claude", args, { cwd: dir, env, stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGINT");
        reject(new Error("claude -p timed out"));
      }, call.timeoutMs ?? 5 * 60_000);
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("error", (e) =>
        reject(
          (e as NodeJS.ErrnoException).code === "ENOENT"
            ? new Error("Claude Code is not installed. Install it, then run `claude` once and sign in with your Claude account")
            : e,
        ),
      );
      child.on("close", () => {
        clearTimeout(timer);
        resolve(stdout || stderr);
      });
      child.stdin.end(call.stdin ?? "");
    });

    let res: { is_error?: boolean; result?: string; structured_output?: T; subtype?: string };
    try {
      res = JSON.parse(out);
    } catch {
      throw new Error(`claude -p returned non-JSON output: ${out.slice(0, 300)}`);
    }
    const text = `${res.result ?? ""} ${res.subtype ?? ""}`;
    if (/usage limit|rate limit|limit reached|5-hour|weekly limit|resets at/i.test(text) && res.is_error !== false && !res.structured_output)
      throw new UsageLimitError(res.result ?? "Plan usage limit reached");
    if (/not logged in|login|authenticat/i.test(text) && !res.structured_output)
      throw new Error("Claude Code is not signed in. Run `claude`, then /login with your Pro/Max account");
    if (!res.structured_output) throw new Error(`No structured answer: ${res.result?.slice(0, 300) ?? "empty"}`);
    return res.structured_output;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
