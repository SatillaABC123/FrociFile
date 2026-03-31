const BG_MUSIC_ENABLED_KEY = 'seedFile.bgMusicEnabled';
const BG_MUSIC_TIME_KEY = 'seedFile.bgMusicTime';
const BG_MUSIC_VOLUME_KEY = 'seedFile.bgMusicVolume';
const DEFAULT_BG_MUSIC_VOLUME = 0.48;
const DEFAULT_AUDIO_CHANNEL_VOLUME = 1;
const bgMusic = document.getElementById('globalBgMusic');
let lastSavedBgMusicTime = 0;
let bgMusicRestored = false;

function saveGlobalMusicState() {
  if (!bgMusic) return;
  try {
    sessionStorage.setItem(BG_MUSIC_TIME_KEY, String(bgMusic.currentTime || 0));
    localStorage.setItem(BG_MUSIC_VOLUME_KEY, String(bgMusic.volume || DEFAULT_BG_MUSIC_VOLUME));
  } catch (error) {
    console.warn('Music state could not be saved.', error);
  }
}

function startGlobalMusic() {
  if (!bgMusic) return;
  bgMusic.volume = DEFAULT_BG_MUSIC_VOLUME;

  if (!bgMusicRestored) {
    const savedTime = Number(sessionStorage.getItem(BG_MUSIC_TIME_KEY));
    if (Number.isFinite(savedTime) && savedTime > 0 && Math.abs((bgMusic.currentTime || 0) - savedTime) > 0.35) {
      try {
        bgMusic.currentTime = savedTime;
      } catch (error) {
        console.warn('Music time could not be restored.', error);
      }
    }
    bgMusicRestored = true;
  }

  if (!bgMusic.paused) return;
  const playAttempt = bgMusic.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(() => {});
  }
}

function enableGlobalMusic() {
  if (!bgMusic) return;
  try {
    localStorage.setItem(BG_MUSIC_ENABLED_KEY, '1');
  } catch (error) {
    console.warn('Music preference could not be saved.', error);
  }
  startGlobalMusic();
}

if (bgMusic) {
  const wantsMusic = localStorage.getItem(BG_MUSIC_ENABLED_KEY) === '1';
  if (wantsMusic) startGlobalMusic();

  document.addEventListener('pointerdown', enableGlobalMusic, { passive: true });
  document.addEventListener('keydown', enableGlobalMusic);

  bgMusic.addEventListener('timeupdate', () => {
    const now = performance.now();
    if (now - lastSavedBgMusicTime > 900) {
      saveGlobalMusicState();
      lastSavedBgMusicTime = now;
    }
  });

  bgMusic.addEventListener('play', () => {
    try {
      localStorage.setItem(BG_MUSIC_ENABLED_KEY, '1');
    } catch (error) {
      console.warn('Music preference could not be saved.', error);
    }
  });

  window.addEventListener('beforeunload', saveGlobalMusicState);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveGlobalMusicState();
    } else if (localStorage.getItem(BG_MUSIC_ENABLED_KEY) === '1') {
      if (bgMusic && bgMusic.paused) startGlobalMusic();
    }
  });
}

const openButton = document.getElementById('openButton');
const modalOne = document.getElementById('modalOne');
const modalTwo = document.getElementById('modalTwo');
const yesOne = document.getElementById('yesOne');
const noOne = document.getElementById('noOne');
const yesTwo = document.getElementById('yesTwo');
const noTwo = document.getElementById('noTwo');

function showModal(modal) {
  if (modal) modal.classList.remove('hidden');
}

function hideModal(modal) {
  if (modal) modal.classList.add('hidden');
}

if (openButton) openButton.addEventListener('click', () => showModal(modalOne));
if (noOne) noOne.addEventListener('click', () => hideModal(modalOne));
if (yesOne) yesOne.addEventListener('click', () => { hideModal(modalOne); showModal(modalTwo); });
if (noTwo) noTwo.addEventListener('click', () => hideModal(modalTwo));
if (yesTwo) yesTwo.addEventListener('click', () => { saveGlobalMusicState(); window.location.href = 'files.html'; });
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { hideModal(modalOne); hideModal(modalTwo); } });

