import React, { useState } from "react";
import { useTuner } from "../hooks/useTuner";
import { ComponentContainer, Row, Col, Slider } from "../ui/styles";
import { COLORS } from "../ui/colors";
import FrequencySpectrum from "./FrequencySpectrum";

export const Tuner: React.FC = () => {
  const { note, isListening, start, stop, frequencyData, audioContext } =
    useTuner();
  const [maxFrequency, setMaxFrequency] = useState(5000);

  // Clamp detune value for display in the indicator
  const detune = Math.max(-50, Math.min(50, note.detune));

  return (
    <ComponentContainer>
      <Row>
        <Col>
          <label>Plot frequency range: 0-{maxFrequency} Hz</label>
        </Col>
        <Col>
          <Slider
            type="range"
            min={1000}
            max={24000}
            step={1000}
            value={maxFrequency}
            onChange={(e) => setMaxFrequency(parseInt(e.target.value, 10))}
          />
        </Col>
      </Row>

      <button
        onClick={isListening ? stop : start}
        style={{
          background: isListening ? COLORS.active : undefined,
          width: "100%",
        }}
      >
        {isListening ? "Stop" : "Start"}
      </button>
      {isListening && (
        <>
          <Row>
            <Col>
              <div>{isListening ? note.name : "Disabled"}</div>
              <div>{isListening ? `${note.frequency.toFixed(2)}` : "?"} Hz</div>
            </Col>
          </Row>
          <Slider
            type="range"
            min={-50}
            max={50}
            value={detune}
            disabled
            style={{ width: "100%" }}
          />
          {frequencyData && audioContext && (
            <FrequencySpectrum
              frequencyData={frequencyData}
              audioContext={audioContext}
              maxFrequency={maxFrequency}
            />
          )}
        </>
      )}
    </ComponentContainer>
  );
};
