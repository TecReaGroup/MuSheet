import { createClickSound } from './click-sound';

const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const START_DELAY_SECONDS = 0.05;
// If the tab was throttled and we fell this far behind, skip the missed clicks instead of bursting them.
const MAX_LAG_SECONDS = 0.05;

/**
 * Look-ahead scheduler ("A Tale of Two Clocks"): a coarse JS timer wakes every 25ms and queues
 * clicks for the next 100ms on the audio clock, which is sample-accurate. Main-thread jank only
 * delays the queueing, never the sound, as long as it stays below the look-ahead window.
 */
export class MetronomeEngine {
  private context: AudioContext | null = null;
  private click: AudioBuffer | null = null;
  private timer = 0;
  private nextClickTime = 0;

  constructor(private readonly readBpm: () => number) {}

  /** Must be called from a user gesture: iOS only unlocks audio inside one. */
  start() {
    this.context ??= new AudioContext({ latencyHint: 'interactive' });
    void this.context.resume();
    this.click ??= createClickSound(this.context);
    this.nextClickTime = this.context.currentTime + START_DELAY_SECONDS;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  stop() {
    window.clearInterval(this.timer);
  }

  private schedule = () => {
    const context = this.context!;
    const secondsPerClick = 60 / this.readBpm();

    if (this.nextClickTime < context.currentTime - MAX_LAG_SECONDS) {
      this.nextClickTime = context.currentTime + START_DELAY_SECONDS;
    }
    while (this.nextClickTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const source = context.createBufferSource();
      source.buffer = this.click;
      source.connect(context.destination);
      source.start(this.nextClickTime);
      this.nextClickTime += secondsPerClick;
    }
  };
}
