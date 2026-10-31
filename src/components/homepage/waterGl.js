import { MAX_RIVERS, TRAIL, IMPULSE, WATER, buildCrafts, buildStrips } from "./riverStrips";

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
const BLEND = `
void over(inout vec4 acc, vec3 c, float a) {
	acc = vec4(c * a, a) + acc * (1.0 - a);
}
`;

// (wind 0..1, wind direction -1 or 1, falling rain 0..1, lightning).
// u_level is how full the rivers are; it lags behind the rain.
const WEATHER = `
uniform vec4 u_weather;
uniform float u_level;
`;

// Rings expand from a shove in the sea. Pulses then travel down each river.
const WAVES = `
uniform vec4 u_pose;
uniform vec4 u_impulse[${IMPULSE}];
uniform float u_impAge[${IMPULSE}];
uniform vec2 u_portal;
float rings(vec2 q) {
	float h = 0.0;
	for (int i = 0; i < ${IMPULSE}; i++) {
		float a = u_impAge[i];
		float p = u_impulse[i].z;
		if (a > 10.0 || p < 0.02) continue;
		float dist = distance(q, u_impulse[i].xy);
		float r = a * 58.0;
		float fade = exp(-a * 0.16) * p;
		float ring = sin((dist - r) * 0.16) * exp(-(dist - r) * (dist - r) / 280.0);
		h += ring * fade * 1.85;
	}
	return h;
}
// Dispersive channel waves: a shove sends a short train, not one bump.
// The front bends across the channel so it is not a straight wash.
float pulse(float along, float across) {
	float h = 0.0;
	for (int i = 0; i < ${IMPULSE}; i++) {
		float a = u_impAge[i];
		float p = u_impulse[i].z;
		if (a > 10.0 || p < 0.02) continue;
		vec2 seed = vec2(float(i) * 17.3, u_impulse[i].x * 0.07 + u_impulse[i].y * 0.05);
		float k = hash(seed);
		float k2 = hash(seed + 4.1);
		float t = max(a - (0.32 + 0.18 * k), 0.0);
		float front = t * (68.0 + 36.0 * k2);
		float warp = across * (1.3 + 1.7 * hash(seed + 8.2));
		warp += sin(across * (0.09 + 0.07 * k) + k * 4.2) * (20.0 + 26.0 * k2);
		warp += (noise(vec2(across * 0.04, k * 9.0)) - 0.5) * 34.0;
		warp += (noise(vec2(along * 0.018, across * 0.03 + k)) - 0.5) * 26.0;
		float d = along - front + warp;
		float envelope = exp(-d * d / (3200.0 + 1600.0 * hash(seed + 2.6))) * exp(-a * 0.1) * p;
		float longW = sin(d * (0.034 + 0.018 * k) + k * 6.0 + across * 0.04);
		float midW = sin(d * (0.072 + 0.028 * k2) - across * 0.09 + a * 0.9);
		float shortW = sin(d * (0.13 + 0.04 * k) + across * 0.14 + seed.x);
		float follow = sin((d + 26.0 + 16.0 * k2) * 0.055 + k * 2.2);
		float chop = sin(d * 0.24 + across * 0.18 + a * 2.6)
			* (0.3 + 0.45 * noise(vec2(along * 0.06, across * 0.1 + k)));
		h += (longW * 0.48 + midW * 0.3 + shortW * 0.18 + follow * 0.28 + chop * 0.16) * envelope * 1.45;
	}
	return h;
}
// Local swell at this point, and how hard the icon has been shaken.
vec2 surgePair(float along) {
	float local = 0.0;
	float shake = 0.0;
	for (int i = 0; i < ${IMPULSE}; i++) {
		float a = u_impAge[i];
		float p = u_impulse[i].z;
		if (a > 10.0 || p < 0.02) continue;
		float live = p * exp(-a * 0.09);
		shake += live;
		float t = max(a - 0.32, 0.0);
		float d = along - t * 80.0;
		local += live * exp(-d * d / 2800.0);
	}
	return vec2(local, shake);
}
`;

// Lit water colour for surface normal n; sky picks where the sky reflects.
const WATER_LIGHT = `
vec3 waterLight(vec3 n, float depth, float sky, float energy) {
	vec3 col = mix(vec3(0.09, 0.17, 0.16), vec3(0.03, 0.1, 0.12), smoothstep(0.0, 0.9, depth));
	col += vec3(0.1, 0.17, 0.19) * smoothstep(0.45, 0.8, sky);
	col *= 0.8 + 0.45 * (n.x * 0.5 - n.y * 0.7 + 0.5);
	col += vec3(0.16, 0.24, 0.27) * (1.0 - n.z) * 1.6;
	vec3 light = normalize(vec3(-0.35, -0.55, 0.75));
	float spec = pow(max(dot(reflect(-light, n), vec3(0.0, 0.0, 1.0)), 0.0), 22.0);
	return col + vec3(1.0, 0.96, 0.88) * spec * mix(0.25, 0.55, energy) * depth;
}
`;

