export function createAudioPool({
  src,
  size = 6,
  volume = 0.18,
  minPlaybackRate = 1,
  maxPlaybackRate = 1,
}) {
  if (!src) {
    throw new Error("Audio pool requires a source path.");
  }

  if (!Number.isInteger(size) || size < 1) {
    throw new Error("Audio pool size must be a positive integer.");
  }

  const voices = Array.from({ length: size }, () => {
    const voice = new Audio(src);
    voice.preload = "auto";
    voice.volume = volume;
    voice.preservesPitch = false;
    voice.load();
    return voice;
  });

  let nextVoiceIndex = 0;

  function getPlaybackRate() {
    return minPlaybackRate + Math.random() * (maxPlaybackRate - minPlaybackRate);
  }

  function play() {
    const voice = voices[nextVoiceIndex];
    nextVoiceIndex = (nextVoiceIndex + 1) % voices.length;

    voice.pause();
    voice.currentTime = 0;
    voice.volume = volume;
    voice.playbackRate = getPlaybackRate();

    voice.play().catch(() => {
      // Browsers may block audio until the first user interaction.
    });
  }

  return {
    play,
    voices,
  };
}
