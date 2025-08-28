import { Context } from "@netlify/functions";
import { readFile, readdir, stat as statFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd(); // points to /var/task inside the Lambda

function isSafeSlug(s: string) {
  return /^[a-z0-9-_]+$/.test(s);
}

function isTextFile(name: string) {
  return /\.(toml|txt|json|sha256)$/i.test(name);
}

function contentType(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".toml") return "text/plain; charset=utf-8"; // render in browser
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

export default async (request: Request, _context: Context) => {
  try {
    const url = new URL(request.url);

    // Strip a possible "/.netlify/functions/<name>" prefix so this works
    // whether reached directly or via redirect.
    let pathname = url.pathname.replace(/^\/\.netlify\/functions\/[^/]+/, "");
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 1) return badRequest("Missing slug");

    // Enforce lowercase slugs + lowercase directories on disk
    const slug = parts[0].toLowerCase();
    if (!isSafeSlug(slug)) return badRequest("Bad slug");

    // No directory listing at "/:slug" (or "/:slug/")
    if (parts.length === 1) return notFound("No index for this path");

    const afterSlug = decodeURIComponent(parts.slice(1).join("/"));
    if (!afterSlug) return badRequest("Missing file");
    if (afterSlug.includes("..")) return badRequest("Invalid path");

    // Resolve and sandbox the request under /modpacks/:slug
    const baseDir = path.join(PROJECT_ROOT, "modpacks", slug);
    const targetPath = path.normalize(path.join(baseDir, afterSlug));

    // Ensure the resolved path stays inside the slug directory
    const baseWithSep = baseDir.endsWith(path.sep) ? baseDir : baseDir + path.sep;
    if (!targetPath.startsWith(baseWithSep)) return badRequest("Invalid path");

    // Must be a file, not a directory
    const st = await statFile(targetPath);
    if (!st.isFile()) return notFound("Not a file");

    // Read + choose body type
    const filename = path.basename(targetPath);
    const mime = contentType(filename);
    const buf = await readFile(targetPath);
    const body: BodyInit = isTextFile(filename) ? buf.toString("utf8") : new Uint8Array(buf);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=300, s-maxage=300",
        // NO Content-Disposition → text renders inline in browser
      },
    });
  } catch (err: any) {
    // Helpful logs during debugging; safe to keep or remove
    console.log(err)
    // list what's in the relative directory to this process
    const dir = path.dirname(PROJECT_ROOT);
    const files = await readdir(dir);
    console.log("Files in directory:", files);
    if (err?.code === "ENOENT") return notFound("File not found");
    return new Response("Server error", { status: 500 });
  }
};
