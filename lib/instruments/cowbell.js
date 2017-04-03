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
import { instrument } from "../synth"
import Gain from "../kit/gain"
import Osc from "../kit/osc"
import GainEnvelope from "../kit/gain-envelope"
import Filter from "../kit/filter"

/**
 * Create a Cowbell
 * @param {AudioContext} context
 * @param {Object} config
 * @return {AudioNode} the instrument
 * @example
 * const cowbell = Cowbell(ac)
 * cowbell.trigger(ac.currentTime + 1)
 */
export default function Cowbell (ac, state) {
  if (state) state = Object.assign({}, Cowbell.defaultState, state)
  else state = Cowbell.defaultState

  const cowbell = instrument(ac, {
    osc1: [ Osc, "env1" ],
    env1: [ GainEnvelope, "filter" ],
    osc2: [ Osc, "env2" ],
    env2: [ GainEnvelope, "filter" ],
    filter: [ Filter, "amp" ],
    amp: [ Gain, "output" ]
  }).update(state)

  cowbell.trigger = (time) => {
    cowbell.env1.trigger(time)
    cowbell.env2.trigger(time)
  }
  return cowbell
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
    sustain: 0,
  },
  osc2: {
    type: "triangle",
    frequency: 845,
  },
  env2: {
    gain: 0.8,
    attack: 0.1,
    decay: 0.1,
  },
  filter: {
    type: "bandpass",
    frequency: 2640,
    Q: 3.5,
  },
  amp: {
    gain: 0.2
  },
}
