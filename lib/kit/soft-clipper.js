// # SoftClipper
import { createAudioNode } from "../synth"
import WaveShaper from "./wave-shaper"

// ## Structure
// Input -> Gain -> WaveShaper -> Output

let curve = null

/**
 * Create a SoftClipper
 */
export default function SoftClipper (ac, state) {
  const clipper = createAudioNode(ac, "Gain", SoftClipper.params)
  clipper.drive = clipper.gain
  if (!curve) curve = createSoftClipperCurve()
  const shaper = WaveShaper(ac, curve, "2x")
  clipper.connect(shaper)
  clipper.connect = shaper.connect.bind(shaper)
  return clipper.update(state)
}
SoftClipper.params = ["drive"]

function createSoftClipperCurve () {
  const n = 65536
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i - (n / 2)) / (n / 2)
    curve[i] = Math.tanh(x)
  }
  return curve
}
