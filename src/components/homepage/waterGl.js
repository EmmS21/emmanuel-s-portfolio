import { MAX_RIVERS, TRAIL, WATER, buildCrafts, buildStrips, sizeCanvas } from "./riverStrips";

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const NOISE = `
float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
		u.y
	);
}
float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 4; i++) {
		v += a * noise(p);
		p = p * 2.03 + vec2(17.0, 9.0);
		a *= 0.5;
	}
	return v;
}
`;

// acc is premultiplied colour; over() lays c on top at opacity a.
const WOOD = `
void over(inout vec4 acc, vec3 c, float a) {
	acc = vec4(c * a, a) + acc * (1.0 - a);
}
// Bark or plank colour with the grain running along q.y.
vec3 wood(vec2 q, float seed) {
	float grain = noise(vec2(q.x * 2.5, q.y * 0.4 + seed));
	return mix(vec3(0.16, 0.1, 0.06), vec3(0.32, 0.22, 0.13), grain);
}
// A round log lying along q.y: shadow, a foam line where it meets the water, then bark.
void drawLog(vec2 q, float len, float rad, float seed, float foam, inout vec4 acc) {
	float dist = length(vec2(q.x, max(abs(q.y) - len, 0.0))) - rad;
	over(acc, vec3(0.0), (1.0 - smoothstep(0.0, 4.0, dist + 1.0)) * 0.35);
	over(acc, vec3(0.82, 0.92, 0.9), (1.0 - smoothstep(0.0, 1.5, abs(dist - 0.8))) * 0.35 * foam);
	float across = clamp(q.x / rad, -1.0, 1.0);
	float dome = sqrt(1.0 - across * across);
	vec3 bark = wood(q, seed) * (0.45 + 0.75 * dome);
	bark = mix(bark, vec3(0.45, 0.35, 0.22), smoothstep(len - 0.8, len, abs(q.y)) * dome * 0.6);
	over(acc, bark, 1.0 - smoothstep(-0.4, 0.4, dist));
}
`;

const CLIP = `
vec4 clip(vec2 p, vec2 view) {
	return vec4(p.x / view.x * 2.0 - 1.0, 1.0 - p.y / view.y * 2.0, 0.0, 1.0);
}
`;

const QUAD_VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const GROUND_FRAG = `${PRECISION}${NOISE}
uniform vec2 u_view;
uniform vec2 u_px;
uniform vec2 u_portal;
uniform float u_ocean;
void main() {
	vec2 p = vec2(gl_FragCoord.x, u_px.y - gl_FragCoord.y) / u_px * u_view;
	float h = fbm(p * 0.0045);
	float moss = fbm(p * 0.02 + 3.0);
	vec3 earth = mix(vec3(0.03, 0.04, 0.038), vec3(0.065, 0.08, 0.058), h);
	earth = mix(earth, vec3(0.045, 0.072, 0.048), smoothstep(0.45, 0.75, moss) * 0.7);
	earth += (noise(p * 0.7) - 0.5) * 0.018;

	float c = abs(fract(h * 14.0) - 0.5);
	earth += vec3(0.66, 0.53, 0.41) * (1.0 - smoothstep(0.0, 0.035, c)) * 0.05;

	earth += vec3(0.4, 0.33, 0.24) * exp(-distance(p, u_portal) / 200.0) * 0.16;

	vec2 q = p / u_view;
	earth *= 0.55 + 0.45 * smoothstep(0.0, 0.3, q.x) * smoothstep(1.0, 0.7, q.x);

	float a = 1.0 - smoothstep(u_ocean - 140.0, u_ocean + 40.0, p.y);
	gl_FragColor = vec4(earth * a, a);
}
`;

const WATER_VERT = `${CLIP}
attribute vec2 a_pos;
attribute float a_side;
attribute float a_along;
attribute float a_t;
attribute float a_half;
attribute vec2 a_tan;
attribute float a_river;
uniform vec2 u_view;
uniform float u_lit[${MAX_RIVERS}];
varying float v_side;
varying float v_along;
varying float v_t;
varying float v_half;
varying float v_lit;
varying vec2 v_tan;
varying vec2 v_world;
varying float v_river;
void main() {
	v_lit = u_lit[int(a_river + 0.5)];
	v_river = a_river;
	v_tan = a_tan;
	v_world = a_pos;
	v_side = a_side;
	v_along = a_along;
	v_t = a_t;
	v_half = a_half;
	gl_Position = clip(a_pos, u_view);
}
`;

