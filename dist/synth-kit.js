(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SynthKit = global.SynthKit || {})));
}(this, (function (exports) { 'use strict';

var isString = function isString(o) {
  return typeof o === "string";
};
var isFn = function isFn(o) {
  return typeof o === "function";
};
var exp = Math.exp;
var E = Math.E;


function ampToGain(amp) {
  return (exp(amp) - 1) / (E - 1);
}

/**
 * Update a node property with a value. If the property is a parameter and
 * the value is a node, it will connect them
 */
function plug(node, name, value) {
  var target = node[name];
  if (isFn(value)) value = value();
  if (target === undefined || value === undefined || value === null) {
    // ignore
  } else if (target.value !== undefined) {
    // it's a parameter
    if (isFn(value.connect)) {
      value.connect(target);
    } else {
      target.setValueAtTime(value, 0);
    }
  } else {
    // replace the old value with a new one
    node[name] = value;
  }
}

/**
 * Update a node
 */
function update(node, newState, initialState) {
  if (initialState) node.state = Object.assign({}, initialState);else if (!node.state) node.state = {};

  if (newState) {
    var state = node.state;
    // diffing algorithm
    Object.keys(newState).forEach(function (key) {
      var newValue = newState[key];
      var prevValue = state[key];
      if (newValue !== prevValue) {
        plug(node, key, newValue);
        state[key] = newValue;
      }
    });
  }
  return node;
}

function polyphony(init) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var max = options.maxVoices || 16;
  var voices = [];
  for (var i = 0; i < max; i++) {
    voices[i] = init();
  }var current = -1;

  return function next() {
    current = (current + 1) % max;
    return voices[current];
  };
}

function connected(object, connections) {
  connections.reduce(function (src, next) {
    if (isString(src)) src = object[src];
    if (isString(next)) next = object[next];
    src.connect(next);
    return next;
  });
  return object;
}

function connect() {
  for (var _len = arguments.length, nodes = Array(_len), _key = 0; _key < _len; _key++) {
    nodes[_key] = arguments[_key];
  }

  nodes.reduce(function (prev, next) {
    prev.connect(next);
    return next;
  });
  return nodes;
}

/**
 * Create a connect function with for the given node
 * The return function have two special characteristics:
 * - It's chainable
 * - It accepts `true` as param to connect to node's AudioContext's destination
 */
function connectWith(node, parent) {
  if (!parent) throw Error("no parent!");
  var conn = node.connect;
  return function (dest) {
    if (dest === true) conn.call(node, node.context.destination);else conn.apply(node, arguments);
    return parent;
  };
}

/**
 * Create a Gain node.
 * Unlike the normal Gain node, the gain of this one is 0 by default
 */
function Gain(ac, state) {
  var gain = update(ac.createGain(), state, Gain.state);
  if (gain.state.gain === 0) gain.gain.setValueAtTime(0, 0);
  return gain;
}

Gain.state = {
  gain: 0
};

/**
 * Create a Gain envelope. Any audio source can be connected to an
 * audio envelope.
 *
 * @example
 * const [osc, adsr] = connect(Osc(ac), GainEnvelope(ac))
 * adsr.trigger()
 */
function GainEnvelope(ac, state) {
  var env = Gain(ac);
  env.state = Object.assign({}, GainEnvelope.state, state);

  /**
   * Trigger the envelope. It triggers the attack phase of the envelope
   * at a given time and the release phase if a duration is given.
   * @param {Number} [when=now]
   * @param {Number} [duration]
   * @return {GainEnvelope} this
   */
  env.trigger = function (time, dur) {
    if (!time) time = ac.currentTime;
    console.log("trigger env", time, dur, env.state);
    var release = triggerAdsr(time, env.gain, env.state);
    if (dur) release(time + dur);
    return release;
  };
  return env;
}
GainEnvelope.state = {
  attack: 0.01,
  release: 0.2
};

function triggerAdsr(time, param, adsr) {
  param.cancelScheduledValues(0);
  // attack phase
  var attack = adsr.attack || 0.01;
  param.setValueAtTime(0, time);
  time += attack;
  param.linearRampToValueAtTime(1, time);

  // decay-sustain phase
  var sustain = adsr.sustain || 1;
  if (sustain !== 1) {
    time += adsr.decay || 0.01;
    param.exponentialRampToValueAtTime(sustain, time);
  }

  var release = function release(time) {
    param.exponentialRampToValueAtTime(0.00001, time - 0.01);
    param.setValueAtTime(0, time);
  };

  // only trigger release if hold is defined
  if (adsr.hold !== undefined) {
    time += adsr.hold || 0;
    param.setValueAtTime(sustain, time);
    release(time + (adsr.release || 0.1));
  }

  return release;
}

function MonoBuffer(ac, samples, generator) {
  var inverse = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var buffer = ac.createBuffer(1, samples, ac.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < samples; i++) {
    data[i] = generator(inverse ? samples - i : i);
  }
  return buffer;
}

function Source(ac, buffer, state) {
  var source = update(ac.createBufferSource(), state, Source.state);
  source.buffer = buffer;
  return source;
}
Source.state = {
  detune: 0,
  loop: false,
  loopStart: undefined,
  loopEnd: undefined,
  playbackRate: 1
};

/**
 * Noise oscillator
 */
function Noise(ac, state) {
  state = Object.assign({}, Noise.state, state);
  var duration = state.duration * ac.sampleRate;
  var buffer = MonoBuffer(ac, duration, function () {
    return Math.random() * 2 - 1;
  });
  var noise = Source(ac, buffer, { loop: true });
  noise.start();
  return noise;
}
Noise.state = {
  type: "white",
  duration: 1,
  gain: 0.7,
  loop: true
};

/**
 * Voltage controlled amplified
 */
function VCA(ac, state) {
  state = Object.assign({}, VCA.state, state);
  var vca = Gain(ac, state);
  vca.envelope = GainEnvelope(ac, state.envelope);
  vca.connect(vca.envelope);

  // API
  vca.state = state;
  vca.connect = connectWith(vca.envelope, vca);
  vca.trigger = vca.envelope.trigger;
  return vca;
}
VCA.state = {
  gain: 0.8,
  envelope: GainEnvelope.state
};

/**
 * Create an Oscillator
 * A oscillator is always started
 */
function Osc(ac, state) {
  var osc = update(ac.createOscillator(), state, Osc.state);
  if (osc.state.start !== false) osc.start(osc.state.start || 0);
  return osc;
}
Osc.state = {
  type: "sine",
  frequency: 440,
  detune: 0
};

/**

 * Low Frequency Oscillator
 */
function LFO(ac, state) {
  var lfo = Osc(ac);
  lfo.amp = Gain(ac);
  lfo.rate = lfo.frequency;
  lfo.amount = lfo.amp.gain;
  lfo.update = function (state) {
    return update(lfo, state);
  };
  lfo.connect(lfo.amp);
  lfo.connect = connectWith(lfo.amp, lfo);
  update(lfo, LFO.state);
}
LFO.state = {
  type: "sine",
  // the lfo frequency
  rate: 3,
  // the lfo intensity
  amount: 0.5
};

/**
 * Voltage Controlled Oscillator. An oscillator with the detune parameter
 * modulated by a low frequency oscillator
 */
function VCO(ac, state) {
  state = Object.assign({}, VCO.state, state);
  var vco = Osc(ac, state);
  vco.modulator = LFO(ac, state.modulator);
  plug(vco, "detune", vco.modulator);

  /**
   * Connect to a node
   * @chainable
   * @param {AudioNode} destination
   * @return {VCO} this
   */
  vco.connect = connectWith(vco, vco);
  return vco;
}
VCO.state = {
  type: "sawtooth",
  frequency: 440,
  detune: 0,
  modulator: {
    rate: 5,
    amount: 1
  }
};

/**
 * Create a Filter
 */
function Filter(ac, state) {
  return update(ac.createBiquadFilter(), state, Filter.state);
}
Filter.state = {
  type: "lowpass",
  frequency: 350,
  detune: 0,
  Q: 1
};

/**
 * Voltage Controlled Filter
 */
function VCF(ac, state, envState) {
  if (!envState) envState = state;
  var filter = Filter(ac, state);
  // filter.envelope = FilterEnvelope(state)
  // filter.trigger = filter.envelope.trigger
  filter.trigger = function () {
    // TODO
  };
  console.log("FILTER", filter, filter.state);
  return filter;
}

function Kick(ac, state) {
  state = Object.assign({}, Kick.state, state);
  var kick = {
    oscillator: VCO(ac, state.oscillator),
    amp: VCA(ac, state.amp)
  };
  connect(kick.oscillator, kick.amp);

  // API
  kick.state = state;
  kick.connect = connectWith(kick.amp, kick);
  kick.trigger = kick.amp.trigger;

  return kick;
}
Kick.state = {
  oscillator: {
    type: "sine",
    frequency: 48
  },
  amp: {
    gain: 1,
    envelope: {
      attack: 0.01,
      hold: 0.1,
      release: 0.1
    }
  }
};

function Snare(ac, state) {
  state = Object.assign({}, Snare.state, state);
  var snare = {
    state: state,
    noise: Noise(ac, state.noise),
    amp: VCA(ac, state.amp)
  };
  connect(snare.noise, snare.amp);

  // API
  snare.connect = connectWith(snare.amp, snare);
  snare.trigger = snare.amp.trigger;

  return snare;
}
Snare.state = {
  noise: {
    type: "white"
  },
  amp: {
    gain: 0.3,
    envelope: {
      attack: 0.01,
      hold: 0.1,
      release: 0.1
    }
  }
};

/**
 * MonoSynth
 */
function MonoSynth(ac, state) {
  if (!state) state = MonoSynth.defaults;else state = Object.assign({}, MonoSynth.defaults, state);

  // Create the synth
  var synth = {
    state: state,
    oscillator: VCO(ac, state.oscillator),
    filter: VCF(ac, state.filter),
    amp: VCA(ac, state, state.envelope)
  };
  connect(synth.oscillator, synth.filter, synth.amp);

  // Synth API
  synth.connect = connectWith(synth.amp, synth);
  synth.trigger = function (freq, time, dur) {
    time = time || ac.currentTime;
    if (freq) synth.oscillator.frequency.setValueAtTime(freq, time);
    synth.amp.trigger(time, dur);
  };
  return synth;
}
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  filter: {
    type: "lowpass",
    frequency: 4000
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3
  },
  gain: 0.5
};

exports.Gain = Gain;
exports.GainEnvelope = GainEnvelope;
exports.Noise = Noise;
exports.VCA = VCA;
exports.VCO = VCO;
exports.VCF = VCF;
exports.Kick = Kick;
exports.Snare = Snare;
exports.MonoSynth = MonoSynth;
exports.ampToGain = ampToGain;
exports.plug = plug;
exports.update = update;
exports.polyphony = polyphony;
exports.connected = connected;
exports.connect = connect;
exports.connectWith = connectWith;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=synth-kit.js.map
