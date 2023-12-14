import ConspiracyElement from "./conspiracy-element.js";

var templateRequest = await fetch(import.meta.url + "/../audio-player.html");
var template = await templateRequest.text();

import { LIVE } from "../src/index.js";

class Counter extends EventTarget {
  value = { count: 0 };
  interval = null;
  [LIVE] = "value";

  constructor() {
    super();
    this.start(1000);
  }

  update() {
    this.value.count++;
    this.dispatchEvent(new Event("value"));
  }

  start(rate) {
    this.interval = window.setInterval(this.update.bind(this), rate);
  }

  stop() {
    window.clearInterval(this.interval);
  }
}

export default class AudioPlayer extends ConspiracyElement {
  static template = template;

  items = [];
  state = {
    liveEvent: new Counter(),
    currentitem: null,
    progress: {}
  };

  constructor() {
    super();
    var observer = new MutationObserver(this.onMutation.bind(this));
    observer.observe(this, { childList: true, subtree: true });
    this.onMutation();

    this.addEventListener("audioevent", this.onAudioEvent);
    this.addEventListener("audioready", this.onAudioReady);
    this.addEventListener("progresschange", this.onSeek);
    this.addEventListener("playaudio", this.onPlay);
    this.addEventListener("playlistclick", this.onPlaylistClick);
  }

  onMutation() {
    var sources = Array.from(this.children).filter(e => e.tagName == "SOURCE");
    this.items = sources.map(source => ({
      url: source.src,
      title: source.getAttribute("title")
    }));
    if (this.items.length && !this.state.currentItem) {
      this.state.currentItem = this.items[0];
    }
    this.render();
  }

  onPlay() {
    var { audio } = this.ui.elements;
    if (!this.state.currentItem && this.items.length) {
      this.state.currentItem = this.items[0];
    }
    this.items.forEach(i => i.playing = i == this.state.currentItem);
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
    this.render();
  }

  updateProgress() {
    var { audio } = this.ui.elements;
    if (audio.duration) {
      var max = audio.duration;
      var value = audio.currentTime;
      this.state.progress = { max, value };
    }
  }

  onAudioEvent() {
    this.updateProgress();
    var { audio } = this.ui.elements;
    this.state.playing = String(!audio.paused);
    this.render();
  }

  onSeek(e) {
    var { audio, progress } = this.ui.elements;
    var event = e.originalEvent;
    var bounds = progress.getBoundingClientRect();
    var ratio = (event.clientX - bounds.left) / bounds.width;
    var time = audio.duration * ratio;
    audio.currentTime = time;
    this.render();
  }

  onPlaylistClick(e) {
    var clicked = e.dispatchedFrom;
    var index = clicked.dataset.index;
    this.state.currentItem = this.items[index];
    this.items.forEach(i => i.playing = i == this.state.currentItem);
    this.render();
    this.ui.elements.audio.play();
  }

}

window.customElements.define("audio-player", AudioPlayer);