const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const bundlePath = path.join(__dirname, ".seo-postbuild-bundle.cjs");
const indexPath = path.join(root, "build", "index.html");

esbuild.buildSync({
	entryPoints: [path.join(__dirname, "seo-postbuild-runner.js")],
	bundle: true,
	platform: "node",
	format: "cjs",
	outfile: bundlePath,
	absWorkingDir: root,
});

const payload = require(bundlePath).default;
fs.unlinkSync(bundlePath);

if (!fs.existsSync(indexPath)) {
	console.error("seo-postbuild: build/index.html not found — run react-scripts build first.");
	process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

const meLinks = [payload.socials.linkedin, payload.socials.github, payload.socials.twitter]
	.filter(Boolean)
	.map((url) => `<link rel="me" href="${url}" />`)
	.join("\n\t\t");

const headBlock = `
\t\t<link rel="canonical" href="${payload.canonical}/" />
\t\t${meLinks}
\t\t<script type="application/ld+json">${JSON.stringify(payload.personJsonLd)}</script>`;

if (!html.includes('rel="canonical"')) {
	html = html.replace("</head>", `${headBlock}\n\t</head>`);
}

if (!html.includes('id="crawl-snapshot"')) {
	html = html.replace(
		'<div id="root"></div>',
		`${payload.crawlHtml}\n\t\t<div id="root"></div>`
	);
}

fs.writeFileSync(indexPath, html);
console.log("seo-postbuild: injected Person schema, canonical, rel=me, and crawl snapshot.");
