import INFO from "../src/data/user.js";
import SEO from "../src/data/seo.js";
import { buildPersonJsonLd } from "../src/utils/seoStructuredData.js";
import { buildCrawlSnapshotHtml } from "../src/utils/buildCrawlSnapshotHtml.js";

const homeSeo = SEO.find((item) => item.page === "home");

export default {
	personJsonLd: buildPersonJsonLd(INFO, homeSeo),
	crawlHtml: buildCrawlSnapshotHtml(INFO.homepage),
	canonical: homeSeo.url,
	socials: INFO.socials,
};
