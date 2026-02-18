class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.isMuted = false;
        this.bgmAudio = null;
        // Sequencer properties
        this.isPlaying = false;
        this.tempo = 105; // BPM
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

        // --- R&B Pattern Definition (16 steps) ---
        // Kick: 1, 4, 7, 11 (syncopated)
        if (beatNumber === 0 || beatNumber === 4 || beatNumber === 10) {
            this.playKick(time);
        }

        // Snare: 4, 12 (backbeat) + subtle ghost note on 15
        if (beatNumber === 4 || beatNumber === 12) {
            this.playSnare(time);
        }

        // HiHat: 16th notes with some open hats or breaks
        if (beatNumber % 2 === 0) { // 8th notes
            this.playHiHat(time);
        } else if (beatNumber === 15) {
            this.playHiHat(time); // Quick double at end
        }

        // Bass: Solid R&B line
        // Root notes F# minor (F# -> A -> B -> C#)
        if (beatNumber === 0) this.playBass(time, 92.50); // F#2
        if (beatNumber === 3) this.playBass(time, 92.50); // F#2
        if (beatNumber === 7) this.playBass(time, 110.00); // A2
        if (beatNumber === 10) this.playBass(time, 46.25); // F#1 (Deep)
        if (beatNumber === 14) this.playBass(time, 69.30); // C#2

        // Chords: Ambient pads every measure or half-measure
        // F#m9 (F# A C# E G#)
        if (beatNumber === 0) {
            this.playChord(time, [277.18, 329.63, 415.30]); // C#4, E4, G#4 (Upper structure)
        }
        if (beatNumber === 8) {
            this.playChord(time, [220.00, 277.18, 369.99]); // A3, C#4, F#4
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
        const now = 0;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            this.playTone(freq, 0.5, 'square', i * 0.15);
        });
    }
}

// Singleton
const soundManager = new SoundManager();
export default soundManager;