// Surface height at p = (across, along) in map units. y is the splash amount.
const WATER_FRAG = `${PRECISION}${NOISE}${WOOD}
uniform float u_time;
uniform float u_reveal;
uniform float u_focus;
// Recent cursor samples, newest first: (x, y, vx, vy) in map units, and age in seconds.
uniform vec4 u_trail[${TRAIL}];
uniform float u_age[${TRAIL}];
varying float v_side;
varying float v_along;
varying float v_t;
varying float v_half;
varying float v_lit;
varying vec2 v_tan;
varying vec2 v_world;
varying float v_river;

const float CELL = 42.0;
const float STONE = 5.5;
const float LOG_CELL = 260.0;

// Draws any log drifting near p (map units, across/along) over the water colour.
void driftwood(vec2 p, float edge, inout vec3 col) {
	vec4 acc = vec4(col, 1.0);
	float seed = v_river * 17.0;
	float drift = u_time * (5.0 + 4.0 * hash(vec2(seed, 1.7))) + hash(vec2(seed, 4.4)) * LOG_CELL;
	float base = floor((p.y - drift) / LOG_CELL);
	for (int k = -1; k <= 1; k++) {
		float c = base + float(k);
		if (hash(vec2(c, 41.3 + seed)) > 0.4) continue;
		vec2 center = vec2(
			(hash(vec2(c, 17.9 + seed)) - 0.5) * edge,
			(c + 0.2 + 0.6 * hash(vec2(c, 29.3 + seed))) * LOG_CELL + drift
		);
		float angle = (hash(vec2(c, 8.1 + seed)) - 0.5) * 1.4 + sin(u_time * 0.3 + c + seed) * 0.25;
		vec2 d = p - center;
		vec2 q = vec2(cos(angle) * d.x + sin(angle) * d.y, -sin(angle) * d.x + cos(angle) * d.y);
		float len = 8.0 + 5.0 * hash(vec2(c, 2.2 + seed));
		float rad = 2.2 + 1.0 * hash(vec2(c, 6.6 + seed));
		drawLog(q, len, rad, c * 10.0 + seed, 1.0, acc);
	}
	col = acc.rgb;
}

// Nearest pebble to p (map units, across/along). Returns
// (distance in pebble radii, across position of its centre, seed, cell seed).
vec4 pebble(vec2 p) {
	vec2 g = p / STONE;
	vec2 id = floor(g);
	vec2 f = fract(g);
	vec4 best = vec4(9.0, 0.0, 0.0, 0.0);
	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 cell = id + vec2(float(x), float(y));
			vec2 c = vec2(float(x), float(y)) + 0.2 + 0.6 * vec2(hash(cell), hash(cell + 13.1));
			float r = 0.28 + 0.22 * hash(cell + 7.7);
			float squash = 0.75 + 0.5 * hash(cell + 3.3);
			float d = length((f - c) * vec2(1.0, squash)) / r;
			if (d < best.x) best = vec4(d, (cell.x + c.x) * STONE, hash(cell + 21.7), hash(cell + 2.9));
		}
	}
	return best;
}

float wake(vec2 q) {
	float h = 0.0;
	for (int i = 0; i < ${TRAIL}; i++) {
		float a = u_age[i];
		float pace = min(length(u_trail[i].zw) / 400.0, 1.0);
		if (a > 1.6 || pace < 0.02) continue;
		float x = distance(q, u_trail[i].xy) - a * 45.0;
		h += sin(x * 0.9) * exp(-x * x / 18.0) * exp(-a * 2.2) * pace * 0.7;
	}
	return h;
}

vec2 surface(vec2 p, float energy, float speed) {
	float flow = u_time * mix(16.0, 30.0, energy) * speed;
	vec2 q = vec2(p.x * 0.07, (p.y - flow) * 0.03);
	float h = fbm(q + vec2(0.0, fbm(q * 1.3 + u_time * 0.12)));
	h += 0.3 * noise(vec2(p.x * 0.35, (p.y - flow * 1.4) * 0.16));

	float splash = 0.0;
	float seed = v_river * 17.0;
	float drift = flow * 0.8 + hash(vec2(seed, 2.6)) * CELL;
	float base = floor((p.y - drift) / CELL);
	float span = v_half * ${WATER.toFixed(2)} * 0.7;
	for (int k = -1; k <= 1; k++) {
		float c = base + float(k);
		float seed = hash(vec2(c, 3.1 + seed));
		if (seed < mix(0.5, 0.05, energy)) continue;
		float rate = mix(0.22, 0.55, energy) * (0.7 + 0.6 * hash(vec2(c, 5.3 + seed)));
		float ph = fract(u_time * rate + seed * 7.0);
		vec2 center = vec2(
			(hash(vec2(c, 7.7 + seed)) - 0.5) * 2.0 * span,
			(c + 0.2 + 0.6 * hash(vec2(c, 9.1 + seed))) * CELL + drift
		);
		float d = length(p - center);
		float r = ph * mix(16.0, 24.0, energy);
		float fade = (1.0 - ph) * (1.0 - ph);
		h += sin((d - r) * 1.1) * exp(-(d - r) * (d - r) / 14.0) * fade * 0.45;
		splash += exp(-d * d / 5.0) * (1.0 - smoothstep(0.0, 0.14, ph));
	}
	return vec2(h, splash);
}

void main() {
	float wobble = (noise(vec2(v_along * 0.02, v_side > 0.0 ? 3.0 : 7.0)) - 0.5) * 0.3;
	float w = abs(v_side) / (${WATER.toFixed(2)} * (1.0 + wobble));
	float depth = 1.0 - min(w * w, 1.0);
	float speed = mix(0.4, 1.0, depth);

	vec2 across = vec2(v_tan.y, -v_tan.x);
	vec2 push = u_trail[0].zw;
	float pace = min(length(push) / 400.0, 1.0);
	float near = exp(-pow(distance(v_world, u_trail[0].xy), 2.0) / 900.0) * exp(-u_age[0] * 3.0);
	float energy = max(mix(0.25, 1.0, v_lit), near * pace);

	vec2 p = vec2(v_side * v_half, v_along) - vec2(dot(push, across), dot(push, v_tan)) * 0.05 * near;
	vec2 s0 = surface(p, energy, speed);
	float hx = surface(p + vec2(0.7, 0.0), energy, speed).x;
	float hy = surface(p + vec2(0.0, 0.7), energy, speed).x;
	s0.x += wake(v_world);
	hx += wake(v_world + across * 0.7);
	hy += wake(v_world + v_tan * 0.7);
	float bump = mix(1.6, 2.6, energy);
	vec3 n = normalize(vec3((s0.x - hx) * bump, (s0.x - hy) * bump, 1.0));

	vec3 col = mix(vec3(0.09, 0.17, 0.16), vec3(0.03, 0.1, 0.12), smoothstep(0.0, 0.9, depth));
	float sky = fbm(vec2(v_along * 0.004 + v_side * 0.3, 1.0));
	col += vec3(0.1, 0.17, 0.19) * smoothstep(0.45, 0.8, sky);
	col *= 0.8 + 0.45 * (n.x * 0.5 - n.y * 0.7 + 0.5);
	col += vec3(0.16, 0.24, 0.27) * (1.0 - n.z) * 1.6;
	vec3 light = normalize(vec3(-0.35, -0.55, 0.75));
	float spec = pow(max(dot(reflect(-light, n), vec3(0.0, 0.0, 1.0)), 0.0), 48.0);
	col += vec3(1.0, 0.96, 0.88) * spec * mix(0.55, 1.1, energy) * depth;

	float flow = u_time * mix(16.0, 30.0, energy) * speed;
	float rapids = smoothstep(0.66, 0.85, fbm(vec2(p.x * 0.09, (p.y - flow * 1.5) * 0.025)));
	float foam = rapids * smoothstep(0.55, 0.8, s0.x) * 0.55;
	foam += smoothstep(0.82, 0.98, w) * (1.0 - smoothstep(0.98, 1.04, w)) * 0.25;
	foam += min(s0.y, 1.0) * 0.9;
	foam += near * pace * smoothstep(0.45, 0.75, s0.x) * 0.6;
	col = mix(col, vec3(0.82, 0.92, 0.9), clamp(foam, 0.0, 1.0) * depth);
	driftwood(p, v_half * ${WATER.toFixed(2)} * 0.9, col);

	float waterEdge = v_half * ${WATER.toFixed(2)};
	vec4 stone = pebble(vec2(v_side * v_half, v_along + v_river * 131.0));
	float sw = abs(stone.y) / waterEdge;
	float dome = sqrt(max(1.0 - stone.x * stone.x, 0.0));
	float shape = 1.0 - smoothstep(0.82, 1.0, stone.x);
	vec3 rock = mix(vec3(0.17, 0.16, 0.14), vec3(0.34, 0.31, 0.26), stone.z);
	rock = mix(rock, vec3(0.22, 0.24, 0.2), step(0.8, stone.w) * 0.6);
	rock *= 0.45 + 0.75 * dome;

	float underwater = shape * step(0.55, stone.w) * smoothstep(0.65, 0.95, sw) * (1.0 - smoothstep(0.95, 1.0, sw));
	col = mix(col, col * 0.6 + rock * 0.55, underwater * 0.6);

	col *= mix(1.0, 0.6, u_focus * (1.0 - v_lit));

	float bankW = 1.0 / ${WATER.toFixed(2)};
	float waterA = 1.0 - smoothstep(0.94, 1.04, w);
	float wet = 1.0 - smoothstep(1.0, 1.35, sw);
	float density = mix(0.85, 0.2, smoothstep(1.0, bankW, sw));
	float onBank = shape * step(stone.w, density) * step(0.98, sw) * (1.0 - smoothstep(bankW - 0.15, bankW, sw));
	rock *= mix(1.0, 0.55, wet);
	rock += vec3(0.5, 0.55, 0.5) * pow(dome, 6.0) * wet * 0.25;

	float moss = fbm(vec2(v_side * v_half, v_along) * 0.25);
	vec3 ground = mix(vec3(0.05, 0.047, 0.035), vec3(0.05, 0.08, 0.045), smoothstep(0.4, 0.7, moss) * smoothstep(1.1, 1.6, w));
	float bankA = (1.0 - smoothstep(1.0, bankW, w)) * 0.7;

	vec3 c = mix(ground, rock, onBank);
	c = mix(c, col, waterA);
	float a = max(max(waterA, bankA), onBank);

	a *= 1.0 - smoothstep(u_reveal * 1.1 - 0.1, u_reveal * 1.1, v_t);
	a *= smoothstep(0.0, 0.05, v_t);
	a *= 1.0 - smoothstep(0.96, 1.0, v_t) * 0.6;
	gl_FragColor = vec4(c * a, a);
}
`;

