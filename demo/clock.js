import ConspiracyElement from "./conspiracy-element.js";
import { LIVE } from "../src/conspiracy.js";

class Timer extends EventTarget {
  time = 0;
  interval = null;
  running = false;
  [LIVE] = "tick";

  constructor() {
    super();
    this.tick = this.tick.bind(this);
  }

  get formatted() {
    var pad = n => String(n).padStart(2, "0");
    var minutes = Math.floor(this.time / 60);
    var seconds = this.time % 60;
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  tick() {
    this.time++;
    this.dispatchEvent(new Event("tick"));
  }

  start() {
    this.time = 0;
    this.running = true;
    this.interval = window.setInterval(this.tick, 1000)
    this.dispatchEvent(new Event("tick"));
  }

  stop() {
    this.running = false;
    clearInterval(this.interval);
  }
}

class MultiTimer extends ConspiracyElement {
  state = {
    timers: Array.from({ length: 2}, a => new Timer())
  }

  static template = `
<style>
:host {
  display: block;
  background: #ACC;
  padding: 20px;
  border-radius: 20px;
}

ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr 1fr;
}

.timer {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #8BB;
  border-radius: 4px;

  & button {
    font-family: inherit;
    background: white;
    color: black;
    border-radius: 3px;
    border: 1px solid black;
    padding: 2px;
    margin-left: 16px;
  }
}
</style>
<ul>
  <li :each="timer, i of state.timers" class="timer">
    Timer <!-- :i --> - <!-- :timer.formatted -->
    <button :on.click="timer.toggle" :attr.data-index="i">Start/stop</button>
    <button :on.click="timer.remove" :attr.data-index="i">Remove</button>
  </li>
  <button :on.click="timer.add">Add timer</button>
</ul>
  `

  constructor() {
    super();
    this.render();
    this.shadowRoot.addEventListener("timer.toggle", this.toggleTimer.bind(this));
    this.shadowRoot.addEventListener("timer.add", this.addTimer.bind(this));
    this.shadowRoot.addEventListener("timer.remove", this.removeTimer.bind(this));
  }

  toggleTimer(e) {
    var index = e.target.dataset.index * 1;
    var timer = this.state.timers[index];
    if (timer.running) {
      timer.stop();
    } else {
      timer.start();
    }
  }

  addTimer() {
    this.state.timers.push(new Timer());
    this.render();
  }

  removeTimer(e) {
    var index = e.target.dataset.index * 1;
    this.statetimers = this.state.timers.splice(index, 1);
    this.render();
  }
}

customElements.define("multi-timer", MultiTimer);