// # Voltage Controlled Filter
import { createAudioNode, triggerAdsr } from "../synth"

// A voltage controlled filter is a BiquadFilter with a
// AD (attack-decay) envelope connected to it's frequency

/**
 * Create a VCF
 */
export default function VCF (ac, state) {
  const filter = createAudioNode(ac, "BiquadFilter", VCF.params)
  // set the default parameters so plug work with them
  filter.attack = 0.01
  filter.decay = 0.1
  filter.octaves = 2

  filter.trigger = function (time, dur) {
    if (!time) time = ac.currentTime
    this.base = this.frequency.value
    this.peak = this.base * this.octaves
    const release = triggerAdsr(time, filter.frequency, filter)
    if (dur) release(time + dur)
    return release
  }
  return filter.update(state)
}
VCF.params = ["type", "frequency", "detune", "Q",
  "attack", "decay", "octaves"]
VCF.defaults = {
  type: "lowpass",
  frequency: 880,
  attack: 0.1,
  decay: 0.5,
  octaves: 2
}
