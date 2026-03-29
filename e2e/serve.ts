import { readFileSync } from "fs";
import { join } from "path";

const PORT = 3999;
const E2E_DIR = import.meta.dir;
const ROOT_DIR = join(E2E_DIR, "..");

// Build the test app
const buildResult = await Bun.build({
  entrypoints: [join(E2E_DIR, "test-app.tsx")],
  outdir: join(E2E_DIR, ".build"),
  target: "browser",
  minify: false,
  external: [],
});

if (!buildResult.success) {
  console.error("Build failed:", buildResult.logs);
  process.exit(1);
}

const bundlePath = join(E2E_DIR, ".build", "test-app.js");
const bundleJS = readFileSync(bundlePath, "utf-8");

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root"></div>
  <script type="module">${bundleJS}</script>
</body>
</html>`;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }
    // Serve images as 1x1 transparent gif
    if (url.pathname.match(/\.(jpg|png|gif|webp)$/)) {
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64",
      );
      return new Response(pixel, {
        headers: { "Content-Type": "image/gif" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`E2E test server running at http://localhost:${server.port}`);
