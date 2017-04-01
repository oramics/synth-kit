/* global AudioContext */
const SynthKit = require("..")
const ac = new AudioContext()
const { h, app } = require("hyperapp")
const hyperx = require("hyperx")
const html = hyperx(h)

const memoize = (fn) => () => {
  console.log("MEMO", fn)
  fn.value = fn.value || fn()
  return fn.value
}

const viewState = (name, model) =>
  model[name] ? JSON.stringify(model[name].state, null, 2) : ""

const viewSynth = (name, model, trigger) => html`
  <div>
    <h2>${name}</h2>
    <button onclick=${(e) => trigger(name)}>Trigger</button>
    <pre><code>${viewState(name, model)}</code></pre>
  </di>
`

app({
  model: {
    MonoSynth: memoize(() => SynthKit.MonoSynth(ac).connect(true)),
    Kick: memoize(() => SynthKit.Kick(ac).connect(true)),
    Snare: memoize(() => SynthKit.Snare(ac).connect(true)),
    Cowbell: memoize(() => SynthKit.Cowbell(ac).connect(true))
  },
  actions: {
    melodic: (model, name) => {
      model[name]().trigger(440, 0, 0.5)
    },
    perc: (model, name) => {
      model[name]().trigger()
    }
  },
  view: (model, actions) => html`
    <div>
      <h1>SynthKit examples</h1>
      ${viewSynth("Cowbell", model, actions.perc)}
      ${viewSynth("Snare", model, actions.perc)}
      ${viewSynth("Kick", model, actions.perc)}
      ${viewSynth("MonoSynth", model, actions.melodic)}
    </div>
  `
})

// const mono = SynthKit.MonoSynth(ac)
// console.log(mono.state)
// mono.trigger(60)
