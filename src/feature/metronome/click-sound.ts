// Clicks are synthesised once into AudioBuffers: no sample files to host, and identical on every device.
const CLICK_DURATION_SECONDS = 0.035;
const CLICK_DECAY_RATE = 120;

interface ClickSpec {
  frequency: number;
  gain: number;
}

const ACCENT: ClickSpec = { frequency: 1760, gain: 1 };
const BEAT: ClickSpec = { frequency: 1320, gain: 0.7 };
const SUBDIVISION: ClickSpec = { frequency: 990, gain: 0.35 };

function synthesizeClick(context: BaseAudioContext, { frequency, gain }: ClickSpec) {
  const length = Math.ceil(context.sampleRate * CLICK_DURATION_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const time = index / context.sampleRate;
    samples[index] = Math.sin(2 * Math.PI * frequency * time) * Math.exp(-time * CLICK_DECAY_RATE) * gain;
  }
  return buffer;
}

export interface ClickSounds {
  accent: AudioBuffer;
  beat: AudioBuffer;
  subdivision: AudioBuffer;
}

export function createClickSounds(context: BaseAudioContext): ClickSounds {
  return {
    accent: synthesizeClick(context, ACCENT),
    beat: synthesizeClick(context, BEAT),
    subdivision: synthesizeClick(context, SUBDIVISION),
  };
}
