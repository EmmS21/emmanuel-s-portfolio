import React from "react";

/**
 * Same copy as interactive panels, rendered on first paint for crawlers and
 * prerendered into index.html at build time (not a separate HTML generator).
 */
const HomepageSeoIndex = ({ homepage }) => {
	const projectById = Object.fromEntries(
		homepage.projects.map((project) => [project.id, project])
	);

	return (
		<div className="homepage-seo-index homepage-sr-only" aria-hidden="true">
			{homepage.skills.map((skill) => (
				<article key={skill.id}>
					<h2>{skill.label}</h2>
					<p>{skill.summary}</p>
					<ul>
						{(skill.work || []).map((entry) => {
							const project = projectById[entry.project];
							const title = entry.label || project?.title || entry.project;
							return (
								<li key={`${skill.id}-${entry.project}-${title}`}>
									<strong>{title}</strong>: {entry.did}
								</li>
							);
						})}
					</ul>
				</article>
			))}

			<section>
				<h2>Work history</h2>
				<ol>
					{homepage.history.map((entry) => (
						<li key={`${entry.org}-${entry.dates}`}>
							<strong>
								{entry.role} · {entry.org}
							</strong>
							{entry.place ? ` — ${entry.place}` : ""}
							{entry.dates ? ` (${entry.dates})` : ""}
							{entry.summary ? `. ${entry.summary}` : ""}
						</li>
					))}
				</ol>
			</section>

			{homepage.projects.map((project) => (
				<article key={project.id}>
					<h2>{project.title}</h2>
					{project.industry && <p>{project.industry}</p>}
					{project.problem && <p>{project.problem}</p>}
					{project.value && <p>{project.value}</p>}
					{project.spring && <p>{project.spring}</p>}
				</article>
			))}
		</div>
	);
};

export default HomepageSeoIndex;
