import React from "react";
import { Link } from "react-router-dom";

import INFO from "../../data/user";

import "./styles/navBar.css";

const NavBar = (props) => {
	const { active } = props;

	return (
		<div className="nav-container">
			<nav className="navbar">
				<div className="nav-background">
					<ul className="nav-list">
						<li
							className={
								active === "home"
									? "nav-item active"
									: "nav-item"
							}
						>
							<Link to="/">Home</Link>
						</li>
						<li className="nav-item nav-item-cta">
							<a
								href={INFO.calendly}
								target="_blank"
								rel="noreferrer"
							>
								Book a Call
							</a>
						</li>
					</ul>
				</div>
			</nav>
		</div>
	);
};

export default NavBar;
