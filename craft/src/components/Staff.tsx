import { FC } from "react";
import { COLORS } from "../ui/colors";
import {
  SHARPS,
  FLATS,
  SHARP_Y,
  FLAT_Y,
  BASS_SHARP_Y,
  BASS_FLAT_Y,
} from "../theory/constants";

const NO_SELECT: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  MozUserSelect: "none",
  msUserSelect: "none",
};

const sigAccidentals = (acc: number, bass = false) =>
  acc > 0
    ? SHARPS.slice(0, acc).map((_, i) => ({
        sym: "♯",
        y: (bass ? BASS_SHARP_Y : SHARP_Y)[i],
      }))
    : acc < 0
      ? FLATS.slice(0, -acc).map((_, i) => ({
          sym: "♭",
          y: (bass ? BASS_FLAT_Y : FLAT_Y)[i],
        }))
      : [];

interface Props {
  left: number;
  gap: number;
  width: number;
  y0Treble: number;
  y0Bass: number;
  accidentals: number;
}

export const Staff: FC<Props> = ({
  left,
  gap,
  width,
  y0Treble,
  y0Bass,
  accidentals,
}) => (
  <>
    {[...Array(5)].map((_, i) => (
      <line
        key={`t${i}`}
        x1={left}
        x2={left + width}
        y1={y0Treble + i * gap}
        y2={y0Treble + i * gap}
        stroke={COLORS.stroke}
      />
    ))}
    <text
      x={left + gap * 1.4}
      y={y0Treble + gap * 2.4}
      fontSize={gap * 7}
      fill={COLORS.stroke}
      dominantBaseline="middle"
      style={NO_SELECT}
    >
      𝄞
    </text>
    {sigAccidentals(accidentals, false).map((a, i) => (
      <text
        key={`tAcc${i}`}
        x={left + gap * 6.8 + i * gap * 1.5}
        y={y0Treble - (a.y - 5) * gap}
        fontSize={gap * 2.6}
        fill={COLORS.stroke}
        dominantBaseline="middle"
        style={NO_SELECT}
      >
        {a.sym}
      </text>
    ))}
    {[...Array(5)].map((_, i) => (
      <line
        key={`b${i}`}
        x1={left}
        x2={left + width}
        y1={y0Bass + i * gap}
        y2={y0Bass + i * gap}
        stroke={COLORS.stroke}
      />
    ))}
    <text
      x={left + gap * 2.1}
      y={y0Bass + gap * 2.6}
      fontSize={gap * 5}
      fill={COLORS.stroke}
      dominantBaseline="middle"
      style={NO_SELECT}
    >
      𝄢
    </text>
    {sigAccidentals(accidentals, true).map((a, i) => (
      <text
        key={`bAcc${i}`}
        x={left + gap * 6.8 + i * gap * 1.5}
        y={y0Bass - (a.y - 5) * gap}
        fontSize={gap * 2.6}
        fill={COLORS.stroke}
        dominantBaseline="middle"
        style={NO_SELECT}
      >
        {a.sym}
      </text>
    ))}
  </>
);
