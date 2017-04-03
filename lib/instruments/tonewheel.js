// Tonewheel _aka clonewheel_ synth
import { instrument } from "../synth"
import Gain from "../kit/gain"
import Pulse from "../kit/pulse"
import GainEnvelope from "../kit/gain-envelope"
import OscBank from "../kit/osc-bank"

// This **will be** an simple model of a Hammond B3 organ. Reproducing the sound
// of that instrument is a complex task, I"ll only recreate a very simplified
// model. Any sonic resemblance with the original is just coincidence.

// **References**

// https://teichman.org/blog/2011/05/roto.html
// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
// http://www.dairiki.org/HammondWiki/OriginalHammondLeslieFaq
// http://www.stefanv.com/electronics/hammond_drawbar_science.html

// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
const RATIOS = [0.5, 1.498823530, 1, 2, 2.997647060, 4, 5.040941178, 5.995294120, 8]

// ## Drawbars

// The sound on a tonewheel Hammond organ is varied through the manipulation of
// drawbars. A drawbar is a metal slider that controls the volume of a
// particular sound component, in a similar way to a fader on an audio mixing
// board. As a drawbar is incrementally pulled out, it increases the volume of
// its sound. When pushed all the way in, the volume is decreased to zero

// ## Presets
// http://www.dairiki.org/HammondWiki/PopularDrawbarRegistrations
const PRESETS = {
  gospel: toState("88 8000 008"),
  blues: toState("88 8800 000"),
  bluesB: toState("88 5324 588"),
  booker: toState("88 8630 000"),
  onions: toState("80 8800 008"),
  smith: toState("88 8000 000"),
  mcgriff: toState("86 8600 006"),
  errol: toState("80 0008 888"),
  genesis: toState("33 6866 330"),
}

// Given a preset, return a state fragment
function toState (preset) {
  if (preset) {
    const norm = (preset.replace(/[^012345678]/g, "") + "000000000").slice(0, 9)
    const gains = norm.split("").map((n) => Math.abs(+n / 8))
    return {
      bank: { gains }
    }
  }
}

// ## Instrument
export default function Tonewheel (ac, preset) {
  preset = preset ? toState(preset) : PRESETS["smith"]
  const state = Object.assign({}, Tonewheel.defaults, preset)
  // Tonewheel instrument output
  const tw = instrument(ac, {
    bank: [OscBank(ac, RATIOS), "envelope"],
    envelope: [GainEnvelope, "amp"],
    click: [Pulse, "output"],
    amp: [Gain, "output"],
  }).update(state)

  tw.setPreset = (preset, time) => {
    const newState = PRESETS[preset] || toState(preset)
    tw.update(newState)
  }

  // API
  tw.trigger = (freq, time, dur) => {
    tw.bank.update(freq, time)
    tw.envelope.trigger(time, dur)
    return tw
  }

  return tw
}
Tonewheel.defaults = {
  bank: {
    types: ["sine"],
  },
  amp: {
    gain: 0.8,
  }
}
