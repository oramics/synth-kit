// # Buffer (Mono)

/**
 * Create a MonoBuffer using a generator function
 */
export default function MonoBuffer (ac, samples, generator, inverse = false) {
  const buffer = ac.createBuffer(1, samples, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) {
    data[i] = generator(inverse ? samples - i : i)
  }
  return buffer
}
