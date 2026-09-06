import { FC } from "react";
import { MetronomeControls } from "../hooks/useMetronome";
import { COLORS } from "../ui/colors";
import { DrumMachine } from "./DrumMachine";
import {
  ComponentContainer,
  Row,
  Col,
  Slider,
  ActionButton,
} from "../ui/styles";

type Props = {
  controls: MetronomeControls;
};

export const Metronome: FC<Props> = ({
  controls,
}) => {
  const { state, setBpm, setBeats, setSubdivisions, tap } =
    controls;

  const {
    bpm,
    beats,
    subdivisions,
    running: isRunning,
    activeBeat,
    activeSubdivision,
    tempoLabel,
  } = state;

  return (
    <ComponentContainer>
      <Row>
        <Col>
          <ActionButton onClick={() => setBeats((b) => Math.max(1, b - 1))}>
            -
          </ActionButton>
          <label>
            {beats} beat{beats !== 1 ? "s" : ""}
          </label>
          <ActionButton onClick={() => setBeats((b) => Math.min(12, b + 1))}>
            +
          </ActionButton>
        </Col>
        <Col>
          <ActionButton
            onClick={() => setSubdivisions((s) => Math.max(1, s - 1))}
          >
            -
          </ActionButton>
          <label>
            {subdivisions} subdivision{subdivisions !== 1 ? "s" : ""}
          </label>
          <ActionButton
            onClick={() => setSubdivisions((s) => Math.min(4, s + 1))}
          >
            +
          </ActionButton>
        </Col>
      </Row>
      <Row>
        <Col>
          <ActionButton onClick={() => setBpm((b) => Math.max(30, b - 1))}>
            -
          </ActionButton>
          <label>
            {bpm} bpm ({tempoLabel})
          </label>
          <ActionButton onClick={() => setBpm((b) => Math.min(210, b + 1))}>
            +
          </ActionButton>
        </Col>
        <Col>
          <Slider
            type="range"
            min={30}
            max={210}
            value={bpm}
            onChange={(e) => setBpm(+e.target.value)}
          />
          <ActionButton onClick={tap}>Tap</ActionButton>
        </Col>
      </Row>
      <DrumMachine controls={controls} />
    </ComponentContainer>
  );
};