const CRAFT_VERT = `${CLIP}
attribute vec2 a_pos;
attribute vec2 a_local;
attribute vec2 a_size;
attribute vec4 a_shape;
uniform vec2 u_view;
uniform float u_lit[${MAX_RIVERS}];
varying vec2 v_local;
varying vec2 v_size;
varying vec4 v_shape;
varying float v_lit;
void main() {
	v_lit = u_lit[int(a_shape.z + 0.5)];
	v_local = a_local;
	v_size = a_size;
	v_shape = a_shape;
	gl_Position = clip(a_pos, u_view);
}
`;

// Docks, rowboats and rafts. p is (across, downstream) from the craft's centre.
const CRAFT_FRAG = `${PRECISION}${NOISE}${WOOD}
uniform float u_time;
uniform float u_reveal;
uniform float u_focus;
varying vec2 v_local;
varying vec2 v_size;
varying vec4 v_shape;
varying float v_lit;

float box(vec2 p, vec2 b, float r) {
	vec2 d = abs(p) - b + r;
	return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

vec3 weathered(vec3 c, float amount) {
	return mix(c, vec3(0.34, 0.31, 0.27), amount);
}

void post(vec2 q, float seed, inout vec4 acc) {
	float r = length(q);
	over(acc, vec3(0.0), (1.0 - smoothstep(4.0, 8.0, length(q - vec2(1.5, 2.5)))) * 0.45);
	float ring = 0.5 + 0.5 * sin(r * 3.2 + noise(q * 0.9 + seed) * 3.0);
	vec3 top = mix(vec3(0.27, 0.19, 0.11), vec3(0.43, 0.33, 0.21), ring) * (0.75 + 0.3 * (1.0 - r / 4.8));
	top = mix(top, vec3(0.11, 0.07, 0.045), smoothstep(3.6, 4.3, r));
	over(acc, top, 1.0 - smoothstep(4.4, 5.0, r));
}

void dock(vec2 p, float seed, inout vec4 acc) {
	vec2 b = v_size * 0.5;
	over(acc, vec3(0.0), (1.0 - smoothstep(-4.0, 10.0, box(p - vec2(3.0, 7.0), b, 6.0))) * 0.55);

	float d = box(p, b, 2.5);
	float bh = v_size.y / 7.0;
	float row = floor((p.y + b.y) / bh);
	float fy = fract((p.y + b.y) / bh);
	float jl = 60.0 + 50.0 * hash(vec2(row, seed));
	float px = p.x + b.x + hash(vec2(row, seed + 3.0)) * jl;
	float piece = floor(px / jl);
	float fx = px - piece * jl;
	float id = hash(vec2(row * 7.0 + piece, seed + 9.0));

	vec3 plank = wood(vec2(fy * bh, px), id * 50.0 + seed);
	plank = weathered(plank, 0.25 + 0.35 * id) * (0.82 + 0.3 * id);
	plank *= 0.8 + 0.3 * sin(fy * 3.14159);
	plank *= 0.8 + 0.35 * fbm(p * 0.06 + seed);
	float seam = smoothstep(0.0, 0.07, fy) * smoothstep(1.0, 0.93, fy);
	seam *= smoothstep(0.0, 0.9, fx) * smoothstep(jl, jl - 0.9, fx);
	plank *= mix(0.25, 1.0, seam);
	vec2 nail = vec2(min(fx, jl - fx) - 3.0, (abs(fy - 0.5) - 0.22) * bh);
	plank *= mix(0.4, 1.0, smoothstep(0.5, 0.9, length(nail)));

	vec3 beam = weathered(wood(vec2(p.y, p.x), seed + 5.0), 0.2) * 0.7;
	plank = mix(plank, beam, smoothstep(-4.0, -3.4, d));
	over(acc, plank, 1.0 - smoothstep(-0.5, 0.5, d));

	float x = b.x - 6.0;
	float cx = abs(p.x) < x * 0.5 ? 0.0 : sign(p.x) * x;
	post(p - vec2(cx, sign(p.y) * (b.y - 1.5)), seed + cx, acc);
}

// Swings a moored craft on its rope, which is tied at the dock edge.
vec2 swing(vec2 p, float len, float seed) {
	vec2 pivot = vec2(0.0, len + v_shape.w);
	float a = sin(u_time * 0.7 + seed) * 0.07;
	vec2 d = p - pivot;
	vec2 q = vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y) + pivot;
	return q + vec2(0.0, sin(u_time * 1.3 + seed) * 0.5);
}

void ripples(float d, inout vec4 acc) {
	float out_ = max(d, 0.0);
	float wave = 0.5 + 0.5 * sin(out_ * 1.1 - u_time * 2.4);
	over(acc, vec3(0.82, 0.92, 0.9), wave * exp(-out_ * 0.22) * step(0.0, d) * 0.16);
	over(acc, vec3(0.82, 0.92, 0.9), (1.0 - smoothstep(0.0, 1.6, abs(d - 0.6))) * 0.4);
}

void rope(vec2 q, float len, inout vec4 acc) {
	float u = clamp((q.y - len + 1.5) / (v_shape.w + 1.5), 0.0, 1.0);
	float sag = sin(u * 3.14159) * 1.8;
	float d = abs(q.x - sag) - 0.55;
	float on = step(len - 1.5, q.y) * step(q.y, len + v_shape.w);
	over(acc, vec3(0.0), (1.0 - smoothstep(0.0, 1.5, abs(q.x - sag - 1.0) - 0.5)) * on * 0.35);
	vec3 twist = mix(vec3(0.42, 0.34, 0.22), vec3(0.62, 0.53, 0.38), 0.5 + 0.5 * sin((q.y + q.x) * 4.0));
	over(acc, twist, (1.0 - smoothstep(-0.2, 0.3, d)) * on);
}

float hull(vec2 q, vec2 b) {
	float s = clamp(q.y / b.y, -1.0, 1.0);
	float hw = b.x * (s < 0.0 ? pow(max(1.0 - s * s, 0.0), 0.75) : 1.0 - 0.28 * s * s);
	return max(abs(q.x) - hw, abs(q.y) - b.y);
}

void boat(vec2 p, float seed, inout vec4 acc) {
	vec2 b = v_size * 0.5;
	vec2 q = swing(p, b.y, seed);
	float d = hull(q, b);
	ripples(d, acc);
	over(acc, vec3(0.0), (1.0 - smoothstep(-1.0, 5.0, hull(q - vec2(1.5, 2.5), b))) * 0.5);

	float s = q.y / b.y;
	float hw = b.x * (s < 0.0 ? pow(max(1.0 - s * s, 0.0), 0.75) : 1.0 - 0.28 * s * s);
	float k = abs(q.x) / max(hw, 0.01);
	float strake = fract(k * 3.0);
	vec3 inside = weathered(wood(q, seed), 0.15) * (0.6 + 0.45 * (1.0 - k * k));
	inside *= mix(0.55, 1.0, smoothstep(0.0, 0.12, strake) * smoothstep(1.0, 0.88, strake));
	float seat = max(
		1.0 - smoothstep(1.4, 1.8, abs(q.y + b.y * 0.3)),
		1.0 - smoothstep(1.4, 1.8, abs(q.y - b.y * 0.35))
	);
	vec3 plank = weathered(wood(vec2(q.y, q.x), seed + 4.0), 0.3) * 1.05;
	inside = mix(inside, plank, seat);
	vec3 rim = weathered(wood(vec2(q.y, q.x), seed + 8.0), 0.1) * 0.65;
	vec3 c = mix(inside, rim, smoothstep(-2.2, -1.6, d));
	over(acc, c, 1.0 - smoothstep(-0.4, 0.4, d));
	rope(q, b.y, acc);
}

void raft(vec2 p, float seed, inout vec4 acc) {
	vec2 b = v_size * 0.5;
	vec2 q = swing(p, b.y, seed);
	ripples(box(q, b, b.x * 0.2), acc);
	float rad = b.x / 5.0;
	for (int i = 0; i < 5; i++) {
		float f = float(i);
		float len = b.y - rad - 1.5 * hash(vec2(f, seed));
		float shift = (hash(vec2(f, seed + 2.0)) - 0.5) * 2.0;
		drawLog(q - vec2(-b.x + rad * (2.0 * f + 1.0), shift), len, rad, f * 10.0 + seed, 0.0, acc);
	}
	float lash = min(abs(q.y + b.y * 0.55), abs(q.y - b.y * 0.55));
	vec3 twist = mix(vec3(0.42, 0.34, 0.22), vec3(0.62, 0.53, 0.38), 0.5 + 0.5 * sin((q.x - q.y) * 4.0));
	over(acc, twist, (1.0 - smoothstep(0.8, 1.2, lash)) * step(abs(q.x), b.x - 0.3));
	rope(q, b.y, acc);
}

void main() {
	vec4 acc = vec4(0.0);
	float seed = v_shape.y * 13.0 + 1.0;
	if (v_shape.x < 0.5) dock(v_local, seed, acc);
	else if (v_shape.x < 1.5) boat(v_local, seed, acc);
	else raft(v_local, seed, acc);
	acc.rgb *= mix(1.0, 0.6, u_focus * (1.0 - v_lit)) * mix(1.0, 1.2, v_lit);
	gl_FragColor = acc * smoothstep(0.85, 1.0, u_reveal);
}
`;

