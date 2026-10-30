import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import SceneShell from "./sceneShell";

const SkillScene = ({ skill, projects, onOpenProject, onClose }) => {
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

				<div className="scene-skills scene-tools">
					{skill.tools.map((tool) => (
						<span key={tool} className="scene-skill" style={{ "--skill": skill.color }}>
							{tool}
						</span>
					))}
				</div>

				<p className="scene-section">Where I used it</p>
				<ul className="scene-work">
					{skill.work.map((item, i) => {
						const project = projectById[item.project];
						return (
							<li key={item.project} style={{ "--i": i }}>
								<button type="button" onClick={() => onOpenProject(project.id)}>
									<span className="scene-work-head">
										<span className="scene-work-title">{project.title}</span>
										<span className="scene-work-industry">{project.industry}</span>
									</span>
									<span className="scene-work-did">{item.did}</span>
									<FontAwesomeIcon icon={faArrowRight} className="scene-work-arrow" />
								</button>
							</li>
						);
					})}
				</ul>
			</div>
		</SceneShell>
	);
};

export default SkillScene;
