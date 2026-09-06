import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { BASE_OCT, PIANO_START_MIDI } from '../theory/keyboard';
import 'html-midi-player';

const normalizeForTone = (note: string) =>
    note.replace(/♭/g, 'b').replace(/♯/g, '#');

export const ascend = (notes: string[], startOct = BASE_OCT) => {
    return ascendNotes(notes, startOct).map(({ name }) => name);
};

type LivePlayer = HTMLElement & {
    player?: {
        loadSamples: (sequence: unknown) => Promise<void>;
        playNoteDown: (note: unknown) => void;
        playNoteUp: (note: unknown) => void;
        stop: () => void;
    };
    noteSequence: unknown;
};

const SAMPLE_PITCHES = Array.from({ length: 88 }, (_, index) => index + 21);
const LIVE_NOTE_DURATION_MS = 1400;

const sampleSequence = (program: number) => ({
    notes: SAMPLE_PITCHES.map((pitch) => ({ pitch, velocity: 100, program })),
});

export interface AscendingNote {
    name: string;
    pitch: number;
}

export const ascendNotes = (notes: string[], startOct = BASE_OCT): AscendingNote[] => {
    const out: AscendingNote[] = [];
    let octave = startOct;
    let previous = -Infinity;

    while (notes.length > 0 && Tone.Frequency(normalizeForTone(`${notes[0]}${octave}`)).toMidi() < PIANO_START_MIDI) {
        octave += 1;
    }

    notes.forEach((name) => {
        let pitch = Tone.Frequency(normalizeForTone(`${name}${octave}`)).toMidi();
        while (pitch <= previous) {
            octave += 1;
            pitch = Tone.Frequency(normalizeForTone(`${name}${octave}`)).toMidi();
        }
        out.push({ name: `${name}${octave}`, pitch });
        previous = pitch;
    });

    return out;
};

export const useSynth = () => {
    const elementRef = useRef<LivePlayer | null>(null);
    const readyRef = useRef<Promise<void> | null>(null);
    const loadedProgramsRef = useRef(new Set<number>());
    const programRef = useRef(0);
    const [program, setProgram] = useState(0);

    useEffect(() => {
        const element = document.createElement('midi-player') as LivePlayer;
        element.setAttribute('sound-font', '');
        element.style.display = 'none';
        document.body.appendChild(element);
        elementRef.current = element;
        readyRef.current = new Promise((resolve) => {
            element.addEventListener('load', () => resolve(), { once: true });
        });
        element.noteSequence = sampleSequence(0);

        return () => {
            element.player?.stop();
            element.remove();
            elementRef.current = null;
            readyRef.current = null;
        };
    }, []);

    const ensureAudio = async () => {
        if (Tone.context.state !== 'running') await Tone.start();
        await readyRef.current;
    };

    const loadProgram = async (nextProgram: number) => {
        const element = elementRef.current;
        await readyRef.current;
        if (!element?.player || loadedProgramsRef.current.has(nextProgram)) return;
        await element.player.loadSamples(sampleSequence(nextProgram));
        loadedProgramsRef.current.add(nextProgram);
    };

    const playNoteDown = useCallback(async (note: string) => {
        await ensureAudio();
        await loadProgram(programRef.current);
        const pitch = Tone.Frequency(normalizeForTone(note)).toMidi();
        elementRef.current?.player?.playNoteDown({
            pitch,
            velocity: 100,
            program: programRef.current,
            isDrum: false,
        });
    }, []);

    const playNoteUp = useCallback(async (note: string) => {
        const pitch = Tone.Frequency(normalizeForTone(note)).toMidi();
        elementRef.current?.player?.playNoteUp({
            pitch,
            velocity: 100,
            program: programRef.current,
            isDrum: false,
        });
    }, []);

    const playSingle = useCallback(async (note: string) => {
        await playNoteDown(note);
        window.setTimeout(() => playNoteUp(note), LIVE_NOTE_DURATION_MS);
    }, [playNoteDown, playNoteUp]);

    const playTriad = useCallback(async (degree: number, scale: string[], includeSeventh = false) => {
        await ensureAudio();
        await loadProgram(programRef.current);
        const notes = ascend([
            scale[degree],
            scale[(degree + 2) % 7],
            scale[(degree + 4) % 7],
            ...(includeSeventh ? [scale[(degree + 6) % 7]] : []),
        ]);
        const events = notes.map((note) => ({
            pitch: Tone.Frequency(normalizeForTone(note)).toMidi(),
            velocity: 100,
            program: programRef.current,
            isDrum: false,
        }));
        events.forEach((event) => elementRef.current?.player?.playNoteDown(event));
        window.setTimeout(() => {
            events.forEach((event) => elementRef.current?.player?.playNoteUp(event));
        }, LIVE_NOTE_DURATION_MS);
    }, []);

    const setInstrument = useCallback((nextProgram: number) => {
        programRef.current = nextProgram;
        setProgram(nextProgram);
    }, []);

    return {
        ascend,
        playSingle,
        playNoteDown,
        playNoteUp,
        playTriad,
        ensureAudio,
        audioReady: Tone.context.state === 'running',
        setInstrument,
        program,
    };
};
