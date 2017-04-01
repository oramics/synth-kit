// # Oscillator
import { createAudioNode } from "../synth"

/**
 * Create an Oscillator
 * A oscillator is always started
 */
export default function Osc (ac, state, start = true) {
  const osc = createAudioNode(ac, "Oscillator", Osc.params)
  if (start) osc.start(+start)
  return osc
}
Osc.params = ["type", "frequency", "detune"]
