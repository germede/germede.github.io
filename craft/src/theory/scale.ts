import { MODES } from './constants';
import { idx, LETTERS, NAT_PC, accFromDiff } from './pitch';

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
        if (i3 === 4 && i5 === 7) return ''; // Major
        if (i3 === 3 && i5 === 7) return 'm'; // Minor
        if (i3 === 3 && i5 === 6) return '°'; // Diminished
        if (i3 === 4 && i5 === 8) return '+'; // Augmented
        return '' as Quality; // Should not happen in diatonic scales, but as a fallback
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