import { connectWith, update, plug } from "./core"
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

/**
 * Voltage Controlled Filter
 */
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
export function VCA (ac, state) {
  state = Object.assign({}, VCA.state, state)
  const vca = Gain(ac, state)
  vca.envelope = GainEnvelope(ac, state.envelope)
  vca.connect(vca.envelope)

  // API
  vca.state = state
  vca.connect = connectWith(vca.envelope, vca)
  vca.trigger = vca.envelope.trigger
  return vca
}
VCA.state = {
  gain: 0.8,
  envelope: GainEnvelope.state
}
