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