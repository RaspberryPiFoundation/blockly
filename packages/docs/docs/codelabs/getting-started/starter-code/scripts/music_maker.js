/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const MusicMaker = {
  queue_: [],
  player_: new Audio(),
  queueSound: function (soundUrl) {
    this.queue_.push(soundUrl);
  },
  play: function () {
    const next = this.queue_.shift();
    if (next) {
      this.player_.src = next;
      this.player_.play();
    }
  },
};

MusicMaker.player_.addEventListener('ended', MusicMaker.play.bind(MusicMaker));
