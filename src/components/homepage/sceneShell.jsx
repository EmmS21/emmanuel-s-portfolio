import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import "./styles/projectScene.css";

const SceneShell = ({ eyebrow, title, accent, variant, onClose, onKey, children }) => {
	const closeRef = useRef(null);

	useEffect(() => {
		closeRef.current.focus();
		const handle = (event) => {
			if (event.key === "Escape") onClose();
			else if (onKey) onKey(event);
		};
		window.addEventListener("keydown", handle);
		return () => window.removeEventListener("keydown", handle);
	}, [onClose, onKey]);

	return (
		<div
			className={`scene-backdrop ${variant ? `scene-backdrop-${variant}` : ""}`}
			onClick={onClose}
			role="presentation"
		>
			<div
				className={`scene ${variant ? `scene-${variant}` : ""}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="scene-title"
				style={accent ? { "--accent": accent } : undefined}
				onClick={(event) => event.stopPropagation()}
			>
				<header className="scene-header">
					<div>
						<p className="scene-industry">{eyebrow}</p>
						<h2 className="scene-title" id="scene-title">
							{title}
						</h2>
					</div>
					<button
						type="button"
						className="scene-close"
						onClick={onClose}
						ref={closeRef}
						aria-label="Close"
					>
						<FontAwesomeIcon icon={faXmark} />
					</button>
				</header>
				{children}
			</div>
		</div>
	);
};

export default SceneShell;