const compile = (gl, vert, frag) => {
	const program = gl.createProgram();
	[
		[gl.VERTEX_SHADER, vert],
		[gl.FRAGMENT_SHADER, frag],
	].forEach(([type, source]) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader));
		}
		gl.attachShader(program, shader);
	});
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(program));
	}
	return program;
};

// Uploads [name, data, size] attributes; returns a function that binds them
// again, which is needed before drawing when programs share a context.
const attributes = (gl, program, list) => {
	const bound = list.map(([name, data, size]) => {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		return { buffer, size, location: gl.getAttribLocation(program, name) };
	});
	const bind = () =>
		bound.forEach(({ buffer, size, location }) => {
			if (location < 0) return;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
		});
	bind();
	return bind;
};

// Paints the land once; call again after a resize.
export const drawGround = (canvas, layout) => {
	const gl = canvas.getContext("webgl", { antialias: false });
	if (!gl) return false;
	const program = compile(gl, QUAD_VERT, GROUND_FRAG);
	gl.useProgram(program);
	attributes(gl, program, [["a_pos", new Float32Array([-1, -1, 3, -1, -1, 3]), 2]]);
	const draw = () => {
		sizeCanvas(canvas, 1);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.uniform2f(gl.getUniformLocation(program, "u_view"), layout.W, layout.H);
		gl.uniform2f(gl.getUniformLocation(program, "u_px"), canvas.width, canvas.height);
		gl.uniform2f(gl.getUniformLocation(program, "u_portal"), layout.portal.x, layout.portal.y);
		gl.uniform1f(gl.getUniformLocation(program, "u_ocean"), layout.oceanY);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};
	return draw;
};


