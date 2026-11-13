/**
 * Dashboard Web Audio mic capture — sends LEVELS ONLY over a callback.
 * Never records or buffers PCM for storage/transmit.
 */

export interface MicCaptureOptions {
  threshold?: number;
  onLevel: (level: number, talking: boolean) => void;
  onError?: (message: string) => void;
}

export class MicCapture {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array | null = null;
  private raf = 0;
  private threshold: number;
  private readonly onLevel: MicCaptureOptions["onLevel"];
  private readonly onError?: MicCaptureOptions["onError"];
  private running = false;

  constructor(opts: MicCaptureOptions) {
    this.threshold = opts.threshold ?? 0.12;
    this.onLevel = opts.onLevel;
    this.onError = opts.onError;
  }

  setThreshold(value: number): void {
    this.threshold = Math.max(0.02, Math.min(0.8, value));
  }

  async start(deviceId?: string): Promise<void> {
    await this.stop();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      this.ctx = new AudioContext();
      const source = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.7;
      source.connect(this.analyser);
      this.data = new Uint8Array(this.analyser.frequencyBinCount);
      this.running = true;
      this.tick();
    } catch (err) {
      this.onError?.(err instanceof Error ? err.message : "mic permission denied");
      await this.stop();
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.analyser?.disconnect();
    this.analyser = null;
    this.data = null;
    if (this.ctx) {
      await this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private tick = (): void => {
    if (!this.running || !this.analyser || !this.data) return;
    this.analyser.getByteTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const v = (this.data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / this.data.length);
    const level = Math.min(1, rms * 3.2);
    this.onLevel(level, level >= this.threshold);
    this.raf = requestAnimationFrame(this.tick);
  };
}
