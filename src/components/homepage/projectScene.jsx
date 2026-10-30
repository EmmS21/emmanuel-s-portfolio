import React, { useCallback, useState } from "react";
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

const ProjectScene = ({ project, skills, onClose }) => {
	const [step, setStep] = useState(0);

	const onKey = useCallback((event) => {
		if (event.key === "ArrowRight") setStep((s) => Math.min(s + 1, 2));
		if (event.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
	}, []);

	const projectSkills = skillsFor(skills, project.id);

	return (
		<SceneShell
			eyebrow={project.industry}
			title={project.title}
			onClose={onClose}
			onKey={onKey}
		>
			<nav className="scene-steps" aria-label="Project steps">
				{STEPS.map((label, i) => (
					<button
						type="button"
						key={label}
						className={`scene-step ${i === step ? "is-current" : ""} ${
							i < step ? "is-done" : ""
						}`}
						onClick={() => setStep(i)}
						aria-current={i === step ? "step" : undefined}
					>
						<span className="scene-step-bar" />
						{label}
					</button>
				))}
			</nav>

			<div className="scene-body" key={step}>
				{step === 0 && (
					<div className="scene-problem">
						<p className="scene-spring">“{project.spring}”</p>
						<p className="scene-text">{project.problem}</p>
					</div>
				)}

				{step === 1 && (
					<ol className="scene-system">
						{project.system.map((item, i) => (
							<li
								key={item}
								className="scene-system-item"
								style={{ "--i": i }}
							>
								<span className="scene-system-node" />
								{item}
							</li>
						))}
					</ol>
				)}

				{step === 2 && (
					<div className="scene-value">
						<p className="scene-metric">{project.metric}</p>
						<p className="scene-text">{project.value}</p>

						{project.details && (
							<ul className="scene-details">
								{project.details.map((detail) => (
									<li key={detail.url}>
										<a href={detail.url} target="_blank" rel="noreferrer">
											<span className="scene-detail-label">
												{detail.label}
											</span>
											<span className="scene-detail-text">
												{detail.text}
											</span>
										</a>
									</li>
								))}
							</ul>
						)}

						{project.logo && (
							<img
								src={project.logo}
								alt={`${project.title} logo`}
								className="scene-logo"
							/>
						)}

						{project.links && (
							<div className="scene-links">
								{project.links.map((link) => (
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
						)}
					</div>
				)}
			</div>

			<footer className="scene-footer">
				<div className="scene-skills">
					{projectSkills.map((skill) => (
						<span
							key={skill.id}
							className="scene-skill"
							style={{ "--skill": skill.color }}
						>
							{skill.label}
						</span>
					))}
				</div>
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
			</footer>
		</SceneShell>
	);
};

export default ProjectScene;
