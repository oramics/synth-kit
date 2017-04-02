// # Low Frequency Oscillator
import { createAudioNode } from "../synth"
import Gain from "./gain"

// A LFO is an oscillator connected to a gain to allow
// configurable output values between -n and n

// It's designed to modulate another property

/**
 * Create an LFO
 */
export default function LFO (ac, state) {
  const lfo = createAudioNode(ac, "Oscillator", LFO.params)
  lfo.amp = Gain(ac)
  lfo.gain = lfo.amp.gain
  lfo.connect(lfo.amp)
  lfo.connect = lfo.amp.bind.connect(lfo.amp)
  return lfo.update(state)
}
LFO.params = ["type", "frequency", "gain"]
