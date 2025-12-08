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

import * as userAgent from './utils/useragent.js';
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
  private sounds = new Map<string, HTMLAudioElement>();

  /** Time that the last sound was played. */
  private lastSound: Date | null = null;

  /** Whether the audio is muted or not. */
  private muted: boolean = false;

  /**
   * @param parentWorkspace The parent of the workspace this audio object
   *     belongs to, or null.
   */
  constructor(private parentWorkspace: WorkspaceSvg) {}

  /**
   * Dispose of this audio manager.
   *
   * @internal
   */
  dispose() {
    this.sounds.clear();
  }

  /**
   * Load an audio file.  Cache it, ready for instantaneous playing.
   *
   * @param filenames List of file types in decreasing order of preference (i.e.
   *     increasing size).  E.g. ['media/go.mp3', 'media/go.wav'] Filenames
   *     include path from Blockly's root.  File extensions matter.
   * @param name Name of sound.
   */
  load(filenames: string[], name: string) {
    if (!filenames.length) {
      return;
    }
    let audioTest;
    try {
      audioTest = new globalThis['Audio']();
    } catch {
      // No browser support for Audio.
      // IE can throw an error even if the Audio object exists.
      return;
    }
    let sound;
    for (let i = 0; i < filenames.length; i++) {
      const filename = filenames[i];
      const ext = filename.match(/\.(\w+)$/);
      if (ext && audioTest.canPlayType('audio/' + ext[1])) {
        // Found an audio format we can play.
        sound = new globalThis['Audio'](filename);
        break;
      }
    }
    if (sound) {
      this.sounds.set(name, sound);
    }
  }

  /**
   * Preload all the audio files so that they play quickly when asked for.
   *
   * @internal
   */
  preload() {
    for (const sound of this.sounds.values()) {
      sound.volume = 0.01;
      const playPromise = sound.play();
      // Edge does not return a promise, so we need to check.
      if (playPromise !== undefined) {
        // If we don't wait for the play request to complete before calling
        // pause() we will get an exception: (DOMException: The play() request
        // was interrupted) See more:
        // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
        playPromise.then(sound.pause).catch(
          // Play without user interaction was prevented.
          function () {},
        );
      } else {
        sound.pause();
      }

      // iOS can only process one sound at a time.  Trying to load more than one
      // corrupts the earlier ones.  Just load one and leave the others
      // uncached.
      if (userAgent.IPAD || userAgent.IPHONE) {
        break;
      }
    }
  }

  /**
   * Play a named sound at specified volume.  If volume is not specified,
   * use full volume (1).
   *
   * @param name Name of sound.
   * @param opt_volume Volume of sound (0-1).
   */
  play(name: string, opt_volume?: number) {
    if (!this.isPlayingAllowed()) return;

    const sound = this.sounds.get(name);
    if (sound) {
      this.lastSound = new Date();
      let mySound;
      if (userAgent.IPAD || userAgent.ANDROID) {
        // Creating a new audio node causes lag in Android and iPad.  Android
        // refetches the file from the server, iPad uses a singleton audio
        // node which must be deleted and recreated for each new audio tag.
        mySound = sound;
      } else {
        mySound = sound.cloneNode() as HTMLAudioElement;
      }
      mySound.volume = opt_volume === undefined ? 1 : opt_volume;
      mySound.play();
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

  /**
   * Returns whether or not playing sounds is currently allowed.
   *
   * @returns False if audio is muted or a sound has just been played, otherwise
   *     true.
   */
  private isPlayingAllowed() {
    const now = new Date();

    if (
      this.getMuted() ||
      (this.lastSound !== null &&
        now.getTime() - this.lastSound.getTime() < SOUND_LIMIT)
    ) {
      return false;
    }
    return true;
  }

  /**
   * Plays a brief beep at the given frequency.
   *
   * @param tone The frequency of the beep to play.
   */
  beep(tone: number) {
    if (!this.isPlayingAllowed()) return;
    this.lastSound = new Date();

    const context = new AudioContext();

    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(tone, context.currentTime);

    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01); // Fade in
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.2); // Fade out

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
  }
}
