export const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export const WHITE_CNT = WHITE.length;
export const BASE_OCT = 3;
export const W_PCT = 100 / WHITE_CNT;

export const SHARP_OF: Record<number, string> = {
    0: 'C♯', 1: 'D♯', 3: 'F♯', 4: 'G♯', 5: 'A♯',
    7: 'C♯', 8: 'D♯', 10: 'F♯', 11: 'G♯', 12: 'A♯',
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
    'z': `C${BASE_OCT}`, 's': `C♯${BASE_OCT}`, 'x': `D${BASE_OCT}`, 'd': `D♯${BASE_OCT}`, 'c': `E${BASE_OCT}`,
    'v': `F${BASE_OCT}`, 'g': `F♯${BASE_OCT}`, 'b': `G${BASE_OCT}`, 'h': `G♯${BASE_OCT}`, 'n': `A${BASE_OCT}`, 'j': `A♯${BASE_OCT}`, 'm': `B${BASE_OCT}`,
    'q': `C${BASE_OCT + 1}`, '2': `C♯${BASE_OCT + 1}`, 'w': `D${BASE_OCT + 1}`, '3': `D♯${BASE_OCT + 1}`, 'e': `E${BASE_OCT + 1}`,
    'r': `F${BASE_OCT + 1}`, '5': `F♯${BASE_OCT + 1}`, 't': `G${BASE_OCT + 1}`, '6': `G♯${BASE_OCT + 1}`, 'y': `A${BASE_OCT + 1}`, '7': `A♯${BASE_OCT + 1}`, 'u': `B${BASE_OCT + 1}`,
};