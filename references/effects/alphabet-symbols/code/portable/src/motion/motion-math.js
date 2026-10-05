export const VIEW_WIDTH = 1396;
export const VIEW_HEIGHT = 1460;
export const GLYPHS = [
    "t",
    "a",
    "r",
    "i",
    "n",
    "1",
    "0",
    "<",
    ">",
    "/",
    "{",
    "}",
    "[",
    "]",
    "(",
    ")",
    "#",
    "@",
    "&",
    "=",
    "+",
    ";",
    "_",
    ".",
    "</>",
    "{}",
    "[]"
];
const OTHER_GLYPHS = GLYPHS.map((_, index)=>index).filter((index)=>index !== 5 && index !== 6);
export function chooseFieldGlyph(sample, alternatives = OTHER_GLYPHS) {
    const value = Math.max(0, Math.min(.999999999, sample));
    if (value < .3) return 5;
    if (value < .6) return 6;
    return alternatives[Math.floor((value - .6) / .4 * alternatives.length)];
}
export function glyphNoise(seed) {
    let value = seed | 0;
    value = Math.imul(value ^ value >>> 16, 0x45d9f3b);
    value = Math.imul(value ^ value >>> 16, 0x45d9f3b);
    return ((value ^ value >>> 16) >>> 0) / 4294967296;
}
export const PALETTE = [
    [
        0.816,
        0.937,
        0.388
    ],
    [
        0.643,
        0.827,
        0.675
    ],
    [
        0.647,
        0.827,
        0.890
    ],
    [
        0.898,
        0.914,
        0.839
    ]
];
export const clamp = (v, lo, hi)=>Math.min(hi, Math.max(lo, v));
export const distance = (a, b)=>Math.hypot(a.x - b.x, a.y - b.y);
export function seededRandom(seed) {
    let n = seed >>> 0 || 1;
    return ()=>{
        n ^= n << 13;
        n ^= n >>> 17;
        n ^= n << 5;
        return (n >>> 0) / 4294967296;
    };
}
export function validLayout(layout, margin = 22) {
    if (layout.rings.length !== 3 || !Number.isFinite(layout.disc.radius) || layout.disc.radius < 1) return false;
    let inside = false;
    for (const ring of layout.rings){
        if (![
            ring.x,
            ring.y,
            ring.radius,
            ring.thickness
        ].every(Number.isFinite) || ring.radius < ring.thickness + 20) return false;
        const d = distance(layout.disc, ring);
        const gap = ring.thickness / 2 + layout.disc.radius + margin;
        if (Math.abs(d - ring.radius) <= gap) return false;
        if (d + gap < ring.radius) inside = true;
    }
    return inside;
}
export function createLayout(seed, initial = false) {
    const rnd = seededRandom(seed);
    const colors = [
        0,
        1,
        2,
        3
    ];
    if (!initial) for(let i = 3; i > 0; i--){
        const j = Math.floor(rnd() * (i + 1));
        [colors[i], colors[j]] = [
            colors[j],
            colors[i]
        ];
    }
    for(let attempt = 0; attempt < 60; attempt++){
        const disc = {
            x: 750 + (rnd() - .5) * 90,
            y: 670 + (rnd() - .5) * 80,
            radius: 104,
            color: colors[3]
        };
        const base = [
            475,
            365,
            520
        ];
        const angles = [
            2.5,
            -.6,
            1.3
        ];
        const rings = base.map((r, i)=>{
            const radius = r + (rnd() - .5) * 95;
            const angle = angles[i] + (rnd() - .5) * .8;
            const offset = (radius - disc.radius - 120) * (.4 + rnd() * .35);
            return {
                x: disc.x + Math.cos(angle) * offset,
                y: disc.y + Math.sin(angle) * offset,
                radius,
                thickness: i === 1 ? 62 : 70,
                color: colors[i]
            };
        });
        const layout = {
            rings,
            disc,
            seed
        };
        if (validLayout(layout)) return layout;
    }
    return {
        seed,
        disc: {
            x: 750,
            y: 670,
            radius: 104,
            color: 3
        },
        rings: [
            {
                x: 660,
                y: 745,
                radius: 475,
                thickness: 70,
                color: 0
            },
            {
                x: 825,
                y: 580,
                radius: 365,
                thickness: 62,
                color: 1
            },
            {
                x: 820,
                y: 840,
                radius: 520,
                thickness: 70,
                color: 2
            }
        ]
    };
}
export function beginRingDrag(layout, index, pointer) {
    const ring = layout.rings[index];
    const d = Math.max(.001, distance(ring, layout.disc));
    const direction = {
        x: (layout.disc.x - ring.x) / d,
        y: (layout.disc.y - ring.y) / d
    };
    const anchor = {
        x: ring.x + direction.x * ring.radius,
        y: ring.y + direction.y * ring.radius
    };
    return {
        index,
        start: {
            ...ring
        },
        direction,
        anchor,
        startDistance: distance(pointer, anchor)
    };
}
export function resizeRing(layout, drag, pointer) {
    const r = clamp(drag.start.radius + (distance(pointer, drag.anchor) - drag.startDistance) / 2, 150, drag.start.radius * 5);
    const ring = {
        ...drag.start,
        x: drag.anchor.x - drag.direction.x * r,
        y: drag.anchor.y - drag.direction.y * r,
        radius: r
    };
    const candidate = {
        ...layout,
        rings: layout.rings.map((v, i)=>i === drag.index ? ring : v)
    };
    return validLayout(candidate) ? ring : null;
}
export function pigmentAt(layout, x, y, offset = {
    x: 0,
    y: 0
}) {
    if (Math.hypot(x - layout.disc.x, y - layout.disc.y) <= layout.disc.radius) return layout.disc.color;
    for(let i = 2; i >= 0; i--){
        const ring = layout.rings[i];
        if (Math.abs(Math.hypot(x - ring.x - offset.x, y - ring.y - offset.y) - ring.radius) < ring.thickness / 2) return ring.color;
    }
    return -1;
}
export class Gesture {
    id = null;
    start = {
        x: 0,
        y: 0
    };
    moved = false;
    blocked = false;
    threshold = 6;
    active = new Set();
    down(id, point, coarse) {
        this.active.add(id);
        if (this.active.size > 1) {
            this.blocked = true;
            this.id = null;
            return false;
        }
        this.id = id;
        this.start = point;
        this.moved = false;
        this.blocked = false;
        this.threshold = coarse ? 8 : 5;
        return true;
    }
    move(id, point) {
        if (this.id !== id || this.blocked) return false;
        if (distance(this.start, point) > this.threshold) this.moved = true;
        return this.moved;
    }
    up(id) {
        const tap = this.id === id && !this.moved && !this.blocked;
        this.active.delete(id);
        if (this.id === id) this.id = null;
        if (!this.active.size) this.blocked = false;
        return tap;
    }
    cancel(id) {
        if (id === undefined) this.active.clear();
        else this.active.delete(id);
        this.id = null;
        this.moved = true;
        this.blocked = this.active.size > 0;
    }
}
