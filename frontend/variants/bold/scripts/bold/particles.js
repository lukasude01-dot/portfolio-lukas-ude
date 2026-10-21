/**
 * PARTICLES  (WebGL particle cloud in the background, bold variant)
 *
 * PURPOSE:
 * Thousands of glowing points form a shape (the logo, a word,
 * a funnel ...). When another section scrolls into the middle of
 * the screen, the points fly over and form that section's shape.
 * The mouse pushes them away.
 *
 * HOW TO USE IN HTML:
 *   <section data-shape="logo">                 shape for this section
 *     <div data-shape-anchor></div>             optional: where it sits
 *   </section>
 *
 * Shapes: logo | text:WORT | funnel | orbit | wave | cloud
 * Optional: data-shape-size="0.8" (share of the anchor box)
 *
 * PERFORMANCE / ACCESSIBILITY:
 * - Off on weak devices (html[data-tier="low"], set in boot.js)
 * - With "reduce motion" the shape is shown still, no drifting
 * - Paused while the tab is hidden
 * - Pure decoration: the canvas is aria-hidden
 */

const VERTEX_SHADER = `
attribute vec2 aStart;
attribute vec2 aTarget;
attribute vec4 aSeed;
uniform vec2 uRes;
uniform vec2 uOffset;
uniform vec2 uMouse;
uniform float uMorph;
uniform float uTime;
uniform float uScale;
uniform float uMotion;
varying float vMix;
varying float vGlow;

float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
    // every point starts a little later, so the shape builds up in waves
    float t = clamp(uMorph * 1.6 - aSeed.x * 0.6, 0.0, 1.0);
    float e = easeInOut(t);
    vec2 pos = mix(aStart, aTarget + uOffset, e);

    // swirl while flying
    float flying = sin(e * 3.14159);
    float angle = aSeed.y * 6.2831 + uTime * 0.8;
    pos += vec2(cos(angle), sin(angle)) * flying * (60.0 + 140.0 * aSeed.z) * uMotion;

    // gentle idle drift
    pos += vec2(sin(uTime * 0.7 + aSeed.x * 40.0), cos(uTime * 0.6 + aSeed.y * 40.0)) * 2.2 * uMotion;

    // mouse pushes points away
    vec2 away = pos - uMouse;
    float dist = length(away);
    float push = smoothstep(150.0, 0.0, dist) * uMotion;
    pos += (away / max(dist, 0.001)) * push * 70.0;

    vec2 clip = (pos / uRes) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    gl_PointSize = (1.7 + aSeed.z * 3.2) * uScale * (1.0 + push * 1.4);
    vMix = aSeed.w;
    vGlow = push + flying * 0.6;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
varying float vMix;
varying float vGlow;
uniform float uAlpha;

void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    vec3 ivory = vec3(0.93, 0.92, 0.88);
    vec3 signal = vec3(1.0, 0.99, 0.95);
    vec3 color = mix(ivory, signal, clamp(step(0.72, vMix) + vGlow * 0.8, 0.0, 1.0));
    gl_FragColor = vec4(color, a * uAlpha * (0.7 + vMix * 0.3));
}`;

const MORPH_DURATION = 2200;   // ms for one shape change
const MOUSE_EASE = 0.12;