const WOOD = `
// Bark or plank colour with the grain running along q.y.
vec3 wood(vec2 q, float seed) {
	float grain = noise(vec2(q.x * 2.5, q.y * 0.4 + seed));
	return mix(vec3(0.16, 0.1, 0.06), vec3(0.32, 0.22, 0.13), grain);
}
// A round log lying along q.y: shadow, a foam line where it meets the water, then bark.
// roll turns the bark under fixed light, which reads as the log rocking.
void drawLog(vec2 q, float len, float rad, float seed, float foam, float roll, inout vec4 acc) {
	float dist = length(vec2(q.x, max(abs(q.y) - len, 0.0))) - rad;
	over(acc, vec3(0.0), (1.0 - smoothstep(0.0, 4.0, dist + 1.0)) * 0.35);
	over(acc, vec3(0.82, 0.92, 0.9), (1.0 - smoothstep(0.0, 1.5, abs(dist - 0.8))) * 0.35 * foam);
	float across = clamp(q.x / rad, -1.0, 1.0);
	float dome = sqrt(1.0 - across * across);
	vec3 bark = wood(vec2(q.x + roll * rad, q.y), seed) * (0.45 + 0.75 * dome);
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

float cap(vec2 p, vec2 a, vec2 b, float ra, float rb) {
	vec2 pa = p - a;
	vec2 ba = b - a;
	float t = clamp(dot(pa, ba) / max(dot(ba, ba), 0.001), 0.0, 1.0);
	return length(pa - ba * t) - mix(ra, rb, t);
}

float palm(vec2 p, vec2 at, vec2 seed) {
	float px = u_view.x / max(u_px.x, 1.0);
	float sc = mix(0.85, 1.4, hash(seed + vec2(1.3, 0.2))) * (92.0 * px) / 26.0;
	vec2 q = (p - at) / sc;
	float lean = (hash(seed + vec2(0.6, 1.8)) - 0.5) * 0.2;
	q.x -= q.y * lean * 0.12;
	vec2 crown = vec2(lean * 3.4, -26.0);
	float trunk = cap(q, vec2(0.0, 1.4), crown, 1.2, 0.38);
	float fronds = 40.0;
	for (int k = 0; k < 7; k++) {
		float fk = float(k);
		float u = (fk - 3.0) / 3.2;
		float jitter = (hash(seed + vec2(fk, 3.2)) - 0.5) * 0.15;
		float ang = u * 1.25 + jitter;
		float len = mix(12.5, 18.0, hash(seed + vec2(fk, 5.1)));
		vec2 dir = vec2(sin(ang), -0.12 - 0.95 * cos(ang * 0.42));
		dir = dir / max(length(dir), 0.001);
		vec2 mid = crown + dir * len * 0.42 + vec2(0.0, 2.6);
		vec2 tip = crown + dir * len + vec2(0.0, 3.8);
		vec2 pa = q - crown;
		vec2 ba = mid - crown;
		float t1 = clamp(dot(pa, ba) / max(dot(ba, ba), 0.001), 0.0, 1.0);
		float w1 = mix(0.16, 1.45, t1) + 0.38 * abs(sin(t1 * 17.0)) * t1;
		float d1 = length(pa - ba * t1) - w1;
		pa = q - mid;
		ba = tip - mid;
		float t2 = clamp(dot(pa, ba) / max(dot(ba, ba), 0.001), 0.0, 1.0);
		float w2 = mix(1.45, 0.07, t2) + 0.42 * abs(sin(t2 * 21.0)) * (1.0 - t2);
		float d2 = length(pa - ba * t2) - w2;
		fronds = min(fronds, min(d1, d2));
	}
	return min(trunk, fronds);
}

void main() {
	vec2 p = vec2(gl_FragCoord.x, u_px.y - gl_FragCoord.y) / u_px * u_view;
	vec2 q = p / u_view;
	float h = fbm(p * 0.0045);
	float moss = fbm(p * 0.02 + 3.0);
	vec3 earth = mix(vec3(0.03, 0.04, 0.038), vec3(0.065, 0.08, 0.058), h);
	earth = mix(earth, vec3(0.045, 0.072, 0.048), smoothstep(0.45, 0.75, moss) * 0.7);
	earth += (noise(p * 0.7) - 0.5) * 0.018;

	float topLand = 1.0 - smoothstep(0.06, 0.52, q.y);
	float c = abs(fract(h * 14.0) - 0.5);
	earth += vec3(0.72, 0.58, 0.44) * (1.0 - smoothstep(0.0, 0.03, c)) * mix(0.05, 0.12, topLand);
	earth += vec3(0.04, 0.045, 0.038) * topLand * 0.55;
	earth += vec3(0.4, 0.33, 0.24) * exp(-distance(p, u_portal) / 200.0) * 0.16;

	float grove = smoothstep(0.4, 0.58, q.y) * (1.0 - smoothstep(0.92, 0.995, q.y));
	grove *= smoothstep(220.0, 380.0, distance(p, u_portal));
	if (grove > 0.01) {
		vec2 cs = vec2(108.0, 175.0);
		vec2 cell = floor(p / cs);
		for (int n = 0; n < 9; n++) {
			float fn = float(n);
			vec2 id = cell + vec2(mod(fn, 3.0), floor(fn / 3.0)) - 1.0;
			vec2 at = (id + 0.2 + 0.55 * vec2(hash(id), hash(id + vec2(4.4, 1.1)))) * cs;
			float onLeft = 1.0 - smoothstep(0.3, 0.52, at.x / u_view.x);
			if (hash(id + vec2(9.1, 2.7)) < mix(0.26, 0.52, onLeft)) {
				float d = palm(p, at, id);
				float cover = (1.0 - smoothstep(-0.18, 0.38, d)) * grove;
				float shade = (1.0 - smoothstep(3.0, 16.0, length((p - at) * vec2(0.7, 1.4)))) * grove * 0.22;
				earth = mix(earth, vec3(0.0), shade);
				earth = mix(earth, vec3(0.016, 0.022, 0.014), cover);
			}
		}
	}

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
const WATER_FRAG = `${PRECISION}${NOISE}${BLEND}${WEATHER}${WAVES}${WATER_LIGHT}${WOOD}
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
		float gust = 1.0 + 1.5 * u_weather.x;
		float angle = (hash(vec2(c, 8.1 + seed)) - 0.5) * 1.4 + sin(u_time * 0.3 + c + seed) * 0.25 * gust;
		vec2 d = p - center;
		vec2 q = vec2(cos(angle) * d.x + sin(angle) * d.y, -sin(angle) * d.x + cos(angle) * d.y);
		float len = 8.0 + 5.0 * hash(vec2(c, 2.2 + seed));
		float rad = 2.2 + 1.0 * hash(vec2(c, 6.6 + seed));
		float roll = sin(u_time * (0.9 + 0.6 * hash(vec2(c, 5.5 + seed))) + c * 3.0) * 0.6 * gust;
		roll += pulse(center.y, center.x) * 0.9;
		drawLog(q, len, rad, c * 10.0 + seed, 1.0, roll, acc);
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
		if (a > 3.2) continue;
		vec2 vel = u_trail[i].zw;
		float spd = length(vel);
		vec2 src = u_trail[i].xy + v_tan * a * 12.0;
		vec2 d = q - src;
		float dist = length(d);
		vec2 dir = spd > 8.0 ? vel / spd : v_tan;
		float along = dot(d, dir);
		float across = d.x * dir.y - d.y * dir.x;
		float live = exp(-a * 3.2);
		float fade = exp(-a * 0.42);
		float dent = -exp(-dist * dist / 70.0);
		float bow = exp(-dist * dist / 95.0) * smoothstep(12.0, -4.0, along);
		float ringR = a * 36.0;
		float gap = dist - ringR;
		float ring = sin(gap * 0.2) * exp(-gap * gap / 150.0);
		float pace = min(spd / 180.0, 1.0);
		float spread = 10.0 + a * 34.0;
		float side = abs(across) - along * 0.28;
		float arm = exp(-side * side / (spread * 0.55)) * exp(-along * along / (spread * spread));
		h += dent * mix(0.28, 0.95, live);
		h += bow * live * 0.7;
		h += ring * fade * (0.4 + 0.35 * pace);
		h += arm * fade * pace * 0.4;
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
		if (seed < mix(0.7, 0.18, energy) * (1.0 - 0.7 * u_weather.z)) continue;
		float rate = mix(0.13, 0.7, hash(vec2(c, 5.3 + seed))) * mix(0.7, 1.3, energy);
		float ph = fract(u_time * rate + seed * 7.0);
		vec2 center = vec2(
			(hash(vec2(c, 7.7 + seed)) - 0.5) * 2.0 * span,
			(c + 0.2 + 0.6 * hash(vec2(c, 9.1 + seed))) * CELL + drift
		);
		float d = length(p - center);
		float r = ph * mix(14.0, 26.0, energy);
		float fade = (1.0 - ph) * (1.0 - ph);
		h += sin((d - r) * 1.1) * exp(-(d - r) * (d - r) / 18.0) * fade * mix(0.35, 0.7, u_weather.z);
		splash += (1.0 - smoothstep(0.0, 1.6, abs(d - r))) * fade * 0.28 * mix(0.6, 1.4, u_weather.z);
	}
	return vec2(h, splash);
}

