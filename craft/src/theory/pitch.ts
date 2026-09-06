export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const NAT_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const accFromDiff = (d: number) =>
    d === -2 ? '♭♭' : d === -1 ? '♭' : d === 0 ? '' : d === 1 ? '♯' : d === 2 ? '𝄪' : '';

export const idx = (note: string) => {
    const L = note[0] as keyof typeof NAT_PC;
    const pc0 = NAT_PC[L];
    let alt = 0;
    for (const c of note.slice(1)) {
        if (c === '♭' || c === 'b') alt--;
        else if (c === '♯' || c === '#') alt++;
        else if (c === 'x' || c === '𝄪') alt += 2;
    }
    return (pc0 + alt + 120) % 12;
};

export const enhEq = (a: string, b: string) => idx(a) === idx(b);

export type Quality = '' | 'm' | '°' | '+';

export const buildScale = (tonic: string, pattern: readonly number[]) => {
    const pc0 = idx(tonic);
    const startL = LETTERS.indexOf(tonic[0] as any);
    const pcs = [pc0];

    pattern.reduce((p, st) => {
        const nxt = (p + st) % 12; pcs.push(nxt); return nxt;
    }, pc0);

    return pcs.slice(0, 7).map((pc, i) => {
        const L = LETTERS[(startL + i) % 7];
        const diff = ((pc - NAT_PC[L] + 6) % 12) - 6;
        return L + accFromDiff(diff);
    });
};

export const qualities = (scale: string[]): Quality[] => {
    const n = scale.map(idx);
    return [...Array(7)].map((_, d) => {
        const r = n[d];
        const i3 = (n[(d + 2) % 7] - r + 12) % 12;
        const i5 = (n[(d + 4) % 7] - r + 12) % 12;
        if (i3 === 4 && i5 === 7) return '';
        if (i3 === 3 && i5 === 7) return 'm';
        if (i3 === 3 && i5 === 6) return '°';
        if (i3 === 4 && i5 === 8) return '+';
        return '' as Quality;
    });
};

const R_UP = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
const R_LOW = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'] as const;

export const romanFor = (d: number, q: Quality) => {
    if (q === '') return R_UP[d];
    if (q === 'm') return R_LOW[d];
    if (q === '°') return `${R_LOW[d]}°`;
    if (q === '+') return `${R_UP[d]}+`;
    return R_UP[d];
};