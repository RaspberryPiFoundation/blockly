/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object in charge of loading, storing, and playing audio for a
 *     workspace.
 *
 * @class
 */
// Former goog.module ID: Blockly.WorkspaceAudio

import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Prevent a sound from playing if another sound preceded it within this many
 * milliseconds.
 */
const SOUND_LIMIT = 100;

/**
 * Class for loading, storing, and playing audio for a workspace.
 */
export class WorkspaceAudio {
  /** Database of pre-loaded sounds. */
  private sounds = new Map<string, AudioBuffer>();

  /** Time that the last sound was played. */
  private lastSound: Date | null = null;

  /** Whether the audio is muted or not. */
  private muted: boolean = false;

  /** Audio context used for playback. */
  private readonly context?: AudioContext;

  /**
   * @param parentWorkspace The parent of the workspace this audio object
   *     belongs to, or null.
   */
  constructor(private parentWorkspace: WorkspaceSvg) {
    if (window.AudioContext) {
      this.context = new AudioContext();
    }
  }

  /**
   * Dispose of this audio manager.
   *
   * @internal
   */
  dispose() {
    this.sounds.clear();
    this.context?.close();
  }

  /**
   * Load an audio file.  Cache it, ready for instantaneous playing.
   *
   * @param filenames Single-item array containing the URL for the sound file.
   *     Any items after the first item are ignored.
   * @param name Name of sound.
   */
  async load(filenames: string[], name: string) {
    if (!filenames.length) {
      return;
    }

    const response = await fetch(filenames[0]);
    const arrayBuffer = await response.arrayBuffer();
    this.context?.decodeAudioData(arrayBuffer, (audioBuffer) => {
      this.sounds.set(name, audioBuffer);
    });
  }

  /**
   * Play a named sound at specified volume.  If volume is not specified,
   * use full volume (1).
   *
   * @param name Name of sound.
   * @param opt_volume Volume of sound (0-1).
   */
  async play(name: string, opt_volume?: number) {
    if (!this.isPlayingAllowed() || opt_volume === 0) return;
    const sound = this.sounds.get(name);
    if (sound) {
      await this.prepareToPlay();

      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();
      gainNode.gain.value = opt_volume ?? 1;
      gainNode.connect(this.context.destination);
      source.buffer = sound;
      source.connect(gainNode);

      source.addEventListener('ended', () => {
        source.disconnect();
        gainNode.disconnect();
      });

      source.start();
    } else if (this.parentWorkspace) {
      // Maybe a workspace on a lower level knows about this sound.
      this.parentWorkspace.getAudioManager().play(name, opt_volume);
    }
  }

  /**
   * Plays a beep at the given frequency.
   *
   * @param tone The frequency of the beep to play, in hertz.
   * @param duration The duration of the beep, in seconds. Defaults to 0.2.
   */
  async beep(tone: number, duration = 0.2) {
    if (!this.isPlayingAllowed()) return;
    await this.prepareToPlay();

    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(tone, this.context.currentTime);

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    // Fade in
    gainNode.gain.linearRampToValueAtTime(0.5, this.context.currentTime + 0.01);
    // Fade out
    gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + duration,
    );

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  /**
   * Returns whether or not playing sounds is currently allowed.
   *
   * @returns False if audio is muted or a sound has just been played, otherwise
   *     true.
   */
  private isPlayingAllowed(
    this: WorkspaceAudio,
  ): this is WorkspaceAudio & Required<{context: AudioContext}> {
    const now = new Date();

    if (
      this.getMuted() ||
      !this.context ||
      (this.lastSound !== null &&
        now.getTime() - this.lastSound.getTime() < SOUND_LIMIT)
    ) {
      return false;
    }
    return true;
  }

  /**
   * Prepares to play audio by recording the time of the last play and resuming
   * the audio context.
   */
  private async prepareToPlay(
    this: WorkspaceAudio & Required<{context: AudioContext}>,
  ) {
    this.lastSound = new Date();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * @param muted If true, mute sounds. Otherwise, play them.
   */
  setMuted(muted: boolean) {
    this.muted = muted;
  }

  /**
   * @returns Whether the audio is currently muted or not.
   */
  getMuted(): boolean {
    return this.muted;
  }
}
