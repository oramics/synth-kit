/* global AudioContext */
require("web-audio-test-api")
const { VCA } = require("../lib/synths")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("synth-kit -- Synths", () => {
  test("VCA", () => {
    const ac = new AudioContext()
    const vca = VCA(ac)
    expect(vca.state).toEqual({ gain: 0 })
  })
})
