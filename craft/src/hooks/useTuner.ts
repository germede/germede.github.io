
import { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { accFromDiff, LETTERS, NAT_PC } from '../theory/pitch';

const A4 = 440;
const C0 = 16.35; // C0 is 16.35 Hz

// Utility to convert frequency to note name
const frequencyToNoteName = (frequency: number): string => {
  if (frequency === 0) return 'A4';
  if (frequency < C0) return 'Low';

  // Calculate the MIDI note number
  const midiNum = 12 * Math.log2(frequency / C0);
  const octave = Math.floor(midiNum / 12);
  const pc = Math.round(midiNum) % 12;


  // Find the best letter name for the pitch class
  let bestFit = 'C';
  let minDiff = 12;

  for (const letter of LETTERS) {
    const natPc = NAT_PC[letter];
    const diff = pc - natPc;
    const absDiff = Math.min(Math.abs(diff), Math.abs(diff - 12), Math.abs(diff + 12));
    if (absDiff < minDiff) {
      minDiff = absDiff;
      bestFit = letter;
    }
  }

  const diff = pc - NAT_PC[bestFit];
  const accidental = accFromDiff(diff);

  return bestFit + accidental + octave;
};

// Custom hook for the tuner
export const useTuner = () => {
  const [note, setNote] = useState<{ name: string; frequency: number; detune: number }>({ name: 'A4', frequency: 440, detune: 0 });
  const [isListening, setIsListening] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const updatePitch = () => {
    if (analyserNodeRef.current && audioContextRef.current) {
      const detector = PitchDetector.forFloat32Array(analyserNodeRef.current.fftSize);
      const input = new Float32Array(detector.inputLength);
      analyserNodeRef.current.getFloatTimeDomainData(input);
      const [pitch, clarity] = detector.findPitch(input, audioContextRef.current.sampleRate);

      if (clarity > 0.95) {
        const h = 12 * Math.log2(pitch / C0);
        const nearestHalfStep = Math.round(h);
        const detune = 100 * (h - nearestHalfStep);

        setNote({
          name: frequencyToNoteName(pitch),
          frequency: pitch,
          detune: detune,
        });
      }

      const dataArray = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
      analyserNodeRef.current.getByteFrequencyData(dataArray);
      setFrequencyData(dataArray);
    }
    animationFrameRef.current = requestAnimationFrame(updatePitch);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096; // Increased for better low-frequency resolution
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserNodeRef.current = analyser;
      mediaStreamSourceRef.current = source;
      setFrequencyData(new Uint8Array(analyser.frequencyBinCount));

      setIsListening(true);
      animationFrameRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamSourceRef.current && mediaStreamSourceRef.current.mediaStream) {
      mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return { note, isListening, start, stop, frequencyData, audioContext: audioContextRef.current };
};
