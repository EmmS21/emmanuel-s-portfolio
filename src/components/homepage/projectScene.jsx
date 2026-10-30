import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faArrowLeft,
	faArrowRight,
	faArrowUpRightFromSquare,
	faXmark,
} from "@fortawesome/free-solid-svg-icons";

import SceneShell from "./sceneShell";
import skillsFor from "./skillsFor";

const STEPS = ["Problem", "System", "Value"];

const SceneLinks = ({ links }) =>
	links?.length ? (
		<div className="scene-links">
			{links.map((link) => (
				<a
					key={link.url}
					href={link.url}
					target="_blank"
					rel="noreferrer"
					className="scene-link"
				>
					{link.label}
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} />
				</a>
			))}
		</div>
	) : null;

const Proofs = ({ project }) => (
	<>
		{project.details && (
			<ul className="scene-details">
				{project.details.map((detail) => (
					<li key={detail.url}>
						<a href={detail.url} target="_blank" rel="noreferrer">
							<span className="scene-detail-label">{detail.label}</span>
							<span className="scene-detail-text">{detail.text}</span>
						</a>
					</li>
				))}
			</ul>
		)}
		<SceneLinks links={project.links} />
	</>
);

const Tipped = ({ text, tips }) => {
	if (!tips) return text;
	const phrases = Object.keys(tips).filter((phrase) => text.includes(phrase));
	if (!phrases.length) return text;
	phrases.sort((a, b) => b.length - a.length);
	const escaped = phrases.map((phrase) =>
		phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	);
	return text.split(new RegExp(`(${escaped.join("|")})`, "g")).map((part, i) =>
		tips[part] ? (
			<span key={i} className="scene-tip" data-tip={tips[part]}>
				{part}
			</span>
		) : (
			part
		)
	);
};

const SystemFlow = ({ steps, tips }) => (
	<ol className="scene-system">
		{steps.map((item, i) => (
			<li key={item} className="scene-system-item" style={{ "--i": i }}>
				<span className="scene-system-node" />
				<Tipped text={item} tips={tips} />
			</li>
		))}
	</ol>
);

const StepNav = ({ tabs, step, onPick, label, markDone, className }) => (
	<nav className={`scene-steps ${className || ""}`.trim()} aria-label={label}>
		{tabs.map((name, i) => (
			<button
				type="button"
				key={name}
				className={`scene-step ${i === step ? "is-current" : ""} ${
					markDone && i < step ? "is-done" : ""
				}`}
				onClick={() => onPick(i)}
				aria-current={i === step ? "step" : undefined}
			>
				<span className="scene-step-bar" />
				{name}
			</button>
		))}
	</nav>
);

const ProjectScene = ({ project, skills, onClose }) => {
	const [step, setStep] = useState(0);
	const [openFlow, setOpenFlow] = useState(null);
	const flowed = Boolean(project.workflows?.length);
	const stacked =
		Boolean(project.system?.length) &&
		Boolean(project.stack?.length) &&
		!flowed;
	const walked = Boolean(project.system?.length) && !project.stack?.length && !flowed;
	const projectSkills = skillsFor(skills, project.id);
	const chips = project.stack?.length ? project.stack : projectSkills;

	useEffect(() => {
		setOpenFlow(null);
	}, [project.id]);

	const onKey = useCallback(
		(event) => {
			if (!walked) return;
			if (event.key === "ArrowRight") setStep((s) => Math.min(s + 1, 2));
			if (event.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
		},
		[walked]
	);

	return (
		<SceneShell
			eyebrow={project.industry}
			title={project.title}
			onClose={onClose}
			onKey={onKey}
		>
			{walked && (
				<StepNav
					tabs={STEPS}
					step={step}
					onPick={setStep}
					label="Project steps"
					markDone
				/>
			)}

			<div
				className="scene-body"
				key={walked ? step : stacked ? "stack" : flowed ? "flows" : "proofs"}
			>
				{walked && step === 0 && (
					<div className="scene-problem">
						<p className="scene-spring">“{project.spring}”</p>
						<p className="scene-text">{project.problem}</p>
					</div>
				)}

				{walked && step === 1 && <SystemFlow steps={project.system} />}

				{walked && step === 2 && (
					<div className="scene-value">
						<p className="scene-metric">{project.metric}</p>
						<p className="scene-text">{project.value}</p>
						<Proofs project={project} />
						{project.logo && (
							<img
								src={project.logo}
								alt={`${project.title} logo`}
								className="scene-logo"
							/>
						)}
					</div>
				)}

				{stacked && (
					<>
						<SystemFlow steps={project.system} />
						<Proofs project={project} />
						{project.logo && (
							<img
								src={project.logo}
								alt={`${project.title} logo`}
								className="scene-logo"
							/>
						)}
					</>
				)}

				{flowed && (
					<>
						<ul className="scene-work">
							{project.workflows.map((flow, i) => (
								<li key={flow.label} style={{ "--i": i }}>
									<button
										type="button"
										className={openFlow === i ? "is-open" : ""}
										onClick={() => setOpenFlow(openFlow === i ? null : i)}
										aria-expanded={openFlow === i}
									>
										<span className="scene-work-title">
											<Tipped text={flow.label} tips={project.modelTips} />
										</span>
										<FontAwesomeIcon
											icon={faArrowRight}
											className="scene-work-arrow"
										/>
									</button>
									{openFlow === i && (
										<>
											<SystemFlow
												steps={flow.steps}
												tips={project.modelTips}
											/>
											<SceneLinks links={flow.links} />
										</>
									)}
								</li>
							))}
						</ul>
						<Proofs project={project} />
					</>
				)}

				{!walked && !stacked && !flowed && <Proofs project={project} />}
			</div>

			<footer className="scene-footer">
				<div className="scene-skills">
					{chips.map((item) => {
						const label = item.label || item;
						const color = item.color || projectSkills[0]?.color || "#e2b878";
						return (
							<span
								key={label}
								className="scene-skill"
								style={{ "--skill": color }}
							>
								{label}
							</span>
						);
					})}
				</div>
				{walked && (
					<div className="scene-nav">
						<button
							type="button"
							className="scene-nav-btn"
							onClick={() => setStep((s) => s - 1)}
							disabled={step === 0}
							aria-label="Previous step"
						>
							<FontAwesomeIcon icon={faArrowLeft} />
						</button>
						<button
							type="button"
							className="scene-nav-btn"
							onClick={() => (step === 2 ? onClose() : setStep((s) => s + 1))}
							aria-label={step === 2 ? "Back to the map" : "Next step"}
						>
							<FontAwesomeIcon icon={step === 2 ? faXmark : faArrowRight} />
						</button>
					</div>
				)}
			</footer>
		</SceneShell>
	);
};

export default ProjectScene;
