import { FC } from "react";
import { useMetronome } from "../hooks/useMetronome";
import { COLORS } from "../ui/colors";
import {
  ComponentContainer,
  Row,
  Col,
  Slider,
  Dot,
  ActionButton,
} from "../ui/styles";

type Props = {
  initialBpm?: number;
  initialBeats?: number;
};

export const Metronome: FC<Props> = ({
  initialBpm = 120,
  initialBeats = 4,
}) => {
  const { state, setBpm, setBeats, setSubdivisions, start, stop, tap } =
    useMetronome(initialBpm, initialBeats);

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
      <button
        onClick={isRunning ? stop : start}
        style={{
          background: isRunning ? COLORS.active : undefined,
          width: "100%",
        }}
      >
        {isRunning ? "Stop" : "Start"}
      </button>
      {isRunning && (
        <Row>
          <Col>
            <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
              {Array.from({ length: beats }).map((_, beatIndex) => (
                <div
                  key={beatIndex}
                  style={{ display: "flex", flexDirection: "column", gap: "10px" }}
                >
                  {Array.from({ length: subdivisions }).map((_, subdivisionIndex) => (
                    <Dot
                      key={`${beatIndex}-${subdivisionIndex}`}
                      isactive={
                        beatIndex === activeBeat &&
                        subdivisionIndex === activeSubdivision
                      }
                      isrunning={isRunning}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Col>
        </Row>
      )}
    </ComponentContainer>
  );
};


