import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { BASE_OCT } from '../theory/keyboard';

const normalize = (n: string) => n.replace('♭', 'b').replace('♯', '#');

export const ascend = (notes: string[], startOct = BASE_OCT) => {
    const out: string[] = [];
    let oct = startOct;
    let prev = -Infinity;

    const toTone = (n: string, o: number) => normalize(n) + o;

    notes.forEach(n => {
        let cand = toTone(n, oct);
        let midi = Tone.Frequency(cand).toMidi();
        while (midi <= prev) {
            oct += 1;
            cand = toTone(n, oct);
            midi = Tone.Frequency(cand).toMidi();
        }
        out.push(cand);
        prev = midi;
    });

    return out;
};

export const useSynth = () => {
    const synthRef = useRef<Tone.PolySynth | null>(null);

    const [playingScale, setPlayingScale] = useState(false);
    const [audioReady, setAudioReady] = useState(
        Tone.context.state === 'running',
    );

    useEffect(() => {
        synthRef.current = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 1,
            modulationIndex: 5,
            detune: 0,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.02,
                decay: 0.6,
                sustain: 0.3,
                release: 0.8,
            },
            modulation: {
                type: 'sine'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.2,
                release: 0.2
            },
        }).toDestination().set({ volume: 0 });
    }, []);

    const ensureAudio = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            setAudioReady(true);
        }
    };

    const playSingle = useCallback(async (note: string) => {
        await ensureAudio();
        synthRef.current?.triggerAttackRelease(normalize(note), '4n');
    }, []);


    const playTriad = useCallback(
        async (deg: number, scale: string[]) => {
            await ensureAudio();
            const tri = ascend([scale[deg], scale[(deg + 2) % 7], scale[(deg + 4) % 7]]);
            synthRef.current?.triggerAttackRelease(tri, '4n');
        },
        [],
    );

    const playScale = useCallback(async (notes: string[]) => {
        if (playingScale) return;
        await ensureAudio();
        notes.forEach((n, i) =>
            synthRef.current?.triggerAttackRelease(
                normalize(n), '8n',
                Tone.now() + i * Tone.Time('8n').toSeconds(),
            ),
        );
        setPlayingScale(true);
        setTimeout(() => setPlayingScale(false),
            notes.length * Tone.Time('8n').toSeconds() * 1000);
    }, [playingScale]);

    return { ascend, playSingle, playTriad, playScale, playingScale, ensureAudio, audioReady };
};