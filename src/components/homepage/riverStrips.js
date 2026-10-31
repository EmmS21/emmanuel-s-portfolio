export const MAX_RIVERS = 8;
// Path points the water keeps. Spaced by distance, not time, so a
// long drag still fits without growing the per-pixel wake loop.
export const TRAIL = 16;
// Pushes from the portrait. Live several seconds so a wave can reach a dock.
export const IMPULSE = 8;
// Share of each strip's half-width that is water; the rest is wet bank.
export const WATER = 0.5;

// Two triangles per sample step. side runs -1..1 across the strip,
// t runs 0..1 from source to mouth, (tx, ty) points downstream.
export const buildStrips = (rivers) => {
	const out = { pos: [], side: [], along: [], t: [], index: [], tan: [], half: [] };
	const mouth = new Float32Array(MAX_RIVERS);
	rivers.forEach((r, ri) => {
		const n = r.points.length;
		let distance = 0;
		const verts = r.points.map((p, i) => {
			const prev = r.points[Math.max(i - 1, 0)];
			const next = r.points[Math.min(i + 1, n - 1)];
			if (i > 0) distance += Math.hypot(p.x - prev.x, p.y - prev.y);
			const dx = next.x - prev.x;
			const dy = next.y - prev.y;
			const len = Math.hypot(dx, dy) || 1;
			const half = r.widths[i] / 2 / WATER;
			const nx = (-dy / len) * half;
			const ny = (dx / len) * half;
			return {
				l: [p.x + nx, p.y + ny],
				r: [p.x - nx, p.y - ny],
				d: distance,
				t: i / (n - 1),
				tan: [dx / len, dy / len],
				half,
			};
		});
		for (let i = 0; i < n - 1; i++) {
			const a = verts[i];
			const b = verts[i + 1];
			[
				[a.l, -1, a],
				[a.r, 1, a],
				[b.l, -1, b],
				[a.r, 1, a],
				[b.r, 1, b],
				[b.l, -1, b],
			].forEach(([xy, s, v]) => {
				out.pos.push(xy[0], xy[1]);
				out.side.push(s);
				out.along.push(v.d);
				out.t.push(v.t);
				out.index.push(ri);
				out.tan.push(v.tan[0], v.tan[1]);
				out.half.push(v.half);
			});
		}
		mouth[ri] = distance;
	});
	return Object.fromEntries([
		["count", out.side.length],
		["mouth", mouth],
		...Object.entries(out).map(([key, list]) => [key, new Float32Array(list)]),
	]);
};

const KINDS = { dock: 0, boat: 1, raft: 2, sea: 3 };
// Room around each craft for its shadow and ripples.
const PAD = 16;

// One quad per craft. local is (across, downstream) in map units from the
// craft's centre; shape is (kind, seed, river index or -1, rope length or
// the portrait radius for the sea).
export const buildCrafts = (crafts) => {
	const out = { pos: [], local: [], size: [], shape: [] };
	crafts.forEach((c, i) => {
		const rope = c.rope || 0;
		const pad = c.kind === "dock" ? 40 : PAD;
		const hx = c.w / 2 + pad;
		const hy = c.h / 2 + rope + pad;
		[
			[-1, -1],
			[1, -1],
			[1, 1],
			[-1, -1],
			[1, 1],
			[-1, 1],
		].forEach(([sx, sy]) => {
			const lx = sx * hx;
			const ly = sy * hy;
			out.pos.push(c.x + c.ty * lx + c.tx * ly, c.y - c.tx * lx + c.ty * ly);
			out.local.push(lx, ly);
			out.size.push(c.w, c.h);
			out.shape.push(KINDS[c.kind], i, c.river, c.kind === "sea" ? c.inner : rope);
		});
	});
	return Object.fromEntries([
		["count", out.pos.length / 2],
		...Object.entries(out).map(([key, list]) => [key, new Float32Array(list)]),
	]);
};

export const sizeCanvas = (canvas, dpr) => {
	const width = Math.round(canvas.clientWidth * dpr);
	const height = Math.round(canvas.clientHeight * dpr);
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
		return true;
	}
	return false;
};
