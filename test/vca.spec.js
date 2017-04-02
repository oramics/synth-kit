/* global AudioContext */
require("web-audio-test-api")
const { VCA } = require("../lib/index")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("VCA", () => {
  test("inspect", () => {
    const ac = new AudioContext()
    const vca = VCA(ac)
    expect(vca.inspect()).toEqual({
      gain: 1
    })
  })
})