// Draws the shader river. Returns null when WebGL is missing or fails.
export const createGlWater = (canvas, layout) => {
	const gl = canvas.getContext("webgl", { antialias: false });
	if (!gl) return null;
	const program = compile(gl, WATER_VERT, WATER_FRAG);
	gl.useProgram(program);
	const strips = buildStrips(layout.rivers);
	const bindWater = attributes(gl, program, [
		["a_pos", strips.pos, 2],
		["a_side", strips.side, 1],
		["a_along", strips.along, 1],
		["a_t", strips.t, 1],
		["a_half", strips.half, 1],
		["a_tan", strips.tan, 2],
		["a_river", strips.index, 1],
	]);
	const u = (name) => gl.getUniformLocation(program, name);
	gl.uniform2f(u("u_view"), layout.W, layout.H);
	const uTime = u("u_time");
	const uReveal = u("u_reveal");
	const uFocus = u("u_focus");
	const uLit = u("u_lit");
	const uTrail = u("u_trail");
	const uAge = u("u_age");

	const craftProgram = compile(gl, CRAFT_VERT, CRAFT_FRAG);
	gl.useProgram(craftProgram);
	const crafts = buildCrafts(layout.crafts);
	const bindCrafts = attributes(gl, craftProgram, [
		["a_pos", crafts.pos, 2],
		["a_local", crafts.local, 2],
		["a_size", crafts.size, 2],
		["a_shape", crafts.shape, 4],
	]);
	const c = (name) => gl.getUniformLocation(craftProgram, name);
	gl.uniform2f(c("u_view"), layout.W, layout.H);
	const cTime = c("u_time");
	const cReveal = c("u_reveal");
	const cFocus = c("u_focus");
	const cLit = c("u_lit");

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	return {
		draw: ({ time, reveal, focus, lit, trail, ages }) => {
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.useProgram(program);
			bindWater();
			gl.uniform1f(uTime, time);
			gl.uniform1f(uReveal, reveal);
			gl.uniform1f(uFocus, focus);
			gl.uniform1fv(uLit, lit);
			gl.uniform4fv(uTrail, trail);
			gl.uniform1fv(uAge, ages);
			gl.drawArrays(gl.TRIANGLES, 0, strips.count);

			gl.useProgram(craftProgram);
			bindCrafts();
			gl.uniform1f(cTime, time);
			gl.uniform1f(cReveal, reveal);
			gl.uniform1f(cFocus, focus);
			gl.uniform1fv(cLit, lit);
			gl.drawArrays(gl.TRIANGLES, 0, crafts.count);
		},
		destroy: () => {},
	};
};
