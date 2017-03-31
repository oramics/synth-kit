import { connected, update, plug } from "./core"
import { Osc, Filter, Gain, GainEnvelope, FilterEnvelope } from "./nodes"

/**
 * Low Frequency Oscillator
 */
export function LFO (ac, state) {
  const lfo = Osc(ac)
  lfo.amp = Gain(ac)
  lfo.rate = lfo.osc.frequency
  lfo.amount = lfo.amp.gain
  lfo.update = (state) => update(lfo, state)
  return update(lfo, LFO.state)
}
LFO.state = {
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
  plug(vco, "frequency", vco.modulator)
  vco.start()
  vco.modulator.start()
  return vco
}
VCO.state = {
  type: "sawtooth",
  frequency: 440,
  detune: 0,
  modulator: {
    rate: 2,
    amount: 0.2,
  }
}

export function VCF (ac, state) {
  const filter = Filter(ac, state)
  filter.envelope = FilterEnvelope(state)
  filter.trigger = filter.envelope.trigger
  return filter
}

/**
 * Voltage controlled amplified
 */
export function VCA (ac, state, envState) {
  if (envState) envState = state
  const vca = Gain(ac, state)
  vca.envelope = GainEnvelope(ac, envState)
  vca.trigger = vca.envelope.trigger
}

export function MonoSynth (ac, state) {
  if (!state) state = MonoSynth.defaults
  else state = Object.assign({}, MonoSynth.defaults, state)

  const synth = connected({
    oscillator: VCO(ac, state.oscillator),
    filter: VCF(ac, state.filter),
    amp: VCA(ac, state, state.envelope),
  }, ["oscillator", "filter", "envelope", "amp"])
  synth.state = state

  return synth
}
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3,
  },
  gain: 0.5
}
