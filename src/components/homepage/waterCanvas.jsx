import React, { useEffect, useRef } from "react";

import { MAX_RIVERS, TRAIL, sizeCanvas } from "./riverStrips";
import { createGlWater, drawGround } from "./waterGl";

const MAX_PACE = 900;

// Keeps the last TRAIL cursor samples in map units, newest first.
const createTrail = () => {
	const trail = new Float32Array(TRAIL * 4);
	const times = new Float32Array(TRAIL).fill(-1e6);
	const ages = new Float32Array(TRAIL);
	let pointer = null;
	let lastAt = 0;
	return {
		trail,
		ages,
		move: (x, y, now) => {
			pointer = { x, y, now };
		},
		update: (now) => {
			if (pointer && now - lastAt > 40) {
				const dt = Math.max((pointer.now - times[0]) / 1000, 0.016);
				let vx = (pointer.x - trail[0]) / dt;
				let vy = (pointer.y - trail[1]) / dt;
				const pace = Math.hypot(vx, vy);
				if (times[0] < -1e5 || pace > MAX_PACE * 4) {
					vx = 0;
					vy = 0;
				} else if (pace > MAX_PACE) {
					vx *= MAX_PACE / pace;
					vy *= MAX_PACE / pace;
				}
				trail.copyWithin(4, 0, (TRAIL - 1) * 4);
				times.copyWithin(1, 0, TRAIL - 1);
				trail.set([pointer.x, pointer.y, vx, vy], 0);
				times[0] = pointer.now;
				lastAt = now;
				pointer = null;
			}
			times.forEach((t, i) => {
				ages[i] = (now - t) / 1000;
			});
		},
	};
};

const WaterCanvas = ({ layout, lit, focus, revealed, motion, onUnsupported }) => {
	const groundRef = useRef(null);
	const waterRef = useRef(null);
	const state = useRef({ lit, focus, revealed, motion });
	state.current = { lit, focus, revealed, motion };
	const redraw = useRef(null);

	useEffect(() => {
		const canvas = waterRef.current;
		let water;
		let paintGround;
		try {
			paintGround = drawGround(groundRef.current, layout);
			water = paintGround && createGlWater(canvas, layout);
		} catch (error) {
			water = null;
		}
		if (!water) {
			onUnsupported();
			return undefined;
		}

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const current = {
			lit: new Float32Array(MAX_RIVERS),
			focus: 0,
			reveal: state.current.revealed && !state.current.motion ? 1 : 0,
		};

		const trail = createTrail();
		const stage = canvas.parentElement;
		const onMove = (event) => {
			const rect = canvas.getBoundingClientRect();
			trail.move(
				((event.clientX - rect.left) / rect.width) * layout.W,
				((event.clientY - rect.top) / rect.height) * layout.H,
				performance.now()
			);
		};
		stage.addEventListener("pointermove", onMove);

		let frame = 0;
		let last = performance.now();
		const start = last;

		const render = (now) => {
			const { lit: litNow, focus: focusNow, revealed: open, motion: moving } = state.current;
			const dt = Math.min((now - last) / 1000, 0.1);
			last = now;
			const ease = moving ? Math.min(dt * 6, 1) : 1;

			litNow.forEach((on, i) => {
				current.lit[i] += ((on ? 1 : 0) - current.lit[i]) * ease;
			});
			current.focus += ((focusNow ? 1 : 0) - current.focus) * ease;
			const target = open ? 1 : 0;
			current.reveal = moving ? Math.min(current.reveal + dt / 1.1, target) : target;

			if (sizeCanvas(canvas, dpr)) paintGround();
			trail.update(now);
			water.draw({
				time: moving ? (now - start) / 1000 : 4,
				reveal: current.reveal,
				focus: current.focus,
				lit: current.lit,
				trail: trail.trail,
				ages: trail.ages,
			});

			if (moving) frame = requestAnimationFrame(render);
		};

		redraw.current = () => {
			if (!state.current.motion) render(performance.now());
		};
		paintGround();
		frame = requestAnimationFrame(render);

		const observer = new ResizeObserver(() => {
			if (sizeCanvas(canvas, dpr)) paintGround();
			redraw.current();
		});
		observer.observe(canvas);

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			stage.removeEventListener("pointermove", onMove);
			water.destroy();
			redraw.current = null;
		};
	}, [layout, onUnsupported]);

	useEffect(() => {
		if (redraw.current) redraw.current();
	}, [lit, focus, revealed]);

	return (
		<>
			<canvas ref={groundRef} className="river-canvas" aria-hidden="true" />
			<canvas ref={waterRef} className="river-canvas" aria-hidden="true" />
		</>
	);
};

export default WaterCanvas;
