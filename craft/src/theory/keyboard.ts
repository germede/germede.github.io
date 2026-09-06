export const WHITE = [
    'A', 'B',
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    'C', 'D', 'E', 'F', 'G',
] as const;
export const WHITE_CNT = WHITE.length;
export const BASE_OCT = 2;
export const PIANO_START_MIDI = 45;
export const W_PCT = 100 / WHITE_CNT;

export const SHARP_OF: Record<number, string> = {
    0: 'A♯', 2: 'C♯', 3: 'D♯', 5: 'F♯', 6: 'G♯',
    7: 'A♯', 9: 'C♯', 10: 'D♯', 12: 'F♯', 13: 'G♯', 14: 'A♯',
    16: 'C♯', 17: 'D♯', 19: 'F♯',
};

export const sharpsBefore = (whiteIdx: number) =>
    Object.keys(SHARP_OF).filter(k => +k < whiteIdx).length;

export const KEY_ORDER = (() => {
    const out: string[] = [];
    WHITE.forEach((w, i) => {
        out.push(w);
        if (SHARP_OF[i]) out.push(SHARP_OF[i]);
    });
    return out;
})();

export const KEY_MAP: { [key: string]: string } = {
    z: `A${BASE_OCT}`, s: `A♯${BASE_OCT}`, x: `B${BASE_OCT}`, c: `C${BASE_OCT + 1}`, f: `C♯${BASE_OCT + 1}`,
    v: `D${BASE_OCT + 1}`, g: `D♯${BASE_OCT + 1}`, b: `E${BASE_OCT + 1}`, n: `F${BASE_OCT + 1}`, j: `F♯${BASE_OCT + 1}`, m: `G${BASE_OCT + 1}`, k: `G♯${BASE_OCT + 1}`,
    ',': `A${BASE_OCT + 1}`, l: `A♯${BASE_OCT + 1}`, '.': `B${BASE_OCT + 1}`,
    q: `C${BASE_OCT + 2}`, 2: `C♯${BASE_OCT + 2}`, w: `D${BASE_OCT + 2}`, 3: `D♯${BASE_OCT + 2}`, e: `E${BASE_OCT + 2}`,
    r: `F${BASE_OCT + 2}`, 5: `F♯${BASE_OCT + 2}`, t: `G${BASE_OCT + 2}`, 6: `G♯${BASE_OCT + 2}`, y: `A${BASE_OCT + 2}`, 7: `A♯${BASE_OCT + 2}`, u: `B${BASE_OCT + 2}`,
    i: `C${BASE_OCT + 3}`, 9: `C♯${BASE_OCT + 3}`, o: `D${BASE_OCT + 3}`, 0: `D♯${BASE_OCT + 3}`, p: `E${BASE_OCT + 3}`,
    '[': `F${BASE_OCT + 3}`, '=': `F♯${BASE_OCT + 3}`, ']': `G${BASE_OCT + 3}`,
};
