# synth-kit

> Synthesizers construction kit for Web Audio API

A collection of ready-to-use Web Audio instruments:

```js
import { Kick } from 'synth-kit'
const ac = new AudioContext()

// create a Kick instrument and connect it to the audio context destination
const kick = Kick(ac).connect(true)
// trigger the kick
kick.trigger()
```

Simple API:

```js
import { MonoSynth, after } from 'synth-kit'

const mono = MonoSynth(ac, {
  oscillator: {
    type: 'square'
  },
  filter: {
    type: 'lowpass',
    frequency: 400
  }
}).connect(true)

mono.trigger('C4')
mono.filter.frequency.value = 500
```

***Work in progress**
