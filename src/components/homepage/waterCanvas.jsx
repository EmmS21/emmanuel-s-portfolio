import React, { useEffect, useRef } from "react";

import { MAX_RIVERS, TRAIL, IMPULSE, sizeCanvas } from "./riverStrips";
import { captureGlError, createGlWater } from "./waterGl";

const MAX_PACE = 900;
const DROP = 34;
const DROP_MS = 70;

// Slot 0 is the live finger. Older slots are the path already crossed.
const createTrail = () => {
	const trail = new Float32Array(TRAIL * 4);
	const times = new Float32Array(TRAIL).fill(-1e6);
	const ages = new Float32Array(TRAIL);
	let finger = null;
	let lastDropX = 0;
	let lastDropY = 0;
	let lastDropAt = 0;
	let hasDrop = false;
	return {
		trail,
		ages,
		move: (x, y, now) => {
			finger = { x, y, now };
		},
		leave: () => {
			finger = null;
		},
		update: (now) => {
			if (finger) {
				const dt = Math.max((now - times[0]) / 1000, 0.008);
				let vx = 0;
				let vy = 0;
				if (times[0] > -1e5) {
					vx = (finger.x - trail[0]) / dt;
					vy = (finger.y - trail[1]) / dt;
					const pace = Math.hypot(vx, vy);
					if (pace > MAX_PACE * 4) {
						vx = 0;
						vy = 0;
					} else if (pace > MAX_PACE) {
						vx *= MAX_PACE / pace;
						vy *= MAX_PACE / pace;
					}
				}
				const moved = hasDrop ? Math.hypot(finger.x - lastDropX, finger.y - lastDropY) : DROP;
				if (!hasDrop || moved >= DROP || (moved > 8 && now - lastDropAt > DROP_MS)) {
					trail.copyWithin(4, 0, (TRAIL - 1) * 4);
					times.copyWithin(1, 0, TRAIL - 1);
					lastDropX = finger.x;
					lastDropY = finger.y;
					lastDropAt = now;
					hasDrop = true;
				}
				trail.set([finger.x, finger.y, vx, vy], 0);
				times[0] = now;
			}
			times.forEach((t, i) => {
				ages[i] = (now - t) / 1000;
			});
		},
	};
};

const between = (low, high) => low + Math.random() * (high - low);

// Pushes from the portrait. Newest first. Ages in seconds.
const createImpulses = (portal) => {
	const list = new Float32Array(IMPULSE * 4);
	const ages = new Float32Array(IMPULSE).fill(100);
	const pose = new Float32Array(4);
	let lastPx = 0;
	let lastPy = 0;
	let lastAt = 0;
	let lastSpawn = 0;
	const spawn = (x, y, power) => {
		list.copyWithin(4, 0, (IMPULSE - 1) * 4);
		ages.copyWithin(1, 0, IMPULSE - 1);
		list.set([x, y, power, 0], 0);
		ages[0] = 0;
	};
	// Keep traveling crests. A hard shake adds another crest; a tiny
	// nudge only feeds the one that just left the sea.
	const shove = (x, y, power) => {
		if (ages[0] < 0.36 && list[2] > 0.04) {
			list[2] = Math.min(list[2] + power * 0.4, 2.1);
			return;
		}
		let oldest = 0;
		for (let i = 1; i < IMPULSE; i++) {
			if (ages[i] > ages[oldest]) oldest = i;
		}
		if (ages[oldest] < 4) {
			list[2] = Math.min(list[2] + power * 0.3, 2.1);
			return;
		}
		spawn(x, y, power);
	};
	return {
		list,
		ages,
		pose,
		setPose: (px, py) => {
			pose[0] = px;
			pose[1] = py;
		},
		bang: (power, dx, dy) => {
			shove(portal.x + dx * 42, portal.y + dy * 42, Math.max(0.7, power * 1.35));
			lastSpawn = performance.now();
		},
		update: (now, dt) => {
			if (lastAt) {
				const idt = Math.max((now - lastAt) / 1000, 0.016);
				pose[2] = (pose[0] - lastPx) / idt;
				pose[3] = (pose[1] - lastPy) / idt;
			}
			lastPx = pose[0];
			lastPy = pose[1];
			lastAt = now;
			const speed = Math.hypot(pose[2], pose[3]);
			const gap = speed > 1.4 ? 160 : speed > 0.8 ? 260 : 400;
			if (speed > 0.45 && now - lastSpawn > gap) {
				const n = speed || 1;
				shove(
					portal.x + (pose[2] / n) * 38,
					portal.y + (pose[3] / n) * 38,
					Math.min(0.4 + speed * 0.5, 1.6)
				);
				lastSpawn = now;
			}
			for (let i = 0; i < IMPULSE; i++) ages[i] += dt;
		},
	};
};

