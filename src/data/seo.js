const SITE_URL = "https://emmanuelsibanda.com";

/** Shared snippet for meta tags and Person schema (keep concise for search snippets). */
export const HOME_META_DESCRIPTION =
	"Emmanuel Sibanda finds where the work actually breaks, then builds the system that fixes it.";

const SEO = [
	{
		page: "home",
		title: "Emmanuel Sibanda | From business problems to working systems",
		description: HOME_META_DESCRIPTION,
		ogImage: `${SITE_URL}/homepage.jpg`,
		ogImageAlt: "Emmanuel Sibanda",
		url: SITE_URL,
		keywords: [
			"Emmanuel Sibanda",
			"AI engineer",
			"automation",
			"AI agents",
			"data pipelines",
			"offline AI",
			"open source",
		],
	},
];

export default SEO;
