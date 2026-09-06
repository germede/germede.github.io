import { FC, ReactNode, useMemo } from "react";
import styled from "styled-components";
import { COLORS } from "../ui/colors";
import {
  WHITE,
  BASE_OCT,
  W_PCT,
  SHARP_OF,
  sharpsBefore,
  KEY_MAP,
} from "../theory/keyboard";

interface Props {
  lit: number[];
  playNote: (n: string) => void;
  h?: number;
  interactive?: boolean;
  showInputLabels?: boolean;
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

const KeyLabel = styled.span<{ black?: boolean }>`
  position: absolute;
  left: 50%;
  bottom: ${(props) => (props.black ? "3px" : "5px")};
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.black ? "1px" : "3px")};
  justify-content: flex-end;
  pointer-events: none;
  user-select: none;
  font-size: ${(props) => (props.black ? "0.55em" : "0.72em")};
  font-weight: 600;
  color: ${(props) => (props.black ? "#fff" : "#202020")};
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  z-index: 3;
`;

const KeyboardCommand = styled.kbd<{ black?: boolean }>`
  display: inline-block;
  font: inherit;
  font-size: ${(props) => (props.black ? "0.9em" : "0.95em")};
  font-weight: 700;
  color: ${(props) => (props.black ? "#fff" : "#202020")};
  background: ${(props) => (props.black ? "#202020" : "#fff")};
  border: 1px solid ${(props) => (props.black ? "#fff" : "#202020")};
  border-radius: 3px;
  margin: 0 2px;
  padding: 3px 4px 1px;
  transform: none;
`;

const NoteName = styled.div`
  white-space: nowrap;
`;

const keyLabels = new Map<string, string>();
Object.entries(KEY_MAP).forEach(([key, note]) => {
  if (!keyLabels.has(note)) keyLabels.set(note, key);
});

const labelFor = (note: string) => keyLabels.get(note);
const formatNote = (note: string): ReactNode => {
  const match = note.match(/^(.*?)(-?\d+)$/);
  if (!match) return note;
  return (
    <>
      {match[1]}
      <sub>{match[2]}</sub>
    </>
  );
};

export const Piano: FC<Props> = ({
  lit,
  playNote,
  h = 60,
  interactive = false,
  showInputLabels = false,
}) => {
  const litSet = useMemo(() => new Set(lit), [lit]);
  const blackH = h * 0.58;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: h }}>
        {WHITE.map((w, i) => {
          const octave = BASE_OCT + Math.floor((i + 5) / 7);
          const note = `${w}${octave}`;
          const idx = i + sharpsBefore(i);
          const keyboardKey = showInputLabels ? labelFor(note) : undefined;
          return (
            <WhiteKey
              key={`w${i}`}
              onClick={() => playNote(note)}
              lit={litSet.has(idx)}
              interactive={interactive}
              style={{
                left: `${i * W_PCT}%`,
              }}
              title={keyboardKey ? `${note} / ${keyboardKey}` : note}
            >
              {showInputLabels && (
                <KeyLabel>
                  <NoteName>{formatNote(note)}</NoteName>
                  {keyboardKey && (
                    <KeyboardCommand>{keyboardKey}</KeyboardCommand>
                  )}
                </KeyLabel>
              )}
            </WhiteKey>
          );
        })}
        {Object.entries(SHARP_OF).map(([left, name]) => {
          const li = +left;
          const octave = BASE_OCT + Math.floor((li + 5) / 7);
          const note = `${name}${octave}`;
          const idx = li + sharpsBefore(li) + 1;
          const keyboardKey = showInputLabels ? labelFor(note) : undefined;
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
              title={keyboardKey ? `${note} / ${keyboardKey}` : note}
            >
              {showInputLabels && (
                <KeyLabel black>
                  <NoteName>{formatNote(note)}</NoteName>
                  {keyboardKey && (
                    <KeyboardCommand black>{keyboardKey}</KeyboardCommand>
                  )}
                </KeyLabel>
              )}
            </BlackKey>
          );
        })}
      </div>
    </div>
  );
};
