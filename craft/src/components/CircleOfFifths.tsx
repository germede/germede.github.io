import { FC, ReactNode, useMemo, useState, useEffect, useCallback } from "react";
import { COLORS } from "../ui/colors";
import { ActionButton } from "../ui/styles";
import { xy } from "../ui/geometry";
import {
  KEYS,
  MODES,
  SOLF_BASE,
  HARMONIC_MINOR_PATTERN,
  MELODIC_MINOR_PATTERN,
  DIATONIC_DEGREE_NAMES,
} from "../theory/constants";
import { buildScale, qualities, romanFor } from "../theory/scale";
import { KEY_ORDER, PIANO_START_MIDI } from "../theory/keyboard";
import { enhEq, idx } from "../theory/pitch";
import { Ring, Segment } from "./Ring";
import { Piano } from "./Piano";
import { Staff } from "./Staff";
import { ascend, ascendNotes, invertNotes, useSynth } from "../hooks/useSynth";
import { useMidi } from "../hooks/useMidi";
import { INSTRUMENTS } from "../ui/instruments";

export interface CircleOfFifthsSelection {
  tonic: string;
  mode: string;
  minorType?: "natural" | "harmonic" | "melodic";
  keyIndex: number;
  modeIndex: number;
  accidentals: number;
  scale: string[];
}

interface Props {
  size?: number;
  onSelect?: (s: CircleOfFifthsSelection) => void;
  metronomeBpm?: number;
}

interface ProgressionChord {
  degree: number;
  scale: string[];
  inversion: number;
  seventh: boolean;
}

const NO_SELECT: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  MozUserSelect: "none",
  msUserSelect: "none",
};

const chordSuffixFor = (scale: string[], degree: number, seventh: boolean) => {
  const chordQualities = qualities(scale);
  if (!seventh) return chordQualities[degree];

  const root = idx(scale[degree]);
  const third = (idx(scale[(degree + 2) % 7]) - root + 12) % 12;
  const fifth = (idx(scale[(degree + 4) % 7]) - root + 12) % 12;
  const seventhInterval = (idx(scale[(degree + 6) % 7]) - root + 12) % 12;
  if (third === 4 && fifth === 7 && seventhInterval === 11) return "maj7";
  if (third === 4 && fifth === 7 && seventhInterval === 10) return "7";
  if (third === 3 && fifth === 7 && seventhInterval === 10) return "m7";
  if (third === 3 && fifth === 6 && seventhInterval === 10) return "ø7";
  if (third === 3 && fifth === 6 && seventhInterval === 9) return "°7";
  return "7";
};

