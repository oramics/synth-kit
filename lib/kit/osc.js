import { update } from "../core"

/**
 * Create an Oscillator
 * A oscillator is always started
 */
export default function Osc (ac, state) {
  const osc = update(ac.createOscillator(), state, Osc.state)
  if (osc.state.start !== false) osc.start(osc.state.start || 0)
  return osc
}
Osc.state = {
  type: "sine",
  frequency: 440,
  detune: 0
}
