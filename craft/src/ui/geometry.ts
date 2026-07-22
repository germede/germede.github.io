export const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

export const xy = (cx: number, cy: number, r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
});

export const arcPath = (
    cx: number, cy: number,
    ro: number, ri: number,
    start: number, end: number,
) => {
    const p0 = xy(cx, cy, ro, start);
    const p1 = xy(cx, cy, ro, end);
    const p2 = xy(cx, cy, ri, end);
    const p3 = xy(cx, cy, ri, start);
    return `M${p0.x} ${p0.y} A${ro} ${ro} 0 0 1 ${p1.x} ${p1.y}
          L${p2.x} ${p2.y}
          A${ri} ${ri} 0 0 0 ${p3.x} ${p3.y}Z`;
};