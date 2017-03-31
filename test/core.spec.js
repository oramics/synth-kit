require("web-audio-test-api")
const { context } = require("..")

describe("synth-kit -- Core", () => {
  test("context returns an AudioContext", () => {
    const ctx = context()
    expect(ctx).not.toBeNull()
  })
})
