import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { getTempoLabel } from '../theory/tempo';

export interface MetronomeState {
    bpm: number;
    beats: number;
    subdivisions: number;
    running: boolean;
    activeBeat: number;
    activeSubdivision: number;
    tempoLabel: string;
}

export const useMetronome = (initialBpm = 120, initialBeats = 4) => {
    const [bpm, setBpm] = useState(initialBpm);
    const [beats, setBeats] = useState(initialBeats);
    const [subdivisions, setSubdivisions] = useState(1);
    const [running, setRun] = useState(false);
    const [activeBeat, setActiveBeat] = useState(-1);
    const [activeSubdivision, setActiveSubdivision] = useState(-1);
    const [tempoLabel, setTempoLabel] = useState(() => getTempoLabel(initialBpm));

    const synthRef = useRef<Tone.Synth | null>(null);
    const loopRef = useRef<Tone.Loop | null>(null);
    const tapHistory = useRef<number[]>([]);

    const beatsRef = useRef(beats);
    useEffect(() => { beatsRef.current = beats; }, [beats]);
    const subdivisionsRef = useRef(subdivisions);
    useEffect(() => { subdivisionsRef.current = subdivisions; }, [subdivisions]);

    const ensureAudio = async () => {
        if (Tone.context.state !== 'running') await Tone.start();
        if (!synthRef.current) {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
                volume: -10
            }).toDestination();
        }
    };

    const start = useCallback(async () => {
        await ensureAudio();
        let count = 0;
        // Using a Tone.Loop with a time-based interval to avoid interfering with the global Tone.Transport's BPM
        loopRef.current = new Tone.Loop(time => {
            const currentBeats = beatsRef.current;
            const currentSubdivisions = subdivisionsRef.current;
            const beat = Math.floor(count / currentSubdivisions);
            const subdivision = count % currentSubdivisions;

            if (subdivision === 0) {
                const accent = beat === 0;
                synthRef.current!.triggerAttackRelease(accent ? 'C6' : 'C5', '8n', time);
            } else {
                synthRef.current!.triggerAttackRelease('C4', '8n', time);
            }
            setActiveBeat(beat);
            setActiveSubdivision(subdivision);
            count = (count + 1) % (currentBeats * currentSubdivisions);
        }, 60 / (bpm * subdivisions)).start(0);

        // The Transport must be running for the loop to be scheduled
        Tone.Transport.start();
        setRun(true);
    }, [bpm, subdivisions]);

    const stop = useCallback(() => {
        if (loopRef.current) {
            loopRef.current.dispose();
            loopRef.current = null;
        }
        Tone.Transport.stop();
        setRun(false);
        setActiveBeat(-1);
        setActiveSubdivision(-1);
    }, []);

    useEffect(() => {
        if (loopRef.current) {
            loopRef.current.interval = 60 / (bpm * subdivisions);
        }
        setTempoLabel(getTempoLabel(bpm));
    }, [bpm, subdivisions]);


    const tap = () => {
        const now = performance.now();
        if (tapHistory.current.length && now - tapHistory.current.at(-1)! > 2000)
            tapHistory.current = [];
        tapHistory.current.push(now);
        if (tapHistory.current.length > 6) tapHistory.current.shift();
        if (tapHistory.current.length >= 2) {
            const avg =
                tapHistory.current
                    .slice(1)
                    .reduce((s, t, i) => s + t - tapHistory.current[i], 0) /
                (tapHistory.current.length - 1);
            setBpm(Math.max(30, Math.min(210, Math.round(60000 / avg))));
        }
    };

    return {
        state: { bpm, beats, subdivisions, running, activeBeat, activeSubdivision, tempoLabel } as MetronomeState,
        setBpm,
        setBeats,
        setSubdivisions,
        start,
        stop,
        tap,
    };
};