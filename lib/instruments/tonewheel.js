// Tonewheel _aka clonewheel_ synth
import { instrument } from "../synth"
import Gain from "../kit/gain"
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
  gospel: preset("88 8000 008"),
  blues: preset("88 8800 000"),
  bluesB: preset("88 5324 588"),
  booker: preset("88 8630 000"),
  onions: preset("80 8800 008"),
  smith: preset("88 8000 000"),
  mcgriff: preset("86 8600 006"),
  errol: preset("80 0008 888"),
  genesis: preset("33 6866 330"),
}

function preset (str) {
  return (str.replace(/[^12345678]/g, "") + "000000000")
    .slice(0, 9)
    .split("")
    .map((n) => Math.abs(+n / 8))
}

// ## Instrument
export default function Tonewheel (ac, config) {
  config = Object.assign({}, Tonewheel.defaults, config)
  // Tonewheel instrument output
  const tw = instrument(ac, {
    bank: [OscBank(ac, RATIOS), "envelope"],
    envelope: [GainEnvelope, "amp"],
    amp: [Gain, "output"],
  }).update(config)

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
    gains: PRESETS["genesis"],
    types: ["sine"],
  },
  amp: {
    gain: 0.8,
  }
}
