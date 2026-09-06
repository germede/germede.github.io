import { FC, useEffect, useId, useRef } from "react";
import "html-midi-player";
import { idx } from "../theory/pitch";

interface Props {
  notes: string[];
  pitches?: number[];
  sequence?: MidiVisualizerElement["noteSequence"];
  signatureTonic: string;
  height?: number;
  sequential?: boolean;
  withPlayer?: boolean;
  program?: number;
  showPlayer?: boolean;
  loop?: boolean;
  hidden?: boolean;
}

type MidiVisualizerElement = HTMLElement & {
  type: string;
  config: Record<string, number>;
  noteSequence: {
    notes: Array<{
      pitch: number;
      startTime: number;
      endTime: number;
      velocity: number;
    }>;
    totalTime: number;
    tempos: Array<{ qpm: number; time: number }>;
    timeSignatures: Array<{
      time: number;
      numerator: number;
      denominator: number;
    }>;
    keySignatures: Array<{ key: number; mode: string; time: number }>;
  };
};

type MidiPlayerElement = HTMLElement & {
  noteSequence: MidiVisualizerElement["noteSequence"];
  loop: boolean;
  player?: {
    stop: () => void;
  };
  addVisualizer: (visualizer: MidiVisualizerElement) => void;
  start: () => void;
  stop?: () => void;
};

const toMidi = (note: string) => {
  const match = note.match(/^([A-G][♭b♯#x𝄪]*)(-?\d+)$/);
  if (!match) throw new Error(`Invalid note: ${note}`);
  return (Number(match[2]) + 1) * 12 + idx(match[1]);
};

const stopMidiPlayer = (player: MidiPlayerElement | null) => {
  if (!player) return;
  player.loop = false;
  player.stop?.();
  player.player?.stop();
};

export const Staff: FC<Props> = ({
  notes,
  pitches,
  sequence,
  signatureTonic,
  height = 42,
  sequential = false,
  withPlayer = false,
  program = 0,
  showPlayer = true,
  loop = false,
  hidden = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<MidiPlayerElement | null>(null);
  const visualizerId = `staff-visualizer-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!containerRef.current) return;
    stopMidiPlayer(playerRef.current);

    const visualizer = document.createElement(
      "midi-visualizer",
    ) as MidiVisualizerElement;
    visualizer.type = "staff";
    visualizer.style.float = "right";
    const player = withPlayer
      ? (document.createElement("midi-player") as MidiPlayerElement)
      : null;
    playerRef.current = player;
    const duration = 0.5;
    const noteDuration = sequential ? duration : 2;
    const spacing = sequential ? duration : 0;
    visualizer.noteSequence = sequence ?? {
      notes: notes.map((note, index) => ({
          pitch: pitches?.[index] ?? toMidi(note),
          startTime: index * spacing,
          endTime: index * spacing + noteDuration,
          velocity: 100,
          program,
        })),
        totalTime: sequential ? notes.length * duration : noteDuration,
        tempos: [{ qpm: 120, time: 0 }],
        timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
        keySignatures: [{
          key: idx(signatureTonic),
          mode: "major",
          time: 0,
        }],
      };
    if (player) {
      player.setAttribute("sound-font", "");
      player.loop = loop;
      if (!showPlayer) player.style.display = "none";
      player.setAttribute("visualizer", `#${visualizerId}`);
      player.noteSequence = visualizer.noteSequence;
      visualizer.id = visualizerId;
      containerRef.current.replaceChildren(player, visualizer);
      player.addVisualizer(visualizer);
    } else {
      containerRef.current.replaceChildren(visualizer);
    }

    return () => {
      stopMidiPlayer(player);
      containerRef.current?.replaceChildren();
    };
  }, [notes, pitches, sequence, signatureTonic, sequential, visualizerId, withPlayer, program]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.loop = loop;
  }, [loop]);

  return (
      <div
        ref={containerRef}
        className="staff-visualizer-wrapper"
        style={{
          display: hidden ? "none" : "flow-root",
          flex: "1 1 180px",
          minWidth: 160,
        }}
      />
  );
};
