// # Source
import { createAudioNode } from "../synth"

// Create a node that plays audio from a buffer

/**
 * Create a (Buffer)Source node
 */
export default function Source (ac, buffer, state) {
  const source = createAudioNode(ac, "BufferSource", Source.params)
  source.update(state)
  source.buffer = buffer
  return source
}

Source.params = ["detune", "loop", "loopStart", "loopEnd", "playbackRate"]
