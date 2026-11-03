const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const root = path.join(__dirname, "..");
const buildDir = path.join(root, "build");
const indexPath = path.join(buildDir, "index.html");
const port = 4173;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, attempts = 30) => {
	for (let i = 0; i < attempts; i += 1) {
		try {
			const response = await fetch(url);
			if (response.ok) return;
		} catch {
			// server still starting
		}
		await wait(500);
	}
	throw new Error(`Static server did not respond at ${url}`);
};

const startStaticServer = () =>
	new Promise((resolve, reject) => {
		const child = spawn(
			"npx",
			["serve", "-s", "build", "-l", String(port), "--no-clipboard"],
			{ cwd: root, stdio: "ignore" }
		);
		child.on("error", reject);
		resolve(child);
	});

async function main() {
	if (!fs.existsSync(indexPath)) {
		console.error("prerender-home: build/index.html not found.");
		process.exit(1);
	}

	const server = await startStaticServer();
	await waitForServer(`http://127.0.0.1:${port}/`);

	let browser;
	try {
		browser = await puppeteer.launch({
			headless: "new",
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});
		const page = await browser.newPage();
		await page.goto(`http://127.0.0.1:${port}/`, {
			waitUntil: "domcontentloaded",
			timeout: 60000,
		});
		await page.waitForSelector(".homepage-seo-index", { timeout: 60000 });
		await page.waitForFunction(
			() => document.querySelector("#root")?.innerHTML.trim().length > 0,
			{ timeout: 60000 }
		);

		const rootHtml = await page.$eval("#root", (el) => el.innerHTML);
		const index = fs.readFileSync(indexPath, "utf8");
		const $ = cheerio.load(index);
		$("#root").html(rootHtml);
		fs.writeFileSync(indexPath, $.html());
		console.log("prerender-home: baked React-rendered #root into index.html.");
	} finally {
		if (browser) await browser.close();
		server.kill("SIGTERM");
	}
}

main().catch((error) => {
	console.error("prerender-home failed:", error);
	process.exit(1);
});
