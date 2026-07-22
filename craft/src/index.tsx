import React from "react";
import { useState } from "react";
import {
  CircleOfFifths,
  CircleOfFifthsSelection,
} from "./components/CircleOfFifths";
import { Metronome } from "./components/Metronome";
import { Tuner } from "./components/Tuner";

export function Craft() {
  const [sel, setSel] = useState<CircleOfFifthsSelection>();
  return (
    <>
      <h3 id="circleOfFifths">Circle of Fifths 🎡</h3>
      <CircleOfFifths onSelect={setSel} />
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 24 }}>
        <div style={{ flex: "1 1 500px" }}>
          <h3 id="metronome">Metronome 🕰️</h3>
          <Metronome initialBpm={120} initialBeats={4} />
        </div>
        <div style={{ flex: "1 1 500px" }}>
          <h3 id="tuner">Tuner 🎚️</h3>
          <Tuner />
        </div>
      </div>
    </>
  );
}
