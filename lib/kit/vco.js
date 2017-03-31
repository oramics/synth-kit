import { plug, connectWith } from "../core"
import Osc from "./osc"
import LFO from "./lfo"

/**
 * Voltage Controlled Oscillator. An oscillator with the detune parameter
 * modulated by a low frequency oscillator
 */
export default function VCO (ac, state) {
  state = Object.assign({}, VCO.state, state)
  const vco = Osc(ac, state)
  vco.modulator = LFO(ac, state.modulator)
  plug(vco, "detune", vco.modulator)

  /**
   * Connect to a node
   * @chainable
   * @param {AudioNode} destination
   * @return {VCO} this
   */
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
