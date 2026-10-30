import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import SceneShell from "./sceneShell";
import skillsFor from "./skillsFor";

const WorkHistory = ({ history, skills, linkedin, onOpenProject, onClose }) => {
	const skillById = Object.fromEntries(skills.map((skill) => [skill.id, skill]));
	const entrySkills = (entry) =>
		entry.project
			? skillsFor(skills, entry.project)
			: entry.skills.map((id) => skillById[id]);

	return (
		<SceneShell eyebrow="Work history" title="Where I've built" onClose={onClose}>
			<div className="scene-body">
				<ol className="scene-system history">
					{history.map((entry, i) => (
						<li key={entry.org} className="scene-system-item history-item" style={{ "--i": i }}>
							<span className="scene-system-node" />
							{entry.dates && <span className="history-dates">{entry.dates}</span>}
							<span className="history-role">
								{entry.role} · <strong>{entry.org}</strong>
							</span>
							<span className="history-place">{entry.place}</span>
							{entry.summary && <span className="history-summary">{entry.summary}</span>}
							<span className="history-foot">
								<span className="scene-skills">
									{entrySkills(entry).map((skill) => (
										<span key={skill.id} className="scene-skill" style={{ "--skill": skill.color }}>
											{skill.label}
										</span>
									))}
								</span>
								{entry.project && (
									<button
										type="button"
										className="history-open"
										onClick={() => onOpenProject(entry.project)}
									>
										See the work <FontAwesomeIcon icon={faArrowRight} />
									</button>
								)}
							</span>
						</li>
					))}
				</ol>

				<div className="scene-links">
					<a href={linkedin} target="_blank" rel="noreferrer" className="scene-link">
						Full profile on LinkedIn
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} />
					</a>
				</div>
			</div>
		</SceneShell>
	);
};

export default WorkHistory;
