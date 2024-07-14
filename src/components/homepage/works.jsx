import React from "react";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";

import Card from "../common/card";

import "./styles/works.css";

const Works = () => {
	return (
		<div className="works">
			<Card
				icon={faBriefcase}
				title="Work"
				body={
					<div className="works-body">
						<div className="work">
							<div className="work-title">Oceanside Perspective</div>
							<div className="work-subtitle">
								Software Engineer
							</div>
							<div className="work-duration">2023 - Present</div>
						</div>

						<div className="work">
							<div className="work-title">Vial</div>
							<div className="work-subtitle">
								Software Engineer
							</div>
							<div className="work-duration">2023</div>
						</div>

						<div className="work">
							<div className="work-title">The Gradient Boost</div>
							<div className="work-subtitle">
								Software Engineer and Founder
							</div>
							<div className="work-duration">2020-2022</div>
						</div>

						<div className="work">
							<div className="work-title">Yoco</div>
							<div className="work-subtitle">
								Data Engineer 
							</div>
							<div className="work-duration">2019-2020</div>
						</div>

						<div className="work">
							<div className="work-title">Google</div>
							<div className="work-subtitle">
								Data Analyst 
							</div>
							<div className="work-duration">2017-2019</div>
						</div>
					</div>
				}
			/>
		</div>
	);
};

export default Works;
