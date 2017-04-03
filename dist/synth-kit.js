(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SynthKit = global.SynthKit || {})));
}(this, (function (exports) { 'use strict';

// const isString = (o) => typeof o === "string"
var isFn = function isFn(o) {
  return typeof o === "function";
};


function instrument(ac, config) {
  var inst = {};
  var names = Object.keys(config);

  // create nodes
  names.forEach(function (key) {
    var Node = config[key][0];
    inst[key] = typeof Node === "function" ? Node(ac) : Node;
  });
  // connect nodes
  names.forEach(function (key) {
    var to = config[key][1];
    var node = inst[key];
    if (to === "output") connectWith(inst, node);else connect(node, inst[to]);
  });

  // API
  // update: change the state of the instrument
  inst.update = function (state, time) {
    time = time || ac.currentTime;
    if (state) {
      names.forEach(function (key) {
        inst[key].update(state[key], time);
      });
    }
    return inst;
  };
  // inspect: get the current state of the instrument
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
        plug(node, name, state[name]);
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
function plug(node, name, value) {
  var target = node[name];
  if (isFn(value)) value = value();
  if (value === undefined || target === undefined) {
    // ignore
  } else if (target.value !== undefined) {
    // it's a parameter
    if (isFn(value.connect)) {
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

function connect(node, dest) {
  if (dest) node.connect(dest);
}

/**
 * Set the output of a node (by creating a new connect function)
 */
function connectWith(inst, node) {
  inst.connect = function (dest) {
    if (dest === true) dest = node.context.destination;
    node.connect(dest);
    return inst;
  };
}

function withDefaults(config, defaults) {
  return config ? Object.assign({}, defaults, config) : defaults;
}

/**
 * Trigger an ADSR envelope over a param
 */
function triggerAdsr(time, param, adsr) {
  param.cancelScheduledValues(0);

  // attack phase
  var attack = adsr.attack || 0.01;
  var peak = adsr.peak || 1;
  param.setValueAtTime(0, time);
  time += attack;
  console.log("attack", attack, peak, time);
  param.linearRampToValueAtTime(peak, time);

  // decay phase
  var decay = adsr.decay || 0.01;
  var sustain = adsr.sustain || 0;
  time += decay;
  param.linearRampToValueAtTime(sustain, time);

  // hold phase
  var hold = adsr.hold || 0;
  if (hold) {
    time += hold;
    param.setValueAtTime(sustain, time);
  }

  var release = function release(time) {
    if (sustain) {
      param.setValueAtTime(time, sustain);
      var _release = adsr.release || 0;
      console.log("Trigger release", _release, time);
      time += _release;
      param.exponentialRampToValueAtTime(0.00001, time);
    }
  };

  // trigger release if hold is specified
  if (hold) {
    release(time);
  }

  return release;
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
    var release = triggerAdsr(time, env.gain, state);
    if (dur) release(time + dur);
    return release;
  };
  return env;
}

GainEnvelope.params = ["base", "peak", "attack", "decay", "sustain", "release"];

// default values
GainEnvelope.defaultState = {
  peak: 1,
  attack: 0.01,
  decay: 0.2
};

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

// # Sample
function Sample(ac, buffer, config) {
  var sample = Gain(ac);

  sample.trigger = function (time, dur) {
    if (!time) time = ac.currentTime;
    var source = Source(ac, buffer, config);
    source.connect(sample);
    source.onended = function () {
      if (sample.onended) sample.onended();
      source.disconnect();
    };
    source.start(time);
  };
  return sample;
}

Sample.state = {
  gain: 0.8
};

// # Pulse
function Pulse(ac, config) {
  config = Object.assign({}, Pulse.defaults, config);
  var samples = config.duration * ac.sampleRate;
  var buffer = MonoBuffer(ac, samples, function () {
    return Math.random() * 2 - 1;
  });
  var pulse = Sample(ac, buffer);
  return pulse;
}
Pulse.defaults = {
  duration: 0.001
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

// # Voltage Controlled Filter
function VCF(ac, state) {
  var filter = createAudioNode(ac, "BiquadFilter", VCF.params);
  // set the default parameters so plug work with them
  filter.attack = 0.01;
  filter.decay = 0.1;
  filter.octaves = 2;

  filter.trigger = function (time, dur) {
    if (!time) time = ac.currentTime;
    this.base = this.frequency.value;
    this.peak = this.base * this.octaves;
    var release = triggerAdsr(time, filter.frequency, filter);
    if (dur) release(time + dur);
    return release;
  };
  return filter.update(state);
}
VCF.params = ["type", "frequency", "detune", "Q", "attack", "decay", "octaves"];
VCF.defaults = {
  type: "lowpass",
  frequency: 880,
  attack: 0.1,
  decay: 0.5,
  octaves: 2
};

// # WaveShaper

/**
 * Create a WaveShaper node.
 */
function WaveShaper(ac, curve) {
  var oversample = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "none";

  var shaper = ac.createWaveShaper();
  shaper.curve = curve;
  shaper.oversample = oversample;
  return shaper;
}

// # SoftClipper
var curve = null;

/**
 * Create a SoftClipper
 */
function SoftClipper(ac, state) {
  var clipper = createAudioNode(ac, "Gain", SoftClipper.params);
  clipper.drive = clipper.gain;
  if (!curve) curve = createSoftClipperCurve();
  var shaper = WaveShaper(ac, curve, "2x");
  clipper.connect(shaper);
  clipper.connect = shaper.connect.bind(shaper);
  return clipper.update(state);
}
SoftClipper.params = ["drive"];

function createSoftClipperCurve() {
  var n = 65536;
  var curve = new Float32Array(n);
  for (var i = 0; i < n; i++) {
    var x = (i - n / 2) / (n / 2);
    curve[i] = Math.tanh(x);
  }
  return curve;
}

function Kick(ac, state) {
  state = Object.assign({}, Kick.defaults, state);
  var kick = instrument(ac, {
    oscillator: [Osc, "envelope"],
    click: [Pulse, "envelope"],
    envelope: [GainEnvelope, "vcf"],
    vcf: [VCF, "clipper"],
    clipper: [SoftClipper, "amp"],
    amp: [Gain, "output"]
  }).update(state);

  kick.trigger = function (time) {
    kick.click.trigger(time);
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
  vcf: {
    type: "lowpass",
    frequency: 48,
    envelope: {
      base: 48,
      peak: 100,
      attack: 0.001,
      decay: 0.60
    }
  },
  amp: {
    gain: 1
  }
};

function Snare(ac, state) {
  state = Object.assign({}, Snare.defaults, state);
  var snare = instrument(ac, {
    osc1: [Osc, "oscEnv"],
    osc2: [Osc, "oscEnv"],
    oscEnv: [GainEnvelope, "amp"],
    noise: [Noise, "noiseEnv"],
    noiseEnv: [GainEnvelope, "amp"],
    amp: [Gain, "output"]
  }).update(state);

  snare.trigger = function (time) {
    snare.oscEnv.trigger(time);
    snare.noiseEnv.trigger(time);
  };

  return snare;
}

Snare.defaults = {
  osc1: {
    type: "sine",
    frequency: 238
  },
  osc2: {
    type: "sine",
    frequency: 476
  },
  oscEnv: {
    gain: 0.5,
    attack: 0.01,
    release: 0.4
  },
  noise: {
    type: "white"
  },
  noiseEnv: {
    attack: 0.01,
    decay: 0.1
  },
  amp: {
    gain: 0.5
  }
};

function Hat(ac, state) {
  state = Object.assign({}, Hat.defaults, state);
  var snare = instrument(ac, {
    noise: [Noise, "envelope"],
    envelope: [GainEnvelope, "amp"],
    amp: [Gain, "output"]
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

/** @module kit */
function Filter(ac, state) {
  return createAudioNode(ac, "BiquadFilter", Filter.params).update(state);
}
Filter.params = ["type", "frequency", "detune", "Q"];

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

  var cowbell = instrument(ac, {
    osc1: [Osc, "env1"],
    env1: [GainEnvelope, "filter"],
    osc2: [Osc, "env2"],
    env2: [GainEnvelope, "filter"],
    filter: [Filter, "amp"],
    amp: [Gain, "output"]
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
    gain: 0.2
  }
};

// # Conga
function Conga(ac, config) {
  var state = withDefaults(config, Conga.defaults);
  var conga = instrument(ac, {
    oscillator: [Osc, "envelope"],
    envelope: [GainEnvelope, "amp"],
    pulse: [Pulse, "amp"],
    amp: [Gain, "output"]
  }).update(state);

  conga.trigger = conga.envelope.trigger;

  return conga;
}
Conga.defaults = {
  oscillator: {
    frequency: 310
  },
  pulse: {
    gain: 0.8
  },
  envelope: {
    decay: 0.31
  },
  amp: {
    gain: 0.4
  }
};

// # Tom
function Tom(ac, config) {
  var state = withDefaults(config, Tom.defaults);
  var tom = instrument(ac, {
    oscillator: [Osc, "envelope"],
    envelope: [GainEnvelope, "amp"],
    pulse: [Pulse, "amp"],
    amp: [Gain, "output"]
  }).update(state);

  tom.trigger = function (time) {
    tom.pulse.trigger(time);
    tom.envelope.trigger(time);
  };
  return tom;
}
Tom.defaults = {
  oscillator: {
    frequency: 165
  },
  pulse: {
    gain: 0.1
  },
  envelope: {
    decay: 0.31
  },
  amp: {
    gain: 1
  }
};

// # MonoSynth
function MonoSynth(ac, state) {
  state = Object.assign({}, MonoSynth.defaults, state);
  var synth = instrument(ac, {
    oscillator: [VCO, "vcf"],
    vcf: [VCF, "envelope"],
    envelope: [GainEnvelope, "amp"],
    amp: [VCA, "output"]
  }).update(state);

  synth.trigger = function (freq, time, dur) {
    time = time || ac.currentTime;
    if (freq) {
      synth.oscillator.frequency.setValueAtTime(freq, time);
      synth.vcf.frequency.setValueAtTime(freq / 2, time);
    }
    synth.vcf.trigger(time, dur);
    synth.envelope.trigger(time, dur);
  };
  return synth;
}
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  vcf: {
    type: "lowpass",
    Q: 2,
    attack: 0.1,
    octaves: 2,
    decay: 1
  },
  envelope: {
    attack: 0.1,
    decay: 0.5,
    sustain: 0.8,
    release: 2
  },
  amp: {
    gain: 0.5
  }
};

// # Feedback Comb Filter
function FeedbackCombFilter(ac, config) {
  config = Object.assign({}, FeedbackCombFilter.defaults, config);
  var feedback = Gain(ac, config);
  // Create a delay with an extra param
  var filter = createAudioNode(ac, "Delay", FeedbackCombFilter.params, config.maxDelay);
  filter.resonance = feedback.gain;
  filter.connect(feedback);
  feedback.connect(filter);
  return filter.update(config);
}
FeedbackCombFilter.params = ["delayTime", "resonance"];
FeedbackCombFilter.defaults = {
  maxDelay: 1,
  delayTime: 0.1,
  resonance: 0.5
};

// # Pluck synth
function Pluck(ac, config) {
  var pluck = instrument(ac, {
    noise: [Noise, "envelope"],
    envelope: [GainEnvelope, "combFilter"],
    combFilter: [FeedbackCombFilter, "amp"],
    amp: [Gain, "output"]
  }).update(config);

  pluck.trigger = function (freq, time, dur) {
    var delay = 1 / freq;
    pluck.combFilter.delayTime.setValueAtTime(delay, time);
    pluck.envelope.trigger(time);
  };
  return pluck;
}

Pluck.defaults = {
  noise: {
    type: "white"
  },
  envelope: {
    attack: 0.1,
    decay: 0.1
  },
  combFilter: {
    delayTime: 0.2,
    resonance: 0.9
  }
};

// # Oscillator Bank
var conn = function conn(src, dest) {
  src.connect(dest);
  return src;
};

/**
 * Create a OscBank
 */
function OscBank(ac, ratios, config) {
  if (!ratios) throw Error("OscBank requires an array 'ratios' in constructor");

  // Setup internal state
  var state = Object.assign({}, OscBank.defaults, config);
  initState(state, ratios);

  // Create the audio nodes
  var output = Gain(ac);
  var amps = ratios.map(function (_) {
    var amp = conn(Gain(ac), output);
    return amp;
  });
  var oscs = amps.map(function (gain, i) {
    var osc = conn(Osc(ac), gain);
    osc.type = state.types[i];
    return osc;
  });
  var bank = { output: output, amps: amps, oscs: oscs };

  // API
  bank.connect = function (dest) {
    return conn(output, dest);
  };
  bank.update = function (config, time) {
    if (typeof config === "number" || typeof config === "string") {
      state.frequency = +config;
      updateFrequencies(bank, state, time);
    } else if (config) {
      time = time || ac.currentTime;
      if (config.gains) {
        updateArray(state.gains, config.gains);
        updateGains(bank, state, time);
      }
      if (config.frequency !== undefined) {
        state.frequency = config.frequency;
        updateFrequencies(bank, state, time);
      }
    }
  };
  bank.inspect = function () {
    return state;
  };
  return bank;
}
OscBank.defaults = {
  frequency: 440,
  gains: [0],
  types: ["sine"],
  compensate: true
};

function initState(state, ratios) {
  var gains = state.gains;
  var types = state.types;
  state.gains = ratios.map(function (_, i) {
    return gains[i % gains.length];
  });
  state.types = ratios.map(function (_, i) {
    return types[i % types.length];
  });
  state.ratios = ratios;
}

function updateFrequencies(_ref, _ref2, time) {
  var oscs = _ref.oscs;
  var ratios = _ref2.ratios,
      frequency = _ref2.frequency;

  oscs.forEach(function (osc, i) {
    osc.frequency.setValueAtTime(ratios[i] * frequency, time);
  });
}

function updateGains(_ref3, _ref4, time) {
  var amps = _ref3.amps;
  var gains = _ref4.gains;

  amps.forEach(function (amp, i) {
    if (gains[i] !== undefined) amp.gain.setValueAtTime(gains[i], time);
  });
}

function updateArray(prev, next) {
  if (next) {
    var len = prev.length;
    for (var i = 0; i < len; i++) {
      if (next[i] !== undefined) prev[i] = next[i];
    }
  }
}

// Tonewheel _aka clonewheel_ synth
// This **will be** an simple model of a Hammond B3 organ. Reproducing the sound
// of that instrument is a complex task, I"ll only recreate a very simplified
// model. Any sonic resemblance with the original is just coincidence.

// **References**

// https://teichman.org/blog/2011/05/roto.html
// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
// http://www.dairiki.org/HammondWiki/OriginalHammondLeslieFaq
// http://www.stefanv.com/electronics/hammond_drawbar_science.html

// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
var RATIOS = [0.5, 1.498823530, 1, 2, 2.997647060, 4, 5.040941178, 5.995294120, 8];

// ## Drawbars

// The sound on a tonewheel Hammond organ is varied through the manipulation of
// drawbars. A drawbar is a metal slider that controls the volume of a
// particular sound component, in a similar way to a fader on an audio mixing
// board. As a drawbar is incrementally pulled out, it increases the volume of
// its sound. When pushed all the way in, the volume is decreased to zero

// ## Presets
// http://www.dairiki.org/HammondWiki/PopularDrawbarRegistrations
var PRESETS = {
  gospel: preset("88 8000 008"),
  blues: preset("88 8800 000"),
  bluesB: preset("88 5324 588"),
  booker: preset("88 8630 000"),
  onions: preset("80 8800 008"),
  smith: preset("88 8000 000"),
  mcgriff: preset("86 8600 006"),
  errol: preset("80 0008 888"),
  genesis: preset("33 6866 330")
};

function preset(str) {
  return (str.replace(/[^12345678]/g, "") + "000000000").slice(0, 9).split("").map(function (n) {
    return Math.abs(+n / 8);
  });
}

// ## Instrument
function Tonewheel(ac, config) {
  config = Object.assign({}, Tonewheel.defaults, config);
  // Tonewheel instrument output
  var tw = instrument(ac, {
    bank: [OscBank(ac, RATIOS), "envelope"],
    envelope: [GainEnvelope, "amp"],
    amp: [Gain, "output"]
  }).update(config);

  // API
  tw.trigger = function (freq, time, dur) {
    tw.bank.update(freq, time);
    tw.envelope.trigger(time, dur);
    return tw;
  };

  return tw;
}
Tonewheel.defaults = {
  bank: {
    gains: PRESETS["genesis"],
    types: ["sine"]
  },
  amp: {
    gain: 0.8
  }
};

// Kit

exports.Gain = Gain;
exports.GainEnvelope = GainEnvelope;
exports.Noise = Noise;
exports.Sample = Sample;
exports.Pulse = Pulse;
exports.VCA = VCA;
exports.VCO = VCO;
exports.VCF = VCF;
exports.Kick = Kick;
exports.Snare = Snare;
exports.Hat = Hat;
exports.Cowbell = Cowbell;
exports.Conga = Conga;
exports.Tom = Tom;
exports.MonoSynth = MonoSynth;
exports.Pluck = Pluck;
exports.Tonewheel = Tonewheel;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=synth-kit.js.map
