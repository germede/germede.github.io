
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { COLORS } from '../ui/colors';

interface FrequencySpectrumProps {
  frequencyData?: Uint8Array;
  audioContext?: AudioContext | null;
  maxFrequency: number;
}

const FrequencySpectrum: React.FC<FrequencySpectrumProps> = ({ frequencyData, audioContext, maxFrequency }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 300 });

  useLayoutEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current && size.width > 0) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;

        // Clear canvas
        context.clearRect(0, 0, width, height);

        // Draw axes
        context.strokeStyle = COLORS.stroke;
        context.fillStyle = COLORS.stroke;
        context.font = '12px sans-serif';

        // Y-axis (Amplitude)
        context.beginPath();
        context.moveTo(padding, padding);
        context.lineTo(padding, height - padding);
        context.stroke();
        context.fillText('Amplitude', 5, padding - 20);
        for (let i = 0; i <= 5; i++) {
          const y = height - padding - (i / 5) * (height - 2 * padding);
          context.fillText(Math.round((i / 5) * 255).toString(), padding - 35, y + 4);
          context.moveTo(padding - 5, y);
          context.lineTo(padding, y);
          context.stroke();
        }

        // X-axis (Frequency)
        context.beginPath();
        context.moveTo(padding, height - padding);
        context.lineTo(width - padding, height - padding);
        context.stroke();
        context.fillText('Frequency (Hz)', width / 2 - 30, height - 10);
        const numTicks = Math.floor((width - 2 * padding) / 80);
        for (let i = 0; i <= numTicks; i++) {
            const x = padding + (i / numTicks) * (width - 2 * padding);
            const freq = Math.round((i / numTicks) * maxFrequency);
            context.fillText(`${(freq / 1000).toFixed(1)}k`, x - 15, height - padding + 25);
            context.moveTo(x, height - padding);
            context.lineTo(x, height - padding + 5);
            context.stroke();
        }


        // Draw spectrum bars
        if (frequencyData && audioContext && frequencyData.length > 0) {
          const nyquist = audioContext.sampleRate / 2;
          const maxBin = Math.min(
            frequencyData.length,
            Math.floor(maxFrequency / nyquist * frequencyData.length),
          );
          const barWidth = (width - 2 * padding) / Math.max(maxBin, 1);
          context.fillStyle = COLORS.idle;
          for (let i = 0; i < maxBin; i++) {
            const value = frequencyData[i];
            const barHeight = (value / 255) * (height - 2 * padding);
            context.fillRect(padding + i * barWidth, height - padding - barHeight, barWidth, barHeight);
          }
        }
      }
    }
  }, [frequencyData, audioContext, maxFrequency, size]);

  return <div ref={containerRef} style={{ width: '100%', height: '200px' }}><canvas ref={canvasRef} width={size.width} height={size.height} /></div>;
};

export default FrequencySpectrum;
