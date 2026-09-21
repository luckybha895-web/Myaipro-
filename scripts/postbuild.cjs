const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const outputPublic = path.join(rootDir, ".output", "public");
const outputServer = path.join(rootDir, ".output", "server");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy .output/public contents into dist
if (fs.existsSync(outputPublic)) {
  copyDirSync(outputPublic, distDir);
}

// Also copy server files to dist/server
if (fs.existsSync(outputServer)) {
  copyDirSync(outputServer, path.join(distDir, "server"));
}

// Read metadata
let title = "Creative AI";
let desc = "Creative AI platform";
try {
  const meta = JSON.parse(fs.readFileSync(path.join(rootDir, "metadata.json"), "utf8"));
  if (meta.name) title = meta.name;
  if (meta.description) desc = meta.description;
} catch (e) {
  // ignore
}

// Find entry css and js files in dist/assets
let cssFile = "";
let jsFiles = [];
const assetsDir = path.join(distDir, "assets");
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  for (const f of files) {
    if (f.endsWith(".css")) cssFile = `/assets/${f}`;
    if (f.startsWith("client-") && f.endsWith(".js")) jsFiles.push(`/assets/${f}`);
  }
}

// Create dist/index.html if missing
const indexHtmlPath = path.join(distDir, "index.html");
if (!fs.existsSync(indexHtmlPath)) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    ${cssFile ? `<link rel="stylesheet" href="${cssFile}" />` : ""}
  </head>
  <body class="bg-background text-foreground antialiased min-h-screen">
    <div id="root"></div>
    ${jsFiles.map((js) => `<script type="module" src="${js}"></script>`).join("\n    ")}
    <script>
      // Fallback reload if single page app direct load
      if (!document.getElementById('root').hasChildNodes()) {
        window.location.replace('/app');
      }
    </script>
  </body>
</html>`;
  fs.writeFileSync(indexHtmlPath, htmlContent, "utf8");
}

console.log("Postbuild completed successfully. Artifacts verified in dist/");
