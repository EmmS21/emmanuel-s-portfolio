import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Portal from "./portal";
import Hummingbird from "./hummingbird";
import WaterCanvas from "./waterCanvas";
import buildLayout, { hitPath } from "./riverLayout";

import "./styles/riverMap.css";

const TALL_QUERY = "(max-width: 760px), (max-aspect-ratio: 4/5)";

const useTallMode = () => {
	const [tall, setTall] = useState(
		() => window.matchMedia(TALL_QUERY).matches
	);
	useEffect(() => {
		const query = window.matchMedia(TALL_QUERY);
		const onChange = () => setTall(query.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);
	return tall;
};

const pct = (value, total) => `${(value / total) * 100}%`;
const ZOOM = 3;
const ZOOM_TALL = 1.8;

const RiverMap = ({
	homepage,
	phase,
	motion,
	zoomSkill,
	onOpenSkill,
	onOpenHistory,
	onOpenContact,
}) => {
	const { skills } = homepage;
	const tall = useTallMode();
	const layout = useMemo(
		() => buildLayout(tall ? "tall" : "wide", skills.length),
		[tall, skills.length]
	);
	const stageRef = useRef(null);
	const [stageWidth, setStageWidth] = useState(0);
	const [activeSkill, setActiveSkill] = useState(null);
	const [noWebGL, setNoWebGL] = useState(false);
	const onUnsupported = useCallback(() => setNoWebGL(true), []);

	useEffect(() => {
		const observer = new ResizeObserver(([entry]) =>
			setStageWidth(entry.contentRect.width)
		);
		observer.observe(stageRef.current);
		return () => observer.disconnect();
	}, []);

	const lit = useMemo(
		() =>
			layout.rivers.map((r) => {
				const skill = skills[r.skill];
				return Boolean(skill) && skill.id === activeSkill;
			}),
		[layout, skills, activeSkill]
	);

	const skillHandlers = (skill) => ({
		onMouseEnter: () => setActiveSkill(skill.id),
		onMouseLeave: () => setActiveSkill(null),
		onFocus: () => setActiveSkill(skill.id),
		onBlur: () => setActiveSkill(null),
		onClick: () => onOpenSkill(skill.id),
	});

	const revealed = phase === "flow" || phase === "ready";
	const portalScale = (stageWidth * layout.portal.size) / 320;

	// Zooms the map into the open skill's dock. On phones the map is taller
	// than the screen, so it only scales toward the dock instead of centring it.
	const zoomLabel = layout.labels[skills.findIndex((s) => s.id === zoomSkill)];
	const zoom = zoomLabel && {
		transformOrigin: `${pct(zoomLabel.x, layout.W)} ${pct(zoomLabel.y, layout.H)}`,
		transform: tall
			? `scale(${ZOOM_TALL})`
			: `translate(${50 - (zoomLabel.x / layout.W) * 100}%, ${
					50 - (zoomLabel.y / layout.H) * 100
			  }%) scale(${ZOOM})`,
	};

	return (
		<section
			className={`river river-${layout.mode} river-phase-${phase} ${
				activeSkill ? "river-focused" : ""
			} ${noWebGL ? "river-flat" : ""} ${zoom ? "river-zoomed" : ""}`}
			aria-label="Skills map"
		>
			<div
				className="river-stage"
				ref={stageRef}
				style={{ aspectRatio: `${layout.W} / ${layout.H}`, ...zoom }}
			>
				{!noWebGL && (
					<WaterCanvas
						layout={layout}
						lit={lit}
						focus={Boolean(activeSkill)}
						revealed={revealed}
						motion={motion}
						onUnsupported={onUnsupported}
					/>
				)}

				<svg
					className="river-svg"
					viewBox={`0 0 ${layout.W} ${layout.H}`}
					aria-hidden="true"
				>
					{layout.rivers.map((r, i) => {
						const skill = skills[r.skill];
						const d = hitPath(r);
						return (
							<g key={i}>
								{noWebGL && (
									<path
										d={d}
										className={`river-fallback ${lit[i] ? "is-lit" : ""}`}
										style={{ strokeWidth: r.widths[r.widths.length - 1] * 0.7 }}
									/>
								)}
								{skill && (
									<path
										d={d}
										className="river-hit"
										style={{ strokeWidth: tall ? 40 : 80 }}
										{...skillHandlers(skill)}
									/>
								)}
							</g>
						);
					})}
				</svg>

				<div
					className="river-portal"
					style={{
						left: pct(layout.portal.x, layout.W),
						top: pct(layout.portal.y, layout.H),
						"--portal-scale": portalScale || 0,
					}}
				>
					<Portal />
				</div>

				<Hummingbird
					label="Work History"
					onClick={onOpenHistory}
					style={{
						left: pct(tall ? 335 : 1200, layout.W),
						top: pct(tall ? 85 : 150, layout.H),
					}}
				/>

				<p
					className="river-name"
					style={{ top: pct(layout.portal.y - (tall ? 170 : 205), layout.H) }}
				>
					{homepage.tagline}
				</p>

				{skills.map((skill, i) => {
					const label = layout.labels[i];
					return (
						<button
							type="button"
							key={skill.id}
							className={`river-skill river-skill-${label.side} ${
								activeSkill === skill.id ? "is-lit" : ""
							}`}
							style={{
								left: pct(label.x, layout.W),
								top: pct(label.y, layout.H),
								width: pct(layout.dock.w, layout.W),
								height: pct(layout.dock.h, layout.H),
								"--skill": skill.color,
								"--delay": `${i * 80}ms`,
							}}
							{...skillHandlers(skill)}
						>
							<span className="river-skill-label">{skill.label}</span>
							<span className="river-skill-tools">
								{skill.tools.slice(0, 3).join(" · ")}
							</span>
						</button>
					);
				})}

				<div
					className="river-shore"
					style={{ top: pct(layout.oceanY - (tall ? 10 : 90), layout.H) }}
				>
					<p className="river-pitch">{homepage.pitch}</p>
					<ul className="river-proof">
						{homepage.proof.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
					<button type="button" className="river-shore-btn" onClick={onOpenContact}>
						Work with me
					</button>
				</div>
			</div>
		</section>
	);
};

export default RiverMap;
