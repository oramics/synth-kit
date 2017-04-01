// # Gain
import { createAudioNode } from "../synth"

// Gain produces changes in volume

/**
 * Create a Gain node.
 */
export default function Gain (ac, state) {
  return createAudioNode(ac, "Gain", Gain.params).update(state)
}
Gain.params = ["gain"]
