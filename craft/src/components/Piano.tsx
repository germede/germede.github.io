import { FC, useMemo } from "react";
import styled from "styled-components";
import { COLORS } from "../ui/colors";
import {
  WHITE,
  BASE_OCT,
  W_PCT,
  SHARP_OF,
  sharpsBefore,
} from "../theory/keyboard";

interface Props {
  lit: number[];
  playNote: (n: string) => void;
  h?: number;
  interactive?: boolean;
}

const WhiteKey = styled.div<{ lit: boolean; interactive: boolean }>`
  position: absolute;
  width: ${W_PCT}%;
  height: 100%;
  border: 1px solid #000;
  background: ${(props) => (props.lit ? COLORS.active : COLORS.text)};
  box-sizing: border-box;
  z-index: 1;
  ${(props) =>
    props.interactive &&
    `
    &:hover {
      background: ${props.lit ? COLORS.active : COLORS.hover};
      cursor: pointer;
    }
  `}
`;

const BlackKey = styled.div<{ lit: boolean; interactive: boolean }>`
  position: absolute;
  border: 1px solid #000;
  z-index: 2;
  background: ${(props) => (props.lit ? COLORS.idle : COLORS.stroke)};
  ${(props) =>
    props.interactive &&
    `
    &:hover {
      background: ${props.lit ? COLORS.idle : COLORS.hover};
      cursor: pointer;
    }
  `}
`;

export const Piano: FC<Props> = ({
  lit,
  playNote,
  h = 60,
  interactive = false,
}) => {
  const litSet = useMemo(() => new Set(lit), [lit]);
  const blackH = h * 0.58;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: h }}>
        {WHITE.map((w, i) => {
          const octave = BASE_OCT + Math.floor(i / 7);
          const note = `${w}${octave}`;
          const idx = i + sharpsBefore(i);
          return (
            <WhiteKey
              key={`w${i}`}
              onClick={() => playNote(note)}
              lit={litSet.has(idx)}
              interactive={interactive}
              style={{
                left: `${i * W_PCT}%`,
              }}
            />
          );
        })}
        {Object.entries(SHARP_OF).map(([left, name]) => {
          const li = +left;
          const octave = BASE_OCT + Math.floor(li / 7);
          const note = `${name}${octave}`;
          const idx = li + sharpsBefore(li) + 1;
          const leftPct = (li + 0.65) * W_PCT;
          const bw = W_PCT * 0.7;
          return (
            <BlackKey
              key={`b${li}`}
              onClick={() => playNote(note)}
              lit={litSet.has(idx)}
              interactive={interactive}
              style={{
                left: `${leftPct}%`,
                width: `${bw}%`,
                height: blackH,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
