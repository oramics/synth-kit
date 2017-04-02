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

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

// const isString = (o) => typeof o === "string"
var isFn$1 = function isFn(o) {
  return typeof o === "function";
};


function instrument(config) {
  var inst = {};
  var names = Object.keys(config);
  names.forEach(function (key) {
    var _config$key = slicedToArray(config[key], 2),
        node = _config$key[0],
        to = _config$key[1];

    inst[key] = node;
    if (to === "output") setOutput(inst, node);else connect$1(node, config[to][0]);
  });
  inst.update = function (state) {
    if (state) {
      names.forEach(function (key) {
        console.log("UPDATE", key, state[key]);
        inst[key].update(state[key]);
      });
    }
    return inst;
  };
  inst.inspect = function () {
    return names.reduce(function (state, name) {
      state[name] = inst[name].inspect();
      return state;
    }, {});
  };
  return inst;
}

function createAudioNode(ac, type, params, initParam) {
  var node = ac["create" + type](initParam);
  node.update = function (state) {
    if (state) {
      params.forEach(function (name) {
        plug$1(node, name, state[name]);
      });
    }
    return node;
  };
  node.inspect = function () {
    return params.reduce(function (state, name) {
      state[name] = inspect(node, name);
      return state;
    }, {});
  };
  return node;
}

// Get the value of a node parameter
function inspect(node, name) {
  var value = node[name];
  return value && value.value !== undefined ? value.value : value;
}

/**
 * Update a node property with a value. If the property is a parameter and
 * the value is a node, it will connect them
 */
function plug$1(node, name, value) {
  var target = node[name];
  if (isFn$1(value)) value = value();
  if (value === undefined || target === undefined) {
    // ignore
  } else if (target.value !== undefined) {
    // it's a parameter
    if (isFn$1(value.connect)) {
      value.connect(target);
    } else {
      target.value = value;
      target.setValueAtTime(value, 0);
    }
  } else {
    // replace the old value with a new one
    node[name] = value;
  }
}

function connect$1(node, dest) {
  if (dest) node.connect(dest);
}

/**
 * Set the output of a node (by creating a new connect function)
 */
function setOutput(inst, node) {
  inst.connect = function (dest) {
    if (dest === true) dest = node.context.destination;
    node.connect(dest);
    return inst;
  };
}

function withDefaults(config, defaults$$1) {
  return config ? Object.assign({}, defaults$$1, config) : defaults$$1;
}

// # Gain
function Gain(ac, state) {
  return createAudioNode(ac, "Gain", Gain.params).update(state);
}
Gain.params = ["gain"];

var SILENCE = { gain: 0 };
/**
 * Create a Gain envelope. Any audio source can be connected to an
 * audio envelope.
 *
 * @example
 * const [osc, adsr] = connect(Osc(ac), GainEnvelope(ac))
 * adsr.trigger()
 */
function GainEnvelope(ac, state) {
  var env = Gain(ac, SILENCE);
  state = Object.assign({}, GainEnvelope.defaultState, state);

  env.update = function (newState) {
    state = Object.assign(state, newState);
    return env;
  };
  env.inspect = function () {
    return state;
  };

  env.trigger = function (time, dur) {
    if (!time) time = ac.currentTime;
    console.log("trigger env", time, dur, state);
    var release = triggerAdsr(time, env.gain, state);
    if (dur) release(time + dur);
    return release;
  };
  return env;
}

GainEnvelope.params = ["base", "peak", "attack", "decay", "sustain", "release"];

// default values
GainEnvelope.defaultState = {
  gain: 1,
  attack: 0.01,
  decay: 0.2
};

