import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faHotel,
	faPlaneDeparture,
	faMusic,
	faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";

import Footer from "../components/common/footer";

import INFO from "../data/user";
import SEO from "../data/seo";

import "./styles/homepage.css";

const industryIcons = [faHotel, faMusic, faPlaneDeparture];

const Homepage = () => {
	const [activeStat, setActiveStat] = useState(null);

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	const currentSEO = SEO.find((item) => item.page === "home");
	const { homepage } = INFO;

	const toggleStat = (index) => {
		setActiveStat((current) => (current === index ? null : index));
	};

	return (
		<React.Fragment>
			<Helmet>
				<title>{INFO.main.title} | Automation for Hospitality & Tourism</title>
				<meta name="description" content={currentSEO.description} />
				<meta
					name="keywords"
					content={currentSEO.keywords.join(", ")}
				/>
			</Helmet>

			<div className="page-content homepage-page">
				<div className="homepage-hero">
					<div className="zen-sky-glow" aria-hidden="true" />
					<div className="zen-horizon-line" aria-hidden="true" />
					<div className="homepage-hero-wave" aria-hidden="true" />

					<div className="content-wrapper homepage-hero-content">
						<p className="homepage-tagline">{homepage.tagline}</p>

						<div className="homepage-photo-sanctuary">
							<div className="zen-enso" aria-hidden="true" />
							<div className="zen-ripples" aria-hidden="true">
								<span className="zen-ripple" />
								<span className="zen-ripple" />
								<span className="zen-ripple" />
							</div>
							<div className="zen-orbs" aria-hidden="true">
								<span className="zen-orb" />
								<span className="zen-orb" />
								<span className="zen-orb" />
							</div>
							<div className="zen-mist zen-mist-left" aria-hidden="true" />
							<div className="zen-mist zen-mist-right" aria-hidden="true" />

							<div className="homepage-photo-frame">
								<div className="homepage-photo-glow" aria-hidden="true" />
								<div className="homepage-photo-ring">
									<img
										src="homepage.jpg"
										alt="Emmanuel Sibanda with surfboard"
										className="homepage-photo"
									/>
								</div>
							</div>
						</div>

						<h1 className="homepage-headline">{homepage.headline}</h1>
						<p className="homepage-subheadline">
							{homepage.subheadline}
						</p>

						<div className="homepage-hero-actions">
							<a
								href={INFO.calendly}
								target="_blank"
								rel="noreferrer"
								className="homepage-btn homepage-btn-primary"
							>
								Book a Free Discovery Call
							</a>
							<a
								href="#services"
								className="homepage-btn homepage-btn-secondary"
							>
								See What I Automate
							</a>
						</div>
					</div>
				</div>

				<div className="content-wrapper homepage-body">
					<section className="homepage-section" id="industries">
						<h2 className="homepage-section-title">
							Built for Puerto Rico's hospitality industry
						</h2>
						<p className="homepage-section-subtitle">
							Whether you run a boutique hotel in Condado, a venue in
							Santurce, or a travel agency across the island, I build
							automation that fits how you actually work.
						</p>
						<div className="homepage-industry-grid">
							{homepage.industries.map((industry, index) => (
								<div
									className="homepage-industry-card"
									key={industry.title}
								>
									<FontAwesomeIcon
										icon={industryIcons[index]}
										className="homepage-industry-icon"
									/>
									<h3 className="homepage-industry-title">
										{industry.title}
									</h3>
									<p className="homepage-industry-desc">
										{industry.description}
									</p>
								</div>
							))}
						</div>
					</section>

					<section className="homepage-section" id="services">
						<h2 className="homepage-section-title">
							{homepage.servicesSection.title}
						</h2>
						<p className="homepage-section-subtitle">
							{homepage.servicesSection.subtitle}
						</p>
						<div className="homepage-services-grid">
							{homepage.services.map((service) => (
								<div
									className="homepage-service-card"
									key={service.title}
								>
									<h3 className="homepage-service-title">
										{service.title}
									</h3>
									<p className="homepage-service-desc">
										{service.description}
									</p>
								</div>
							))}
						</div>
					</section>

					<section className="homepage-section homepage-proof" id="proof">
						<h2 className="homepage-section-title">
							{homepage.proof.title}
						</h2>
						<p className="homepage-section-subtitle">
							{homepage.proof.subtitle}
						</p>
						<div className="homepage-stats-grid">
							{homepage.stats.map((stat, index) => {
								const isActive = activeStat === index;

								return (
									<button
										type="button"
										className={`homepage-stat ${isActive ? "homepage-stat-active" : ""}`}
										key={stat.label}
										onClick={() => toggleStat(index)}
										aria-expanded={isActive}
										aria-controls="homepage-stat-panel"
										aria-label={
											isActive
												? `Close details for ${stat.value}`
												: `See more about ${stat.value}`
										}
									>
										<div className="homepage-stat-value">
											{stat.value}
										</div>
										<div className="homepage-stat-label">
											{stat.label}
										</div>
										<span className="homepage-stat-expand">
											<FontAwesomeIcon
												icon={faPlus}
												className="homepage-stat-plus"
											/>
										</span>
									</button>
								);
							})}
						</div>

						{activeStat !== null && (
							<div
								id="homepage-stat-panel"
								className="homepage-stat-panel"
							>
								<p className="homepage-stat-detail-text">
									{homepage.stats[activeStat].detail}
								</p>
								<div className="homepage-stat-company">
									<span className="homepage-stat-company-label">
										Delivered at
									</span>
									<img
										src={homepage.stats[activeStat].company.logo}
										alt={`${homepage.stats[activeStat].company.name} logo`}
										className="homepage-stat-company-logo"
									/>
								</div>
							</div>
						)}
						<p className="homepage-proof-note">
							Same approach, now focused on Puerto Rico's hospitality
							and tourism businesses.
						</p>
					</section>

					<section className="homepage-section" id="process">
						<h2 className="homepage-section-title">How it works</h2>
						<div className="homepage-process-grid">
							{homepage.process.map((step) => (
								<div
									className="homepage-process-card"
									key={step.step}
								>
									<span className="homepage-process-step">
										{step.step}
									</span>
									<h3 className="homepage-process-title">
										{step.title}
									</h3>
									<p className="homepage-process-desc">
										{step.description}
									</p>
								</div>
							))}
						</div>
					</section>

					<section className="homepage-section homepage-cta">
						<h2 className="homepage-cta-headline">
							{homepage.cta.headline}
						</h2>
						<p className="homepage-cta-subheadline">
							{homepage.cta.subheadline}
						</p>
						<a
							href={INFO.calendly}
							target="_blank"
							rel="noreferrer"
							className="homepage-btn homepage-btn-primary homepage-btn-large"
						>
							Book a Free Discovery Call
						</a>
						<div className="homepage-cta-links">
							<a
								href={`mailto:${INFO.main.email}`}
								className="homepage-cta-link"
							>
								{INFO.main.email}
							</a>
							<a
								href={INFO.socials.linkedin}
								target="_blank"
								rel="noreferrer"
								className="homepage-cta-link homepage-cta-link-icon"
							>
								<FontAwesomeIcon icon={faLinkedin} />
								LinkedIn
							</a>
						</div>
					</section>

					<div className="page-footer">
						<Footer />
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

export default Homepage;