const channelVideo = document.getElementById('channelVideo');
const channelImage = document.getElementById('channelImage');
const channelAudio = document.getElementById('channelAudio');
const audioTransmissionCard = document.getElementById('audioTransmissionCard');
const audioTransmissionTitle = document.getElementById('audioTransmissionTitle');
const audioTransmissionMeta = document.getElementById('audioTransmissionMeta');
const videoOverlay = document.getElementById('videoOverlay');
const tuningFx = document.getElementById('tuningFx');
const staticCanvas = document.getElementById('staticCanvas');
const liveFx = document.getElementById('liveFx');
const idleStaticCanvas = document.getElementById('idleStaticCanvas');
const whiteFlash = document.getElementById('whiteFlash');
const videoFrame = document.querySelector('.video-frame');
const channelTitle = document.getElementById('channelTitle');
const channelMeta = document.getElementById('channelMeta');
const currentChannel = document.getElementById('currentChannel');
const channelBadge = document.getElementById('channelBadge');
const mediaTypeBadge = document.getElementById('mediaTypeBadge');
const bankLabel = document.getElementById('bankLabel');
const channelStatus = document.getElementById('channelStatus');
const audioStatus = document.getElementById('audioStatus');
const presetGrid = document.getElementById('presetGrid');
const dialButton = document.getElementById('dialButton');
const dialMarker = document.querySelector('.dial-marker');
const dialUp = document.getElementById('dialUp');
const dialDown = document.getElementById('dialDown');
const volumeKnob = document.getElementById('volumeKnob');
const randomButton = document.getElementById('randomButton');

