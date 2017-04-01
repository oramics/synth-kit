// # Low Frequency Oscillator
import { update, setOutput } from "../core"
import Osc from "./osc"
import Gain from "./gain"

// A LFO is an oscillator connected to a gain to allow
// configurable output values between -n and n

// It's designed to modulate another property

/**
 * Create an LFO
 */
export default function LFO (ac, state) {
  const lfo = Osc(ac)
  lfo.amp = Gain(ac)
  lfo.gain = lfo.amp.gain
  lfo.connect(lfo.amp)
  setOutput(lfo, lfo.amp)
  return update(lfo, state)
}
LFO.params = ["type", "frequency", "gain"]
