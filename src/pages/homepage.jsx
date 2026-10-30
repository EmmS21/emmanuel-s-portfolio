import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";

import Door from "../components/homepage/door";
import RiverMap from "../components/homepage/riverMap";
import ProjectScene from "../components/homepage/projectScene";
import SkillScene from "../components/homepage/skillScene";
import WorkHistory from "../components/homepage/workHistory";
import ContactDock from "../components/homepage/contactDock";

import INFO from "../data/user";
import SEO from "../data/seo";

import "./styles/homepage.css";

const SEEN_KEY = "portal-opened";

// Each phase starts this many ms after the page loads.
const TIMELINE = [
	["opening", 350],
	["flow", 1450],
	["ready", 2500],
];

const prefersMotion = () =>
	!window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Homepage = () => {
	const [motion] = useState(prefersMotion);
	const [phase, setPhase] = useState(() =>
		motion && !sessionStorage.getItem(SEEN_KEY) ? "closed" : "ready"
	);
	const [openSkill, setOpenSkill] = useState(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [openProject, setOpenProject] = useState(null);
	const [contactOpen, setContactOpen] = useState(false);

	const currentSEO = SEO.find((item) => item.page === "home");
	const { homepage } = INFO;

	useEffect(() => {
		if (phase !== "closed") return undefined;
		sessionStorage.setItem(SEEN_KEY, "1");
		const timers = TIMELINE.map(([next, at]) =>
			setTimeout(
				() => setPhase((current) => (current === "ready" ? current : next)),
				at
			)
		);
		return () => timers.forEach(clearTimeout);
		// The timeline runs once, from the first render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const skipIntro = useCallback(() => setPhase("ready"), []);

	useEffect(() => {
		if (phase === "ready") return undefined;
		window.addEventListener("keydown", skipIntro);
		return () => window.removeEventListener("keydown", skipIntro);
	}, [phase, skipIntro]);

	const closeSkill = useCallback(() => setOpenSkill(null), []);
	const closeHistory = useCallback(() => setHistoryOpen(false), []);
	const closeProject = useCallback(() => setOpenProject(null), []);
	const skill = homepage.skills.find((s) => s.id === openSkill);
	const project = homepage.projects.find((p) => p.id === openProject);
	const doorVisible = phase === "closed" || phase === "opening";

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
					phase={phase}
					motion={motion}
					zoomSkill={openSkill}
					onOpenSkill={setOpenSkill}
					onOpenHistory={() => setHistoryOpen(true)}
					onOpenContact={() => setContactOpen(true)}
				/>
			</main>

			{doorVisible && (
				<Door phase={phase} name={INFO.main.name} onSkip={skipIntro} />
			)}

			{historyOpen && !project && (
				<WorkHistory
					history={homepage.history}
					skills={homepage.skills}
					linkedin={INFO.socials.linkedin}
					onOpenProject={setOpenProject}
					onClose={closeHistory}
				/>
			)}

			{skill && !project && !historyOpen && (
				<SkillScene
					skill={skill}
					projects={homepage.projects}
					onOpenProject={setOpenProject}
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

			<ContactDock
				open={contactOpen}
				onToggle={setContactOpen}
				visible={phase === "ready"}
			/>
		</React.Fragment>
	);
};

export default Homepage;
