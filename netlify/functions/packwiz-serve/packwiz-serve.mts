// netlify/functions/packwiz-serve.mts
import { Context } from "@netlify/functions";
import { readFile, stat as statFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const MODPACKS = path.join(ROOT, "modpacks");

function isText(name: string) { return /\.(toml|txt|json|sha256)$/i.test(name); }
function mime(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".toml" || ext === ".txt" || ext === ".sha256" || ext === ".properties") return "text/plain; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  if (ext === ".jar") return "application/java-archive";
  return "application/octet-stream";
}

export default async (req: Request, _ctx: Context) => {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/^\/\.netlify\/functions\/[^/]+/, "");
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length < 2) return new Response("No index", { status: 404 });

  const slug = parts[0].toLowerCase();
  console.log(slug);
  if (!/^[a-z0-9-_]+$/.test(slug)) return new Response("Bad slug", { status: 400 });

  const rel = decodeURIComponent(parts.slice(1).join("/"));
  if (!rel || rel.includes("..")) return new Response("Invalid path", { status: 400 });

  const base = path.join(MODPACKS, slug);
  const abs = path.normalize(path.join(base, rel));
  if (!abs.startsWith(base + path.sep)) return new Response("Invalid path", { status: 400 });
  console.log(abs);
  const st = await statFile(abs).catch(() => null);
  if (!st || !st.isFile()) return new Response("Not found", { status: 404 });

  const name = path.basename(abs);
  const data = await readFile(abs);
  const body: BodyInit = isText(name) ? data.toString("utf8") : new Uint8Array(data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": mime(name),
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
};
