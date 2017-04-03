// # Mini synth

// The `Mini` synth is a port of the Minimoog synth architecture. Appart from
// that, any resemblance with the sound of the original is only coincidence ;-)

// The Minimoog is monophonic (only one note can be played at a time) and its
// three-oscillator design gave it its famous fat sound.

// **References**
// - https://en.wikipedia.org/wiki/Minimoog
// - http://www.synthark.org/Moog/Minimoog.html

// ## Overview

// To produce a sound, the musician would first choose a sound shape to be
// generated from the VCO(s) and/or the type of noise (white or pink). The
// signals are routed through the mixer to the VCF (voltage-controlled filter),
// where harmonic content can be modified and resonance added. The filtered
// signal is then routed to the voltage-controlled amplifier (VCA), where its
// contour is shaped by a dedicated ADS (attack, decay/release, sustain)
// envelope generator. The voltage-controlled filter (VCF) and
// voltage-controlled amplifier (VCA) each have their own ADSD envelope
// generator

 // The envelope generators do not re-trigger unless all notes are lifted before
 // the next note is played, an important characteristic which allows phrasing.

 export default function Mini (ac, config) {
   // TODO: nothing yet
 }
