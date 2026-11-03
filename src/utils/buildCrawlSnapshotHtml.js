const escapeHtml = (value) =>
	String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

export function buildCrawlSnapshotHtml(homepage) {
	const projectById = new Map(
		homepage.projects.map((project) => [project.id, project])
	);

	const skillBlocks = homepage.skills
		.map((skill) => {
			const workLines = (skill.work || [])
				.map((entry) => {
					const project = projectById.get(entry.project);
					const title = project?.title ?? entry.project;
					return `<p><strong>${escapeHtml(title)}</strong>: ${escapeHtml(entry.did)}</p>`;
				})
				.join("");
			return `<article><h3>${escapeHtml(skill.label)}</h3><p>${escapeHtml(skill.summary)}</p>${workLines}</article>`;
		})
		.join("");

	const projectBlocks = homepage.projects
		.map((project) => {
			const problem = project.problem
				? `<p>${escapeHtml(project.problem)}</p>`
				: "";
			const value = project.value
				? `<p>${escapeHtml(project.value)}</p>`
				: "";
			return `<article><h3>${escapeHtml(project.title)}</h3>${problem}${value}</article>`;
		})
		.join("");

	return `<section id="crawl-snapshot" hidden aria-hidden="true"><h2>Skills</h2>${skillBlocks}<h2>Projects</h2>${projectBlocks}</section>`;
}
