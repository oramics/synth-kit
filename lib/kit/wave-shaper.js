// # WaveShaper

/**
 * Create a WaveShaper node.
 */
export default function WaveShaper (ac, curve, oversample = "none") {
  const shaper = ac.createWaveShaper()
  shaper.curve = curve
  shaper.oversample = oversample
  return shaper
}