export const CircleOfFifths: FC<Props> = ({ size = 600, onSelect, metronomeBpm = 120 }) => {
  const cx = size / 2,
    cy = size / 2,
    r = (p: number) => p * (size / 2);
  const RAD = {
    centre: 0.3,
    keyIn: 0.3,
    keyOut: 0.5,
    romanIn: 0.5,
    romanOut: 0.7,
    modeIn: 0.7,
    modeOut: 0.9,
    aeolianR1: 0.7,
    aeolianR2: 0.766,
    aeolianR3: 0.833,
    aeolianR4: 0.9,
    catIn: 0.9,
    catOut: 0.95,
  };
  const SEG = 360 / 12,
    HALF = SEG / 2;

  const [keyIdx, setKeyIdx] = useState(0);
  const [modeIdx, setModeIdx] = useState(1);
  const [minorType, setMinorType] = useState<
    "natural" | "harmonic" | "melodic"
  >("natural");
  const [degIdx, setDegIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [solf, setSolf] = useState(false);
  const [seventhChords, setSeventhChords] = useState(false);
  const [doubling, setDoubling] = useState(false);
  const [inversion, setInversion] = useState(0);
  const [progression, setProgression] = useState<ProgressionChord[]>([]);
  const [loopProgression, setLoopProgression] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const [midiEnabled, setMidiEnabled] = useState(false);

  useEffect(() => {
    if (!seventhChords && inversion > 2) setInversion(0);
  }, [seventhChords, inversion]);

    const {
      playSingle: playInputNote,
      playNoteDown,
      playNoteUp,
      playTriad,
      setInstrument,
      program,
    } = useSynth();
  const { lit: midiLit, midiReady } = useMidi(
    playNoteDown,
    keyboardEnabled,
    midiEnabled,
    playNoteUp,
  );

  const pattern = useMemo(() => {
    if (modeIdx === 4) {
      // Aeolian
      if (minorType === "harmonic") return HARMONIC_MINOR_PATTERN;
      if (minorType === "melodic") return MELODIC_MINOR_PATTERN;
    }
    return MODES[modeIdx].pattern;
  }, [modeIdx, minorType]);

  const scale = useMemo(
    () => buildScale(KEYS[keyIdx].tonic, pattern),
    [keyIdx, pattern],
  );
  const quals = useMemo(() => qualities(scale), [scale]);

  const show = (note: string) =>
    solf
      ? (SOLF_BASE[note[0] as keyof typeof SOLF_BASE] ?? note) + note.slice(1)
      : note;

  const acc = useMemo(() => {
    const rel = (keyIdx + 1 - modeIdx + 12) % 12;
    return KEYS[rel].acc;
  }, [keyIdx, modeIdx]);

  const scaleSequence = useMemo(
    () => doubling
      ? Array.from({ length: 15 }, (_, index) => scale[index % 7])
      : [...scale, scale[0]],
    [scale, doubling],
  );
  const ascNotes = useMemo(() => ascend(scaleSequence), [scaleSequence]);
  const ascPitches = useMemo(
    () => ascendNotes(scaleSequence).map(({ pitch }) => pitch),
    [scaleSequence],
  );
  const chordVoiceNames = (degree: number) => [
    scale[degree],
    scale[(degree + 2) % 7],
    scale[(degree + 4) % 7],
    ...(seventhChords ? [scale[(degree + 6) % 7]] : []),
  ];
  const chordVoices = useMemo(
    () => {
      const voices = invertNotes(ascendNotes(chordVoiceNames(degIdx)), inversion);
      return doubling
        ? [
            ...voices,
            ...voices.map((voice) => ({
              ...voice,
              name: voice.name.replace(/(-?\d+)$/, (octave) => String(Number(octave) + 1)),
              pitch: voice.pitch + 12,
            })),
          ]
        : voices;
    },
    [degIdx, scale, seventhChords, inversion, doubling],
  );
  const chordNotes = useMemo(() => chordVoices.map(({ name }) => name), [chordVoices]);
  const chordPitches = useMemo(() => chordVoices.map(({ pitch }) => pitch), [chordVoices]);

  const chordSuffix = (degree: number) =>
    chordSuffixFor(scale, degree, seventhChords);

  const chordLabel = (
    chordScale: string[],
    degree: number,
    chordInversion: number,
    seventh: boolean,
  ) => {
    const names = [
      chordScale[degree],
      chordScale[(degree + 2) % 7],
      chordScale[(degree + 4) % 7],
      ...(seventh ? [chordScale[(degree + 6) % 7]] : []),
    ];
    const root = chordScale[degree];
    const bass = invertNotes(ascendNotes(names), chordInversion)[0].name
      .replace(/-?\d+$/, "");
    return `${show(root)}${chordSuffixFor(chordScale, degree, seventh)}${idx(bass) === idx(root) ? "" : `/${show(bass)}`}`;
  };

  const chordName = (degree: number) =>
    chordLabel(scale, degree, inversion, seventhChords);

  const progressionChordName = (chord: ProgressionChord) =>
    chordLabel(chord.scale, chord.degree, chord.inversion, chord.seventh);

  const progressionSequence = useMemo(() => {
    const beatDuration = 60 / metronomeBpm;
    const chordDuration = beatDuration * 4;
    const notes = progression.flatMap((chord, chordIndex) => {
      const chordNames = [
        chord.scale[chord.degree],
        chord.scale[(chord.degree + 2) % 7],
        chord.scale[(chord.degree + 4) % 7],
        ...(chord.seventh ? [chord.scale[(chord.degree + 6) % 7]] : []),
      ];
      const voices = invertNotes(ascendNotes(chordNames), chord.inversion);
      const pitches = doubling
        ? [...voices.map(({ pitch }) => pitch), ...voices.map(({ pitch }) => pitch + 12)]
        : voices.map(({ pitch }) => pitch);
      return pitches.map((pitch) => ({
        pitch,
        startTime: chordIndex * chordDuration,
        endTime: (chordIndex + 1) * chordDuration,
        velocity: 100,
        program,
      }));
    });
    return {
      notes,
      totalTime: progression.length * chordDuration,
      tempos: [{ qpm: metronomeBpm, time: 0 }],
      timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
      keySignatures: [{
        key: idx(KEYS[(keyIdx + 1 - modeIdx + 12) % 12].tonic),
        mode: "major",
        time: 0,
      }],
    };
  }, [progression, doubling, metronomeBpm, program, keyIdx, modeIdx]);

  const addProgressionChord = useCallback(() => {
    if (progression.length >= 8) return;
    setProgression((current) => [
      ...current,
      {
        degree: degIdx,
        scale: [...scale],
        inversion,
        seventh: seventhChords,
      },
    ]);
  }, [degIdx, scale, inversion, seventhChords, progression.length]);

  const resetProgression = () => {
    setProgression((current) => current.slice(0, -1));
  };

  const romanChord = (degree: number) => {
    if (!seventhChords) return romanFor(degree, quals[degree]);
    const suffix = chordSuffix(degree);
    if (suffix === "maj7") return `${romanFor(degree, "")}maj7`;
    if (suffix === "m7") return `${romanFor(degree, "m")}7`;
    if (suffix === "ø7") return `${romanFor(degree, "°").replace("°", "ø")}7`;
    if (suffix === "°7") return `${romanFor(degree, "°")}7`;
    return `${romanFor(degree, "")}7`;
  };

  const scaleLit = useMemo(() => {
    return ascPitches
      .map((pitch) => pitch - PIANO_START_MIDI)
      .filter((index) => index >= 0 && index < KEY_ORDER.length);
  }, [ascPitches]);

  const triads = useMemo(
    () =>
      [...Array(7)].map((_, d) => {
        const root = scale[d],
          third = scale[(d + 2) % 7],
          fifth = scale[(d + 4) % 7];
        const idxOf = (n: string) =>
          KEY_ORDER.reduce<number[]>(
            (a, k, i) => (enhEq(k, n) ? [...a, i] : a),
            [],
          );
        for (const r of idxOf(root)) {
          const t = idxOf(third).find((x) => x > r);
          const f = idxOf(fifth).find((x) => x! > (t ?? 99));
          if (t !== undefined && f !== undefined) return [r, t, f];
        }
        return [];
      }),
    [scale],
  );
  const selectedChordKeys = chordPitches
    .map((pitch) => pitch - PIANO_START_MIDI)
    .filter((index) => index >= 0 && index < KEY_ORDER.length);

  /* notify parent */
  useEffect(() => {
    onSelect?.({
      tonic: KEYS[keyIdx].tonic,
      mode: MODES[modeIdx].name,
      minorType: modeIdx === 4 ? minorType : undefined,
      keyIndex: keyIdx,
      modeIndex: modeIdx,
      accidentals: acc,
      scale,
    });
    setDegIdx(0);
  }, [keyIdx, modeIdx, acc, scale, onSelect, minorType]);

  /* ---------- ring builders ---------- */
  const keySegs = useMemo<Segment[]>(
    () =>
      KEYS.map((k, i) => {
        const start = i * SEG - HALF,
          end = i * SEG + HALF,
          mid = i * SEG;
        const isSel = i === keyIdx;
        const inScale = scale.some((n) => enhEq(n, k.tonic));
        const fill = isSel
          ? COLORS.active
          : i === hoverIdx
          ? COLORS.hover
          : inScale
          ? COLORS.idle
          : COLORS.dimmed;
        const pos = xy(cx, cy, (r(RAD.keyIn) + r(RAD.keyOut)) / 2, mid);
        return {
          start,
          end,
          mid,
          key: i,
          fill,
          onClick: () => setKeyIdx(i),
          onEnter: () => setHoverIdx(i),
          onLeave: () => setHoverIdx(null),
          label: (
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={COLORS.text}
              style={{
                fontSize: 18,
                fontWeight: 600,
                pointerEvents: "none",
                ...NO_SELECT,
              }}
            >
              {show(k.tonic)}
            </text>
          ),
        };
      }),
    [hoverIdx, keyIdx, scale, solf, cx, cy],
  );

  const modeSegs = useMemo<Segment[]>(() => {
    const startOuter = (keyIdx - modeIdx + 12) % 12;
    return [...Array(7)].map((_, i) => {
      const outer = (startOuter + i) % 12;
      const start = outer * SEG - HALF,
        end = start + SEG,
        mid = (start + end) / 2;
      const fill =
        i === modeIdx
          ? COLORS.active
          : i + 100 === hoverIdx
          ? COLORS.hover
          : COLORS.idle;
      const pos = xy(cx, cy, (r(RAD.modeIn) + r(RAD.modeOut)) / 2, mid);
      return {
        start,
        end,
        mid,
        key: "m" + i,
        fill,
        onClick: () => setModeIdx(i),
        onEnter: () => setHoverIdx(i + 100),
        onLeave: () => setHoverIdx(null),
        label: (
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={COLORS.text}
            transform={`rotate(${mid} ${pos.x} ${pos.y})`}
            style={{ pointerEvents: "none", ...NO_SELECT }}
          >
            <tspan fontSize={15} fontWeight={700}>
              {MODES[i].name}
            </tspan>
          </text>
        ),
      };
    });
  }, [keyIdx, modeIdx, hoverIdx, cx, cy]);

  const romanSegs = useMemo<Segment[]>(
    () =>
      modeSegs.map((m, i) => {
        const pos = xy(cx, cy, (r(RAD.romanIn) + r(RAD.romanOut)) / 2, m.mid);
        const relDeg = (MODES[i].degree - MODES[modeIdx].degree + 7) % 7;
        const roman = romanChord(relDeg);
        const fill =
          relDeg === degIdx
            ? COLORS.active
            : i + 1000 === hoverIdx
              ? COLORS.hover
              : COLORS.idle;
        return {
          ...m,
          key: "r" + i,
          fill,
          onClick: () => {
            setDegIdx(relDeg);
            playTriad(relDeg, scale, seventhChords, inversion, doubling);
          },
          onEnter: () => setHoverIdx(i + 1000),
          onLeave: () => setHoverIdx(null),
          label: (
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={COLORS.text}
              transform={`rotate(${m.mid} ${pos.x} ${pos.y})`}
              style={{ pointerEvents: "none", ...NO_SELECT }}
            >
              <tspan fontSize={24} fontWeight={700}>
                {roman}
              </tspan>
              <tspan x={pos.x} dy="2.2em" fontSize={9}>
                {(() => {
                  let degreeName = DIATONIC_DEGREE_NAMES[relDeg];
                  if (relDeg === 6) { // 7th degree
                    const tonicPc = idx(scale[0]);
                    const seventhPc = idx(scale[6]);
                    if ((tonicPc - seventhPc + 12) % 12 === 1) { // Half step below tonic
                      degreeName = "Leading tone";
                    }
                  }
                  return degreeName;
                })()}
              </tspan>
            </text>
          ),
        };
      }),
    [modeSegs, modeIdx, quals, degIdx, hoverIdx, scale, playTriad, seventhChords, inversion, doubling],
  );

  const catSegs = useMemo<Segment[]>(() => {
    const groups = [
      { label: "MAJOR", start: 0, count: 3 },
      { label: "Minor", start: 3, count: 3 },
      { label: "dim.", start: 6, count: 1 },
    ] as const;
    return groups.map((g) => {
      const first = romanSegs[g.start],
        last = romanSegs[g.start + g.count - 1];
      const start = first.start;
      let end = last.end;
      if (end < start) end += 360;
      const mid = (start + end) / 2;
      const pos = xy(cx, cy, (r(RAD.catIn) + r(RAD.catOut) - 3) / 2, mid);
      return {
        start,
        end,
        mid,
        key: "c" + g.label,
        fill: COLORS.inactive,
        label: (
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${mid} ${pos.x} ${pos.y})`}
            fill={COLORS.stroke}
            style={{ fontSize: 12, ...NO_SELECT }}
          >
            {g.label}
          </text>
        ),
      };
    });
  }, [romanSegs, cx, cy]);

  const pianoH = size / 3;

  const startOuter = (keyIdx - modeIdx + 12) % 12;
  const outer = (startOuter + 4) % 12; // 4 is Aeolian's index in MODES
  const start = outer * SEG - HALF,
    end = start + SEG,
    mid = (start + end) / 2;

  const types: ("natural" | "harmonic" | "melodic")[] = [
    "natural",
    "harmonic",
    "melodic",
  ];
  const radii = [RAD.aeolianR1, RAD.aeolianR2, RAD.aeolianR3, RAD.aeolianR4];
  const signatureTonic = KEYS[(keyIdx + 1 - modeIdx + 12) % 12].tonic;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: 24,
        alignItems: "center",
      }}
    >
      <div style={{ flex: "1 1 500px" }}>
        <div style={{ textAlign: "center", color: COLORS.text }}>
          <svg viewBox={`0 0 ${size} ${size}`}>
            <Ring
              outerR={r(RAD.catOut)}
              innerR={r(RAD.catIn)}
              cx={cx}
              cy={cy}
              segments={catSegs}
            />
            <Ring
              outerR={r(RAD.modeOut)}
              innerR={r(RAD.modeIn)}
              cx={cx}
              cy={cy}
              segments={modeSegs}
            />
            {modeIdx === 4 &&
              types.map((type, i) => {
                const r1 = r(radii[i]);
                const r2 = r(radii[i + 1]);
                const pos = xy(cx, cy+2, (r1 + r2) / 2, mid);
                return (
                  <Ring
                    key={"minor" + i}
                    outerR={r2}
                    innerR={r1}
                    cx={cx}
                    cy={cy}
                    segments={[
                      {
                        start,
                        end,
                        mid,
                        key: "minor" + i,
                        fill:
                          type === minorType
                            ? COLORS.active
                            : i + 200 === hoverIdx
                            ? COLORS.hover
                            : COLORS.idle,
                        onClick: () => {
                          setMinorType(type);
                          setModeIdx(4);
                        },
                        onEnter: () => setHoverIdx(i + 200),
                        onLeave: () => setHoverIdx(null),
                        label: (
                          <text
                            x={pos.x}
                            y={pos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={COLORS.text}
                            transform={`rotate(${mid} ${pos.x} ${pos.y})`}
                            style={{ pointerEvents: "none", ...NO_SELECT }}
                          >
                            <tspan fontSize={12} fontWeight={700}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </tspan>
                          </text>
                        ),
                      },
                    ]}
                  />
                );
              })}
            <Ring
              outerR={r(RAD.romanOut)}
              innerR={r(RAD.romanIn)}
              cx={cx}
              cy={cy}
              segments={romanSegs}
            />
            <Ring
              outerR={r(RAD.keyOut)}
              innerR={r(RAD.keyIn)}
              cx={cx}
              cy={cy}
              segments={keySegs}
            />
            <circle cx={cx} cy={cy} r={r(RAD.centre)} fill={COLORS.text} />
            <text
              x={cx}
              y={cy - r(RAD.centre) * 0.45}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: size * 0.05, fontWeight: 700, ...NO_SELECT }}
              fill={COLORS.stroke}
            >
              {chordName(degIdx)}
            </text>
            <foreignObject
              x={cx - r(RAD.centre) / 2 - 5}
              y={cy - 10}
              width={r(RAD.centre) + 10}
              height={r(RAD.centre)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    ...NO_SELECT,
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0,
                    color: COLORS.stroke,
                  }}
                >
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <label style={{ margin: 0, lineHeight: 1 }}>
                      <input
                        type="radio"
                        name="chord-type"
                        checked={!seventhChords}
                        onChange={() => setSeventhChords(false)}
                      />{" "}Triad
                    </label>
                    <label style={{ margin: 0, lineHeight: 1 }}>
                      <input
                        type="radio"
                        name="chord-type"
                        checked={seventhChords}
                        onChange={() => setSeventhChords(true)}
                      />{" "}7th
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2, ...(seventhChords ? [3] : [])].map((value) => (
                      <label key={value} style={{ margin: 0, lineHeight: 1 }}>
                        <input
                          type="radio"
                          name="chord-inversion"
                          checked={inversion === value}
                          onChange={() => setInversion(value)}
                        />
                            {["Root", "1st", "2nd", "3rd"][value]}
                      </label>
                    ))}
                  </div>
                  <label style={{ margin: 0, lineHeight: 1 }}>
                    <input
                      type="checkbox"
                      checked={doubling}
                      onChange={(e) => setDoubling(e.target.checked)}
                    />{" "}Doubling?
                  </label>
                  <label style={{ margin: 0, lineHeight: 1 }}>
                    <input
                      type="checkbox"
                      checked={solf}
                      onChange={(e) => setSolf(e.target.checked)}
                    />{" "}Solfège?
                  </label>
                </div>
              </div>
            </foreignObject>
          </svg>
        </div>
      </div>

      <div style={{ flex: "1 1 500px" }}>
        <h4 style={{ marginTop: 24, ...NO_SELECT }}>Scale 🪜</h4>
        <Staff
          notes={ascNotes}
          pitches={ascPitches}
          signatureTonic={signatureTonic}
          height={92}
          sequential
          withPlayer
          program={program}
        />
        <Piano lit={scaleLit} playNote={() => {}} h={pianoH} />
        <h4 style={{ marginTop: 24, ...NO_SELECT }}>Chords 🎶</h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            flexWrap: "wrap",
            marginBottom: 7,
          }}
        >
          <ActionButton
            onClick={addProgressionChord}
            disabled={progression.length >= 8}
          >
            +
          </ActionButton>
          <ActionButton onClick={resetProgression} disabled={progression.length === 0}>
            -
          </ActionButton>
          <ActionButton
            onClick={() => setLoopProgression((looping) => !looping)}
            disabled={progression.length === 0}
            style={{
              background: loopProgression ? COLORS.active : undefined,
            }}
          >
            Loop
          </ActionButton>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            {progression.map((chord, index) => (
              <span key={`${index}-${chord.degree}`} style={{ ...NO_SELECT }}>
                {index > 0 ? " - " : ""}{progressionChordName(chord)}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 7 }}
        >
          <Staff
            notes={progression.length > 0 ? [] : chordNotes}
            pitches={progression.length > 0 ? [] : chordPitches}
            sequence={progression.length > 0 ? progressionSequence : undefined}
            signatureTonic={signatureTonic}
            height={70}
            withPlayer
            loop={loopProgression}
            program={program}
          />
        </div>
        <Piano lit={selectedChordKeys} playNote={() => {}} h={pianoH} />
        <h4 style={{ marginTop: 24, ...NO_SELECT }}>Input 🎹</h4>
        <div
          style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 7 }}
        >
          <ActionButton
            onClick={() => setKeyboardEnabled(!keyboardEnabled)}
            style={{
              background: keyboardEnabled ? COLORS.active : undefined,
            }}
          >
            Keyboard
          </ActionButton>
          <ActionButton
            onClick={() => setMidiEnabled(!midiEnabled)}
            style={{
              background: midiReady ? COLORS.active : undefined,
            }}
          >
            MIDI
          </ActionButton>
          <select
            aria-label="Instrument"
            defaultValue={0}
            onChange={(e) => setInstrument(Number(e.target.value))}
            style={{ flex: "0 0 auto", width: "auto", marginLeft: "auto" }}
          >
            {Object.entries(INSTRUMENTS).map(([group, names], groupIndex) => (
              <optgroup
                key={group}
                label={`${group} (${groupIndex * 8 + 1}-${groupIndex * 8 + names.length})`}
              >
                {names.map((name, instrumentIndex) => {
                  const program = groupIndex * 8 + instrumentIndex;
                  return (
                    <option key={program} value={program}>
                      {name}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>
        <Piano
          lit={Array.from(midiLit)}
          playNote={playInputNote}
          h={pianoH}
          interactive
          showInputLabels
        />
      </div>
    </div>
  );
};