// One moving patch of wind at a time, plus independent rain.
// `out` is (wind, direction, falling rain, lightning). `level` is river fullness.
// Rain and water level are separate clocks: drops stop first, the flood recedes later.
const createWeather = (view) => {
	const out = new Float32Array([0, 1, 0, 0]);
	const gust = new Float32Array(4);
	const level = new Float32Array(1);
	let puff = null;
	let nextPuff = between(2, 7);
	let shower = { end: 0, next: between(6, 16), power: 0, thunder: false, flashAt: 1e9, flashes: 0 };
	return {
		out,
		gust,
		level,
		update: (t, dt) => {
			if (!puff && t > nextPuff) {
				const windDir = Math.abs(out[0]) > 0.05 ? out[1] : Math.random() < 0.5 ? 1 : -1;
				const wet = out[2] > 0.2;
				const dense = wet || Math.random() < 0.42;
				puff = {
					x: windDir > 0 ? -20 : view.W + 20,
					y: between(0.1, 0.82) * view.H,
					vx: windDir * between(wet ? 16 : 20, wet ? 36 : 48) * (dense ? 1.2 : 1),
					vy: between(-12, 12),
					radius: between(dense ? 160 : 200, dense ? (wet ? 250 : 220) : 280),
					peak: dense ? between(0.95, 1.4) : between(0.4, 0.75),
					born: t,
					life: between(wet ? 12 : 8, wet ? 20 : 16),
					wobble: between(0.12, 0.4),
				};
				out[1] = windDir;
				nextPuff = t + puff.life + (Math.random() < 0.28 ? between(0.5, 2) : between(5, 26));
			}
			if (puff) {
				const age = (t - puff.born) / puff.life;
				if (age >= 1) {
					puff = null;
				} else {
					puff.x += (puff.vx + out[1] * out[0] * 28) * dt;
					puff.y += puff.vy * dt + Math.sin(t * puff.wobble) * 6 * dt;
					puff.vy += Math.sin(t * 0.18 + puff.wobble) * 4 * dt;
					const swell = Math.pow(Math.sin(age * Math.PI), 0.62);
					const power = puff.peak * swell;
					out[0] = power;
					gust.set([puff.x, puff.y, puff.radius, power]);
				}
			}
			if (!puff) {
				out[0] += (0 - out[0]) * Math.min(dt * 2.2, 1);
				gust[3] += (0 - gust[3]) * Math.min(dt * 3, 1);
			}
			if (t > shower.next) {
				const roll = Math.random();
				const drizzle = roll < 0.42;
				const downpour = roll > 0.8;
				const power = drizzle
					? between(0.12, 0.3)
					: downpour
						? between(0.8, 1)
						: between(0.35, 0.65);
				const life = drizzle
					? between(7, 16)
					: downpour
						? between(16, 32)
						: between(10, 20);
				const thunder = downpour ? Math.random() < 0.8 : !drizzle && Math.random() < 0.18;
				shower = {
					end: t + life,
					next: t + life + between(14, 50),
					power,
					thunder,
					flashAt: thunder ? t + between(1.5, 6) : 1e9,
					flashes: 0,
				};
			}
			const falling = t < shower.end ? shower.power : 0;
			if (!puff && falling > 0.2 && nextPuff > t + 2.8) {
				nextPuff = t + between(0.6, 2.4);
			}
			out[2] += (falling - out[2]) * Math.min(dt * 0.55, 1);
			if (falling >= level[0]) {
				level[0] += (falling - level[0]) * Math.min(dt * 0.18, 1);
			} else {
				const drain = 0.022 + 0.03 * (1 - level[0]);
				level[0] += (falling - level[0]) * Math.min(dt * drain, 1);
			}
			let flash = 0;
			if (shower.thunder && t < shower.end && t >= shower.flashAt) {
				const a = t - shower.flashAt;
				if (a < 0.05) flash = 1;
				else if (a > 0.08 && a < 0.14) flash = 0.7;
				else if (a > 0.2 && a < 0.25) flash = 0.35;
				if (a > 0.32) {
					shower.flashes += 1;
					shower.flashAt =
						shower.flashes < 3 && Math.random() < 0.5
							? t + between(2, 9)
							: shower.end + 1;
				}
			}
			out[3] = flash;
		},
	};
};

