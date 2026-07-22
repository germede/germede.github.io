export const KEYS = [
  { tonic: 'C', acc: 0 }, { tonic: 'G', acc: 1 }, { tonic: 'D', acc: 2 },
  { tonic: 'A', acc: 3 }, { tonic: 'E', acc: 4 }, { tonic: 'B', acc: 5 },
  { tonic: 'G♭', acc: -6 }, { tonic: 'D♭', acc: -5 }, { tonic: 'A♭', acc: -4 },
  { tonic: 'E♭', acc: -3 }, { tonic: 'B♭', acc: -2 }, { tonic: 'F', acc: -1 },
] as const;

export const MODES = [
  { name: 'Lydian', degree: 4, pattern: [2, 2, 2, 1, 2, 2, 1] },
  { name: 'Ionian', degree: 1, pattern: [2, 2, 1, 2, 2, 2, 1] },
  { name: 'Mixolydian', degree: 5, pattern: [2, 2, 1, 2, 2, 1, 2] },
  { name: 'Dorian', degree: 2, pattern: [2, 1, 2, 2, 2, 1, 2] },
  { name: 'Aeolian', degree: 6, pattern: [2, 1, 2, 2, 1, 2, 2] },
  { name: 'Phrygian', degree: 3, pattern: [1, 2, 2, 2, 1, 2, 2] },
  { name: 'Locrian', degree: 7, pattern: [1, 2, 2, 1, 2, 2, 2] },
] as const;

export const DIATONIC_DEGREE_NAMES = [
  "Tonic",
  "Supertonic",
  "Mediant",
  "Subdominant",
  "Dominant",
  "Submediant",
  "Subtonic",
  "Leading tone",
] as const;

export const HARMONIC_MINOR_PATTERN = [2, 1, 2, 2, 1, 3, 1] as const;
export const MELODIC_MINOR_PATTERN = [2, 1, 2, 2, 2, 2, 1] as const;

export const SOLF_BASE = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
} as const;

export const SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const;
export const FLATS = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const;
export const SHARP_Y = [5, 3.5, 5.5, 4, 2.5, 4.5, 3];
export const FLAT_Y = [3, 4.5, 2.5, 4, 2, 3.5, 1.5];
export const BASS_SHARP_Y = [4, 2.5, 4.5, 3, 1.5, 3.5, 2];
export const BASS_FLAT_Y = [2, 3.5, 1.5, 3, 1, 2.5, 0.5];