// Capillary rings where a drop hits. Neighbour cells so a thin river still catches them.
vec2 rainHit(vec2 q) {
	if (u_weather.z < 0.04) return vec2(0.0);
	float amount = u_weather.z;
	float cell = 22.0;
	vec2 id0 = floor(q / cell);
	vec2 out_ = vec2(0.0);
	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 id = id0 + vec2(float(x), float(y));
			if (hash(id + v_river) > mix(0.42, 0.95, amount)) continue;
			float rate = 0.65 + 1.0 * hash(id + 2.0);
			float ph = fract(u_time * rate + hash(id + 3.0) * 7.0);
			vec2 c = (id + 0.12 + 0.76 * vec2(hash(id), hash(id + 1.1))) * cell;
			float d = length(q - c);
			float r = ph * mix(11.0, 22.0, amount);
			float fade = (1.0 - ph) * (1.0 - ph) * mix(0.6, 1.0, amount);
			out_.x += sin((d - r) * 1.15) * exp(-(d - r) * (d - r) / 18.0) * fade * 1.2;
			out_.y += exp(-d * d / 11.0) * (1.0 - smoothstep(0.0, 0.2, ph)) * mix(0.7, 1.25, amount);
			out_.y += (1.0 - smoothstep(0.0, 2.0, abs(d - r))) * fade * 0.45;
		}
	}
	return out_;
}

