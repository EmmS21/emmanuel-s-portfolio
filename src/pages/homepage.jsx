import React, { lazy, Suspense, useCallback, useState } from "react";
import { Helmet } from "react-helmet";

import RiverMap from "../components/homepage/riverMap";
import ContactDock from "../components/homepage/contactDock";
import { warm } from "../components/homepage/warmPanel";
import INFO from "../data/user";
import SEO from "../data/seo";

import "./styles/homepage.css";

const loadHistory = () => import("../components/homepage/workHistory");
const loadSkill = () => import("../components/homepage/skillScene");
const loadProject = () => import("../components/homepage/projectScene");
const WorkHistory = lazy(loadHistory);
const SkillScene = lazy(loadSkill);
const ProjectScene = lazy(loadProject);

const prefersMotion = () =>
	!window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Homepage = () => {
	const [motion] = useState(prefersMotion);
	const [openSkill, setOpenSkill] = useState(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [openProject, setOpenProject] = useState(null);
	const [contactOpen, setContactOpen] = useState(false);

	const currentSEO = SEO.find((item) => item.page === "home");
	const { homepage } = INFO;

	const closeSkill = useCallback(() => setOpenSkill(null), []);
	const closeHistory = useCallback(() => setHistoryOpen(false), []);
	const closeProject = useCallback(() => setOpenProject(null), []);
	const skill = homepage.skills.find((s) => s.id === openSkill);
	const project = homepage.projects.find((p) => p.id === openProject);

	return (
		<React.Fragment>
			<Helmet>
				<title>{currentSEO.title}</title>
				<meta name="description" content={currentSEO.description} />
				<meta name="keywords" content={currentSEO.keywords.join(", ")} />
				<meta property="og:type" content="website" />
				<meta property="og:url" content={currentSEO.url} />
				<meta property="og:title" content={currentSEO.title} />
				<meta property="og:description" content={currentSEO.description} />
				<meta property="og:image" content={currentSEO.ogImage} />
				<meta property="og:image:alt" content={currentSEO.ogImageAlt} />
				<meta property="og:site_name" content={INFO.main.name} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={currentSEO.title} />
				<meta name="twitter:description" content={currentSEO.description} />
				<meta name="twitter:image" content={currentSEO.ogImage} />
			</Helmet>

			<main className="page-content homepage-page">
				<h1 className="homepage-sr-only">
					{INFO.main.name}: {homepage.pitch}
				</h1>

				<RiverMap
					homepage={homepage}
					motion={motion}
					zoomSkill={openSkill}
					onOpenSkill={setOpenSkill}
					onOpenHistory={() => setHistoryOpen(true)}
					onWarmSkill={() => warm(loadSkill)}
					onWarmHistory={() => warm(loadHistory)}
				>
					<ContactDock open={contactOpen} onToggle={setContactOpen} />
				</RiverMap>
			</main>

			<Suspense fallback={null}>
				{historyOpen && !project && (
					<WorkHistory
						history={homepage.history}
						skills={homepage.skills}
						linkedin={INFO.socials.linkedin}
						onOpenProject={setOpenProject}
						onWarmProject={() => warm(loadProject)}
						onClose={closeHistory}
					/>
				)}

				{skill && !project && !historyOpen && (
					<SkillScene
						skill={skill}
						projects={homepage.projects}
						onOpenProject={setOpenProject}
						onWarmProject={() => warm(loadProject)}
						onClose={closeSkill}
					/>
				)}

				{project && (
					<ProjectScene
						project={project}
						skills={homepage.skills}
						onClose={closeProject}
					/>
				)}
			</Suspense>
		</React.Fragment>
	);
};

export default Homepage;
