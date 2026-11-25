// The click is synthesised once into an AudioBuffer: no sample file to host, and identical on every device.
const CLICK_DURATION_SECONDS = 0.035;
const CLICK_DECAY_RATE = 120;
const CLICK_FREQUENCY = 1320;
const CLICK_GAIN = 0.8;

export function createClickSound(context: BaseAudioContext) {
  const length = Math.ceil(context.sampleRate * CLICK_DURATION_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const time = index / context.sampleRate;
    samples[index] = Math.sin(2 * Math.PI * CLICK_FREQUENCY * time) * Math.exp(-time * CLICK_DECAY_RATE) * CLICK_GAIN;
  }
  return buffer;
}