void main() {
	float flood = smoothstep(0.4, 0.92, u_level);
	vec2 swell = surgePair(v_along);
	float surge = swell.x;
	float shake = swell.y;
	float band = mix(${WATER.toFixed(2)}, 0.84, flood);
	band = mix(band, min(band + 0.3, 0.96), smoothstep(0.2, 1.7, shake + surge));
	float wobble = (noise(vec2(v_along * 0.02, v_side > 0.0 ? 3.0 : 7.0)) - 0.5) * mix(0.3, 0.55, clamp(shake, 0.0, 1.0));
	float w = abs(v_side) / (band * (1.0 + wobble));
	float depth = 1.0 - min(w * w, 1.0);
	float speed = mix(0.4, 1.0, depth);
	speed = mix(speed, 1.0, smoothstep(0.25, 1.5, shake));

	vec2 across = vec2(v_tan.y, -v_tan.x);
	vec2 push = u_trail[0].zw;
	float pace = min(length(push) / 180.0, 1.0);
	float near = exp(-pow(distance(v_world, u_trail[0].xy), 2.0) / 1600.0) * exp(-u_age[0] * 0.7);
	float energy = max(mix(0.25, 1.0, v_lit), max(near * max(pace, 0.35), smoothstep(0.2, 1.5, shake)));

	vec2 p = vec2(v_side * v_half, v_along) - vec2(dot(push, across), dot(push, v_tan)) * 0.2 * near;
	vec2 s0 = surface(p, energy, speed);
	float hx = surface(p + vec2(0.7, 0.0), energy, speed).x;
	float hy = surface(p + vec2(0.0, 0.7), energy, speed).x;
	vec2 r0 = rainHit(v_world);
	vec2 rx = rainHit(v_world + across * 0.7);
	vec2 ry = rainHit(v_world + v_tan * 0.7);
	float acrossPos = v_side * v_half;
	float wave = rings(v_world) + pulse(v_along, acrossPos);
	s0.x += wake(v_world) + r0.x + wave;
	hx += wake(v_world + across * 0.7) + rx.x + rings(v_world + across * 0.7) + pulse(v_along, acrossPos + 0.7);
	hy += wake(v_world + v_tan * 0.7) + ry.x + rings(v_world + v_tan * 0.7) + pulse(v_along + 0.7, acrossPos);
	float breakers = smoothstep(0.5, 1.2, wave) *
		smoothstep(0.38, 0.72, noise(vec2(acrossPos * 0.07, v_along * 0.045 + u_time * 0.35)));
	s0.y += r0.y + breakers * 0.55 * clamp(shake, 0.0, 1.5);
	float bump = mix(1.6, 2.6, energy) + u_weather.x * 1.2 + shake * 0.85;
	vec3 n = normalize(vec3((s0.x - hx) * bump, (s0.x - hy) * bump, 1.0));

	float sky = fbm(vec2(v_along * 0.004 + v_side * 0.3, 1.0));
	vec3 col = waterLight(n, depth, sky, energy);
	col += vec3(0.55, 0.62, 0.78) * u_weather.w * (0.2 + 0.55 * n.z);

	float flow = u_time * mix(16.0, 30.0, energy) * speed;
	float rapids = smoothstep(0.66, 0.85, fbm(vec2(p.x * 0.09, (p.y - flow * 1.5) * 0.025)));
	float foam = rapids * smoothstep(0.55, 0.8, s0.x) * 0.55 *
		smoothstep(0.38, 0.72, noise(p * 0.07 + vec2(u_time * 0.08, v_river)));
	foam += smoothstep(0.82, 0.98, w) * (1.0 - smoothstep(0.98, 1.04, w)) * 0.25;
	foam += min(s0.y, 1.0) * 0.9;
	foam += near * pace * smoothstep(0.45, 0.75, s0.x) * 0.6;
	col = mix(col, vec3(0.82, 0.92, 0.9), clamp(foam, 0.0, 1.0) * depth);
	driftwood(p, v_half * ${WATER.toFixed(2)} * 0.9, col);

	float waterEdge = v_half * band;
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
	float wet = 1.0 - smoothstep(1.0, mix(1.35, 1.7, flood), sw);
	float density = mix(0.85, 0.2, smoothstep(1.0, bankW, sw));
	float onBank = shape * step(stone.w, density) * step(0.98, sw) * (1.0 - smoothstep(bankW - 0.15, bankW, sw));
	rock *= mix(1.0, 0.55, wet);
	rock += vec3(0.5, 0.55, 0.5) * pow(dome, 6.0) * wet * 0.25;

	float moss = fbm(vec2(v_side * v_half, v_along) * 0.25);
	vec3 ground = mix(vec3(0.05, 0.047, 0.035), vec3(0.05, 0.08, 0.045), smoothstep(0.4, 0.7, moss) * smoothstep(1.1, 1.6, w));
	float bankA = (1.0 - smoothstep(1.0, bankW, w)) * 0.7;

	float gully = fbm(vec2(v_along * 0.035, v_side * 2.4 + v_river * 3.0));
	float stream = smoothstep(0.64, 0.8, gully) * smoothstep(0.3, 1.1, shake + surge) *
		smoothstep(0.92, 1.05, w) * (1.0 - smoothstep(1.35, 1.62, w));
	vec3 c = mix(ground, rock, onBank);
	c = mix(c, col, max(waterA, stream * 0.85));
	float a = max(max(max(waterA, bankA), onBank), stream * 0.8);

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
varying vec2 v_world;
void main() {
	v_lit = a_shape.z < -0.5 ? 0.0 : u_lit[int(a_shape.z + 0.5)];
	v_local = a_local;
	v_size = a_size;
	v_shape = a_shape;
	v_world = a_pos;
	gl_Position = clip(a_pos, u_view);
}
`;

// Docks, rowboats, rafts and the sea. p is (across, downstream) from the craft's centre.
const CRAFT_FRAG = `${PRECISION}${NOISE}${BLEND}${WEATHER}${WAVES}${WATER_LIGHT}${WOOD}
uniform float u_time;
uniform float u_reveal;
uniform float u_focus;
uniform float u_along[${MAX_RIVERS}];
varying vec2 v_local;
varying vec2 v_size;
varying vec4 v_shape;
varying float v_lit;
varying vec2 v_world;

// Same along-clock as the river water. Docks sit at the mouth; boats a rope back.
float mouthAlong() {
	float along = 0.0;
	for (int i = 0; i < ${MAX_RIVERS}; i++) {
		if (abs(v_shape.z - float(i)) < 0.5) along = u_along[i];
	}
	return along - v_shape.w;
}

float box(vec2 p, vec2 b, float r) {
	vec2 d = abs(p) - b + r;
	return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

vec3 weathered(vec3 c, float amount) {
	return mix(c, vec3(0.34, 0.31, 0.27), amount);
}

void ripples(float d, inout vec4 acc);

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
	float idle = sin(u_time * 0.42 + seed) * 0.12;
	float gust = u_weather.x * sin(u_time * 0.9 + seed * 2.0) * 0.22;
	float along = mouthAlong();
	float h0 = pulse(along, 0.0);
	float hUp = pulse(along - b.y, 0.0);
	float heave = h0 * 1.6;
	float pitch = (hUp - h0) * 1.1;
	vec2 q = p + vec2(
		idle + gust + pitch * 0.35,
		heave + pitch * (p.y / max(b.y, 1.0)) * 0.55
	);

	float y01 = clamp((q.y + b.y) / max(2.0 * b.y, 1.0), 0.0, 1.0);
	float taper = mix(1.04, 0.94, y01);
	float bow = sin(y01 * 3.14159) * (hash(vec2(seed, 0.7)) - 0.5) * 6.0;
	vec2 wq = vec2(q.x - bow, q.y);

	float nRows = 8.0 + floor(hash(vec2(seed, 2.4)) * 2.99);
	float nibbleB = (hash(vec2(seed, 5.2)) - 0.35) * 3.0;
	float nibbleT = (hash(vec2(seed, 4.1)) - 0.5) * 2.5;
	float ySpan = max(2.0 * b.y + nibbleT + nibbleB, 8.0);
	float rowF = ((wq.y + b.y + nibbleB) / ySpan) * nRows;
	float row = floor(rowF);
	float fy = fract(rowF);
	float bh = ySpan / nRows;

	float left = (hash(vec2(row, seed + 1.1)) - 0.4) * 7.0;
	float right = (hash(vec2(row, seed + 2.3)) - 0.4) * 7.0;
	float chewed = step(0.78, hash(vec2(row, seed + 8.0))) * 5.0;
	float halfW = b.x * taper;
	float x0 = -halfW - left + chewed * 0.35 + (hash(vec2(row, seed + 6.6)) - 0.5) * 2.5;
	float x1 = halfW + right - chewed * 0.55 + (hash(vec2(row, seed + 7.1)) - 0.5) * 2.5;
	float hw = max(x1 - x0, 8.0) * 0.5;
	float cx = (x0 + x1) * 0.5;
	float cy = (row + 0.5) * bh - b.y - nibbleB;
	float d = box(vec2(wq.x - cx, wq.y - cy), vec2(hw, bh * 0.48), 0.8);

	ripples(d, acc);
	over(acc, vec3(0.0), (1.0 - smoothstep(-4.0, 12.0, d + 5.0)) * 0.5);

	float jl = 30.0 + 22.0 * hash(vec2(row, seed));
	float px = wq.x - x0 + hash(vec2(row, seed + 3.0)) * jl * 0.4;
	float piece = floor(px / jl);
	float fx = px - piece * jl;
	float id = hash(vec2(row * 7.0 + piece, seed + 9.0));

	vec3 plank = wood(vec2(fy * bh, px), id * 50.0 + seed);
	plank = weathered(plank, 0.2 + 0.4 * id) * (0.78 + 0.34 * id);
	plank *= 0.78 + 0.32 * sin(fy * 3.14159);
	plank *= 0.78 + 0.38 * fbm(q * 0.06 + seed);
	float seam = smoothstep(0.0, 0.1, fy) * smoothstep(1.0, 0.9, fy);
	seam *= smoothstep(0.0, 1.1, fx) * smoothstep(jl, jl - 1.1, fx);
	plank *= mix(0.22, 1.0, seam);
	vec2 nail = vec2(min(fx, jl - fx) - 3.0, (abs(fy - 0.5) - 0.22) * bh);
	plank *= mix(0.4, 1.0, smoothstep(0.5, 0.9, length(nail)));
	float wet = smoothstep(0.35, -0.15, q.y / max(b.y, 1.0));
	plank = mix(plank, plank * vec3(0.62, 0.78, 0.58), wet * 0.32 * fbm(q * 0.11 + seed));

	vec3 beam = weathered(wood(vec2(q.y, q.x), seed + 5.0), 0.2) * 0.68;
	float rail = min(abs(wq.x - x0), abs(wq.x - x1));
	plank = mix(plank, beam, (1.0 - smoothstep(1.0, 2.6, rail)) * 0.85);
	plank = mix(plank, beam, smoothstep(-3.2, -2.4, d));
	over(acc, plank, 1.0 - smoothstep(-0.5, 0.5, d));

	for (int i = 0; i < 6; i++) {
		float f = float(i);
		vec2 at;
		if (i < 4) {
			at = vec2(
				mix(-1.0, 1.0, step(0.5, mod(f, 2.0))) * b.x * 0.78,
				mix(-1.0, 1.0, step(1.5, f)) * b.y * 0.72
			);
		} else {
			at = vec2(
				(hash(vec2(f, seed + 11.0)) - 0.5) * b.x * 1.55,
				-b.y - 3.0 - hash(vec2(f, seed + 12.0)) * 9.0
			);
		}
		at += vec2(hash(vec2(f, seed)) - 0.5, hash(vec2(f, seed + 3.0)) - 0.5) * 8.0;
		post((q - at) * 1.35, seed + f * 9.0, acc);
	}
}

// Swings a moored craft on its rope, which is tied at the dock edge.
vec2 swing(vec2 p, float len, float seed) {
	vec2 pivot = vec2(0.0, len + v_shape.w);
	float a = sin(u_time * 0.7 + seed) * 0.07 * (1.0 + 2.0 * u_weather.x);
	vec2 d = p - pivot;
	vec2 q = vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y) + pivot;
	return q + vec2(0.0, sin(u_time * 1.3 + seed) * 0.5 + pulse(mouthAlong(), 0.0) * 6.0);
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

// Side-to-side roll of a floating craft; stronger in a gust or a passing wake.
float rocking(float seed) {
	return sin(u_time * 1.1 + seed * 2.0) * (0.12 + 0.3 * u_weather.x)
		+ rings(v_world) * 0.45
		+ pulse(mouthAlong(), 0.0) * 2.2;
}

void boat(vec2 p, float seed, inout vec4 acc) {
	vec2 b = v_size * 0.5;
	vec2 q = swing(p, b.y, seed);
	float roll = rocking(seed);
	q.x += roll * 1.2;
	float d = hull(q, b);
	ripples(d, acc);
	over(acc, vec3(0.0), (1.0 - smoothstep(-1.0, 5.0, hull(q - vec2(1.5, 2.5), b))) * 0.5);

	float s = q.y / b.y;
	float hw = b.x * (s < 0.0 ? pow(max(1.0 - s * s, 0.0), 0.75) : 1.0 - 0.28 * s * s);
	float k = abs(q.x) / max(hw, 0.01);
	float strake = fract(k * 3.0);
	vec3 inside = weathered(wood(q, seed), 0.15) * (0.6 + 0.45 * (1.0 - k * k));
	inside *= 1.0 + roll * sign(q.x) * k * 1.2;
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
	float roll = rocking(seed);
	q.x += roll * 1.2;
	ripples(box(q, b, b.x * 0.2), acc);
	float rad = b.x / 5.0;
	for (int i = 0; i < 5; i++) {
		float f = float(i);
		float len = b.y - rad - 1.5 * hash(vec2(f, seed));
		float shift = (hash(vec2(f, seed + 2.0)) - 0.5) * 2.0;
		drawLog(q - vec2(-b.x + rad * (2.0 * f + 1.0), shift), len, rad, f * 10.0 + seed, 0.0, roll * 2.0, acc);
	}
	float lash = min(abs(q.y + b.y * 0.55), abs(q.y - b.y * 0.55));
	vec3 twist = mix(vec3(0.42, 0.34, 0.22), vec3(0.62, 0.53, 0.38), 0.5 + 0.5 * sin((q.x - q.y) * 4.0));
	over(acc, twist, (1.0 - smoothstep(0.8, 1.2, lash)) * step(abs(q.x), b.x - 0.3));
	rope(q, b.y, acc);
}

// Several wave trains at incommensurate speeds. One shared sine reads as a grid.
float swell(vec2 p) {
	float warp = noise(p * 0.016 + u_time * 0.06) * 16.0;
	vec2 q = p + vec2(warp, -warp * 0.65);
	float h = 0.0;
	h += 0.48 * sin(dot(q, vec2(0.31, 0.95)) * 0.09 - u_time * 1.07);
	h += 0.26 * sin(dot(q, vec2(-0.66, 0.75)) * 0.16 - u_time * 1.69);
	h += 0.15 * sin(dot(q, vec2(0.93, 0.37)) * 0.24 - u_time * 2.41);
	h += 0.1 * sin(dot(q, vec2(0.19, -0.98)) * 0.33 - u_time * 3.13);
	h += 0.3 * fbm(q * 0.038 + vec2(u_time * 0.12 * u_weather.y, -u_time * 0.08));
	h += 0.14 * noise(q * 0.2 - vec2(u_time * 0.47 * u_weather.y, u_time * 0.21));
	h += 0.16 * max(h, 0.0) * max(h, 0.0);
	return h * (1.0 + 0.5 * u_weather.x);
}

float seaHeight(vec2 p) {
	vec2 nd = p / max(length(p), 0.001);
	float inner = v_shape.w;
	float band = exp(-pow(length(p) - inner, 2.0) / 3400.0);
	float hull = (dot(nd, u_pose.xy) * 2.8 + dot(nd, clamp(u_pose.zw, -8.0, 8.0)) * 0.32) * band;
	return swell(p) + rings(u_portal + p) * 1.75 + hull;
}

// A small sea around the portrait: swell, surf on the coast and at the portrait.
void sea(vec2 p, float seed, inout vec4 acc) {
	float outer = v_size.x * 0.5;
	float inner = v_shape.w;
	float r = length(p);
	vec2 dir = p / max(r, 0.001);
	float coast = outer * (0.9 + 0.12 * fbm(dir * 1.7 + seed));
	float e = r / coast;
	if (e > 1.3) return;

	float h = seaHeight(p);
	float hx = seaHeight(p + vec2(0.7, 0.0));
	float hy = seaHeight(p + vec2(0.0, 0.7));
	vec3 n = normalize(vec3((h - hx) * 4.4, (h - hy) * 4.4, 1.0));
	float depth = 1.0 - smoothstep(0.75, 1.0, e);
	vec3 col = waterLight(n, max(depth, 0.2), fbm(p * 0.004 + 3.0), 0.4 + 0.6 * u_weather.x) * 0.85;
	col += vec3(0.55, 0.62, 0.78) * u_weather.w * 0.35;

	float ragged = fbm(dir * 4.2 + seed + u_time * 0.05);
	float surge = 0.03 * ragged;
	float lap = smoothstep(0.85 + surge, 0.97, e) * (1.0 - smoothstep(0.97, 1.03 + surge, e));
	float field = noise(p * 0.055 + vec2(u_time * 0.07 * u_weather.y, u_time * 0.03));
	field = field * 0.55 + 0.25 * noise(p * 0.14 - vec2(u_time * 0.12, u_time * 0.05 * u_weather.y));
	field += 0.2 * noise(vec2(dot(p, vec2(0.08, 0.02)), dot(p, vec2(-0.03, 0.12))) - u_time * 0.09);
	float cap = smoothstep(0.06, 0.2, 1.0 - n.z) * smoothstep(0.48, 0.8, field);
	cap *= 0.16 + 0.2 * u_weather.x;
	float surf = exp(-pow(r - inner - 2.0 - ragged * 10.0, 2.0) / 55.0);
	surf *= 0.12 + 0.28 * smoothstep(0.4, 0.75, field);
	float wash = max(dot(dir, u_pose.xy), 0.0) * 0.18;
	col = mix(col, vec3(0.82, 0.92, 0.9), clamp(lap * 0.4 + surf + cap + wash, 0.0, 1.0));

	vec3 sand = mix(vec3(0.05, 0.047, 0.035), vec3(0.09, 0.08, 0.06), noise(p * 0.3));
	over(acc, sand * 0.8, (1.0 - smoothstep(1.0, 1.28, e)) * 0.75);
	over(acc, col, 1.0 - smoothstep(0.99 + surge, 1.02 + surge, e));
}

void main() {
	vec4 acc = vec4(0.0);
	float seed = v_shape.y * 13.0 + 1.0;
	if (v_shape.x < 0.5) dock(v_local, seed, acc);
	else if (v_shape.x < 1.5) boat(v_local, seed, acc);
	else if (v_shape.x < 2.5) raft(v_local, seed, acc);
	else sea(v_local, seed, acc);
	acc.rgb *= mix(1.0, 0.6, u_focus * (1.0 - v_lit)) * mix(1.0, 1.2, v_lit);
	gl_FragColor = acc * smoothstep(0.85, 1.0, u_reveal);
}
`;

// Faint weather over the whole map: distant birds, gusts carrying leaves, light rain.
const WEATHER_FRAG = `${PRECISION}${NOISE}${BLEND}${WEATHER}
uniform vec2 u_view;
uniform vec2 u_px;
uniform float u_time;
uniform float u_reveal;
uniform vec4 u_gust;

// Distant small birds, not geese. They share a heading, leave gaps, and weave.
// Same 2x5 loop as before: empty slots and a flock box keep the cost down.
void birds(vec2 p, inout vec4 acc) {
	for (int k = 0; k < 2; k++) {
		float f = float(k);
		float span = 22.0 + 8.0 * f;
		float cycle = floor(u_time / span);
		if (hash(vec2(cycle, f + 1.0)) < 0.46) continue;
		float start = hash(vec2(cycle, f + 2.0)) * 9.0;
		float flight = mix(7.0, 16.0, hash(vec2(cycle, f + 3.0)));
		float localT = u_time - cycle * span - start;
		if (localT < 0.0 || localT > flight) continue;
		float ph = localT / flight;
		float flip = hash(vec2(cycle, f + 4.0)) < 0.5 ? -1.0 : 1.0;
		float y0 = mix(0.05, 0.7, hash(vec2(cycle, f + 5.0))) * u_view.y;
		float climb = (hash(vec2(cycle, f + 6.0)) - 0.5) * 0.4 * u_view.y;
		float weave = mix(0.6, 2.3, hash(vec2(cycle, f + 7.0)));
		float arc = mix(12.0, 68.0, hash(vec2(cycle, f + 8.0)));
		float wave = sin(ph * 6.2832 * weave) * arc;
		vec2 lead = vec2(
			mix(-180.0, u_view.x + 180.0, ph),
			y0 + climb * ph + wave
		);
		lead.x += u_weather.y * u_weather.x * 30.0 * ph;
		if (flip < 0.0) lead.x = u_view.x - lead.x;
		float vy = clamp((climb + cos(ph * 6.2832 * weave) * arc * weave * 6.2832) / 1600.0, -0.65, 0.65);
		vec2 dir = vec2(flip, vy);
		dir /= max(length(dir), 0.001);
		vec2 d = p - lead;
		vec2 local = vec2(d.x * dir.x + d.y * dir.y, -d.x * dir.y + d.y * dir.x);
		float along = mix(22.0, 88.0, hash(vec2(cycle, f + 9.0)));
		float across = mix(8.0, 38.0, hash(vec2(cycle, f + 10.0)));
		if (abs(local.x) > along + 22.0 || abs(local.y) > across + 22.0) continue;

		float filled = mix(0.28, 0.92, hash(vec2(cycle, f + 11.0)));
		float scale0 = mix(3.4, 6.6, hash(vec2(cycle, f + 12.0)));
		float fade = (0.28 + 0.18 * hash(vec2(cycle, f + 13.0))) *
			smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.88, 1.0, ph));

		for (int i = 0; i < 5; i++) {
			float g = float(i);
			if (hash(vec2(g + 1.3, cycle + f)) > filled) continue;
			vec2 at = vec2(
				(hash(vec2(g, cycle + 14.0)) - 0.55) * along,
				(hash(vec2(cycle, g + 4.0)) - 0.5) * across
			);
			float w1 = hash(vec2(g, cycle + 15.0));
			float w2 = hash(vec2(cycle, g + 16.0));
			at += vec2(
				sin(u_time * mix(0.35, 0.9, w1) + g * 2.1),
				cos(u_time * mix(0.3, 0.8, w2) + g * 1.4)
			) * mix(0.6, 2.8, hash(vec2(g, cycle + 17.0)));
			vec2 b = local - at;
			float scale = scale0 * mix(0.72, 1.28, hash(vec2(g, cycle + 18.0)));
			if (abs(b.x) > 12.0 * scale || abs(b.y) > 11.0 * scale) continue;
			float flap = 0.5 + 0.5 * sin(u_time * mix(3.1, 5.6, hash(vec2(g, 19.0))) + g * 2.8);
			vec2 q = b / scale;
			float body = length((q - vec2(0.04, 0.02)) / vec2(1.85, 0.3)) - 0.95;
			float head = length((q - vec2(1.42, 0.1)) / vec2(0.42, 0.34)) - 1.0;
			float beak = length((q - vec2(1.92, 0.08)) / vec2(0.55, 0.1)) - 1.0;
			vec2 tq = q + vec2(1.55, 0.0);
			float tail = length((tq - vec2(0.0, 0.0)) / vec2(1.15, 0.14)) - 0.55;
			vec2 sh = q - vec2(-0.08, 0.04);
			float up = mix(0.12, 1.05, flap);
			vec2 wu = vec2(sh.x * 0.38 + sh.y * up, sh.y - sh.x * 0.18);
			float wingU = length(wu / vec2(2.05, 0.18)) - 1.0;
			float dn = mix(0.95, 0.12, flap);
			vec2 wl = vec2(sh.x * 0.46 - sh.y * dn, sh.y + sh.x * 0.14);
			float wingL = length(wl / vec2(1.55, 0.16)) - 1.0;
			float sil = min(min(body, head), min(min(beak, tail), min(wingU, wingL)));
			vec3 col = mix(vec3(0.14, 0.14, 0.13), vec3(0.32, 0.3, 0.27), hash(vec2(g, cycle + 20.0)) * 0.55);
			col = mix(col, col * 1.18, clamp(0.4 - q.y, 0.0, 1.0) * 0.4);
			over(acc, col, (1.0 - smoothstep(0.0, 0.38, sil)) * fade);
		}
	}
}