function triggerAdsr(time, param, adsr) {
  console.log("trigger", time, adsr);
  param.cancelScheduledValues(0);

  // attack phase
  var attack = adsr.attack || 0.01;
  var peak = adsr.gain || 1;
  param.setValueAtTime(0, time);
  time += attack;
  param.linearRampToValueAtTime(peak, time);

  // decay phase
  var decay = adsr.decay || 0.01;
  var sustain = adsr.sustain || 0;
  console.log("DECAY", decay, sustain);
  time += decay;
  param.linearRampToValueAtTime(sustain, time);

  // hold phase
  var hold = adsr.hold || 0;
  if (hold) {
    time += hold;
    param.setValueAtTime(sustain, time);
  }

  var release = function release(time) {
    var release = adsr.release || 0;
    time += release;
    param.exponentialRampToValueAtTime(0.00001, time);
  };

  // trigger release if hold is specified
  if (sustain && hold) {
    release(time);
  }

  return release;
}

// # Buffer (Mono)

/**
 * Create a MonoBuffer using a generator function
 */
function MonoBuffer(ac, samples, generator) {
  var inverse = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var buffer = ac.createBuffer(1, samples, ac.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < samples; i++) {
    data[i] = generator(inverse ? samples - i : i);
  }
  return buffer;
}

// # Source
function Source(ac, buffer, state) {
  var source = createAudioNode(ac, "BufferSource", Source.params);
  source.update(state);
  source.buffer = buffer;
  return source;
}

Source.params = ["detune", "loop", "loopStart", "loopEnd", "playbackRate"];

// # Noise
function Noise(ac, config) {
  config = Object.assign({}, Noise.defaults, config);
  var samples = config.duration * ac.sampleRate;
  var buffer = MonoBuffer(ac, samples, function () {
    return Math.random() * 2 - 1;
  });
  var noise = Source(ac, buffer, { loop: true });
  noise.start();
  return noise;
}
Noise.defaults = {
  duration: 1,
  loop: true
};

// Voltage controlled amplified
function VCA(ac, config) {
  var vca = Gain(ac, config);
  return vca;
}

// # Oscillator
function Osc(ac, state) {
  var start = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var osc = createAudioNode(ac, "Oscillator", Osc.params);
  if (start) osc.start(+start);
  return osc;
}
Osc.params = ["type", "frequency", "detune"];

// # Voltage Controlled Oscillator
function VCO(ac, config) {
  return Osc(ac, config);
}

/** @module kit */
function Filter(ac, state) {
  return createAudioNode(ac, "BiquadFilter", Filter.params).update(state);
}
Filter.params = ["type", "frequency", "detune", "Q"];

// # Voltage Controlled Filter
function VCF(ac, config) {
  var filter = Filter(ac, config);
  return filter;
}

function Kick(ac, state) {
  state = Object.assign({}, Kick.defaults, state);
  var kick = instrument({
    oscillator: [Osc(ac), "envelope"],
    envelope: [GainEnvelope(ac), "amp"],
    amp: [Gain(ac), "output"]
  }).update(state);

  kick.trigger = function (time) {
    kick.envelope.trigger(time);
  };

  return kick;
}

Kick.defaults = {
  oscillator: {
    type: "sine",
    frequency: 48
  },
  envelope: {
    attack: 0.1,
    decay: 0.2
  },
  amp: {
    gain: 1
  }
};

function Snare(ac, state) {
  state = Object.assign({}, Snare.defaults, state);
  var snare = instrument({
    noise: [Noise(ac), "envelope"],
    envelope: [GainEnvelope(ac), "amp"],
    amp: [Gain(ac), "output"]
  }).update(state);

  snare.trigger = snare.envelope.trigger;

  return snare;
}

Snare.defaults = {
  noise: {
    type: "white"
  },
  envelope: {
    attack: 0.01,
    release: 0.1
  },
  amp: {
    gain: 0.1
  }
};

function Hat(ac, state) {
  state = Object.assign({}, Hat.defaults, state);
  var snare = instrument({
    noise: [Noise(ac), "envelope"],
    envelope: [GainEnvelope(ac), "amp"],
    amp: [Gain(ac), "output"]
  }).update(state);

  snare.trigger = snare.envelope.trigger;

  return snare;
}

Hat.defaults = {
  noise: {
    type: "white"
  },
  envelope: {
    attack: 0.01,
    release: 0.1
  },
  amp: {
    gain: 0.1
  }
};

// # Cowbell

// The Cowbell is based on the 808 design:

