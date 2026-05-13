/**
 * TDD Test Suite: lib/SoundManager.js
 */
let soundManager;

beforeEach(async () => {
  jest.resetModules();
  const mod = await import('../../lib/SoundManager.js');
  soundManager = mod.default;
  soundManager.audioCtx = null;
  soundManager.isMuted = false;
  soundManager.isPlaying = false;
  soundManager.bgmAudio = null;
  soundManager.timerID = null;
  soundManager.current16thNote = 0;
  soundManager.nextNoteTime = 0;
  soundManager.notesInQueue = [];
});

describe('SoundManager initialization', () => {
  test('should start with null audioCtx', () => {
    expect(soundManager.audioCtx).toBeNull();
  });
  test('init() should create AudioContext', () => {
    soundManager.init();
    expect(soundManager.audioCtx).not.toBeNull();
  });
  test('init() should not recreate AudioContext if already exists', () => {
    soundManager.init();
    const first = soundManager.audioCtx;
    soundManager.init();
    expect(soundManager.audioCtx).toBe(first);
  });
  test('should have default tempo of 100 BPM', () => {
    expect(soundManager.tempo).toBe(100);
  });
});

describe('setMute', () => {
  test('should set isMuted to true', () => {
    soundManager.setMute(true);
    expect(soundManager.isMuted).toBe(true);
  });
  test('should set isMuted to false', () => {
    soundManager.isMuted = true;
    soundManager.setMute(false);
    expect(soundManager.isMuted).toBe(false);
  });
  test('should suspend audioCtx when muting', () => {
    soundManager.init();
    soundManager.setMute(true);
    expect(soundManager.audioCtx.suspend).toHaveBeenCalled();
  });
  test('should resume audioCtx when unmuting', () => {
    soundManager.init();
    soundManager.setMute(false);
    expect(soundManager.audioCtx.resume).toHaveBeenCalled();
  });
  test('should set bgmAudio.muted if bgmAudio exists', () => {
    soundManager.bgmAudio = { muted: false };
    soundManager.setMute(true);
    expect(soundManager.bgmAudio.muted).toBe(true);
  });
});

describe('playTone', () => {
  test('should not play when muted', () => {
    soundManager.init();
    soundManager.isMuted = true;
    soundManager.playTone(440, 0.5);
    expect(soundManager.audioCtx.createOscillator).not.toHaveBeenCalled();
  });
  test('should not play when audioCtx is null', () => {
    soundManager.playTone(440, 0.5);
    expect(soundManager.audioCtx).toBeNull();
  });
  test('should create oscillator and gain when playing', () => {
    soundManager.init();
    soundManager.playTone(440, 0.5, 'sine');
    expect(soundManager.audioCtx.createOscillator).toHaveBeenCalled();
    expect(soundManager.audioCtx.createGain).toHaveBeenCalled();
  });
});

describe('nextNote (sequencer)', () => {
  test('should advance current16thNote by 1', () => {
    soundManager.tempo = 120;
    soundManager.nextNote();
    expect(soundManager.current16thNote).toBe(1);
  });
  test('should wrap around to 0 after 15', () => {
    soundManager.tempo = 120;
    soundManager.current16thNote = 15;
    soundManager.nextNote();
    expect(soundManager.current16thNote).toBe(0);
  });
  test('should advance nextNoteTime correctly', () => {
    soundManager.tempo = 120;
    soundManager.nextNoteTime = 0;
    soundManager.nextNote();
    expect(soundManager.nextNoteTime).toBeCloseTo(0.125);
  });
});

describe('scheduleNote', () => {
  beforeEach(() => {
    soundManager.init();
    soundManager.playKick = jest.fn();
    soundManager.playSnare = jest.fn();
    soundManager.playHiHat = jest.fn();
    soundManager.playBass = jest.fn();
    soundManager.playChord = jest.fn();
  });
  test('should push note to queue', () => {
    soundManager.scheduleNote(0, 0.0);
    expect(soundManager.notesInQueue).toHaveLength(1);
  });
  test('should play kick on beat 0', () => {
    soundManager.scheduleNote(0, 1.0);
    expect(soundManager.playKick).toHaveBeenCalledWith(1.0);
  });
  test('should play snare on beat 4', () => {
    soundManager.scheduleNote(4, 1.0);
    expect(soundManager.playSnare).toHaveBeenCalledWith(1.0);
  });
  test('should always play hihat', () => {
    soundManager.scheduleNote(3, 1.0);
    expect(soundManager.playHiHat).toHaveBeenCalled();
  });
  test('should play chord stabs on off-beats', () => {
    soundManager.scheduleNote(2, 1.0);
    expect(soundManager.playChord).toHaveBeenCalledWith(1.0, [277.18, 329.63, 415.30]);
  });
});

describe('BGM Control', () => {
  test('startProceduralBGM should set isPlaying true', () => {
    soundManager.startProceduralBGM();
    expect(soundManager.isPlaying).toBe(true);
  });
  test('stopBGM should set isPlaying false', () => {
    soundManager.isPlaying = true;
    soundManager.stopBGM();
    expect(soundManager.isPlaying).toBe(false);
  });
  test('stopBGM should pause bgmAudio if exists', () => {
    const mock = { pause: jest.fn(), currentTime: 5 };
    soundManager.bgmAudio = mock;
    soundManager.stopBGM();
    expect(mock.pause).toHaveBeenCalled();
    expect(mock.currentTime).toBe(0);
  });
});

describe('Sound Effects', () => {
  beforeEach(() => { soundManager.playTone = jest.fn(); });
  test('playClick calls playTone 800Hz', () => {
    soundManager.playClick();
    expect(soundManager.playTone).toHaveBeenCalledWith(800, 0.1, 'sine');
  });
  test('playCorrect plays 3 ascending tones', () => {
    soundManager.playCorrect();
    expect(soundManager.playTone).toHaveBeenCalledTimes(3);
  });
  test('playWrong plays 2 descending tones', () => {
    soundManager.playWrong();
    expect(soundManager.playTone).toHaveBeenCalledTimes(2);
  });
});
