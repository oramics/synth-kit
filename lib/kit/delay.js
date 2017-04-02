// # Delay
import { createAudioNode } from "../synth"

// Delay a signal

/**
 * Create a Delay node.
 */
export default function Delay (ac, maxDelay, config) {
  return createAudioNode(ac, "Delay", Delay.params, maxDelay).update(config)
}
Delay.params = ["delayTime"]
