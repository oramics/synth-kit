# synth-kit
[![Travis CI](https://img.shields.io/travis/oramics/synth-kit/master.svg)](https://travis-ci.org/oramics/synth-kit)
[![Codecov](https://img.shields.io/codecov/c/github/oramics/synth-kit/master.svg)](https://codecov.io/gh/oramics/synth-kit)
[![CDNJS](https://img.shields.io/cdnjs/v/synth-kit.svg?colorB=ff69b4)](https://cdnjs.com/libraries/synth-kit)
[![npm](https://img.shields.io/npm/v/synth-kit.svg?colorB=ff69b4)](https://www.npmjs.org/package/synth-kit)


> Synthesizers construction kit for Web Audio API

**Work in progress**

`synth-kit` is a small (8Kb minified, 3Kb minified and gzipped) collection of ready-to-use Web Audio instruments:

```js
import { Kick } from 'synth-kit'
const ac = new AudioContext()

// create a Kick instrument and connect it to the audio context destination
const kick = Kick(ac).connect(true)
// trigger the kick
kick.trigger()
```

**Features**

- Sound reasonably good
- No setup: nice defaults, no config
- Easy and simple API
- Extensible and flexible

## SynthKit

#### Percussion instruments

- [Kick](https://oramics.github.io/synth-kit/literate/kick)
- [Snare](https://oramics.github.io/synth-kit/literate/snare)
- [Hat](https://oramics.github.io/synth-kit/literate/hat)
- [Cowbell](https://oramics.github.io/synth-kit/literate/cowbell)
- [Conga](https://oramics.github.io/synth-kit/literate/cowbell)
- [Tom](https://oramics.github.io/synth-kit/literate/tom)

#### Melodic instruments

- [MonoSynth](https://oramics.github.io/synth-kit/literate/monosynth): One oscillator subtractive synth

#### Effects

#### Components

- [Sample](https://oramics.github.io/synth-kit/literate/sample)
- [Noise](https://oramics.github.io/synth-kit/literate/noise)
- [LFO](https://oramics.github.io/synth-kit/literate/lfo)

## Usage

`synth-kit` is designed to be very easy to use: install the library, create an instrument and trigger it.

#### Install

**Node**

With npm: `npm i --save synth-kit` or with yarn: `yarn add --save synth-kit`

ES6:

```js
import { Clave } from "synth-kit"
const ac = new AudioContext()
const clave = Clave(ac).connect(true)
clave.trigger()
```

ES5:

```js
const SynthKit = require('synth-kit')
const ac = new AudioContext()
const clave = new SynthKit.Clave(ac).connect(true)
clave.trigger()
```

**Browser**


```html
<script src="https://oramics.github.io/synth-kit/dist/synth-kit.js"></script>
<script>
  // SynthKit is exported as global
  const ac = new AudioContext()
  const kick = SynthKit.Kick(ac).connect(true)
  kick.trigger()
</script>
```

#### Create instruments

Call the function with an audio context. The `connect` function is chainable and accepts `true` to connect to the AudioContext's destination:

```js
import { MonoSynth } from 'synth-kit'

const mono = MonoSynth(ac).connect(true)
// trigger signature for melodic instruments: (midi, time, duration)
mono.trigger(440, ac.currentTime, 0.5)
mono.trigger(62, ac.currentTime + 1, 0.5)
```

#### Trigger

Trigger the attack/release envelope of an instrument with the `trigger` function:

```js
import { Snare } from 'synth-kit'

const snare = Snare(ac).connect(true)
snare.trigger()
```

Perussion instruments accept `time` as `trigger` arguments:

```js
snare.trigger(ac.currentTime + 1)
```

Melodic instruments accept `frequency, time, duration` as `trigger` arguments:

```js
import { MonoSynth } from 'synth-kit'

const mono = MonoSynth(ac).connect(true)
mono.trigger(440, ac.currentTime, 0.5)
```

**Re-triggerable**

You can trigger an instrument any number of times:

```js
mono.trigger(440, ac.currentTime, 0.5)
mono.trigger(880, ac.currentTime + 1, 0.5)
```

You can use `Sample` to get a re-triggerable buffer source:

```js
import { Sample } from 'synth-kit'

fetch("snare.wav").then(decodeAudioData).then(buffer => {
  sample = Sample(ac, buffer)
  sample.trigger()
  sample.trigger(ac.currentTime + 1)
})
```

**Attack/release**

Using a melodic instrument, you can trigger the attack and release phases at different moments:

```js
const triggerRelease = mono.trigger(440, ac.currentTime)
triggerRelease(ac.currentTime + 1)
```

#### Polyphony

All instruments are monophonic by default. You can create a polyphonic instrument with `polyphonc` function:

```js
import { DuoSynth, polyphonic } from 'synth-kit'

const synth = polyphonic(ac, 16, DuoSynth)
const freqs = [400, 500, 600, 700]
freqs.forEach((note, i) => synth.trigger(note, ac.currentTime + i))
```

#### Update parameters

All instruments have an `update` function:

```js
const duo = DuoSynth(ac)
duo.update({
  filter: {
    frequency: 800
  },
  amp: {
    gain: 0.5
  }
})
duo.trigger(440)
```

And an `inspect` function:

```js
console.log(duo.inspect())
// console.log output:
{
  osc1: {
    frequency: 440,
    ...
  },
  osc2: {
    frequency: 880,
    ...
  },
  filter: {
    ...
  },
  amp: {
    gain: 0.6
  }
}
```

For fine-grained control, use the audio nodes directly:

```js
const duo = DuoSynth(ac)
duo.filter.frequency.linearRampToValueAtTime(600, ac.currentTime + 1)
```


## References

- Of course, the synth secrets tutorial was the beginning of all: https://github.com/micjamking/synth-secrets (that's a easy to read version). Thanks Gordon Reid (here it is an [awesome PDF version](http://www.mediafire.com/file/7w2dcsqmkbeduea/Synth+Secrets+Complete.pdf))
- Vincent made some nice 808 drum synsthesis: https://github.com/vincentriemer/io-808
- Percussion synthesis tutorial: http://www.cim.mcgill.ca/~clark/nordmodularbook/nm_percussion.html
- Sound Design in Web Audio its an awesome two part blog post: http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-1/ and http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-2/
- There are a lot of resources about synthesis, here is a nice one: https://www.gearslutz.com/board/electronic-music-instruments-electronic-music-production/460283-how-do-you-synthesize-808-ish-drums.html


## License

MIT License
