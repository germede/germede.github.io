import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
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

export interface MetronomeControls {
    state: MetronomeState;
    setBpm: Dispatch<SetStateAction<number>>;
    setBeats: Dispatch<SetStateAction<number>>;
    setSubdivisions: Dispatch<SetStateAction<number>>;
    start: () => Promise<void>;
    stop: () => void;
    tap: () => void;
}

export const useMetronome = (initialBpm = 120, initialBeats = 4): MetronomeControls => {
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
    const subdivisionsRef = useRef(subdivisions);

    useEffect(() => { beatsRef.current = beats; }, [beats]);
    useEffect(() => { subdivisionsRef.current = subdivisions; }, [subdivisions]);

    const ensureAudio = async () => {
        if (Tone.context.state !== 'running') await Tone.start();
        if (!synthRef.current) {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
                volume: -10,
            }).toDestination();
        }
    };

    const start = useCallback(async () => {
        await ensureAudio();
        let count = 0;
        loopRef.current = new Tone.Loop((time) => {
            const currentBeats = beatsRef.current;
            const currentSubdivisions = subdivisionsRef.current;
            const beat = Math.floor(count / currentSubdivisions);
            const subdivision = count % currentSubdivisions;
            const note = subdivision === 0 ? (beat === 0 ? 'C6' : 'C5') : 'C4';
            synthRef.current?.triggerAttackRelease(note, '8n', time);
            setActiveBeat(beat);
            setActiveSubdivision(subdivision);
            count = (count + 1) % (currentBeats * currentSubdivisions);
        }, 60 / (bpm * subdivisions)).start(0);
        Tone.Transport.start();
        setRun(true);
    }, [bpm, subdivisions]);

    const stop = useCallback(() => {
        loopRef.current?.dispose();
        loopRef.current = null;
        Tone.Transport.stop();
        setRun(false);
        setActiveBeat(-1);
        setActiveSubdivision(-1);
    }, []);

    useEffect(() => {
        if (loopRef.current) loopRef.current.interval = 60 / (bpm * subdivisions);
        setTempoLabel(getTempoLabel(bpm));
    }, [bpm, subdivisions]);

    useEffect(() => () => {
        loopRef.current?.dispose();
        synthRef.current?.dispose();
        Tone.Transport.stop();
    }, []);

    const tap = () => {
        const now = performance.now();
        if (tapHistory.current.length && now - tapHistory.current.at(-1)! > 2000) tapHistory.current = [];
        tapHistory.current.push(now);
        if (tapHistory.current.length > 6) tapHistory.current.shift();
        if (tapHistory.current.length >= 2) {
            const average = tapHistory.current.slice(1).reduce(
                (sum, time, index) => sum + time - tapHistory.current[index], 0,
            ) / (tapHistory.current.length - 1);
            setBpm(Math.max(30, Math.min(210, Math.round(60000 / average))));
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