export function initParticles() {
    const canvas = document.querySelector("[data-particles]");
    if (!canvas) return;

    const tier = document.documentElement.dataset.tier || "high";
    if (tier === "low") return; // weak device: grid + glow only

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const COUNT = tier === "high" ? 9000 : 4200;

    // ---- GL SETUP ---------------------------------------------------------
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) return;
    gl.useProgram(program);

    const start = new Float32Array(COUNT * 2);
    const target = new Float32Array(COUNT * 2);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
        seeds.set([Math.random(), Math.random(), Math.random() ** 3, Math.random()], i * 4);
    }

    const startBuffer = createBuffer(gl, program, "aStart", start, 2);
    const targetBuffer = createBuffer(gl, program, "aTarget", target, 2);
    createBuffer(gl, program, "aSeed", seeds, 4);

    const uniform = (name) => gl.getUniformLocation(program, name);
    const u = {
        res: uniform("uRes"), offset: uniform("uOffset"), mouse: uniform("uMouse"),
        morph: uniform("uMorph"), time: uniform("uTime"), scale: uniform("uScale"),
        motion: uniform("uMotion"), alpha: uniform("uAlpha")
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive: overlapping points glow

    // ---- STATE --------------------------------------------------------------
    let width = 0;
    let height = 0;
    let dpr = 1;
    let activeSection = null;
    let morphStarted = 0;
    let morphOffset = { x: 0, y: 0 };   // offset used when the current morph started
    let hasMorphed = false;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const shapeCache = new Map();

    const sections = [...document.querySelectorAll("[data-shape]")];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, tier === "high" ? 1.75 : 1.25);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        shapeCache.clear();
        if (activeSection) morphTo(activeSection, { instant: true });
    }

    /** Box (viewport px) where the active section's shape sits */
    function anchorBox(section) {
        const anchor = section.querySelector("[data-shape-anchor]") || section;
        const rect = anchor.getBoundingClientRect();
        const box = anchor === section
            ? { x: 0, y: 0, w: width, h: height, cx: width / 2, cy: height / 2 }   // whole screen
            : { w: rect.width, h: rect.height, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
        return box;
    }

    function scatter() {
        const points = new Float32Array(COUNT * 2);
        for (let i = 0; i < COUNT; i++) {
            points[i * 2] = (Math.random() * 1.4 - 0.2) * width;
            points[i * 2 + 1] = (Math.random() * 1.4 - 0.2) * height;
        }
        return points;
    }

    /** Current position of every point (to start the next morph from there) */
    function currentPositions(now) {
        const progress = Math.min((now - morphStarted) / MORPH_DURATION, 1);
        const current = new Float32Array(COUNT * 2);
        for (let i = 0; i < COUNT; i++) {
            const t = clamp(progress * 1.6 - seeds[i * 4] * 0.6, 0, 1);
            const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            current[i * 2] = start[i * 2] + (target[i * 2] + morphOffset.x - start[i * 2]) * e;
            current[i * 2 + 1] = start[i * 2 + 1] + (target[i * 2 + 1] + morphOffset.y - start[i * 2 + 1]) * e;
        }
        return current;
    }

    async function morphTo(section, { instant = false } = {}) {
        const now = performance.now();
        const box = anchorBox(section);
        const shape = section.dataset.shape;
        const size = parseFloat(section.dataset.shapeSize || "1");
        const points = await getShape(shape, box.w * size, box.h * size);
        if (section !== activeSection) return; // another section won meanwhile

        if (instant) start.set(points.map((value, index) => value + (index % 2 ? box.cy : box.cx)));
        else if (!hasMorphed) start.set(scatter());   // first time: fly in from all over the screen
        else start.set(currentPositions(now));
        hasMorphed = true;
        target.set(points);
        morphOffset = { x: box.cx, y: box.cy };
        morphStarted = instant ? now - MORPH_DURATION : now;

        gl.bindBuffer(gl.ARRAY_BUFFER, startBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, start);
        gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, target);
        canvas.classList.add("is-ready");
        if (reducedMotion.matches) requestFrame();
    }

    async function getShape(shape, w, h) {
        const key = `${shape}|${Math.round(w)}|${Math.round(h)}`;
        if (!shapeCache.has(key)) shapeCache.set(key, await buildShape(shape, w, h, COUNT));
        return shapeCache.get(key);
    }

    /** Which section is in the middle of the screen? */
    function pickSection() {
        const middle = height * 0.5;
        let best = null;
        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= middle && rect.bottom >= middle) best = section;
        }
        if (best && best !== activeSection) {
            activeSection = best;
            morphTo(best);
        }
    }

    // ---- RENDER LOOP ----------------------------------------------------------
    let frameRequested = false;
    let running = true;

    function render(now) {
        frameRequested = false;
        const still = reducedMotion.matches;

        mouse.x += (mouse.tx - mouse.x) * MOUSE_EASE;
        mouse.y += (mouse.ty - mouse.y) * MOUSE_EASE;

        // the shape follows its anchor while scrolling
        const box = activeSection ? anchorBox(activeSection) : { cx: width / 2, cy: height / 2 };

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(u.res, width, height);
        gl.uniform2f(u.offset, box.cx, box.cy);
        gl.uniform2f(u.mouse, mouse.x, mouse.y);
        gl.uniform1f(u.morph, still ? 1 : Math.min((now - morphStarted) / MORPH_DURATION, 1));
        gl.uniform1f(u.time, still ? 0 : now / 1000);
        gl.uniform1f(u.scale, dpr);
        gl.uniform1f(u.motion, still ? 0 : 1);
        gl.uniform1f(u.alpha, 0.95);
        gl.drawArrays(gl.POINTS, 0, COUNT);

        if (running && !still) requestFrame();
    }

    function requestFrame() {
        if (frameRequested) return;
        frameRequested = true;
        requestAnimationFrame(render);
    }

    // ---- EVENTS ----------------------------------------------------------------
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    });
    window.addEventListener("scroll", () => {
        pickSection();
        if (reducedMotion.matches) requestFrame();
    }, { passive: true });
    window.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;
        mouse.tx = event.clientX;
        mouse.ty = event.clientY;
    }, { passive: true });
    document.addEventListener("mouseleave", () => {
        mouse.tx = -9999;
        mouse.ty = -9999;
    });
    document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
        if (running) requestFrame();
    });
    reducedMotion.addEventListener("change", requestFrame);
    // a section changed its shape (e.g. the "Kunden | Mitarbeiter" switch)
    window.addEventListener("particles:refresh", (event) => {
        if (activeSection && (!event.detail || event.detail === activeSection)) morphTo(activeSection);
    });

    // ---- START ------------------------------------------------------------------
    resize();
    // words need the display font before they are drawn
    const fontsReady = document.fonts ? document.fonts.load("900 120px Archivo").catch(() => null) : Promise.resolve();
    fontsReady.then(() => {
        pickSection();
        if (!activeSection && sections[0]) {
            activeSection = sections[0];
            morphTo(sections[0], { instant: false });
        }
        requestFrame();
    });
}


