import React, { useEffect, useRef } from "react";

import "./styles/hummingbird.css";

// How close (px) the cursor must be before the bird leans toward it.
const NOTICE = 320;
const LEAN = 22;
const WING = [
	"M64 52 C58 40 46 42 50 58 C54 64 64 60 64 52 Z",
	"M60 54 C48 30 24 8 4 2 C12 18 30 38 58 52 Z",
	"M58 56 C44 40 18 26 2 24 C10 38 30 52 56 60 Z",
	"M56 60 C44 52 18 50 4 54 C14 62 34 64 56 62 Z",
	"M56 62 C46 60 24 64 10 68 C22 72 40 66 56 62 Z",
];

const Hummingbird = ({ label, onClick, onPointerEnter, onFocus, style }) => {
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
		<button
			type="button"
			className="bird"
			ref={ref}
			style={style}
			onClick={onClick}
			onPointerEnter={onPointerEnter}
			onFocus={onFocus}
		>
			<span className="bird-flight">
				<svg className="bird-svg" viewBox="0 0 132 136" aria-hidden="true">
					<defs>
						<linearGradient id="hb-body" x1="0" y1="1" x2="1" y2="0">
							<stop offset="0%" stopColor="#0b6a58" />
							<stop offset="42%" stopColor="#1db87a" />
							<stop offset="78%" stopColor="#8ee85c" />
							<stop offset="100%" stopColor="#d8f56e" />
						</linearGradient>
						<linearGradient id="hb-belly" x1="0.15" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#eef8e8" />
							<stop offset="100%" stopColor="#7dcaa0" stopOpacity="0.2" />
						</linearGradient>
						<linearGradient id="hb-wing" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#f2ffc4" />
							<stop offset="40%" stopColor="#7ee08f" />
							<stop offset="100%" stopColor="#147a66" />
						</linearGradient>
						<linearGradient id="hb-tail" x1="0" y1="0" x2="0.8" y2="1">
							<stop offset="0%" stopColor="#0a3d34" />
							<stop offset="55%" stopColor="#1a8f6c" />
							<stop offset="100%" stopColor="#5ad07e" />
						</linearGradient>
						<linearGradient id="hb-beak" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#f4f7f2" />
							<stop offset="55%" stopColor="#d5ddd4" />
							<stop offset="100%" stopColor="#8a948c" />
						</linearGradient>
						<linearGradient id="hb-gorget" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#7cffb0" />
							<stop offset="45%" stopColor="#2ad4c4" />
							<stop offset="100%" stopColor="#c45cff" />
						</linearGradient>
					</defs>

					<g className="bird-wing bird-wing-far">
						<path d="M72 58 C64 74 42 96 16 104 C38 86 58 68 72 56 Z" fill="url(#hb-wing)" />
					</g>

					<g className="bird-wing bird-wing-ghost">
						{WING.map((d) => (
							<path key={d} d={d} fill="url(#hb-wing)" />
						))}
					</g>

					<path d="M52 88 L8 118 L18 128 L56 94 Z" fill="url(#hb-tail)" />
					<path d="M56 90 L22 126 L32 134 L60 96 Z" fill="url(#hb-tail)" />
					<path d="M60 92 L40 128 L50 134 L66 98 Z" fill="url(#hb-tail)" />
					<path d="M64 94 L54 128 L62 130 L70 98 Z" fill="url(#hb-tail)" />
					<path d="M54 90 L14 122" stroke="#082822" strokeWidth="0.7" opacity="0.35" />
					<path d="M58 92 L28 128" stroke="#082822" strokeWidth="0.7" opacity="0.35" />
					<path d="M62 94 L46 128" stroke="#082822" strokeWidth="0.7" opacity="0.28" />

					<path
						d="M82 46 C68 54 52 72 46 92 C44 98 52 102 60 94 C72 80 84 60 82 46 Z"
						fill="url(#hb-body)"
					/>
					<path
						d="M78 54 C66 64 54 78 50 92 C58 94 70 78 76 62 Z"
						fill="url(#hb-belly)"
					/>
					<path
						d="M80 48 C76 56 74 64 78 68 C84 60 86 52 82 46 Z"
						fill="url(#hb-gorget)"
					/>
					<path d="M58 96 C56 104 54 110 58 112 C62 106 62 100 60 96 Z" fill="#0d4a40" opacity="0.7" />

					<path
						d="M86 26 C76 18 60 20 58 34 C56 44 68 52 80 48 C90 44 94 34 86 26 Z"
						fill="url(#hb-body)"
					/>
					<path
						d="M74 22 C68 22 64 26 64 31 C70 28 78 26 84 28 C80 24 76 22 74 22 Z"
						fill="#d8f56e"
						opacity="0.42"
					/>
					<ellipse cx="72" cy="36" rx="6.5" ry="5.2" fill="#0a3d34" opacity="0.18" />

					<circle cx="70" cy="33" r="3.1" fill="#07110e" />
					<circle cx="70.9" cy="32.1" r="0.9" fill="#f6fff4" />
					<circle cx="69.4" cy="33.6" r="0.45" fill="#4a7a6a" />

					<g className="bird-wing">
						{WING.map((d) => (
							<path key={d} d={d} fill="url(#hb-wing)" />
						))}
						<path
							d="M60 54 C48 32 28 12 8 4"
							fill="none"
							stroke="#f7ffd4"
							strokeWidth="0.9"
							strokeLinecap="round"
							opacity="0.55"
						/>
						<path
							d="M58 56 C44 42 22 30 6 26"
							fill="none"
							stroke="#0d4a40"
							strokeWidth="0.55"
							opacity="0.28"
						/>
						<path
							d="M56 60 C44 54 22 52 8 56"
							fill="none"
							stroke="#0d4a40"
							strokeWidth="0.55"
							opacity="0.28"
						/>
						<path
							d="M54 62 C42 64 24 70 10 76"
							fill="none"
							stroke="#0d4a40"
							strokeWidth="0.5"
							opacity="0.22"
						/>
					</g>

					<path d="M128 12 L84 28 L82 34 Q104 24 128 12 Z" fill="url(#hb-beak)" />
					<path d="M128 12 L84 28 L83 31 Q104 22 128 12 Z" fill="#f8fbf6" />
					<path
						d="M84 28 L128 12"
						fill="none"
						stroke="#2a332e"
						strokeWidth="0.9"
						strokeLinecap="round"
					/>
					<ellipse cx="92" cy="26.5" rx="1.1" ry="0.7" fill="#2a332e" opacity="0.45" />
				</svg>
			</span>
			<span className="bird-banner">{label}</span>
		</button>
	);
};

export default Hummingbird;
