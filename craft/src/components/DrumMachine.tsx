import { FC, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { MetronomeControls } from "../hooks/useMetronome";
import { COLORS } from "../ui/colors";
import { ActionButton, ComponentContainer } from "../ui/styles";

const TRACKS = [
  { key: "cymbal", label: "Cymbal", variant: true },
  { key: "hat", label: "Hat", variant: true },
  { key: "tom", label: "Tom", variant: true },
  { key: "snare", label: "Snare", variant: true },
  { key: "floor", label: "Floor", variant: false },
  { key: "kick", label: "Kick", variant: false },
] as const;

type TrackKey = (typeof TRACKS)[number]["key"];
type StepState = 0 | 1 | 2;
type Pattern = Record<TrackKey, StepState[]>;

const createPattern = (beats: number, subdivisions: number): Pattern => ({
  cymbal: Array.from({ length: beats * subdivisions }, () => 0),
  hat: Array.from(
    { length: beats * subdivisions },
    (_, index) => (index % subdivisions) % 2 === 0 ? 1 : 0,
  ),
  tom: Array.from({ length: beats * subdivisions }, () => 0),
  floor: Array.from({ length: beats * subdivisions }, () => 0),
  snare: Array.from({ length: beats * subdivisions }, (_, index) => {
    const beat = Math.floor(index / subdivisions);
    return index % subdivisions === 0 && (beat % 4 === 1 || beat % 4 === 3) ? 1 : 0;
  }),
  kick: Array.from({ length: beats * subdivisions }, (_, index) =>
    index % subdivisions === 0 ? 1 : 0,
  ),
});

const clearPattern = (steps: number): Pattern => ({
  cymbal: Array.from({ length: steps }, () => 0),
  hat: Array.from({ length: steps }, () => 0),
  tom: Array.from({ length: steps }, () => 0),
  floor: Array.from({ length: steps }, () => 0),
  snare: Array.from({ length: steps }, () => 0),
  kick: Array.from({ length: steps }, () => 0),
});

interface Props {
  controls: MetronomeControls;
}

export const DrumMachine: FC<Props> = ({ controls }) => {
  const {
    beats,
    subdivisions,
    running,
    activeBeat,
    activeSubdivision,
  } = controls.state;
  const { start, stop } = controls;
  const steps = beats * subdivisions;
  const stepDuration = subdivisions === 1 ? "4n" : subdivisions === 2 ? "8n" : "16n";
  const [pattern, setPattern] = useState<Pattern>(() =>
    createPattern(beats, subdivisions),
  );
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const patternRef = useRef(pattern);
  const runningRef = useRef(running);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    setPattern(createPattern(beats, subdivisions));
  }, [beats, steps, subdivisions]);

  useEffect(() => {
    const kick = new Tone.MembraneSynth({ volume: -6 }).toDestination();
    const snare = new Tone.NoiseSynth({
      volume: -12,
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    }).toDestination();
    const closedHat = new Tone.MetalSynth({
      volume: -12,
      envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    const openHat = new Tone.MetalSynth({
      volume: -18,
      envelope: { attack: 0.001, decay: 0.18, release: 0.03 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    const rimClick = new Tone.NoiseSynth({
      volume: -16,
      envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
    }).toDestination();
    const tom = new Tone.MembraneSynth({ volume: -10 }).toDestination();
    const floor = new Tone.MembraneSynth({ volume: -10 }).toDestination();
    const ride = new Tone.MetalSynth({
      volume: -18,
      envelope: { attack: 0.001, decay: 0.14, release: 0.03 },
      harmonicity: 3.5,
      modulationIndex: 20,
      resonance: 3500,
      octaves: 1.2,
    }).toDestination();
    const crash = new Tone.MetalSynth({
      volume: -16,
      envelope: { attack: 0.001, decay: 0.45, release: 0.08 },
      harmonicity: 3.5,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1.8,
    }).toDestination();
    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        if (!runningRef.current) return;
        const currentPattern = patternRef.current;
        if (currentPattern.cymbal[step] === 1) ride.triggerAttackRelease("C4", "8n", time);
        if (currentPattern.cymbal[step] === 2) crash.triggerAttackRelease("C4", "8n", time);
        if (currentPattern.hat[step] === 1) closedHat.triggerAttackRelease("32n", time);
        if (currentPattern.hat[step] === 2) openHat.triggerAttackRelease("8n", time);
        if (currentPattern.tom[step] === 1) tom.triggerAttackRelease("G3", "8n", time);
        if (currentPattern.tom[step] === 2) tom.triggerAttackRelease("E2", "8n", time);
        if (currentPattern.floor[step]) floor.triggerAttackRelease("C2", "8n", time);
        if (currentPattern.snare[step] === 1) snare.triggerAttackRelease("8n", time);
        if (currentPattern.snare[step] === 2) rimClick.triggerAttackRelease("32n", time);
        if (currentPattern.kick[step]) kick.triggerAttackRelease("C1", "8n", time);
      },
      Array.from({ length: steps }, (_, index) => index),
      stepDuration,
    );
    sequence.loop = true;
    sequence.start(0);

    return () => {
      sequence.dispose();
      ride.dispose();
      crash.dispose();
      closedHat.dispose();
      openHat.dispose();
      tom.dispose();
      floor.dispose();
      snare.dispose();
      rimClick.dispose();
      kick.dispose();
    };
  }, [steps, stepDuration]);

  const toggleStep = (track: TrackKey, step: number) => {
    const trackConfig = TRACKS.find(({ key }) => key === track);
    const stateCount = trackConfig?.variant ? 3 : 2;
    setPattern((current) => ({
      ...current,
      [track]: current[track].map((active, index) =>
        index === step ? ((active + 1) % stateCount) as StepState : active,
      ),
    }));
  };

  const toggleTrack = (track: TrackKey) => {
    const trackConfig = TRACKS.find(({ key }) => key === track);
    setPattern((current) => {
      const states = current[track];
      if (trackConfig?.variant) {
        const nextState = states.every((state) => state === 0)
          ? 1
          : states.every((state) => state === 1)
            ? 2
            : states.every((state) => state === 2)
              ? 0
              : 0;
        return {
          ...current,
          [track]: states.map(() => nextState as StepState),
        };
      }
      const isEmpty = states.every((state) => state === 0);
      return {
        ...current,
        [track]: states.map(() => isEmpty ? 1 : 0),
      };
    });
  };

  return (
    <ComponentContainer>
      <div style={{ width: "100%" }}>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: `58px repeat(${steps}, minmax(0, 1fr))`,
            gap: 3,
            alignItems: "center",
          }}
        >
          {TRACKS.map((track) => (
            <div key={track.key} style={{ display: "contents" }}>
              <button
                onClick={() => toggleTrack(track.key)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: COLORS.stroke,
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {track.label}
              </button>
              {Array.from({ length: steps }, (_, step) => {
                const state = pattern[track.key][step];
                const cellKey = `${track.key}-${step}`;
                const active =
                  running &&
                  Math.floor(step / subdivisions) === activeBeat &&
                  step % subdivisions === activeSubdivision;
                return (
                  <button
                    key={`${track.key}-${step + 1}`}
                    aria-label={`${track.label} step ${step + 1}`}
                    onClick={() => toggleStep(track.key, step)}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      minWidth: 0,
                      height: 28,
                      padding: 0,
                      border: active
                        ? `2px solid ${COLORS.text}`
                        : "1px solid transparent",
                      boxShadow: active
                        ? `inset 0 0 0 999px ${COLORS.hover}40`
                        : undefined,
                      background: hoveredCell === cellKey
                        ? COLORS.hover
                          : state === 1
                          ? COLORS.active
                            : state === 2
                              ? COLORS.idle
                          : COLORS.inactive,
                      opacity: state === 0 ? 0.35 : 1,
                      color: state === 0 ? COLORS.stroke : COLORS.text,
                      cursor: "pointer",
                      transition: "background 100ms ease",
                    }}
                  >
                    {step % subdivisions === 0 && (
                      <span
                        style={{
                          color: state === 0 ? COLORS.stroke : COLORS.text,
                          fontSize: 12,
                        }}
                      >
                        {Math.floor(step / subdivisions) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 7, width: "100%" }}>
        <ActionButton
        onClick={() => setPattern(clearPattern(steps))}
        style={{ flex: 1 }}
        >
        Clear
        </ActionButton>
        <ActionButton
          onClick={running ? stop : start}
          style={{
            background: running ? COLORS.active : undefined,
            flex: 1,
          }}
        >
          {running ? "Stop" : "Start"}
        </ActionButton>
        <ActionButton
          onClick={() => setPattern(createPattern(beats, subdivisions))}
          style={{ flex: 1 }}
        >
          Default
        </ActionButton>
      </div>
    </ComponentContainer>
  );
};
