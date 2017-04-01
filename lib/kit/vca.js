// Voltage controlled amplified
import Gain from "./gain"

/**
 * Create a VCA
 */
export default function VCA (ac, config) {
  const vca = Gain(ac, config)
  return vca
}