// =============================================================================
// SHAPES: every shape is a list of COUNT points (x, y) around the centre 0, 0
// =============================================================================

async function buildShape(shape, w, h, count) {
    w = Math.max(w, 40);
    h = Math.max(h, 40);
    if (shape === "cloud") return cloud(w, h, count);
    if (shape === "orbit") return orbit(w, h, count);
    if (shape === "wave") return wave(w, h, count);
    // path relative to this file, so it also works when the site lives in a subfolder
    if (shape === "logo") return fromImage(new URL("../../assets/brand/logo-mark-ivory.svg", import.meta.url).href, w, h, count);
    if (shape === "funnel") return fromDrawing(drawFunnel, w, h, count);
    if (shape.startsWith("text:")) return fromDrawing((ctx, cw, ch) => drawWord(ctx, cw, ch, shape.slice(5)), w, h, count);
    return cloud(w, h, count);
}

function cloud(w, h, count) {
    const points = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
        points[i * 2] = gaussian() * w * 0.28;
        points[i * 2 + 1] = gaussian() * h * 0.22;
    }
    return points;
}

function orbit(w, h, count) {
    const points = new Float32Array(count * 2);
    const radius = Math.min(w, h) * 0.42;
    for (let i = 0; i < count; i++) {
        const ring = i % 3;
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.55 + ring * 0.22) + gaussian() * 4;
        const tilt = [0.32, 0.55, 0.9][ring];
        points[i * 2] = Math.cos(angle) * r;
        points[i * 2 + 1] = Math.sin(angle) * r * tilt;
    }
    return points;
}