if (presetGrid && dialButton && dialMarker && dialUp && dialDown) {
  const CHANNELS_PER_BANK = 10;
  const keyLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const sourceMedia = [
    ...Array.from({ length: 17 }, (_, index) => ({
      type: 'video',
      src: `MEDIA/videos/video-${String(index + 1).padStart(2, '0')}.mp4`
    })),
    ...Array.from({ length: 12 }, (_, index) => ({
      type: 'image',
      src: `MEDIA/images/image-${String(index + 1).padStart(2, '0')}.jpeg`
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      type: 'audio',
      src: `MEDIA/audio/audio-${String(index + 1).padStart(2, '0')}.ogg`
    }))
  ];

  function seededShuffle(items, seed = 13031996) {
    const shuffled = [...items];
    let state = seed >>> 0;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  const channels = seededShuffle(sourceMedia).map((item, index) => ({
    id: index + 1,
    number: String(index + 1).padStart(2, '0'),
    title: `Channel ${String(index + 1).padStart(2, '0')}`,
    description: `Recovered signal ${String(index + 1).padStart(2, '0')}.`,
    type: item.type,
    src: item.src
  }));

  const TOTAL_CHANNELS = channels.length;
  const TOTAL_BANKS = Math.max(1, Math.ceil(TOTAL_CHANNELS / CHANNELS_PER_BANK));
  const playableChannels = channels.filter((channel) => Boolean(channel && channel.src));
  let activeBank = 0;
  let activeChannelId = TOTAL_CHANNELS ? channels[0].id : 1;
  let volumeValue = DEFAULT_AUDIO_CHANNEL_VOLUME;
  let tuningTimeout;
  let staticFrameId;
  let staticEffectUntil = 0;
  let idleStaticFrameId;
  let burstTimeout;
  let microGlitchTimeout;

  function resizeCanvasSurface(canvas, host) {
    if (!canvas || !host) return;
    const rect = host.getBoundingClientRect();
    canvas.width = Math.max(240, Math.floor(rect.width / 2));
    canvas.height = Math.max(180, Math.floor(rect.height / 2));
  }

  function resizeEffectCanvases() {
    resizeCanvasSurface(staticCanvas, tuningFx);
    resizeCanvasSurface(idleStaticCanvas, liveFx || videoFrame);
  }

  function stopStaticEffect() {
    staticEffectUntil = 0;
    if (staticFrameId) cancelAnimationFrame(staticFrameId);
    staticFrameId = undefined;
    if (staticCanvas) {
      const context = staticCanvas.getContext('2d');
      context.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
    }
  }

  function triggerWhiteFlash() {
    if (!whiteFlash) return;
    whiteFlash.classList.remove('active');
    void whiteFlash.offsetWidth;
    whiteFlash.classList.add('active');
  }

  function drawIdleStaticFrame() {
    if (!idleStaticCanvas) return;
    const context = idleStaticCanvas.getContext('2d');
    const width = idleStaticCanvas.width;
    const height = idleStaticCanvas.height;
    context.clearRect(0, 0, width, height);
    const pixelSize = Math.max(3, Math.floor(width / 96));

    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        const chance = Math.random();
        if (chance > 0.962) {
          const bright = 150 + Math.random() * 105;
          context.fillStyle = `rgba(${bright}, ${bright}, ${bright}, ${0.38 + Math.random() * 0.26})`;
          context.fillRect(x, y, pixelSize, pixelSize);
        } else if (chance > 0.952) {
          const channel = Math.random() > 0.5 ? 255 : 0;
          const mid = 70 + Math.random() * 150;
          context.fillStyle = `rgba(${channel}, ${mid}, ${255 - channel}, ${0.18 + Math.random() * 0.16})`;
          context.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }

    if (Math.random() > 0.75) {
      const lineY = Math.random() * height;
      const lineHeight = 1 + Math.random() * 5;
      const gradient = context.createLinearGradient(0, lineY, 0, lineY + lineHeight);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, `rgba(255,255,255,${0.25 + Math.random() * 0.2})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, lineY, width, lineHeight);
    }

    if (Math.random() > 0.88) {
      const stripeX = Math.random() * width;
      context.fillStyle = `rgba(255,255,255,${0.18 + Math.random() * 0.12})`;
      context.fillRect(stripeX, 0, 1 + Math.random() * 2, height);
    }
  }

  function startIdleInterference() {
    if (!idleStaticCanvas) return;
    if (idleStaticFrameId) cancelAnimationFrame(idleStaticFrameId);
    const animate = () => { drawIdleStaticFrame(); idleStaticFrameId = requestAnimationFrame(animate); };
    idleStaticFrameId = requestAnimationFrame(animate);
  }

  function burstInterference(duration = 280) {
    if (!videoFrame) return;
    clearTimeout(burstTimeout);
    videoFrame.classList.remove('interference-burst');
    void videoFrame.offsetWidth;
    videoFrame.classList.add('interference-burst');
    triggerWhiteFlash();
    burstTimeout = window.setTimeout(() => { videoFrame.classList.remove('interference-burst'); }, duration);
  }

  function scheduleRandomVideoGlitch() {
    clearTimeout(microGlitchTimeout);
    const delay = 1800 + Math.random() * 3200;
    microGlitchTimeout = window.setTimeout(() => {
      const hasVisibleMedia = Boolean(channelVideo.getAttribute('src') || channelImage.getAttribute('src') || channelAudio.getAttribute('src'));
      if (!hasVisibleMedia) { scheduleRandomVideoGlitch(); return; }
      const target = !channelImage.classList.contains('hidden') ? channelImage : channelVideo;
      target.classList.remove('micro-glitch');
      void target.offsetWidth;
      target.classList.add('micro-glitch');
      if (Math.random() > 0.55) burstInterference(180 + Math.random() * 120);
      if (Math.random() > 0.6) triggerWhiteFlash();
      window.setTimeout(() => { target.classList.remove('micro-glitch'); }, 220);
      scheduleRandomVideoGlitch();
    }, delay);
  }

  function drawStaticFrame() {
    if (!staticCanvas) return;
    const context = staticCanvas.getContext('2d');
    const width = staticCanvas.width;
    const height = staticCanvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    const pixelSize = Math.max(4, Math.floor(width / 80));
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        if (Math.random() > 0.48) {
          const hue = Math.floor(Math.random() * 360);
          const light = 46 + Math.random() * 34;
          context.fillStyle = `hsla(${hue}, 95%, ${light}%, 0.92)`;
        } else if (Math.random() > 0.7) {
          context.fillStyle = `rgba(255,255,255,${0.7 + Math.random() * 0.3})`;
        } else {
          context.fillStyle = `rgba(0,0,0,${0.8 + Math.random() * 0.2})`;
        }
        context.fillRect(x, y, pixelSize, pixelSize);
      }
    }
    for (let i = 0; i < 34; i += 1) {
      const stripeX = Math.random() * width;
      const stripeWidth = 2 + Math.random() * (pixelSize * 2.2);
      const hue = Math.random() > 0.6 ? Math.floor(Math.random() * 360) : 0;
      const alpha = 0.25 + Math.random() * 0.6;
      context.fillStyle = hue === 0 ? `rgba(255,255,255,${alpha})` : `hsla(${hue}, 100%, 62%, ${alpha})`;
      context.fillRect(stripeX, 0, stripeWidth, height);
      if (Math.random() > 0.55) {
        context.fillStyle = 'rgba(0,0,0,0.85)';
        context.fillRect(stripeX + stripeWidth * 0.45, 0, Math.max(1, stripeWidth * 0.28), height);
      }
    }
    for (let i = 0; i < 4; i += 1) {
      const tearY = Math.random() * height;
      const tearHeight = 4 + Math.random() * 18;
      const gradient = context.createLinearGradient(0, tearY, 0, tearY + tearHeight);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, `rgba(255,255,255,${0.55 + Math.random() * 0.25})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, tearY, width, tearHeight);
    }
    context.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 1);
  }

  function startStaticEffect(duration = 820) {
    if (!staticCanvas) return;
    resizeEffectCanvases();
    staticEffectUntil = performance.now() + duration;
    if (staticFrameId) cancelAnimationFrame(staticFrameId);
    const animate = (now) => {
      drawStaticFrame();
      if (now < staticEffectUntil) {
        staticFrameId = requestAnimationFrame(animate);
      } else {
        stopStaticEffect();
      }
    };
    staticFrameId = requestAnimationFrame(animate);
  }

  function getChannelById(channelId) {
    return channels.find((channel) => channel.id === channelId);
  }

  function updateDialVisual() {
    const targetRotation = activeBank * 58;
    dialMarker.style.transform = `translateX(-50%) rotate(${targetRotation}deg)`;
  }

  function updateReadout(channel) {
    if (!channel) return;
    currentChannel.textContent = channel.number;
    if (channelBadge) channelBadge.textContent = `CH ${channel.number}`;
    if (mediaTypeBadge) mediaTypeBadge.textContent = '';
    bankLabel.textContent = `${activeBank + 1} / ${TOTAL_BANKS}`;
    channelTitle.textContent = `Channel ${channel.number}`;
    channelMeta.textContent = `Recovered signal ${channel.number}.`;
    if (audioTransmissionTitle) audioTransmissionTitle.textContent = `Channel ${channel.number}`;
    if (audioTransmissionMeta) audioTransmissionMeta.textContent = `Recovered signal ${channel.number}.`;
  }

  function getVisibleChannels() {
    const start = activeBank * CHANNELS_PER_BANK;
    return channels.slice(start, start + CHANNELS_PER_BANK);
  }

  function markActiveButton() {
    const buttons = presetGrid.querySelectorAll('.preset-btn');
    buttons.forEach((button) => {
      const channelId = Number(button.dataset.channelId);
      button.classList.toggle('active', channelId === activeChannelId);
    });
  }

  function buildPresetButtons() {
    const visibleChannels = getVisibleChannels();
    presetGrid.innerHTML = '';

    for (let index = 0; index < CHANNELS_PER_BANK; index += 1) {
      const channel = visibleChannels[index];
      const button = document.createElement('button');
      button.className = 'preset-btn';
      button.type = 'button';

      if (channel) {
        button.dataset.channelId = String(channel.id);
        button.title = `Channel ${channel.number}`;
        button.innerHTML = `
          <span class="preset-number">${keyLabels[index]}</span>
          <span class="preset-channel">${channel.number}</span>
        `;
        button.addEventListener('click', () => playChannel(channel.id));
      } else {
        button.disabled = true;
        button.classList.add('is-empty');
        button.innerHTML = `
          <span class="preset-number">${keyLabels[index]}</span>
          <span class="preset-channel">--</span>
        `;
      }

      presetGrid.appendChild(button);
    }

    markActiveButton();
  }

  function showOverlay(message, statusText) {
    if (!videoOverlay) return;
    videoOverlay.classList.remove('hidden');
    channelMeta.textContent = message;
    channelStatus.textContent = statusText;
  }

  function hideOverlay() {
    if (videoOverlay) videoOverlay.classList.add('hidden');
  }

  function runTuningAnimation() {
    if (tuningFx) {
      clearTimeout(tuningTimeout);
      tuningFx.classList.remove('active');
      void tuningFx.offsetWidth;
      tuningFx.classList.add('active');
      startStaticEffect(920);
      burstInterference(260);
      triggerWhiteFlash();
      tuningTimeout = window.setTimeout(() => {
        tuningFx.classList.remove('active');
        stopStaticEffect();
      }, 920);
    }
    if (channelVideo) {
      channelVideo.classList.remove('channel-switch');
      void channelVideo.offsetWidth;
      channelVideo.classList.add('channel-switch');
    }
    if (channelImage) {
      channelImage.classList.remove('channel-switch');
      void channelImage.offsetWidth;
      channelImage.classList.add('channel-switch');
    }
  }

  function getActualAudioVolume() {
    return Math.min(1, Math.max(0, volumeValue));
  }

  function setVolume(nextVolume) {
    volumeValue = Math.min(1, Math.max(0, nextVolume));
    const actualAudioVolume = getActualAudioVolume();
    if (channelVideo) {
      channelVideo.muted = true;
      channelVideo.volume = 0;
    }
    if (channelAudio) channelAudio.volume = actualAudioVolume;

    const activeChannel = getChannelById(activeChannelId);
    if (activeChannel?.type === 'audio') {
      audioStatus.textContent = actualAudioVolume === 0 ? 'Muted' : `${Math.round(actualAudioVolume * 100)}%`;
    } else {
      audioStatus.textContent = 'Off';
    }

    if (volumeKnob) {
      const rotation = -130 + volumeValue * 260;
      volumeKnob.style.transform = `rotate(${rotation}deg)`;
    }
  }

  function stopAllPlayback() {
    if (channelVideo) {
      channelVideo.pause();
      channelVideo.removeAttribute('src');
      channelVideo.load();
      channelVideo.classList.add('hidden');
      channelVideo.classList.remove('video-active', 'audio-visual', 'micro-glitch');
    }
    if (channelImage) {
      channelImage.removeAttribute('src');
      channelImage.classList.add('hidden');
      channelImage.classList.remove('image-active', 'micro-glitch');
    }
    if (channelAudio) {
      channelAudio.pause();
      channelAudio.removeAttribute('src');
      channelAudio.load();
    }
    if (audioTransmissionCard) audioTransmissionCard.classList.add('hidden');
  }

  function activateVisualMode(channel) {
    stopAllPlayback();
    updateReadout(channel);
    runTuningAnimation();
    showOverlay('Searching for signal...', 'Tuning');

    if (channel.type === 'video') {
      channelVideo.classList.remove('hidden', 'audio-visual');
      channelVideo.classList.add('video-active');
      channelVideo.src = channel.src;
      channelVideo.load();
      channelVideo.muted = true;
      channelVideo.volume = 0;
      setVolume(volumeValue);
      const playAttempt = channelVideo.play();
      scheduleRandomVideoGlitch();
      if (playAttempt && typeof playAttempt.then === 'function') {
        playAttempt.then(() => { hideOverlay(); channelStatus.textContent = 'Playing'; })
          .catch(() => { showOverlay('Click the channel again if the browser blocks playback.', 'Standby'); });
      }
      return;
    }

    if (channel.type === 'image') {
      channelImage.classList.remove('hidden');
      channelImage.classList.add('image-active');
      channelImage.src = channel.src;
      hideOverlay();
      channelStatus.textContent = 'Locked';
      audioStatus.textContent = 'Off';
      scheduleRandomVideoGlitch();
      burstInterference(220);
      return;
    }

    if (channel.type === 'audio') {
      channelVideo.classList.remove('hidden');
      channelVideo.classList.add('audio-visual');
      if (audioTransmissionCard) audioTransmissionCard.classList.remove('hidden');
      channelAudio.src = channel.src;
      channelAudio.load();
      setVolume(volumeValue);
      const playAttempt = channelAudio.play();
      hideOverlay();
      channelStatus.textContent = 'Locked';
      scheduleRandomVideoGlitch();
      burstInterference(220);
      if (playAttempt && typeof playAttempt.then === 'function') {
        playAttempt.catch(() => {
          showOverlay('Click the channel again if the browser blocks playback.', 'Standby');
        });
      }
    }
  }

  function playChannel(channelId) {
    const channel = getChannelById(channelId);
    if (!channel) return;
    activeChannelId = channel.id;
    activeBank = Math.floor((channel.id - 1) / CHANNELS_PER_BANK);
    updateDialVisual();
    buildPresetButtons();
    activateVisualMode(channel);
  }

  function switchBank(direction) {
    if (!TOTAL_CHANNELS) return;

    const currentSlot = Math.max(0, (activeChannelId - 1) % CHANNELS_PER_BANK);
    activeBank = (activeBank + direction + TOTAL_BANKS) % TOTAL_BANKS;

    const visibleChannels = getVisibleChannels();
    const targetChannel = visibleChannels[currentSlot] || visibleChannels[0];
    if (!targetChannel) return;

    playChannel(targetChannel.id);
  }

  function openRandomChannel() {
    if (!playableChannels.length) {
      showOverlay('No recovered signals were found in the archive.', 'Empty');
      channelStatus.textContent = 'Empty';
      return;
    }
    const randomChannel = playableChannels[Math.floor(Math.random() * playableChannels.length)];
    playChannel(randomChannel.id);
  }

  dialUp.addEventListener('click', () => switchBank(1));
  dialDown.addEventListener('click', () => switchBank(-1));
  dialButton.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY > 0) switchBank(1); else switchBank(-1);
  }, { passive: false });
  dialButton.addEventListener('click', () => switchBank(1));

  if (randomButton) randomButton.addEventListener('click', openRandomChannel);

  if (volumeKnob) {
    volumeKnob.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.05 : 0.05;
      setVolume(volumeValue + delta);
    }, { passive: false });
    volumeKnob.addEventListener('click', () => { setVolume(volumeValue > 0 ? 0 : 1); });
  }

  if (channelVideo) {
    channelVideo.addEventListener('loadeddata', () => { hideOverlay(); channelStatus.textContent = 'Signal Locked'; audioStatus.textContent = 'Off'; burstInterference(220); });
    channelVideo.addEventListener('play', () => { channelStatus.textContent = 'Playing'; scheduleRandomVideoGlitch(); });
    channelVideo.addEventListener('error', () => { showOverlay('This signal could not be opened.', 'Missing'); channelStatus.textContent = 'Missing'; audioStatus.textContent = 'Off'; clearTimeout(microGlitchTimeout); });
    channelVideo.addEventListener('ended', () => { channelVideo.currentTime = 0; channelVideo.play().catch(() => {}); });
  }

  if (channelAudio) {
    channelAudio.addEventListener('play', () => { audioStatus.textContent = channelAudio.volume ? `${Math.round(channelAudio.volume * 100)}%` : 'Muted'; channelStatus.textContent = 'Playing'; });
    channelAudio.addEventListener('error', () => { showOverlay('This signal could not be opened.', 'Missing'); channelStatus.textContent = 'Missing'; audioStatus.textContent = 'Off'; });
    channelAudio.addEventListener('ended', () => { channelAudio.currentTime = 0; channelAudio.play().catch(() => {}); });
  }

  if (channelImage) channelImage.addEventListener('load', () => burstInterference(160));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') switchBank(1);
    if (event.key === 'ArrowLeft') switchBank(-1);
    if (event.key.toLowerCase() === 'r') openRandomChannel();
    const keyIndex = keyLabels.indexOf(event.key);
    if (keyIndex !== -1) {
      const channel = getVisibleChannels()[keyIndex];
      if (channel) playChannel(channel.id);
    }
  });

  window.addEventListener('resize', resizeEffectCanvases);
  setVolume(DEFAULT_AUDIO_CHANNEL_VOLUME);
  resizeEffectCanvases();
  startIdleInterference();
  updateDialVisual();
  buildPresetButtons();
  if (channels[0]) updateReadout(channels[0]);
  if (TOTAL_CHANNELS) {
    showOverlay('Choose one of the ten keys to open a channel.', 'Idle');
  } else {
    showOverlay('No archive media was found.', 'Empty');
    channelStatus.textContent = 'Empty';
  }
}
