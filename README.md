# synth-kit
[![Travis CI](https://img.shields.io/travis/oramics/synth-kit/master.svg)](https://travis-ci.org/oramics/synth-kit)
[![Codecov](https://img.shields.io/codecov/c/github/oramics/synth-kit/master.svg)](https://codecov.io/gh/oramics/synth-kit)
[![CDNJS](https://img.shields.io/cdnjs/v/ash-vm.svg?colorB=ff69b4)](https://cdnjs.com/libraries/ash-vm)
[![npm](https://img.shields.io/npm/v/ash-vm.svg?colorB=ff69b4)](https://www.npmjs.org/package/ash-vm)


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

**Work in progress**

## Why

- Easy to use: consistent and small API
- Modular: a lot of connectable modules
- Easy to understand: [heavily annotated source code](https://oramics.github.io/synth-kit/literate/lib/index.js.html) with lot of links


## References

## Inspiration and references

- Of course, the synth secrets tutorial was the beginning of all: https://github.com/micjamking/synth-secrets (that's a easy to read version). Thanks Gordon Reid (here it is an [awesome PDF version](http://www.mediafire.com/file/7w2dcsqmkbeduea/Synth+Secrets+Complete.pdf))
- Vincent made some nice 808 drum synsthesis: https://github.com/vincentriemer/io-808
- Percussion synthesis tutorial: http://www.cim.mcgill.ca/~clark/nordmodularbook/nm_percussion.html
- Sound Design in Web Audio its an awesome two part blog post: http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-1/ and http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-2/
- There are a lot of resources about synthesis, here is a nice one: https://www.gearslutz.com/board/electronic-music-instruments-electronic-music-production/460283-how-do-you-synthesize-808-ish-drums.html


## License

MIT License
