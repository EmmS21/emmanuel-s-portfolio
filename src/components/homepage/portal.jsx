import React, { useRef } from "react";

import "./styles/portal.css";

const clamp = (v) => Math.max(-1, Math.min(1, v));

const SHAKE_STEPS = 32;
// Holding this long gives the strongest shake.
const FULL_CHARGE_MS = 1500;

// A damped oscillation: pushed away from the click, then rocking back to rest.
// strength is how far from the centre (0..1); power is how long it was held (0..1).
const shakeFrames = (dx, dy, strength, power) => {
	const gain = 1 + 3 * power;
	return Array.from({ length: SHAKE_STEPS + 1 }, (_, i) => {
		const t = i / SHAKE_STEPS;
		const swing = Math.exp(-5 * t) * Math.sin(t * Math.PI * (9 + 6 * power)) * gain;
		const push = 14 * strength * swing;
		const pulse = 1 - 0.05 * (1 - strength) * swing;
		return {
			transform: `translate(${(-dx * push).toFixed(2)}px, ${(-dy * push).toFixed(2)}px) rotate(${(dx * 4 * strength * swing).toFixed(2)}deg) scale(${pulse.toFixed(4)})`,
		};
	});
};

const Portal = () => {
	const ref = useRef(null);
	const ringRef = useRef(null);
	const press = useRef(null);

	// --px and --py run -1..1 from the centre; the CSS turns them into tilt and depth.
	const onPointerMove = (event) => {
		const rect = ref.current.getBoundingClientRect();
		const style = ref.current.style;
		style.setProperty("--px", clamp(((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
		style.setProperty("--py", clamp(((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
		style.setProperty("--hover", "1");
	};

	const onPointerDown = (event) => {
		ref.current.setPointerCapture(event.pointerId);
		press.current = { x: event.clientX, y: event.clientY, at: performance.now() };
		ringRef.current.classList.add("is-charging");
	};

	const onPointerUp = () => {
		if (!press.current) return;
		const { x: clientX, y: clientY, at } = press.current;
		press.current = null;
		const ring = ringRef.current;
		ring.classList.remove("is-charging");

		const power = Math.min((performance.now() - at) / FULL_CHARGE_MS, 1);
		const rect = ring.getBoundingClientRect();
		const x = ((clientX - rect.left) / rect.width) * 2 - 1;
		const y = ((clientY - rect.top) / rect.height) * 2 - 1;
		const distance = Math.min(Math.hypot(x, y), 1);
		const dx = distance ? x / distance : 0;
		const dy = distance ? y / distance : 0;

		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			ring.animate(shakeFrames(dx, dy, distance, power), {
				duration: 650 + 700 * power,
				easing: "linear",
			});
		}
		if (navigator.vibrate) {
			navigator.vibrate(Math.round((15 + 35 * distance) * (1 + 2 * power)));
		}

		const wave = document.createElement("span");
		wave.className = "portal-hit";
		wave.style.left = `${clientX - rect.left}px`;
		wave.style.top = `${clientY - rect.top}px`;
		wave.style.setProperty("--reach", (5 + 6 * power).toFixed(2));
		wave.addEventListener("animationend", () => wave.remove());
		ring.appendChild(wave);
	};

	const onPointerCancel = () => {
		press.current = null;
		ringRef.current.classList.remove("is-charging");
	};

	const onPointerLeave = () => {
		["--px", "--py", "--hover"].forEach((name) => ref.current.style.setProperty(name, "0"));
	};

	return (
		<div
			className="homepage-photo-sanctuary"
			ref={ref}
			onPointerMove={onPointerMove}
			onPointerDown={onPointerDown}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerCancel}
			onPointerLeave={onPointerLeave}
		>
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
				<div className="homepage-photo-ring" ref={ringRef}>
					<img
						src="homepage.jpg"
						alt="Emmanuel Sibanda with surfboard"
						className="homepage-photo"
					/>
				</div>
			</div>
		</div>
	);
};

export default Portal;
