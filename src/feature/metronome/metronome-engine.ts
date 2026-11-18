import { createClickSounds, type ClickSounds } from './click-sound';

const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const START_DELAY_SECONDS = 0.05;
// If the tab was throttled and we fell this far behind, skip the missed ticks instead of bursting them.
const MAX_LAG_SECONDS = 0.05;

export interface MetronomePattern {
  bpm: number;
  beatsPerBar: number;
  /** Clicks per beat: 1 = beats only, 2 = eighths, 3 = triplets, 4 = sixteenths. */
  subdivision: number;
}

interface QueuedBeat {
  time: number;
  beat: number;
}

/**
 * Look-ahead scheduler ("A Tale of Two Clocks"): a coarse JS timer wakes every 25ms and queues
 * clicks for the next 100ms on the audio clock, which is sample-accurate. Main-thread jank only
 * delays the queueing, never the sound, as long as it stays below the look-ahead window.
 */
export class MetronomeEngine {
  private context: AudioContext | null = null;
  private sounds: ClickSounds | null = null;
  private timer = 0;
  private frame = 0;
  private nextTickTime = 0;
  private tickInBar = 0;
  private queuedBeats: QueuedBeat[] = [];

  constructor(
    private readonly readPattern: () => MetronomePattern,
    private readonly onBeat: (beat: number) => void,
  ) {}

  /** Must be called from a user gesture: iOS only unlocks audio inside one. */
  start() {
    this.context ??= new AudioContext({ latencyHint: 'interactive' });
    void this.context.resume();
    this.sounds ??= createClickSounds(this.context);
    this.tickInBar = 0;
    this.queuedBeats = [];
    this.nextTickTime = this.context.currentTime + START_DELAY_SECONDS;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
    this.frame = requestAnimationFrame(this.syncVisualBeat);
  }

  stop() {
    window.clearInterval(this.timer);
    cancelAnimationFrame(this.frame);
    this.queuedBeats = [];
    this.onBeat(-1);
  }

  private schedule = () => {
    const context = this.context!;
    const sounds = this.sounds!;
    const { bpm, beatsPerBar, subdivision } = this.readPattern();
    const ticksPerBar = beatsPerBar * subdivision;
    const secondsPerTick = 60 / bpm / subdivision;

    if (this.nextTickTime < context.currentTime - MAX_LAG_SECONDS) {
      this.nextTickTime = context.currentTime + START_DELAY_SECONDS;
    }
    while (this.nextTickTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      if (this.tickInBar >= ticksPerBar) this.tickInBar = 0;
      const isBeat = this.tickInBar % subdivision === 0;
      const buffer = this.tickInBar === 0 ? sounds.accent : isBeat ? sounds.beat : sounds.subdivision;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(this.nextTickTime);
      if (isBeat) this.queuedBeats.push({ time: this.nextTickTime, beat: this.tickInBar / subdivision });
      this.nextTickTime += secondsPerTick;
      this.tickInBar += 1;
    }
  };

  // Visual beats are released against the audio clock so the light flashes with the click.
  private syncVisualBeat = () => {
    const now = this.context?.currentTime ?? 0;
    let latest: QueuedBeat | undefined;
    while (this.queuedBeats.length > 0 && this.queuedBeats[0]!.time <= now) latest = this.queuedBeats.shift();
    if (latest) this.onBeat(latest.beat);
    this.frame = requestAnimationFrame(this.syncVisualBeat);
  };
}
