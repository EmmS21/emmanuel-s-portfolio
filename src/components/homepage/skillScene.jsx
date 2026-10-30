import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import SceneShell from "./sceneShell";

const SkillScene = ({ skill, projects, onOpenProject, onWarmProject, onClose }) => {
	const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

	return (
		<SceneShell
			eyebrow="Skill"
			title={skill.label}
			accent={skill.color}
			variant="dock"
			onClose={onClose}
		>
			<div className="scene-body">
				<p className="scene-text">{skill.summary}</p>

				{skill.tools?.length > 0 && (
					<div className="scene-skills scene-tools">
						{skill.tools.map((tool) => (
							<span key={tool} className="scene-skill" style={{ "--skill": skill.color }}>
								{tool}
							</span>
						))}
					</div>
				)}

				<ul className="scene-work">
					{skill.work.map((item, i) => {
						const project = projectById[item.project];
						const canOpen = item.open !== false && project;
						const body = (
							<>
								<span className="scene-work-head">
									<span className="scene-work-title">
										{item.label || project.title}
									</span>
									<span className="scene-work-industry">{project.industry}</span>
								</span>
								<span className="scene-work-did">{item.did}</span>
								{canOpen && (
									<FontAwesomeIcon
										icon={faArrowRight}
										className="scene-work-arrow"
									/>
								)}
							</>
						);
						return (
							<li key={item.label || item.project} style={{ "--i": i }}>
								{canOpen ? (
									<button
										type="button"
										onClick={() => onOpenProject(project.id)}
										onPointerEnter={onWarmProject}
										onFocus={onWarmProject}
									>
										{body}
									</button>
								) : (
									<div className="scene-work-static">{body}</div>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</SceneShell>
	);
};

export default SkillScene;
