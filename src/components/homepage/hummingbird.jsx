import React, { useEffect, useRef } from "react";

import "./styles/hummingbird.css";

// How close (px) the cursor must be before the bird leans toward it.
const NOTICE = 320;
const LEAN = 22;
const WING = "M44 55 C41 36 25 14 5 3 C8 21 18 37 32 46 L7 48 C13 59 31 65 44 55 Z";

const Hummingbird = ({ label, onClick, style }) => {
	const ref = useRef(null);

	useEffect(() => {
		const onMove = (event) => {
			const el = ref.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const dx = event.clientX - (rect.left + rect.width / 2);
			const dy = event.clientY - (rect.top + rect.height / 2);
			const distance = Math.hypot(dx, dy);
			const pull = distance < NOTICE ? (1 - distance / NOTICE) * LEAN : 0;
			const unit = distance || 1;
			el.style.setProperty("--face", dx < 0 ? "-1" : "1");
			el.style.setProperty("--lean-x", `${((dx / unit) * pull).toFixed(1)}px`);
			el.style.setProperty("--lean-y", `${((dy / unit) * pull).toFixed(1)}px`);
		};
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, []);

	return (
		<button type="button" className="bird" ref={ref} style={style} onClick={onClick}>
			<span className="bird-flight">
				<svg className="bird-svg" viewBox="0 0 104 116" aria-hidden="true">
					<defs>
						<linearGradient id="bird-body" x1="0" y1="1" x2="1" y2="0">
							<stop offset="0%" stopColor="#0f7f74" />
							<stop offset="55%" stopColor="#2fbf7f" />
							<stop offset="100%" stopColor="#b8ee6a" />
						</linearGradient>
						<linearGradient id="bird-wing" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#d6f78a" />
							<stop offset="60%" stopColor="#5fd38d" />
							<stop offset="100%" stopColor="#1c9c7c" />
						</linearGradient>
					</defs>

					<g className="bird-wing bird-wing-ghost">
						<path d={WING} fill="url(#bird-wing)" />
					</g>
					<path
						d="M101 21 Q87 23.5 73 28 C67 22 57 24 55 33 C51 49 45 62 35 76 C27 88 22 100 19 113 C30 99 45 87 56 76 C66 65 70 51 71 41 C72 35 74 32 77 30.5 Q89 25 101 21 Z"
						fill="url(#bird-body)"
					/>
					<circle cx="66" cy="31.5" r="2" fill="#f4fbf2" />
					<g className="bird-wing">
						<path d={WING} fill="url(#bird-wing)" />
					</g>
				</svg>
			</span>
			<span className="bird-banner">{label}</span>
		</button>
	);
};

export default Hummingbird;
