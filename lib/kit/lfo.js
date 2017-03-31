import { update, connectWith } from "../core"
import Osc from "./osc"
import Gain from "./gain"

/**

 * Low Frequency Oscillator
 */
export default function LFO (ac, state) {
  const lfo = Osc(ac)
  lfo.amp = Gain(ac)
  lfo.rate = lfo.frequency
  lfo.amount = lfo.amp.gain
  lfo.update = (state) => update(lfo, state)
  lfo.connect(lfo.amp)
  lfo.connect = connectWith(lfo.amp, lfo)
  update(lfo, LFO.state)
}
LFO.state = {
  type: "sine",
  // the lfo frequency
  rate: 3,
  // the lfo intensity
  amount: 0.5
}
