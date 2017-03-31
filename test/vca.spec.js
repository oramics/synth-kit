/* global AudioContext */
require("web-audio-test-api")
const { VCA } = require("../lib/index")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("VCA", () => {
  test("state", () => {
    const ac = new AudioContext()
    const vca = VCA(ac)
    expect(vca.state).toEqual({
      gain: 0.8,
      envelope: {attack: 0.01, release: 0.2}
    })
  })
})
