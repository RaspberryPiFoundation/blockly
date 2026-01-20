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
    if (this.muted || opt_volume === 0 || !this.context) {
      return;
    }
    const sound = this.sounds.get(name);
    if (sound) {
      // Don't play one sound on top of another.
      const now = new Date();
      if (
        this.lastSound !== null &&
        now.getTime() - this.lastSound.getTime() < SOUND_LIMIT
      ) {
        return;
      }
      this.lastSound = now;

      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

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