// Soft oval of wind around the moving gust. Cheap: one distance, one sine warp.
float gustAt(vec2 p) {
	if (u_gust.w < 0.01) return 0.0;
	vec2 d = p - u_gust.xy;
	d.x += 22.0 * sin(d.y * 0.016 + u_time * 1.3);
	float r = length(d * vec2(1.0, 1.7));
	return exp(-r * r / (u_gust.z * u_gust.z)) * u_gust.w;
}

void gust(vec2 p, inout vec4 acc) {
	if (u_gust.w < 0.01) return;
	vec2 d = p - u_gust.xy;
	float r = max(u_gust.z, 1.0);
	float storm = smoothstep(0.12, 0.7, u_weather.z);
	vec2 seed = vec2(u_gust.z * 0.13, u_gust.z * 0.07);
	float a = hash(seed);
	float b = hash(seed + 1.7);
	float c = hash(seed + 3.3);
	float n1 = fbm(d * 0.013 + seed);
	float n2 = fbm(d * 0.038 + seed * 1.4);
	vec2 w = d + vec2(n1 - 0.5, n2 - 0.48) * r * 0.42;
	float m0 = length((w - vec2(0.0, r * 0.1)) * vec2(0.7, 1.75));
	float m1 = length((w - vec2((a - 0.5) * r * 0.52, (b - 0.58) * r * 0.26)) * vec2(1.08 + a * 0.35, 1.4));
	float m2 = length((w - vec2((c - 0.5) * r * 0.48, (a - 0.62) * r * 0.3)) * vec2(1.15 + c * 0.3, 1.45));
	float dist = min(m0, min(m1, m2));
	float sil = 1.0 - smoothstep(r * 0.3, r * 0.6, dist - (n2 - 0.45) * r * 0.2);
	float n3 = fbm(d * 0.055 + seed * 2.1);
	float floorCut = 1.0 - smoothstep(
		r * 0.02,
		r * 0.42,
		d.y + (n1 - 0.5) * r * 0.3 + (n3 - 0.5) * r * 0.24
	);
	float g = sil * floorCut * (0.72 + 0.28 * n2) * u_gust.w;
	if (g < 0.03) return;
	float height = clamp(-d.y / max(r * 0.42, 1.0), 0.0, 1.0);
	float grey = step(0.7, hash(seed + 8.2));
	float dark = max(storm, grey * 0.4);
	vec3 fair = vec3(0.88, 0.9, 0.93) * (0.74 + 0.2 * height);
	vec3 nimbus = vec3(0.46, 0.48, 0.52) * (0.58 + 0.34 * height);
	vec3 col = mix(fair, nimbus, dark);
	over(acc, col, clamp(g, 0.0, 1.0) * mix(0.28, 0.64, u_gust.w) * mix(0.9, 1.15, storm));
}

