import { connectWith } from "../core"
import Gain from "./gain"
import GainEnvelope from "./gain-envelope"

/**
 * Voltage controlled amplified
 */
export default function VCA (ac, state) {
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
