import React from "react";

import INFO from "../../data/user";

import "./styles/footer.css";

const Footer = () => {
	return (
		<div className="footer">
			<div className="footer-links">
				<a
					href={INFO.calendly}
					target="_blank"
					rel="noreferrer"
					className="footer-link"
				>
					Book a Discovery Call
				</a>
				<a
					href={`mailto:${INFO.main.email}`}
					className="footer-link"
				>
					{INFO.main.email}
				</a>
			</div>

			<div className="footer-credits">
				<div className="footer-credits-text">
					© 2026 {INFO.main.name}. Automation for Hospitality &
					Tourism in Puerto Rico.
				</div>
			</div>
		</div>
	);
};

export default Footer;
