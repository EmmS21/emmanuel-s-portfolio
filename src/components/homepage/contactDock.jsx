import React, { lazy, Suspense, useEffect } from "react";

import "./styles/contactDock.css";

const loadOpen = () => import("./contactDockOpen");
const ContactDockMenu = lazy(loadOpen);
const CloseMark = lazy(() =>
	loadOpen().then((mod) => ({ default: mod.CloseMark }))
);

const ContactDock = ({ open, onToggle }) => {
	useEffect(() => {
		if (!open) return undefined;
		const onKey = (event) => event.key === "Escape" && onToggle(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onToggle]);

	return (
		<div className={`dock dock-visible ${open ? "dock-open" : ""}`}>
			<div className="dock-menu" id="dock-menu" aria-hidden={!open}>
				{open && (
					<Suspense fallback={null}>
						<ContactDockMenu />
					</Suspense>
				)}
			</div>
			<button
				type="button"
				className="dock-toggle"
				onClick={() => onToggle(!open)}
				onPointerEnter={loadOpen}
				onFocus={loadOpen}
				aria-expanded={open}
				aria-controls="dock-menu"
			>
				{open ? (
					<Suspense fallback="×">
						<CloseMark />
					</Suspense>
				) : (
					"Contact"
				)}
			</button>
		</div>
	);
};

export default ContactDock;
