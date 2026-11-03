export function buildPersonJsonLd({ main, homepage, socials }, seo) {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		name: main.name,
		url: seo.url,
		email: main.email,
		sameAs: [socials.linkedin, socials.github, socials.twitter].filter(
			Boolean
		),
		knowsAbout: homepage.skills.map((skill) => skill.label),
		description: seo.description,
	};
}
