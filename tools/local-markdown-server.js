const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");
const dataDir = path.join(rootDir, "data");
const port = Number(process.env.PORT || 8787);

const dataFiles = {
  map: {
    file: "map.md",
    title: "Map Data",
    fallback: { palette: null, cells: {} }
  },
  spells: {
    file: "spells.md",
    title: "Spell Data",
    fallback: []
  },
  dictionary: {
    file: "dictionary.md",
    title: "Dictionary Data",
    fallback: {}
  }
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
  await Promise.all(Object.entries(dataFiles).map(async ([key, config]) => {
    const filePath = path.join(dataDir, config.file);
    try {
      await fs.access(filePath);
    } catch {
      await writeMarkdownData(key, config.fallback);
    }
  }));
}

function markdownFor(title, data) {
  return `# ${title}\n\nThis file is written by tools/local-markdown-server.js.\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
}

function parseMarkdownData(markdown, fallback) {
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) return fallback;
  return JSON.parse(match[1]);
}

async function readMarkdownData(key) {
  const config = dataFiles[key];
  if (!config) throw new Error("Unknown data key");
  const filePath = path.join(dataDir, config.file);
  const text = await fs.readFile(filePath, "utf8");
  return parseMarkdownData(text, config.fallback);
}

async function writeMarkdownData(key, data) {
  const config = dataFiles[key];
  if (!config) throw new Error("Unknown data key");
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, config.file);
  await fs.writeFile(filePath, markdownFor(config.title, data), "utf8");
}

function sendJson(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) reject(new Error("Request body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/Caerland.html";
  const requested = path.normalize(path.join(appDir, pathname));
  if (!requested.startsWith(appDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(requested);
    const filePath = stat.isDirectory() ? path.join(requested, "index.html") : requested;
    const ext = path.extname(filePath).toLowerCase();
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function handleApi(req, res, key) {
  if (!dataFiles[key]) {
    sendJson(res, 404, { error: "Unknown data key" });
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, await readMarkdownData(key));
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const data = JSON.parse(body || "null");
    await writeMarkdownData(key, data);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function main() {
  await ensureDataDir();
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const apiMatch = url.pathname.match(/^\/api\/data\/([a-z]+)$/);
      if (apiMatch) {
        await handleApi(req, res, apiMatch[1]);
        return;
      }
      await serveStatic(req, res, url);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Caerland local server: http://127.0.0.1:${port}/`);
    console.log(`Markdown data folder: ${dataDir}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
