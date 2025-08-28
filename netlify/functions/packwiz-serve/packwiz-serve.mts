import { Context } from "@netlify/functions";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the project root from this file's location.
 * In the published Lambda bundle Netlify preserves relative paths for
 * files listed in `included_files`, so going two levels up from
 * `netlify/functions/` lands at the repository root.
 */
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", );

export default async (request: Request, _context: Context) => {
  try {
    const url = new URL(request.url);

    // Path looks like: /.netlify/functions/packwiz-serve/<slug>
    const segments = url.pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1].toLowerCase();

    if (!slug || /[^a-zA-Z0-9-_]/.test(slug)) {
      return new Response("Bad slug", { status: 400 });
    }
    
    const filePath = path.join(PROJECT_ROOT, "modpacks", slug, "pack.toml");
    console.log(filePath)
    const toml = await readFile(filePath, "utf8");

    return new Response(toml, {
      status: 200,
      headers: {
        "Content-Type": "application/toml; charset=utf-8",
        // cache a bit at the edge; tweak as you like
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err: any) {
    // Return 404 if the pack doesn't exist; 500 for other problems
    if (err && (err.code === "ENOENT" || err.message?.includes("ENOENT"))) {
      return new Response("pack.toml not found for that slug", { status: 404 });
    }
    return new Response("Server error", { status: 500 });
  }
};
