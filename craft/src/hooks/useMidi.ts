import { useEffect, useState, useCallback } from 'react';
import { KEY_ORDER, KEY_MAP, PIANO_START_MIDI } from '../theory/keyboard';
import { idx } from '../theory/pitch';

const CHROM_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
const midiNumToNote = (n: number) => `${CHROM_SHARP[n % 12]}${Math.floor(n / 12) - 1}`;

const noteToPianoKeyIndex = (note: string) => {
    const noteName = note.replace(/-?\d+$/, '');
    const octave = parseInt(note.match(/-?\d+$/)?.[0] ?? '', 10);
    const midi = (octave + 1) * 12 + idx(noteName);
    const baseIndex = midi - PIANO_START_MIDI;
    return baseIndex >= 0 && baseIndex < KEY_ORDER.length ? baseIndex : -1;
};

export const useMidi = (
    play: (n: string) => void,
    interactive: boolean,
    enabled: boolean,
    release?: (n: string) => void,
) => {
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
                    const inRange = (n: number) => n - PIANO_START_MIDI >= 0 && n - PIANO_START_MIDI < KEY_ORDER.length;

                    if (cmd === 0x90 && vel > 0) {
                        play(midiNumToNote(num));
                        if (inRange(num)) setLit(p => new Set(p).add(num - PIANO_START_MIDI));
                    }
                    if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
                        release?.(midiNumToNote(num));
                        if (inRange(num)) setLit(p => {
                            const n = new Set(p); n.delete(num - PIANO_START_MIDI); return n;
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
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            const note = KEY_MAP[key];
            const pressedKey = event.code || event.key;
            if (note && !pressedKeys.has(pressedKey)) {
                event.preventDefault();
                setPressedKeys(prev => new Set(prev).add(pressedKey));
                play(note);
                setLit(p => new Set(p).add(noteToPianoKeyIndex(note)));
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!interactive) return;
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            const note = KEY_MAP[key];
            if (note) {
                release?.(note);
                setPressedKeys(prev => {
                    const next = new Set(prev);
                    next.delete(event.code || event.key);
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
    }, [play, interactive, enabled, pressedKeys, release]);

    return { lit, midiReady };
};