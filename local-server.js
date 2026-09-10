const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers,
  });
  response.end(body);
}

function resolveSafePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const absolute = path.resolve(root, `.${normalized}`);
  if (!absolute.startsWith(root)) return null;
  return absolute;
}

function isWritableTarget(absolutePath) {
  const relative = path.relative(root, absolutePath).replace(/\\/g, "/");
  return relative === "content/articles.json" || relative.startsWith("assets/articles/");
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function handlePut(request, response, absolutePath) {
  if (!isWritableTarget(absolutePath)) {
    send(response, 403, "Forbidden writable path");
    return;
  }

  const body = await collectBody(request);

  if (absolutePath.endsWith(path.join("content", "articles.json"))) {
    try {
      JSON.parse(body.toString("utf8").replace(/^\uFEFF/, ""));
    } catch (error) {
      send(response, 400, "Invalid JSON");
      return;
    }
  }

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, body);
  send(response, 200, JSON.stringify({ ok: true }), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

function handleGet(request, response, absolutePath) {
  let filePath = absolutePath;

  if (!filePath) {
    send(response, 400, "Bad request");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(response, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      send(response, 204, "");
      return;
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const absolutePath = resolveSafePath(requestUrl.pathname);

    if (request.method === "PUT") {
      await handlePut(request, response, absolutePath);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      handleGet(request, response, absolutePath);
      return;
    }

    send(response, 405, "Method not allowed");
  } catch (error) {
    console.error(error);
    send(response, 500, "Internal server error");
  }
});

server.listen(port, () => {
  console.log(`EIINSIDE local writable server running at http://127.0.0.1:${port}`);
  console.log("Writable targets: /content/articles.json, /assets/articles/*");
});
