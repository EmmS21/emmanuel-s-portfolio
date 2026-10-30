import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

import INFO from "../../data/user";

const LINKS = [
	{ label: INFO.main.email, url: `mailto:${INFO.main.email}`, icon: faEnvelope },
	{ label: "LinkedIn", url: INFO.socials.linkedin, icon: faLinkedin },
	{ label: "GitHub", url: INFO.socials.github, icon: faGithub },
];

export const CloseMark = () => <FontAwesomeIcon icon={faXmark} />;

const ContactDockMenu = () =>
	LINKS.map((link, i) => (
		<a
			key={link.url}
			href={link.url}
			target={link.url.startsWith("mailto:") ? undefined : "_blank"}
			rel="noreferrer"
			className="dock-link"
			style={{ "--i": i }}
		>
			<FontAwesomeIcon icon={link.icon} className="dock-link-icon" />
			{link.label}
		</a>
	));

export default ContactDockMenu;
