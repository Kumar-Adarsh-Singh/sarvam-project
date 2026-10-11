// SarvamCast Studio Client Application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State
  let currentPreset = 'ai-india';
  let currentEpisode = null;
  let audioPlaylist = []; // Array of audio objects per dialogue
  let currentPlayingIndex = -1;
  let isMasterPlaying = false;
  let apiKey = localStorage.getItem('SARVAM_API_KEY') || 'sk_qaq8ho3m_ifhyEjbCvcWMUv8RgzKzk1qn';

  // Elements
  const presetButtons = document.querySelectorAll('.preset-btn');
  const topicInput = document.getElementById('topic-input');
  const selectLanguage = document.getElementById('select-language');
  const selectPace = document.getElementById('select-pace');
  const selectSpeaker1 = document.getElementById('select-speaker-1');
  const selectSpeaker2 = document.getElementById('select-speaker-2');
  const btnGenerate = document.getElementById('btn-generate');
  const progressContainer = document.getElementById('progress-container');
  const progressStatusText = document.getElementById('progress-status-text');
  const progressPercent = document.getElementById('progress-percent');
  const progressBarFill = document.getElementById('progress-bar-fill');

  const playerEpisodeTitle = document.getElementById('player-episode-title');
  const playerEpisodeTagline = document.getElementById('player-episode-tagline');
  const playerActiveSpeakerTag = document.getElementById('player-active-speaker-tag');
  const playerTimeCurrent = document.getElementById('player-time-current');
  const playerSegmentIndicator = document.getElementById('player-segment-indicator');
  const btnMasterPlay = document.getElementById('btn-master-play');
  const masterPlayIcon = document.getElementById('master-play-icon');
  const waveformBars = document.getElementById('waveform-bars');
  const transcriptContainer = document.getElementById('transcript-container');
  const btnExportScript = document.getElementById('btn-export-script');
  const btnDownloadAll = document.getElementById('btn-download-all');

  const audioEngine = document.getElementById('audio-engine');

  // Modal elements
  const btnApiSettings = document.getElementById('btn-api-settings');
  const apiModal = document.getElementById('api-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalApiKeyInput = document.getElementById('modal-api-key-input');
  const btnSaveKey = document.getElementById('btn-save-key');

  modalApiKeyInput.value = apiKey;

  // Build 24 waveform bars
  const NUM_BARS = 32;
  waveformBars.innerHTML = '';
  for (let i = 0; i < NUM_BARS; i++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    bar.style.height = `${Math.floor(Math.random() * 30 + 15)}%`;
    waveformBars.appendChild(bar);
  }

  // Handle Preset Switching
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPreset = btn.getAttribute('data-preset');
      topicInput.value = '';
    });
  });

  // Modal controls
  btnApiSettings.addEventListener('click', () => {
    modalApiKeyInput.value = apiKey;
    apiModal.classList.remove('hidden');
  });

  btnCloseModal.addEventListener('click', () => {
    apiModal.classList.add('hidden');
  });

  btnSaveKey.addEventListener('click', () => {
    const val = modalApiKeyInput.value.trim();
    if (val) {
      apiKey = val;
      localStorage.setItem('SARVAM_API_KEY', apiKey);
    }
    apiModal.classList.add('hidden');
  });

  // Generate Podcast Workflow
  btnGenerate.addEventListener('click', async () => {
    const customTopic = topicInput.value.trim();
    const language = selectLanguage.value;
    const pace = parseFloat(selectPace.value);
    const speaker1 = selectSpeaker1.value;
    const speaker2 = selectSpeaker2.value;

    btnGenerate.disabled = true;
    btnGenerate.classList.add('opacity-70', 'cursor-not-allowed');
    progressContainer.classList.remove('hidden');

    try {
      // Step 1: Generate Script
      updateProgress(20, 'Writing multi-speaker Indic dialogue script...');

      const scriptPayload = {
        topic: customTopic || undefined,
        presetKey: customTopic ? undefined : currentPreset,
        language,
        speaker1,
        speaker2,
        apiKey
      };

      const scriptRes = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptPayload)
      });

      if (!scriptRes.ok) {
        throw new Error('Failed to generate script from server');
      }

      const scriptData = await scriptRes.json();
      currentEpisode = scriptData;

      // Update UI Header
      playerEpisodeTitle.textContent = currentEpisode.title;
      playerEpisodeTagline.textContent = currentEpisode.tagline;

      // Step 2: Synthesize voice for each line using Sarvam Bulbul TTS
      const dialogues = currentEpisode.dialogues || [];
      audioPlaylist = [];
      renderTranscript(dialogues);

      const totalLines = dialogues.length;
      for (let i = 0; i < totalLines; i++) {
        const item = dialogues[i];
        const stepPct = Math.round(30 + ((i + 1) / totalLines) * 65);
        updateProgress(
          stepPct,
          `Synthesizing ${item.name} via Sarvam Bulbul TTS (${i + 1}/${totalLines})...`
        );

        try {
          const ttsRes = await fetch('/api/synthesize-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: item.text,
              speaker: item.speaker,
              target_language_code: language,
              model: 'bulbul:v3',
              pace,
              apiKey
            })
          });

          if (ttsRes.ok) {
            const ttsData = await ttsRes.json();
            audioPlaylist.push({
              index: i,
              speaker: item.speaker,
              name: item.name,
              text: item.text,
              audioBase64: ttsData.audio_base64
            });
            // Update individual line card with play button
            enableLineAudio(i);
          } else {
            console.warn(`TTS error on line ${i}:`, await ttsRes.text());
          }
        } catch (err) {
          console.error(`TTS failed for line ${i}:`, err);
        }
      }

      updateProgress(100, 'Podcast production complete! Ready to play.');
      setTimeout(() => {
        progressContainer.classList.add('hidden');
      }, 1500);

      // Automatically cue line 0
      currentPlayingIndex = 0;
      updateSegmentIndicator(0);

    } catch (err) {
      alert(`Error producing episode: ${err.message}`);
      progressContainer.classList.add('hidden');
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.classList.remove('opacity-70', 'cursor-not-allowed');
    }
  });

  function updateProgress(percent, message) {
    progressPercent.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
    progressStatusText.textContent = message;
  }

  // Render Transcript Bubbles
  function renderTranscript(dialogues) {
    transcriptContainer.innerHTML = '';
    dialogues.forEach((d, index) => {
      const isHost1 = index % 2 === 0;
      const card = document.createElement('div');
      card.id = `dialogue-card-${index}`;
      card.className = `dialogue-card p-4 rounded-xl border ${
        isHost1
          ? 'bg-slate-900/60 border-indigo-900/40'
          : 'bg-slate-900/40 border-pink-900/40'
      } flex items-start gap-3.5 transition-all`;

      card.innerHTML = `
        <div class="w-8 h-8 rounded-full ${
          isHost1 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'
        } flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
          isHost1 ? 'border-indigo-500/30' : 'border-pink-500/30'
        }">
          ${isHost1 ? 'H1' : 'H2'}
        </div>
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold ${isHost1 ? 'text-indigo-300' : 'text-pink-300'}">
              ${d.name}
            </span>
            <div class="flex items-center gap-1.5">
              <button id="btn-play-line-${index}" class="px-2 py-1 rounded-md text-[11px] bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1 transition opacity-50 cursor-not-allowed" disabled>
                <i data-lucide="volume-2" class="w-3 h-3"></i>
                <span class="line-status-text">Synthesizing...</span>
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-200 leading-relaxed">${d.text}</p>
        </div>
      `;

      transcriptContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function enableLineAudio(index) {
    const btn = document.getElementById(`btn-play-line-${index}`);
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    btn.querySelector('.line-status-text').textContent = 'Play';

    btn.onclick = () => {
      playLine(index);
    };
  }

  // Play a single line
  function playLine(index) {
    const audioData = audioPlaylist.find(a => a.index === index);
    if (!audioData) return;

    highlightPlayingCard(index);
    audioEngine.src = `data:audio/wav;base64,${audioData.audioBase64}`;
    audioEngine.play();

    isMasterPlaying = true;
    updateMasterPlayUI(true);
    setWaveformActive(true);
    currentPlayingIndex = index;
    updateSegmentIndicator(index);
  }

  // Continuous Master Playback
  btnMasterPlay.addEventListener('click', () => {
    if (!audioPlaylist.length) {
      alert('Please click "Produce Podcast Episode" first!');
      return;
    }

    if (isMasterPlaying) {
      audioEngine.pause();
      isMasterPlaying = false;
      updateMasterPlayUI(false);
      setWaveformActive(false);
    } else {
      if (currentPlayingIndex < 0 || currentPlayingIndex >= audioPlaylist.length) {
        currentPlayingIndex = 0;
      }
      playSequencedTurn(currentPlayingIndex);
    }
  });

  function playSequencedTurn(index) {
    if (index >= audioPlaylist.length) {
      // Finished all turns
      isMasterPlaying = false;
      updateMasterPlayUI(false);
      setWaveformActive(false);
      highlightPlayingCard(-1);
      currentPlayingIndex = 0;
      updateSegmentIndicator(0);
      return;
    }

    currentPlayingIndex = index;
    const item = audioPlaylist[index];
    highlightPlayingCard(index);
    updateSegmentIndicator(index);

    audioEngine.src = `data:audio/wav;base64,${item.audioBase64}`;
    audioEngine.play();
    isMasterPlaying = true;
    updateMasterPlayUI(true);
    setWaveformActive(true);

    audioEngine.onended = () => {
      if (isMasterPlaying) {
        // Automatically proceed to next turn after 350ms natural pause
        setTimeout(() => {
          if (isMasterPlaying) {
            playSequencedTurn(index + 1);
          }
        }, 350);
      }
    };
  }

  function highlightPlayingCard(index) {
    document.querySelectorAll('.dialogue-card').forEach((card, i) => {
      if (i === index) {
        card.classList.add('playing');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('playing');
      }
    });

    if (index >= 0 && audioPlaylist[index]) {
      playerActiveSpeakerTag.classList.remove('hidden');
      playerActiveSpeakerTag.textContent = `Speaking: ${audioPlaylist[index].name}`;
    } else {
      playerActiveSpeakerTag.classList.add('hidden');
    }
  }

  function updateMasterPlayUI(playing) {
    if (playing) {
      btnMasterPlay.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
      btnMasterPlay.classList.add('bg-amber-500');
      btnMasterPlay.classList.remove('bg-brand-500');
    } else {
      btnMasterPlay.innerHTML = '<i data-lucide="play" class="w-5 h-5 ml-0.5"></i>';
      btnMasterPlay.classList.add('bg-brand-500');
      btnMasterPlay.classList.remove('bg-amber-500');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function setWaveformActive(active) {
    const bars = document.querySelectorAll('.waveform-bar');
    bars.forEach(bar => {
      if (active) {
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
        bar.style.height = `${Math.floor(Math.random() * 30 + 15)}%`;
      }
    });
  }

  function updateSegmentIndicator(index) {
    const total = audioPlaylist.length || 5;
    playerSegmentIndicator.textContent = `Turn ${index + 1} / ${total}`;
  }

  // Audio time update
  audioEngine.addEventListener('timeupdate', () => {
    const cur = Math.floor(audioEngine.currentTime);
    const min = Math.floor(cur / 60);
    const sec = cur % 60;
    playerTimeCurrent.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  });

  // Export Script
  btnExportScript.addEventListener('click', () => {
    if (!currentEpisode) {
      alert('Generate an episode first!');
      return;
    }
    const blob = new Blob([JSON.stringify(currentEpisode, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarvamcast-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Download Manifest
  btnDownloadAll.addEventListener('click', () => {
    if (!audioPlaylist.length) {
      alert('Generate an episode first!');
      return;
    }
    const manifest = {
      episode: currentEpisode,
      tracks: audioPlaylist.map(a => ({
        index: a.index,
        speaker: a.speaker,
        name: a.name,
        text: a.text
      }))
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarvamcast-manifest-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Load Initial Preset
  (async () => {
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetKey: 'ai-india' })
      });
      if (res.ok) {
        currentEpisode = await res.json();
        playerEpisodeTitle.textContent = currentEpisode.title;
        playerEpisodeTagline.textContent = currentEpisode.tagline;
        renderTranscript(currentEpisode.dialogues);
      }
    } catch (e) {
      console.warn('Initial load fallback', e);
    }
  })();
});
