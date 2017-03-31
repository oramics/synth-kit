import { connectWith, connect, update, plug } from "./core"
import { Osc, Filter, Gain, GainEnvelope } from "./nodes"

/**
 * Low Frequency Oscillator
 */
export function LFO (ac, state) {
  const lfo = Osc(ac)
  lfo.amp = Gain(ac)
  lfo.rate = lfo.frequency
  lfo.amount = lfo.amp.gain
  lfo.update = (state) => update(lfo, state)
  lfo.connect(lfo.amp)
  lfo.connect = connectWith(lfo.amp, lfo)
  update(lfo, LFO.state)
  console.log("JODER", lfo.frequency.value, lfo.amp.gain.value)
}
LFO.state = {
  type: "sine",
  // the lfo frequency
  rate: 3,
  // the lfo intensity
  amount: 0.5
}

/**
 * Voltage Controlled Oscillator
 */
export function VCO (ac, state) {
  state = Object.assign({}, VCO.state, state)
  const vco = Osc(ac, state)
  vco.modulator = LFO(ac, state.modulator)
  plug(vco, "detune", vco.modulator)
  vco.connect = connectWith(vco, vco)
  return vco
}
VCO.state = {
  type: "sawtooth",
  frequency: 440,
  detune: 0,
  modulator: {
    rate: 5,
    amount: 1,
  }
}

export function VCF (ac, state, envState) {
  if (!envState) envState = state
  const filter = Filter(ac, state)
  // filter.envelope = FilterEnvelope(state)
  // filter.trigger = filter.envelope.trigger
  filter.trigger = () => {
    // TODO
  }
  console.log("FILTER", filter, filter.state)
  return filter
}

/**
 * Voltage controlled amplified
 */
export function VCA (ac, state, envState) {
  if (!envState) envState = state
  const vca = Gain(ac, state)
  vca.envelope = GainEnvelope(ac, envState)
  vca.connect(vca.envelope)
  // add connect function
  vca.connect = connectWith(vca.envelope, vca)
  // add trigger function
  vca.trigger = vca.envelope.trigger
  return vca
}

export function MonoSynth (ac, state) {
  if (!state) state = MonoSynth.defaults
  else state = Object.assign({}, MonoSynth.defaults, state)

  // Create the synth
  const synth = {
    state,
    oscillator: VCO(ac, state.oscillator),
    filter: VCF(ac, state.filter),
    amp: VCA(ac, state, state.envelope),
  }
  connect(synth.oscillator, synth.filter, synth.amp)

  // Synth API
  synth.connect = connectWith(synth.amp, synth)
  synth.trigger = (freq, time, dur) => {
    time = time || ac.currentTime
    if (freq) synth.oscillator.frequency.setValueAtTime(freq, time)
    synth.amp.trigger(time, dur)
  }
  return synth
}
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  filter: {
    type: "lowpass",
    frequency: 4000,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3,
  },
  gain: 0.5
}
