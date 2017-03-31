/* global AudioContext */
const SynthKit = require("..")
const ac = new AudioContext()
const { h, app } = require("hyperapp")
const hyperx = require("hyperx")
const html = hyperx(h)

const viewSynth = (name, synth, trigger) => html`
  <div>
    <h2>${name}</h2>
    <button onclick=${(e) => trigger()}>Trigger</button>
    <pre><code>${synth ? JSON.stringify(synth.state, null, 2) : ""}
    </code></pre>
  </di>
`

app({
  model: {
    MonoSynth: SynthKit.MonoSynth(ac).connect(true),
    Kick: SynthKit.Kick(ac).connect(true),
    Snare: SynthKit.Snare(ac).connect(true)
  },
  actions: {
    MonoSynth: (model) => {
      console.log("AMP", model.MonoSynth.amp)
      model.MonoSynth.trigger(440, 0, 0.2)
    },
    Kick: (model) => {
      model.Kick.trigger()
    },
    Snare: (model) => {
      model.Snare.trigger()
    }
  },
  view: (model, actions) => html`
    <div>
      <h1>SynthKit examples</h1>
      ${viewSynth("Snare", model.Snare, actions.Snare)}
      ${viewSynth("Kick", model.Kick, actions.Kick)}
      ${viewSynth("MonoSynth", model.MonoSynth, actions.MonoSynth)}
    </div>
  `
})

// const mono = SynthKit.MonoSynth(ac)
// console.log(mono.state)
// mono.trigger(60)
