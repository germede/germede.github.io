import { useEffect, useState, useCallback } from 'react';
import { KEY_ORDER, KEY_MAP, BASE_OCT } from '../theory/keyboard';

const CHROM_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
const midiNumToNote = (n: number) => `${CHROM_SHARP[n % 12]}${Math.floor(n / 12) - 1}`;

const noteToPianoKeyIndex = (note: string) => {
    const noteName = note.replace(/[0-9]/g, ''); // "C", "C#"
    const octave = parseInt(note.replace(/[^0-9]/g, ''), 10); // 3, 4

    let baseIndex = KEY_ORDER.findIndex(k => k === noteName);

    if (baseIndex === -1) return -1; // Should not happen with valid notes

    // Adjust for octave. If octave is BASE_OCT + 1, add 12 to the index.
    // Assuming BASE_OCT is 3, C3-B3 are indices 0-11, and C4-B4 are indices 12-23.
    if (octave === BASE_OCT + 1) {
        baseIndex += 12; // Move to the second octave in KEY_ORDER
    }
    return baseIndex;
};

export const useMidi = (play: (n: string) => void, interactive: boolean, enabled: boolean) => {
    const [lit, setLit] = useState<Set<number>>(new Set());
    const [pressedKeys, setPressedKeys] = useState(new Set<string>());
    const [midiReady, setMidiReady] = useState(false);

    useEffect(() => {
        let disconnectMidi: () => void;

        if (enabled) {
            navigator.requestMIDIAccess?.().then(midi => {
                setMidiReady(true);
                const onMsg = (e: MIDIMessageEvent) => {
                    const [status, num, vel] = e.data as Uint8Array;
                    const cmd = status & 0xf0;
                    const inRange = (n: number) => n - 48 >= 0 && n - 48 < KEY_ORDER.length;

                    if (cmd === 0x90 && vel > 0) {
                        play(midiNumToNote(num));
                        if (inRange(num)) setLit(p => new Set(p).add(num - 48));
                    }
                    if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
                        if (inRange(num)) setLit(p => {
                            const n = new Set(p); n.delete(num - 48); return n;
                        });
                    }
                };
                midi.inputs.forEach(i => i.addEventListener('midimessage', onMsg));
                disconnectMidi = () => {
                    midi.inputs.forEach(i => i.removeEventListener('midimessage', onMsg));
                    setMidiReady(false);
                }
            });
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!interactive) return;
            const note = KEY_MAP[event.key];
            if (note && !pressedKeys.has(event.key)) {
                event.preventDefault();
                setPressedKeys(prev => new Set(prev).add(event.key));
                play(note);
                setLit(p => new Set(p).add(noteToPianoKeyIndex(note)));
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!interactive) return;
            const note = KEY_MAP[event.key];
            if (note) {
                setPressedKeys(prev => {
                    const next = new Set(prev);
                    next.delete(event.key);
                    return next;
                });
                setLit(p => {
                    const n = new Set(p); n.delete(noteToPianoKeyIndex(note)); return n;
                });
            }
        };

        if (interactive) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        }

        return () => {
            disconnectMidi?.();
            if (interactive) {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            }
        };
    }, [play, interactive, enabled, pressedKeys]);

    return { lit, midiReady };
};