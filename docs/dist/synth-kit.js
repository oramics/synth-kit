(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SynthKit = global.SynthKit || {})));
}(this, (function (exports) { 'use strict';

/* global AudioContext */
var isString = function isString(o) {
  return typeof o === "string";
};
var isFn = function isFn(o) {
  return typeof o === "function";
};
var exp = Math.exp;
var E = Math.E;


var ctx = null;
/**
 * Get an audio context.
 */
function context(config, ac) {
  if (ac) {
    return ac;
  } else if (config && config.context) {
    return config.context;
  } else {
    if (ctx === null) ctx = new AudioContext();
    return ctx;
  }
}

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
    if (isFn(value.connect)) value.connect(target);else target.setValueAtTime(value, 0);
  } else if (target === undefined) {
    // replace the old value with a new one
    node[name] = value;
  }
}

/**
 * Update a node
 */
function update(node, newState) {
  var state = node.state || {};
  Object.keys(newState).forEach(function (key) {
    var newValue = newState[key];
    var prevValue = state[key];
    if (newValue !== prevValue) {
      plug(node, key, newValue);
      state[key] = newValue;
    }
    node.state = state;
  });
  return node;
}

function triggerAttack(time, param, adsr) {
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
    param.exponentialRampToValueAtTime(adsr.sustain, time);
  }

  // only trigger release if hold is defined
  if (adsr.hold !== undefined) {
    time += adsr.hold || 0;
    param.setValueAtTime(adsr.sustain);
    time += adsr.release || 0.1;
    param.exponentialRampToValueAtTime(0.00001, time - 0.01);
    param.setValueAtTime(0, time);
  }
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

function createNode(ac, name, initialState, state, params) {
  var node = ac["create" + name].apply(ac, params);
  node.state = initialState;
  return state ? update(node, state) : node;
}

/**
 * Create an Oscillator
 * A oscillator is always started
 */
function Osc(ac, state) {
  var osc = createNode(ac, "Oscillator", Osc.state, state);
  if (state.start !== false) osc.start(state.start || 0);
  return osc;
}
Osc.state = {
  type: "sine",
  frequency: 440,
  detune: 0
};

function Filter(ac, state) {
  return createNode(ac, "BiquadFilter", Filter.state, state);
}
Filter.state = {
  type: "lowpass",
  frequency: 350,
  detune: 0,
  Q: 1
};

/**
 * Create a Gain node. By default a it's gain value it's 0
 */
var Gain = function Gain(ac, state) {
  var gain = createNode(ac, "Gain", Osc.state, state);
  if (gain.state.gain === 0) gain.gain.setValueAtTime(0, 0);
  return gain;
};
Gain.state = {
  gain: 0
};

function GainEnvelope(ac, state) {
  var env = Gain(null, ac);
  env.state = state;
  env.trigger = function (time, dur) {
    triggerAttack(time, env.gain, env.state);
  };
  return env;
}
GainEnvelope.state = {
  attack: 0.01,
  release: 0.2
};

function FilterEnvelope(ac, state) {}

/**
 * Low Frequency Oscillator
 */
function LFO(ac, state) {
  var lfo = Osc(ac);
  lfo.amp = Gain(ac);
  lfo.rate = lfo.osc.frequency;
  lfo.amount = lfo.amp.gain;
  lfo.update = function (state) {
    return update(lfo, state);
  };
  return update(lfo, LFO.state);
}
LFO.state = {
  // the lfo frequency
  rate: 3,
  // the lfo intensity
  amount: 0.5
};

/**
 * Voltage Controlled Oscillator
 */
function VCO(ac, state) {
  state = Object.assign({}, VCO.state, state);
  var vco = Osc(ac, state);
  vco.modulator = LFO(ac, state.modulator);
  plug(vco, "frequency", vco.modulator);
  vco.start();
  vco.modulator.start();
  return vco;
}
VCO.state = {
  type: "sawtooth",
  frequency: 440,
  detune: 0,
  modulator: {
    rate: 2,
    amount: 0.2
  }
};

function VCF(ac, state) {
  var filter = Filter(ac, state);
  filter.envelope = FilterEnvelope(state);
  filter.trigger = filter.envelope.trigger;
  return filter;
}

/**
 * Voltage controlled amplified
 */
function VCA(ac, state, envState) {
  if (envState) envState = state;
  var vca = Gain(ac, state);
  vca.envelope = GainEnvelope(ac, envState);
  vca.trigger = vca.envelope.trigger;
}

function MonoSynth(ac, state) {
  if (!state) state = MonoSynth.defaults;else state = Object.assign({}, MonoSynth.defaults, state);

  var synth = connected({
    oscillator: VCO(ac, state.oscillator),
    filter: VCF(ac, state.filter),
    amp: VCA(ac, state, state.envelope)
  }, ["oscillator", "filter", "envelope", "amp"]);
  synth.state = state;

  return synth;
}
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3
  },
  gain: 0.5
};

function Kick(ac, state) {}

exports.context = context;
exports.ampToGain = ampToGain;
exports.plug = plug;
exports.update = update;
exports.triggerAttack = triggerAttack;
exports.polyphony = polyphony;
exports.connected = connected;
exports.connect = connect;
exports.Osc = Osc;
exports.Filter = Filter;
exports.Gain = Gain;
exports.GainEnvelope = GainEnvelope;
exports.FilterEnvelope = FilterEnvelope;
exports.LFO = LFO;
exports.VCO = VCO;
exports.VCF = VCF;
exports.VCA = VCA;
exports.MonoSynth = MonoSynth;
exports.Kick = Kick;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=synth-kit.js.map
