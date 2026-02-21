class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.isMuted = false;
        this.bgmAudio = null;
        // Sequencer properties
        this.isPlaying = false;
        this.tempo = 100; // BPM (Tech Sprint)
        this.lookahead = 25.0; // milliseconds
        this.scheduleAheadTime = 0.1; // seconds
        this.nextNoteTime = 0.0;
        this.current16thNote = 0;
        this.timerID = null;
        this.notesInQueue = [];
    }

    init() {
        if (!this.audioCtx && typeof window !== 'undefined') {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    setMute(mute) {
        this.isMuted = mute;
        if (this.bgmAudio) {
            this.bgmAudio.muted = mute;
        }
        if (this.audioCtx) {
            if (mute) {
                this.audioCtx.suspend();
            } else {
                this.audioCtx.resume();
            }
        }
    }

    // --- Synthesizers ---

    playTone(frequency, duration, type = 'sine', startTime = 0) {
        if (this.isMuted || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime + startTime;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration + 0.1);
    }

    playKick(time) {
        if (this.isMuted) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playSnare(time) {
        if (this.isMuted) return;
        const noiseBuffer = this.createNoiseBuffer();
        const node = this.audioCtx.createBufferSource();
        node.buffer = noiseBuffer;

        const nodeGain = this.audioCtx.createGain();
        nodeGain.gain.setValueAtTime(0.5, time);
        nodeGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        node.connect(nodeGain);
        nodeGain.connect(this.audioCtx.destination);

        node.start(time);

        // Oscillator "tone" underneath
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time);
        oscGain.gain.setValueAtTime(0.2, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.connect(oscGain);
        oscGain.connect(this.audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playHiHat(time) {
        if (this.isMuted) return;
        const noiseBuffer = this.createNoiseBuffer();
        const node = this.audioCtx.createBufferSource();
        node.buffer = noiseBuffer;

        const nodeGain = this.audioCtx.createGain();
        nodeGain.gain.setValueAtTime(0.3, time);
        nodeGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        // High pass filter
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        node.connect(filter);
        filter.connect(nodeGain);
        nodeGain.connect(this.audioCtx.destination);

        node.start(time);
    }

    playBass(time, freq) {
        if (this.isMuted) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.linearRampToValueAtTime(100, time + 0.3);

        gain.gain.setValueAtTime(0.6, time); // Solid volume
        gain.gain.linearRampToValueAtTime(0.4, time + 0.1);
        gain.gain.linearRampToValueAtTime(0, time + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(time);
        osc.stop(time + 0.4);
    }

    playChord(time, freqs) {
        if (this.isMuted) return;
        // Synth pad/chord
        freqs.forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, time);

            // Detune slightly for "lush" feel
            if (i % 2 === 0) osc.detune.value = 3;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1, time + 0.05); // Attack
            gain.gain.linearRampToValueAtTime(0.05, time + 0.3); // Sustain
            gain.gain.linearRampToValueAtTime(0, time + 0.8); // Release

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(time);
            osc.stop(time + 0.9);
        });
    }


    createNoiseBuffer() {
        if (!this.audioCtx) return null;
        const bufferSize = this.audioCtx.sampleRate * 2.0; // 2 seconds
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // --- Sequencer Logic ---

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.current16thNote++;
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
        }
    }

    scheduleNote(beatNumber, time) {
        this.notesInQueue.push({ note: beatNumber, time: time });

        // --- Urgent Electro-Rush Pattern (16 steps) ---
        // Fast, driving rhythm to induce "rush"

        // Kick: 4-on-the-floor driving beat (0, 4, 8, 12) + extra syncopation
        if (beatNumber % 4 === 0) {
            this.playKick(time);
        } else if (beatNumber === 14) {
            // Extra kick at end of loop for momentum
            this.playKick(time);
        }

        // Snare: Driving backbeat on 4 and 12, plus ghost notes
        if (beatNumber === 4 || beatNumber === 12) {
            this.playSnare(time);
        }
        if (beatNumber === 7 || beatNumber === 15) {
            // Ghost snares
            // Note: internal playSnare doesn't support volume arg nicely in current method 
            // but defaults are okay, creates busy texture
            this.playSnare(time);
        }

        // HiHat: Constant 16th note drive (every step)
        // This is key for the "rushed" feeling
        this.playHiHat(time);

        // Open Hat emphasis on off-beats
        if (beatNumber % 4 === 2) {
            // To simulate open hat, we could modify playHiHat but just playing it is fine for now
            // forcing a stronger attack feel
        }

        // Bass: Octave jumping "pump" feel (Sidechain simulation) for urgency
        // Root: F# (approx 92.5Hz)
        const root = 92.50;

        // Driving 8th note bass line
        if (beatNumber % 2 === 0) {
            if (beatNumber === 0 || beatNumber === 8) {
                this.playBass(time, root); // Root
            } else {
                this.playBass(time, root * 2); // Octave up/pop
            }
        }
        // fast 16th fills
        if (beatNumber === 11 || beatNumber === 15) {
            this.playBass(time, root);
        }

        // Chords: Stabs instead of pads. Short and punchy.
        // On the "and" of beats (off-beats) to create ska/dance urgency
        if (beatNumber === 2 || beatNumber === 6 || beatNumber === 10 || beatNumber === 14) {
            // Short stabs (0.1s duration logic would need change in playChord, 
            // but standard playChord has decay. We rely on the accumulation.)
            this.playChord(time, [277.18, 329.63, 415.30]); // F#m upper
        }
    }

    scheduler() {
        if (!this.audioCtx) return;
        // while there are notes that will need to play before the next interval, 
        // schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            this.nextNote();
        }
        if (this.isPlaying) {
            this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
        }
    }

    startProceduralBGM() {
        if (!this.audioCtx) this.init();
        if (this.isPlaying) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isPlaying = true;
        this.current16thNote = 0;
        this.nextNoteTime = this.audioCtx.currentTime + 0.05;
        this.scheduler();
    }

    startBGM(url) {
        // Fallback or replaced by procedural
        this.startProceduralBGM();
    }

    stopBGM() {
        this.isPlaying = false;
        if (this.timerID) clearTimeout(this.timerID);
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }


    playClick() {
        this.init();
        this.playTone(800, 0.1, 'sine');
    }

    playCorrect() {
        this.init();
        this.playTone(523.25, 0.3, 'sine', 0);
        this.playTone(659.25, 0.3, 'sine', 0.1);
        this.playTone(783.99, 0.4, 'sine', 0.2);
    }

    playWrong() {
        this.init();
        this.playTone(185.00, 0.4, 'sawtooth', 0);
        this.playTone(130.81, 0.5, 'triangle', 0.2);
    }

    playWin() {
        this.init();
        const now = this.audioCtx.currentTime;

        // Fanfare: Rapid Arpeggio (Trumpet-like)
        // C4, E4, G4, C5 (doubled for richness)
        const notes = [
            { f: 523.25, t: 0 },    // C4
            { f: 659.25, t: 0.1 },  // E4
            { f: 783.99, t: 0.2 },  // G4
            { f: 1046.50, t: 0.3 }, // C5
        ];

        notes.forEach(n => {
            this.playTone(n.f, 0.4, 'sawtooth', n.t);
            this.playTone(n.f * 1.01, 0.4, 'sawtooth', n.t); // Detuned layer
        });

        // Grand Finale Chord at 0.6s
        // C Major: C4, E4, G4, C5
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle'; // Smoother body for the chord
            osc.frequency.value = f;

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            gain.gain.setValueAtTime(0, now + 0.6);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.7);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5); // Long sustain

            osc.start(now + 0.6);
            osc.stop(now + 3.0);
        });

        // Add some "firework" pops
        [1.0, 1.2, 1.5, 1.8, 2.0].forEach(t => {
            this.playSnare(now + t);
        });
    }
}

// Singleton
const soundManager = new SoundManager();
export default soundManager;
