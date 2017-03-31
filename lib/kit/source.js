import { update } from "../core"

export default function Source (ac, buffer, state) {
  const source = update(ac.createBufferSource(), state, Source.state)
  source.buffer = buffer
  return source
}
Source.state = {
  detune: 0,
  loop: false,
  loopStart: undefined,
  loopEnd: undefined,
  playbackRate: 1
}