function wave(w, h, count) {
    const points = new Float32Array(count * 2);
    const columns = Math.ceil(Math.sqrt(count * (w / h)));
    for (let i = 0; i < count; i++) {
        const cx = (i % columns) / columns - 0.5;
        const cy = Math.floor(i / columns) / (count / columns) - 0.5;
        const depth = cy + 0.5;   // fake perspective: rows in the back are narrower
        points[i * 2] = cx * w * (0.55 + depth * 0.45);
        points[i * 2 + 1] = cy * h * 0.6 + Math.sin(cx * 9 + cy * 5) * h * 0.06;
    }
    return points;
}

async function fromImage(src, w, h, count) {
    const image = new Image();
    image.src = src;
    await image.decode().catch(() => null);
    return fromDrawing((ctx, cw, ch) => {
        const size = Math.min(cw, ch);
        ctx.drawImage(image, (cw - size) / 2, (ch - size) / 2, size, size);
    }, w, h, count);
}

/** Draws on a small hidden canvas and turns the filled pixels into points */
function fromDrawing(draw, w, h, count) {
    const scale = Math.min(1, 420 / Math.max(w, h));   // sample at max ~420px for speed
    const cw = Math.max(20, Math.round(w * scale));
    const ch = Math.max(20, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    draw(ctx, cw, ch);

    const data = ctx.getImageData(0, 0, cw, ch).data;
    const filled = [];
    for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
            if (data[(y * cw + x) * 4 + 3] > 120) filled.push(x, y);
        }
    }
    const points = new Float32Array(count * 2);
    if (!filled.length) return cloud(w, h, count);
    const pixels = filled.length / 2;
    for (let i = 0; i < count; i++) {
        const p = Math.floor(Math.random() * pixels) * 2;
        points[i * 2] = (filled[p] + Math.random() - cw / 2) / scale;
        points[i * 2 + 1] = (filled[p + 1] + Math.random() - ch / 2) / scale;
    }
    return points;
}

function drawWord(ctx, cw, ch, word) {
    let size = ch * 0.8;
    ctx.font = `900 ${size}px Archivo, Arial, sans-serif`;
    const measured = ctx.measureText(word).width;
    if (measured > cw * 0.96) size *= (cw * 0.96) / measured;
    ctx.font = `900 ${size}px Archivo, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(word, cw / 2, ch / 2);
}

function drawFunnel(ctx, cw, ch) {
    // three funnel levels (many clicks -> fewer leads -> customers)
    const levels = [[0.95, 0.12], [0.62, 0.42], [0.3, 0.7]];
    ctx.lineWidth = Math.max(2, ch * 0.012);
    for (const [share, top] of levels) {
        const y = ch * top;
        const half = (cw * share) / 2;
        ctx.beginPath();
        ctx.ellipse(cw / 2, y, half, ch * 0.05, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cw / 2 - (cw * 0.95) / 2, ch * 0.12);
    ctx.lineTo(cw / 2 - (cw * 0.3) / 2, ch * 0.7);
    ctx.lineTo(cw / 2 - cw * 0.06, ch * 0.95);
    ctx.moveTo(cw / 2 + (cw * 0.95) / 2, ch * 0.12);
    ctx.lineTo(cw / 2 + (cw * 0.3) / 2, ch * 0.7);
    ctx.lineTo(cw / 2 + cw * 0.06, ch * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cw / 2, ch * 0.95, ch * 0.03, 0, Math.PI * 2);
    ctx.fill();
}


// =============================================================================
// HELPERS
// =============================================================================

function gaussian() {
    return Math.sqrt(-2 * Math.log(Math.random() || 1e-6)) * Math.cos(2 * Math.PI * Math.random());
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[PARTICLES] Shader could not be compiled. Module: scripts/bold/particles.js", gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("[PARTICLES] WebGL program could not be linked. Module: scripts/bold/particles.js", gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function createBuffer(gl, program, name, data, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    return buffer;
}
