import { Context } from "@netlify/functions";
import { readFile } from "node:fs/promises";
import path from "node:path";


const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

function isSafeSlug(s: string) {
  return /^[a-z0-9-_]+$/.test(s);
}

function isTextFile(name: string) {
  return /\.(toml|txt|json|sha256)$/i.test(name);
}

function contentType(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".toml") return "text/plain; charset=utf-8"; // display in browser
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
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 1) return badRequest();
    const slug = parts[0].toLowerCase();
    if (!isSafeSlug(slug)) return badRequest("Bad slug");

    // No directory listing: "/:slug" or "/:slug/" returns 404
    if (parts.length === 1) return notFound("No index for this path");

    const afterSlug = decodeURIComponent(parts.slice(1).join("/"));

    // Block traversal & weird paths
    if (!afterSlug || afterSlug.includes("..")) return badRequest();

    // Allowlist:
    // - pack.toml
    // - index.toml
    // - mods/<...> (must reference a file, not a directory)
    let relativeFile: string | null = null;
    if (afterSlug === "pack.toml" || afterSlug === "index.toml") {
      relativeFile = afterSlug;
    } else if (afterSlug.startsWith("mods/") && !afterSlug.endsWith("/")) {
      relativeFile = afterSlug;
    } else {
      return notFound();
    }

    const absPath = path.join(PROJECT_ROOT, "modpacks", slug, relativeFile);
    const filename = path.basename(relativeFile);
    const mime = contentType(filename);

    const buf = await readFile(absPath);

    // To satisfy BodyInit typing and display text in browser:
    const body: BodyInit = isTextFile(filename)
      ? buf.toString("utf8") // text types render inline in the browser
      : new Uint8Array(buf); // binary types

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err: any) {
    console.log(err);
    if (err?.code === "ENOENT") return notFound("File not found");
    return new Response("Server error", { status: 500 });
  }
};