void leaves(vec2 p, inout vec4 acc) {
	vec2 size = vec2(150.0, 120.0);
	vec2 id = floor(p / size);
	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 cell = id + vec2(float(x), float(y));
			if (hash(cell + 5.0) > 0.55) continue;
			float rate = 0.1 + 0.2 * hash(cell + 1.1);
			float age = fract(u_time * rate + hash(cell + 2.2));
			float fade = smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(0.78, 1.0, age));
			vec2 origin = (cell + 0.12 + 0.76 * vec2(hash(cell), hash(cell + 1.3))) * size;
			float slow = hash(cell + 6.6);
			float fall = age * mix(14.0, 120.0, hash(cell + 3.4));
			if (slow > 0.72) fall *= 0.22;
			float flutter = sin(u_time * mix(1.1, 3.2, hash(cell + 4.1)) + cell.x) * mix(3.0, 16.0, hash(cell + 4.7));
			float bias = hash(cell + 6.0) - 0.5;
			float drift = age * mix(4.0, 50.0, 1.0 - slow) * bias * 2.0;
			float g = gustAt(origin);
			float ride = hash(cell + 8.0);
			vec2 carry = vec2(u_weather.y, -0.22) * g * mix(8.0, 85.0, ride) * age;
			if (slow > 0.7) carry *= 0.12;
			vec2 c = origin + vec2(drift, fall + flutter) + carry;
			vec2 d = p - c;
			float spin = u_time * mix(0.6, 4.2, hash(cell + 4.0)) + hash(cell) * 6.0;
			vec2 l = vec2(cos(spin) * d.x + sin(spin) * d.y, -sin(spin) * d.x + cos(spin) * d.y);
			float tumble = 0.35 + 0.65 * abs(cos(u_time * mix(1.4, 3.6, hash(cell + 7.2)) + cell.y));
			l.x /= tumble;
			float len = 4.5 + 3.2 * hash(cell + 8.0);
			float width = len * 0.45 * (1.0 - pow(clamp(l.y / len, -1.0, 1.0), 2.0));
			float dd = max(abs(l.x) - width, abs(l.y) - len);
			vec3 tint = mix(vec3(0.55, 0.6, 0.25), vec3(0.75, 0.45, 0.18), hash(cell + 9.0));
			tint = mix(tint, vec3(0.45, 0.3, 0.16), hash(cell + 10.0) * 0.5) * (0.8 + 0.3 * tumble);
			over(acc, tint, (1.0 - smoothstep(-0.3, 0.4, dd)) * fade * mix(0.28, 0.5, g));
		}
	}
}

