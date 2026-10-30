import React, { useEffect, useRef } from "react";

import "./styles/portal.css";

const clamp = (v) => Math.max(-1, Math.min(1, v));

const SHAKE_STEPS = 32;
// Holding this long gives the strongest shake.
const FULL_CHARGE_MS = 1500;
const STIFF = 16;
const DAMP = 5.2;

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

const Portal = ({ poseRef, bangRef }) => {
	const ref = useRef(null);
	const ringRef = useRef(null);
	const press = useRef(null);
	const body = useRef({
		px: 0,
		py: 0,
		vx: 0,
		vy: 0,
		tx: 0,
		ty: 0,
		hover: 0,
	});

	const kick = useRef(() => {});

	useEffect(() => {
		let frame = 0;
		let last = performance.now();
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const stop = () => {
			cancelAnimationFrame(frame);
			frame = 0;
		};
		const write = (s) => {
			const el = ref.current;
			if (el) {
				el.style.setProperty("--px", s.px.toFixed(3));
				el.style.setProperty("--py", s.py.toFixed(3));
				el.style.setProperty("--hover", s.hover ? "1" : Math.min(Math.hypot(s.px, s.py) * 1.8, 1).toFixed(3));
			}
			if (poseRef) {
				poseRef.current.px = s.px;
				poseRef.current.py = s.py;
			}
		};
		const tick = (now) => {
			frame = 0;
			if (document.hidden) return;
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			const s = body.current;
			if (reduced) {
				s.px = s.tx;
				s.py = s.ty;
				s.vx = 0;
				s.vy = 0;
			} else {
				s.vx += (s.tx - s.px) * STIFF * dt - s.vx * DAMP * dt;
				s.vy += (s.ty - s.py) * STIFF * dt - s.vy * DAMP * dt;
				s.px += s.vx * dt;
				s.py += s.vy * dt;
			}
			const settled =
				!s.hover && Math.hypot(s.px, s.py) < 0.004 && Math.hypot(s.vx, s.vy) < 0.004;
			if (settled) {
				s.px = 0;
				s.py = 0;
				s.vx = 0;
				s.vy = 0;
			}
			write(s);
			if (!settled) frame = requestAnimationFrame(tick);
		};
		const start = () => {
			if (document.hidden || frame) return;
			last = performance.now();
			frame = requestAnimationFrame(tick);
		};
		kick.current = start;
		const onVis = () => {
			if (document.hidden) stop();
			else start();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			stop();
			document.removeEventListener("visibilitychange", onVis);
			kick.current = () => {};
		};
	}, [poseRef]);

	const aim = (event, hovering) => {
		const rect = ref.current.getBoundingClientRect();
		body.current.tx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
		body.current.ty = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);
		body.current.hover = hovering;
		kick.current();
	};

	const onPointerMove = (event) => aim(event, 1);

	const onPointerDown = (event) => {
		ref.current.setPointerCapture(event.pointerId);
		press.current = { x: event.clientX, y: event.clientY, at: performance.now() };
		ringRef.current.classList.add("is-charging");
		aim(event, 1);
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

		const s = body.current;
		s.vx += -dx * (1.2 + 2.4 * power);
		s.vy += -dy * (1.2 + 2.4 * power);

		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			ring.animate(shakeFrames(dx, dy, distance, power), {
				duration: 650 + 700 * power,
				easing: "linear",
			});
		}
		if (navigator.vibrate) {
			navigator.vibrate(Math.round((15 + 35 * distance) * (1 + 2 * power)));
		}
		if (bangRef && bangRef.current) bangRef.current(power, dx, dy);
		kick.current();

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
		body.current.tx = 0;
		body.current.ty = 0;
		body.current.hover = 0;
		kick.current();
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
