import { Context } from "@netlify/functions";
import { readFile, stat as statFile, readdir } from "node:fs/promises";
import path from "node:path";

const BUNDLE_ROOT = process.cwd(); // Usually /var/task
const MODPACKS_ROOT = path.join(BUNDLE_ROOT, "modpacks");

function isSafeSlug(s: string) {
  // enforce lowercase slugs in URLs to keep things simple
  return /^[a-z0-9-_]+$/.test(s);
}

function isTextFile(name: string) {
  return /\.(toml|txt|json|sha256)$/i.test(name);
}

function contentType(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".toml") return "text/plain; charset=utf-8";
  if (ext === ".txt" || ext === ".sha256") return "text/plain; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  if (ext === ".jar") return "application/java-archive";
  return "application/octet-stream";
}

function badRequest(msg = "Bad request") {
  return new Response(msg, { status: 400 });
}
function notFound(msg = "Not found") {
  return new Response(msg, { status: 404 });
}

// Debug helper: list a directory (1 level) to logs
async function listDirOnce(label: string, dir: string) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    console.log(`📂 ${label}: ${dir}`);
    for (const e of entries) {
      console.log("  ", e.isDirectory() ? `${e.name}/` : e.name);
    }
  } catch (err: any) {
    console.log(`(could not read ${dir}):`, err?.message || err);
  }
}

// Try to resolve a case-insensitive slug dir (if needed)
async function resolveSlugDir(slugLower: string): Promise<string | null> {
  try {
    const entries = await readdir(MODPACKS_ROOT, { withFileTypes: true });
    // 1) Prefer exact lower-case match
    const exact = entries.find((e) => e.isDirectory() && e.name === slugLower);
    if (exact) return path.join(MODPACKS_ROOT, exact.name);

    // 2) Fallback: look for a single directory whose lowercase equals the slug
    const ci = entries.filter((e) => e.isDirectory() && e.name.toLowerCase() === slugLower);
    if (ci.length === 1) {
      console.log(`⚠️  Using case-insensitive match for slug: ${ci[0].name}`);
      return path.join(MODPACKS_ROOT, ci[0].name);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default async (request: Request, _context: Context) => {
  try {
    const url = new URL(request.url);

    // Normalize path (support direct function hits and pretty URLs)
    let pathname = url.pathname.replace(/^\/\.netlify\/functions\/[^/]+/, "");
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 1) return badRequest("Missing slug");
    const slugLower = parts[0].toLowerCase();
    if (!isSafeSlug(slugLower)) return badRequest("Bad slug");

    // No directory listing at "/:slug"
    if (parts.length === 1) return notFound("No index for this path");

    const afterSlug = decodeURIComponent(parts.slice(1).join("/"));
    if (!afterSlug) return badRequest("Missing file");
    if (afterSlug.includes("..")) return badRequest("Invalid path");

    // --- DEBUG SURF ---
    // Show what's in /var/task/modpacks and /var/task/modpacks/<slugLower>
    await listDirOnce("modpacks root", MODPACKS_ROOT);
    await listDirOnce(`modpacks/${slugLower}`, path.join(MODPACKS_ROOT, slugLower));

    // Resolve the slug directory (exact lower-case, or case-insensitive single match)
    const slugDir =
      (await (async () => {
        const candidate = path.join(MODPACKS_ROOT, slugLower);
        try {
          const s = await statFile(candidate);
          if (s.isDirectory()) return candidate;
        } catch {}
        return null;
      })()) || (await resolveSlugDir(slugLower));

    if (!slugDir) {
      console.log(`❌ Could not find slug dir for "${slugLower}" under ${MODPACKS_ROOT}`);
      return notFound("Slug not found");
    }

    // Build final path and sandbox
    const requestedPath = path.normalize(path.join(slugDir, afterSlug));

    const slugDirSep = slugDir.endsWith(path.sep) ? slugDir : slugDir + path.sep;
    if (!requestedPath.startsWith(slugDirSep)) return badRequest("Invalid path");

    // Reject directory requests (no listing)
    const st = await statFile(requestedPath);
    if (!st.isFile()) return notFound("Not a file");

    const filename = path.basename(requestedPath);
    const mime = contentType(filename);
    const buf = await readFile(requestedPath);
    const body: BodyInit = isTextFile(filename) ? buf.toString("utf8") : new Uint8Array(buf);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err: any) {
    console.error("serve error:", err?.code || err?.message || err);
    if (err?.code === "ENOENT") return notFound("File not found");
    return new Response("Server error", { status: 500 });
  }
};