const WaterCanvas = ({ layout, lit, focus, revealed, motion, poseRef, bangRef, onUnsupported }) => {
	const canvasRef = useRef(null);
	const state = useRef({ lit, focus, revealed, motion, poseRef, bangRef });
	state.current = { lit, focus, revealed, motion, poseRef, bangRef };
	const redraw = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		let failed = false;
		const fail = (error) => {
			if (failed) return;
			failed = true;
			captureGlError(error);
			onUnsupported();
		};
		let water;
		try {
			water = createGlWater(canvas, layout);
		} catch (error) {
			fail(error);
			return undefined;
		}
		if (!water) {
			fail(new Error("WebGL context unavailable"));
			return undefined;
		}
		const onLost = (event) => {
			event.preventDefault();
			fail(new Error("WebGL context lost"));
		};
		canvas.addEventListener("webglcontextlost", onLost);

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const current = {
			lit: new Float32Array(MAX_RIVERS),
			focus: 0,
			reveal: state.current.revealed && !state.current.motion ? 1 : 0,
		};

		const trail = createTrail();
		const weather = createWeather(layout);
		const forces = createImpulses(layout.portal);
		if (state.current.bangRef) state.current.bangRef.current = forces.bang;
		const stage = canvas.parentElement;
		const onMove = (event) => {
			const rect = canvas.getBoundingClientRect();
			trail.move(
				((event.clientX - rect.left) / rect.width) * layout.W,
				((event.clientY - rect.top) / rect.height) * layout.H,
				performance.now()
			);
		};
		const onLeave = () => trail.leave();
		stage.addEventListener("pointermove", onMove);
		stage.addEventListener("pointerleave", onLeave);

		let frame = 0;
		let last = performance.now();
		const start = last;

		const stop = () => {
			cancelAnimationFrame(frame);
			frame = 0;
		};

		const render = (now) => {
			frame = 0;
			if (document.hidden) return;
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

			if (sizeCanvas(canvas, dpr)) water.paintGround();
			trail.update(now);
			const time = moving ? (now - start) / 1000 : 4;
			if (moving) weather.update(time, dt);
			const poseHold = state.current.poseRef;
			if (poseHold && poseHold.current) {
				forces.setPose(poseHold.current.px, poseHold.current.py);
			}
			if (moving) forces.update(now, dt);
			try {
				water.draw({
					time,
					weather: weather.out,
					gust: weather.gust,
					level: weather.level,
					pose: forces.pose,
					impulse: forces.list,
					impAge: forces.ages,
					reveal: current.reveal,
					focus: current.focus,
					lit: current.lit,
					trail: trail.trail,
					ages: trail.ages,
				});
			} catch (error) {
				stop();
				fail(error);
				return;
			}

			if (moving) frame = requestAnimationFrame(render);
		};

		const play = () => {
			if (document.hidden || frame) return;
			last = performance.now();
			frame = requestAnimationFrame(render);
		};

		redraw.current = () => {
			if (!state.current.motion) render(performance.now());
		};
		sizeCanvas(canvas, dpr);
		water.paintGround();
		play();
		const onVis = () => {
			if (document.hidden) stop();
			else play();
		};
		document.addEventListener("visibilitychange", onVis);

		const observer = new ResizeObserver(() => {
			sizeCanvas(canvas, dpr);
			water.paintGround();
			redraw.current();
		});
		observer.observe(canvas);

		return () => {
			stop();
			document.removeEventListener("visibilitychange", onVis);
			canvas.removeEventListener("webglcontextlost", onLost);
			observer.disconnect();
			stage.removeEventListener("pointermove", onMove);
			stage.removeEventListener("pointerleave", onLeave);
			if (state.current.bangRef) state.current.bangRef.current = null;
			water.destroy();
			redraw.current = null;
		};
	}, [layout, onUnsupported]);

	useEffect(() => {
		if (redraw.current) redraw.current();
	}, [lit, focus, revealed]);

	return <canvas ref={canvasRef} className="river-canvas" aria-hidden="true" />;
};

export default WaterCanvas;