void rain(vec2 p, inout vec4 acc) {
	float amount = u_weather.z;
	float slant = u_weather.y * u_weather.x * 0.35 + 0.08;
	for (int k = 0; k < 2; k++) {
		float f = float(k);
		vec2 size = vec2(16.0 + 8.0 * f, 70.0);
		vec2 q = vec2(p.x - p.y * slant, p.y - u_time * (650.0 + 250.0 * f)) + f * 37.0;
		vec2 id = floor(q / size);
		if (hash(id + f * 9.0) > amount) continue;
		vec2 d = q - (id + 0.2 + 0.6 * vec2(hash(id + 3.0), hash(id + 4.0))) * size;
		float len = (5.0 + 8.0 * f) * (0.5 + 0.7 * hash(id + 5.0)) * mix(0.7, 1.3, amount);
		float line = abs(d.x) + max(abs(d.y) - len, 0.0) * 2.0;
		over(acc, vec3(0.78, 0.86, 0.9), (1.0 - smoothstep(0.2, 0.9, line)) * (0.045 + 0.06 * f) * amount);
	}
	over(acc, vec3(0.55, 0.62, 0.68), 0.035 * amount);
}

void main() {
	vec2 p = vec2(gl_FragCoord.x, u_px.y - gl_FragCoord.y) / u_px * u_view;
	vec4 acc = vec4(0.0);
	birds(p, acc);
	if (u_gust.w > 0.01) gust(p, acc);
	if (u_gust.w > 0.01) leaves(p, acc);
	if (u_weather.z > 0.01) rain(p, acc);
	if (u_weather.w > 0.01) over(acc, vec3(0.82, 0.86, 0.96), u_weather.w * 0.18);
	gl_FragColor = acc * smoothstep(0.85, 1.0, u_reveal);
}
`;

// Stretches the 1x land texture onto the water canvas.
const BLIT_FRAG = `${PRECISION}
uniform sampler2D u_tex;
uniform vec2 u_px;
void main() {
	gl_FragColor = texture2D(u_tex, gl_FragCoord.xy / u_px);
}
`;

// Same hash as NOISE. Used only to skip the weather pass when no flock is up.
const fract = (v) => v - Math.floor(v);
const hash2 = (x, y) => {
	let px = fract(x * 123.34);
	let py = fract(y * 456.21);
	const add = px * (px + 45.32) + py * (py + 45.32);
	return fract((px + add) * (py + add));
};

// Must match the 2-flock window in WEATHER_FRAG (span 22+8k, skip 0.46, start, flight).
const flocksUp = (time) => {
	for (let k = 0; k < 2; k += 1) {
		const span = 22 + 8 * k;
		const cycle = Math.floor(time / span);
		if (hash2(cycle, k + 1) < 0.46) continue;
		const start = hash2(cycle, k + 2) * 9;
		const flight = 7 + 9 * hash2(cycle, k + 3);
		const local = time - cycle * span - start;
		if (local >= 0 && local <= flight) return true;
	}
	return false;
};

const skyBusy = (time, weather, gust) =>
	(gust && gust[3] > 0.01) ||
	(weather && (weather[2] > 0.01 || weather[3] > 0.01)) ||
	flocksUp(time);

const compile = (gl, vert, frag, name) => {
	const program = gl.createProgram();
	[
		[gl.VERTEX_SHADER, vert],
		[gl.FRAGMENT_SHADER, frag],
	].forEach(([type, source]) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
			throw new Error(
				`WebGL ${name} ${kind} shader: ${
					gl.getShaderInfoLog(shader) || "compile failed"
				}`
			);
		}
		gl.attachShader(program, shader);
	});
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(
			`WebGL ${name} program: ${gl.getProgramInfoLog(program) || "link failed"}`
		);
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

// One triangle that covers the whole canvas.
const FULL_SCREEN = new Float32Array([-1, -1, 3, -1, -1, 3]);

const GL_OPTS = { antialias: false, powerPreference: "high-performance" };

const makeTexture = (gl, width, height) => {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	return texture;
};

export const captureGlError = (error) => {
	const captured =
		error instanceof Error ? error : new Error(String(error || "WebGL failed"));
	if (typeof reportError === "function") reportError(captured);
	else console.error(captured);
	return captured;
};

// Draws land, rivers, crafts, and weather in one context.
// Land is painted at 1x into a texture (same as the old ground canvas) and stretched.
export const createGlWater = (canvas, layout) => {
	const gl = canvas.getContext("webgl", GL_OPTS);
	if (!gl) throw new Error("WebGL context unavailable");
	const program = compile(gl, WATER_VERT, WATER_FRAG, "water");
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

	const craftProgram = compile(gl, CRAFT_VERT, CRAFT_FRAG, "craft");
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
	const cWeather = c("u_weather");
	const cLevel = c("u_level");

	const groundProgram = compile(gl, QUAD_VERT, GROUND_FRAG, "ground");
	gl.useProgram(groundProgram);
	const bindGround = attributes(gl, groundProgram, [["a_pos", FULL_SCREEN, 2]]);
	const g = (name) => gl.getUniformLocation(groundProgram, name);
	gl.uniform2f(g("u_view"), layout.W, layout.H);
	gl.uniform2f(g("u_portal"), layout.portal.x, layout.portal.y);
	gl.uniform1f(g("u_ocean"), layout.oceanY);
	const gPx = g("u_px");

	const blitProgram = compile(gl, QUAD_VERT, BLIT_FRAG, "blit");
	gl.useProgram(blitProgram);
	const bindBlit = attributes(gl, blitProgram, [["a_pos", FULL_SCREEN, 2]]);
	const blitPx = gl.getUniformLocation(blitProgram, "u_px");
	gl.uniform1i(gl.getUniformLocation(blitProgram, "u_tex"), 0);

	const uWeather = u("u_weather");
	const uLevel = u("u_level");
	const uPose = u("u_pose");
	const uImpulse = u("u_impulse");
	const uImpAge = u("u_impAge");
	gl.useProgram(program);
	gl.uniform2f(u("u_portal"), layout.portal.x, layout.portal.y);
	const cPose = c("u_pose");
	const cImpulse = c("u_impulse");
	const cImpAge = c("u_impAge");
	gl.useProgram(craftProgram);
	gl.uniform2f(c("u_portal"), layout.portal.x, layout.portal.y);
	gl.uniform1fv(c("u_along"), strips.mouth);

	const noPose = new Float32Array(4);
	const noImpulse = new Float32Array(IMPULSE * 4);
	const noImpAge = new Float32Array(IMPULSE).fill(100);

	const groundFbo = gl.createFramebuffer();
	let groundTex = null;
	let groundW = 0;
	let groundH = 0;

	const paintGround = () => {
		const width = Math.max(1, Math.round(canvas.clientWidth));
		const height = Math.max(1, Math.round(canvas.clientHeight));
		if (!groundTex || width !== groundW || height !== groundH) {
			if (groundTex) gl.deleteTexture(groundTex);
			groundTex = makeTexture(gl, width, height);
			groundW = width;
			groundH = height;
			gl.bindFramebuffer(gl.FRAMEBUFFER, groundFbo);
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D,
				groundTex,
				0
			);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, groundFbo);
		gl.viewport(0, 0, groundW, groundH);
		gl.disable(gl.BLEND);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(groundProgram);
		bindGround();
		gl.uniform2f(gPx, groundW, groundH);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};

	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	let sky = null;
	let skyWait = 0;
	let skyDead = false;
	let alive = true;
	const ensureSky = () => {
		if (skyDead) return null;
		if (sky || !alive) return sky;
		try {
			const skyProgram = compile(gl, QUAD_VERT, WEATHER_FRAG, "weather");
			gl.useProgram(skyProgram);
			const bindSky = attributes(gl, skyProgram, [["a_pos", FULL_SCREEN, 2]]);
			const loc = (name) => gl.getUniformLocation(skyProgram, name);
			gl.uniform2f(loc("u_view"), layout.W, layout.H);
			sky = {
				program: skyProgram,
				bind: bindSky,
				px: loc("u_px"),
				time: loc("u_time"),
				reveal: loc("u_reveal"),
				weather: loc("u_weather"),
				gust: loc("u_gust"),
			};
			return sky;
		} catch (error) {
			skyDead = true;
			captureGlError(error);
			return null;
		}
	};
	const warmSky = () => {
		if (skyWait) return;
		skyWait = 1;
		const later = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
		later(() => {
			if (alive && !sky) ensureSky();
		});
	};

	return {
		paintGround,
		draw: ({ time, reveal, focus, lit, trail, ages, weather, gust, level, pose, impulse, impAge }) => {
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.disable(gl.BLEND);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			if (groundTex) {
				gl.useProgram(blitProgram);
				bindBlit();
				gl.uniform2f(blitPx, canvas.width, canvas.height);
				gl.bindTexture(gl.TEXTURE_2D, groundTex);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
			}

			gl.enable(gl.BLEND);
			gl.useProgram(program);
			bindWater();
			gl.uniform1f(uTime, time);
			gl.uniform1f(uReveal, reveal);
			gl.uniform1f(uFocus, focus);
			gl.uniform1fv(uLit, lit);
			gl.uniform4fv(uTrail, trail);
			gl.uniform1fv(uAge, ages);
			gl.uniform4fv(uWeather, weather);
			gl.uniform1f(uLevel, level ? level[0] : 0);
			gl.uniform4fv(uPose, pose || noPose);
			gl.uniform4fv(uImpulse, impulse || noImpulse);
			gl.uniform1fv(uImpAge, impAge || noImpAge);
			gl.drawArrays(gl.TRIANGLES, 0, strips.count);

			gl.useProgram(craftProgram);
			bindCrafts();
			gl.uniform1f(cTime, time);
			gl.uniform1f(cReveal, reveal);
			gl.uniform1f(cFocus, focus);
			gl.uniform1fv(cLit, lit);
			gl.uniform4fv(cWeather, weather);
			gl.uniform1f(cLevel, level ? level[0] : 0);
			gl.uniform4fv(cPose, pose || noPose);
			gl.uniform4fv(cImpulse, impulse || noImpulse);
			gl.uniform1fv(cImpAge, impAge || noImpAge);
			gl.drawArrays(gl.TRIANGLES, 0, crafts.count);

			if (skyBusy(time, weather, gust)) {
				const pass = ensureSky();
				if (pass) {
					gl.useProgram(pass.program);
					pass.bind();
					gl.uniform2f(pass.px, canvas.width, canvas.height);
					gl.uniform1f(pass.time, time);
					gl.uniform1f(pass.reveal, reveal);
					gl.uniform4fv(pass.weather, weather);
					gl.uniform4fv(pass.gust, gust);
					gl.drawArrays(gl.TRIANGLES, 0, 3);
				}
			} else {
				warmSky();
			}
		},
		destroy: () => {
			alive = false;
			gl.deleteFramebuffer(groundFbo);
			if (groundTex) gl.deleteTexture(groundTex);
		},
	};
};