// > "the block diagram for the cowbell sound generator in the TR808 is a
// relatively simple circuit, and uses just two of the six pulse-wave
// oscillators that provide the basis of the machine's cymbal and hi-hat sounds.
// The outputs from these pass through a pair of VCAs controlled by a contour
// generator, and through a band-pass filter that removes the upper and lower
// partials. Finally, the result is then amplified before reaching the outside
// world."

// Source of all quotes: https://github.com/micjamking/synth-secrets/blob/master/part-41.md

// #### Oscillators

// > "We should be able to recreate this sound on any synth with two oscillators
// and a band-pass (...) the sound comprises a pair of tones with fundamental
// pitches of approximately 587Hz and 845Hz. With a frequency ratio of 1:1.44,
// these are suitably clangy, and serve Roland's purpose well."

// > Firstly, we select two oscillators, and set them with triangle-wave outputs
// at frequencies of 587Hz and 845Hz

// #### Filter

// > "then added a band-pass filter, finding that a centre frequency of 2.64kHz
// worked well. The 12dB-per-octave option sounded a bit flabby, while the
// 24dB-per-octave cutoff shaped the sound too severely, , so I chose the
// 12dB-per-octave option and added a little resonance to accentuate the
// partials close to the centre frequency"

// #### Envelope

// > "forms an envelope having abrupt level decay at the initial trailing edge
// to emphasise attack effect"

// #### The instrument
function Cowbell(ac, state) {
  if (state) state = Object.assign({}, Cowbell.defaultState, state);else state = Cowbell.defaultState;

  var cowbell = instrument({
    osc1: [Osc(ac), "env1"],
    env1: [GainEnvelope(ac), "filter"],
    osc2: [Osc(ac), "env2"],
    env2: [GainEnvelope(ac), "filter"],
    filter: [Filter(ac), "amp"],
    amp: [Gain(ac), "output"]
  }).update(state);

  cowbell.trigger = function (time) {
    cowbell.env1.trigger(time);
    cowbell.env2.trigger(time);
  };
  return cowbell;
}

// The Cowbell default parameters
Cowbell.defaultState = {
  osc1: {
    type: "triangle",
    frequency: 587
  },
  env1: {
    gain: 0.6,
    attack: 0.01,
    decay: 0.05,
    sustain: 0
  },
  osc2: {
    type: "triangle",
    frequency: 845
  },
  env2: {
    gain: 0.8,
    attack: 0.1,
    decay: 0.1
  },
  filter: {
    type: "bandpass",
    frequency: 2640,
    Q: 3.5
  },
  amp: {
    gain: 1
  }
};

// # Conga
function Conga(ac, config) {
  var state = withDefaults(config, Conga.defaults);
  var conga = instrument({
    oscillator: [Osc(ac), "envelope"],
    envelope: [GainEnvelope(ac), "amp"],
    amp: [Gain(ac), "output"]
  }).update(state);

  conga.trigger = conga.envelope.trigger;

  return conga;
}
Conga.defaults = {
  oscillator: {
    frequency: 310
  },
  envelope: {
    decay: 0.31
  },
  amp: {
    gain: 0.4
  }
};

// # MonoSynth
function MonoSynth(ac, state) {
  state = Object.assign({}, MonoSynth.defaults, state);
  var synth = instrument({
    oscillator: [VCO(ac), "filter"],
    filter: [VCF(ac), "envelope"],
    envelope: [GainEnvelope(ac), "amp"],
    amp: [VCA(ac), "output"]
  }).update(state);

  synth.trigger = function (freq, time, dur) {
    time = time || ac.currentTime;
    if (freq) synth.oscillator.frequency.setValueAtTime(freq, time);
    synth.envelope.trigger(time, dur);
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
  amp: {
    gain: 0.5
  }
};

// Functions

exports.Gain = Gain;
exports.GainEnvelope = GainEnvelope;
exports.Noise = Noise;
exports.VCA = VCA;
exports.VCO = VCO;
exports.VCF = VCF;
exports.Kick = Kick;
exports.Snare = Snare;
exports.Hat = Hat;
exports.Cowbell = Cowbell;
exports.Conga = Conga;
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
