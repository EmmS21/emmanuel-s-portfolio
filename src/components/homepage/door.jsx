import React from "react";

import "./styles/door.css";

const Door = ({ phase, name, onSkip }) => (
	<div
		className={`door door-${phase}`}
		onClick={onSkip}
		role="presentation"
		aria-hidden="true"
	>
		<div className="door-light" />
		<div className="door-panel door-panel-left">
			<span className="door-handle" />
		</div>
		<div className="door-panel door-panel-right">
			<span className="door-handle" />
		</div>
		<p className="door-name">{name}</p>
	</div>
);

export default Door;
