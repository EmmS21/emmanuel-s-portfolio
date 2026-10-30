const SAMPLES = 140;

const curve = (p0, p1, p2, p3) => (t) => {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return {
		x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
		y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
	};
};

// Samples a path and pushes each point sideways by `wiggle(t)`,
// which gives the river its meanders.
const river = ({ path, width, wiggle = () => 0, skill }) => {
	const base = Array.from({ length: SAMPLES + 1 }, (_, i) => path(i / SAMPLES));
	const points = base.map((p, i) => {
		const prev = base[Math.max(i - 1, 0)];
		const next = base[Math.min(i + 1, SAMPLES)];
		const dx = next.x - prev.x;
		const dy = next.y - prev.y;
		const len = Math.hypot(dx, dy) || 1;
		const w = wiggle(i / SAMPLES);
		return { x: p.x - (dy / len) * w, y: p.y + (dx / len) * w };
	});
	return {
		points,
		widths: points.map((_, i) => width(i / SAMPLES)),
		skill,
	};
};

const pointAt = (r, t) => r.points[Math.round(t * SAMPLES)];

const hitPath = (r) =>
	r.points
		.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
		.join(" ");

const wide = (count) => {
	const W = 1600;
	const H = 1000;
	const portal = { x: 800, y: 250, size: 0.2 };
	const ends = Array.from(
		{ length: count },
		(_, i) => 200 + (i * 1200) / Math.max(count - 1, 1)
	);
	const mid = (count - 1) / 2;
	const oceanY = 880;

	// Sources sit around the bottom of the portal and leave it outward.
	const rim = 128;
	const rivers = ends.map((ex, i) => {
		const k = i - mid;
		const angle = Math.PI / 2 - k * (Math.PI / 6);
		const out = { x: Math.cos(angle), y: Math.sin(angle) };
		return river({
			path: curve(
				{ x: portal.x + out.x * rim, y: portal.y + out.y * rim },
				{ x: portal.x + out.x * (rim + 140), y: portal.y + out.y * (rim + 140) },
				{ x: ex, y: 520 },
				{ x: ex, y: 660 }
			),
			width: (t) => 26 + 30 * t,
			wiggle: (t) => 16 * Math.sin(t * Math.PI * 2.4 + i * 1.3) * Math.sin(Math.PI * t),
			skill: i,
		});
	});

	return {
		mode: "wide",
		W,
		H,
		portal,
		oceanY,
		rivers,
		labels: rivers.map((r) => ({ ...pointAt(r, 1), side: "center" })),
	};
};

const tall = (count) => {
	const W = 400;
	const top = 440;
	const step = 200;
	const H = top + (count - 1) * step + 320;
	const portal = { x: 200, y: 190, size: 0.62 };
	const oceanY = H - 150;
	const trunkX = (y) => 200 + 95 * Math.cos((Math.PI * (y - top)) / step);

	const branchY = (i) => top + i * step - 80;
	const trunkEnd = branchY(count - 1) + 20;
	const trunk = river({
		path: (t) => {
			const y = 320 + t * (trunkEnd - 320);
			return { x: trunkX(y), y };
		},
		width: (t) => 34 + 12 * t,
		skill: -1,
	});

	const labels = [];
	const tributaries = Array.from({ length: count }, (_, i) => {
		const y = top + i * step;
		const left = i % 2 === 0;
		const lx = left ? 130 : 270;
		labels.push({ x: lx, y, side: left ? "left" : "right" });
		const by = branchY(i);
		return river({
			path: curve(
				{ x: trunkX(by), y: by },
				{ x: trunkX(by) + (left ? -30 : 30), y: by + 30 },
				{ x: lx, y: y - 50 },
				{ x: lx, y }
			),
			width: (t) => 22 + 12 * t,
			skill: i,
		});
	});

	return {
		mode: "tall",
		W,
		H,
		portal,
		oceanY,
		rivers: [trunk, ...tributaries],
		labels,
	};
};

// Each skill's text sits on a landing dock at its river's mouth.
// Some docks also have a boat or raft tied upstream of them.
const DOCK = { wide: { w: 236, h: 92 }, tall: { w: 200, h: 104 } };
const MOORED = ["boat", "raft", null];
const ROPE = 7;

// Index of the sample `reach` map units upstream of the mouth, or -1.
const upstream = (r, reach) => {
	let d = 0;
	for (let i = r.points.length - 1; i > 0; i--) {
		d += Math.hypot(r.points[i].x - r.points[i - 1].x, r.points[i].y - r.points[i - 1].y);
		if (d >= reach) return i - 1;
	}
	return -1;
};

const moor = (r, kind, dock, side) => {
	const water = r.widths[r.widths.length - 1];
	const w = water * (kind === "boat" ? 0.42 : 0.55);
	const h = w * (kind === "boat" ? 2.6 : 1.7);
	const at = upstream(r, dock.h / 2 + ROPE + h / 2);
	if (at < SAMPLES * 0.4) return null;
	const prev = r.points[at - 1];
	const next = r.points[at + 1];
	const len = Math.hypot(next.x - prev.x, next.y - prev.y) || 1;
	const tx = (next.x - prev.x) / len;
	const ty = (next.y - prev.y) / len;
	const shift = (r.widths[at] - w) * 0.25 * side;
	return {
		kind,
		x: r.points[at].x + ty * shift,
		y: r.points[at].y - tx * shift,
		tx,
		ty,
		w,
		h,
		rope: ROPE,
	};
};

// Portrait ring radius as a share of the portal's width (a 226px ring in a 320px portal).
const PHOTO = 0.353;
// The sea's coast sits past the river sources, so the rivers flow out of it.
const COAST = 1.85;

const withCrafts = (layout) => {
	const dock = DOCK[layout.mode];
	const { portal } = layout;
	const inner = portal.size * layout.W * PHOTO;
	const sea = {
		kind: "sea",
		x: portal.x,
		y: portal.y,
		tx: 0,
		ty: 1,
		w: inner * COAST * 2,
		h: inner * COAST * 2,
		inner,
		river: -1,
	};
	const docks = layout.labels.flatMap((label, i) => {
		const river = layout.rivers.findIndex((r) => r.skill === i);
		const kind = MOORED[i % MOORED.length];
		const tied = kind && moor(layout.rivers[river], kind, dock, i % 2 ? 1 : -1);
		return [
			{ kind: "dock", x: label.x, y: label.y, tx: 0, ty: 1, w: dock.w, h: dock.h, rope: 0, river },
			...(tied ? [{ ...tied, river }] : []),
		];
	});
	return { ...layout, dock, crafts: [sea, ...docks] };
};

const buildLayout = (mode, count) => withCrafts(mode === "tall" ? tall(count) : wide(count));

export { hitPath };
export default buildLayout;
