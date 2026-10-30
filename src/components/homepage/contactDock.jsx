import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faEnvelope, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

import INFO from "../../data/user";

import "./styles/contactDock.css";

const LINKS = [
	{ label: "Book a call", url: INFO.calendly, icon: faCalendar },
	{ label: INFO.main.email, url: `mailto:${INFO.main.email}`, icon: faEnvelope },
	{ label: "LinkedIn", url: INFO.socials.linkedin, icon: faLinkedin },
	{ label: "GitHub", url: INFO.socials.github, icon: faGithub },
];

const ContactDock = ({ open, onToggle, visible }) => {
	useEffect(() => {
		if (!open) return undefined;
		const onKey = (event) => event.key === "Escape" && onToggle(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onToggle]);

	return (
		<div className={`dock ${open ? "dock-open" : ""} ${visible ? "dock-visible" : ""}`}>
			<div className="dock-menu" id="dock-menu" aria-hidden={!open}>
				{LINKS.map((link, i) => (
					<a
						key={link.url}
						href={link.url}
						target={link.url.startsWith("mailto:") ? undefined : "_blank"}
						rel="noreferrer"
						className="dock-link"
						style={{ "--i": i }}
						tabIndex={open ? 0 : -1}
					>
						<FontAwesomeIcon icon={link.icon} className="dock-link-icon" />
						{link.label}
					</a>
				))}
			</div>
			<button
				type="button"
				className="dock-toggle"
				onClick={() => onToggle(!open)}
				aria-expanded={open}
				aria-controls="dock-menu"
			>
				{open ? <FontAwesomeIcon icon={faXmark} /> : "Contact"}
			</button>
		</div>
	);
};

export default ContactDock;
