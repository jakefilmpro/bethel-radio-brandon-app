const STREAM_URL = "https://stream.zeno.fm/hls/ryz8p4uisaqvv";
const METADATA_STREAM = "https://api.zeno.fm/mounts/metadata/subscribe/ryz8p4uisaqvv";
const ARTWORK_URL = "https://artwork.rcast.net/73642";
const API_PROXY = "https://bethel-radio-redirect-resolver.vercel.app/api/resolve";

const audio = document.getElementById("radio");
const playBtn = document.getElementById("playBtn");
const volumeBtn = document.getElementById("volumeBtn");
const cover = document.getElementById("cover");
const connectionStatus = document.getElementById("connectionStatus");

let hls = null;
let sourcePromise = null;

function ensureSource() {
  if (sourcePromise) return sourcePromise;

  if (window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls();
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
    sourcePromise = new Promise((resolve) => {
      hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
    });
    hls.on(window.Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      console.error("HLS fatal error:", data);
      if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else if (playing) {
        attemptReconnect();
      }
    });
  } else {
    // Safari / iOS play HLS natively
    audio.src = STREAM_URL;
    sourcePromise = Promise.resolve();
  }

  return sourcePromise;
}

let playing = false;
let volume = 1.0;
let isMuted = false;
let reconnectTimeout = null;
let reconnectAttempts = 0;

audio.volume = volume;

function setStatus(msg) {
  connectionStatus.innerText = msg;
  connectionStatus.style.display = msg ? "block" : "none";
}

function cancelReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function attemptReconnect() {
  if (!playing) return;
  if (reconnectTimeout) return;

  const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 30000) + Math.random() * 1000;
  reconnectAttempts++;

  setStatus("Reconnecting...");
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6v6l4 2"/></svg>';

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    if (hls) {
      hls.startLoad();
    } else {
      audio.load();
    }
    audio.play().then(() => {
      reconnectAttempts = 0;
      setStatus("");
    }).catch(() => {
      attemptReconnect();
    });
  }, delay);
}

playBtn.addEventListener("click", async () => {
  try {
    if (!playing) {
      cancelReconnect();
      reconnectAttempts = 0;
      setStatus("Connecting...");
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6v6l4 2"/></svg>';
      await ensureSource();
      if (hls) hls.startLoad();
      await audio.play();
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      playing = true;
      setStatus("");
    } else {
      cancelReconnect();
      audio.pause();
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M8 5v14l11-7z"/></svg>';
      playing = false;
      setStatus("");
    }
  } catch (e) {
    console.error("Play failed:", e);
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M8 5v14l11-7z"/></svg>';
    setStatus("Tap play again");
    setTimeout(async () => {
      if (!playing) {
        try {
          setStatus("Connecting...");
          playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6v6l4 2"/></svg>';
          await ensureSource();
          if (hls) hls.startLoad();
          await audio.play();
          playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
          playing = true;
          setStatus("");
        } catch (e2) {
          console.error("Retry play failed:", e2);
          playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M8 5v14l11-7z"/></svg>';
        }
      }
    }, 1000);
  }
});

volumeBtn.addEventListener("click", () => {
  if (isMuted) {
    audio.volume = volume;
    volumeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
    isMuted = false;
  } else {
    audio.volume = 0;
    volumeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"/></svg>';
    isMuted = true;
  }
});

audio.addEventListener("loadstart", () => { if (!playing) setStatus("Loading..."); });
audio.addEventListener("error", (e) => { console.error("Audio error:", e); if (playing) attemptReconnect(); });
audio.addEventListener("stalled", () => { setStatus("Buffering..."); });
audio.addEventListener("waiting", () => { setStatus("Buffering..."); });
audio.addEventListener("playing", () => {
  cancelReconnect();
  reconnectAttempts = 0;
  setStatus("");
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
});
audio.addEventListener("ended", () => { if (playing) attemptReconnect(); });

async function getArtworkUrl() {
  try {
    const response = await fetch(API_PROXY + "?url=" + encodeURIComponent(ARTWORK_URL));
    const data = await response.json();
    let url = data.content || data.finalUrl;

    if (typeof url === 'string') {
      url = url.trim().replace(/[^a-zA-Z0-9:/.?&=%_-]/g, '');
    }

    if (!url || url.includes("error") || url.includes("localhost") || !url.startsWith('http')) {
      throw new Error("Invalid artwork URL");
    }

    return url;
  } catch (err) {
    console.error("Artwork fetch error:", err);
    return "images/fallback.webp";
  }
}

function applyTrackTitle(text) {
  const parts = (text || "").split(" - ");
  const title = parts.slice(0, -1).join(" - ");
  const artist = parts[parts.length - 1];

  document.getElementById("songTitle").innerText = title || "Estas Escuchando:";
  document.getElementById("nowPlaying").innerText = artist || "";

  // Artwork fetching temporarily disabled
  // const artworkUrl = await getArtworkUrl();
  // if (artworkUrl && !artworkUrl.includes("error")) {
  //   cover.src = artworkUrl;
  // }
}

let metadataSource = null;
let metadataRetry = null;

function connectMetadata() {
  if (metadataSource) metadataSource.close();

  metadataSource = new EventSource(METADATA_STREAM);

  metadataSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.streamTitle) applyTrackTitle(data.streamTitle);
    } catch (err) {
      console.error("Metadata parse error:", err);
    }
  };

  metadataSource.onerror = () => {
    // EventSource retries by itself; only rebuild it once it has given up
    if (metadataSource && metadataSource.readyState === EventSource.CLOSED && !metadataRetry) {
      metadataRetry = setTimeout(() => {
        metadataRetry = null;
        connectMetadata();
      }, 12000);
    }
  };
}

applyTrackTitle("");
connectMetadata();

async function tryAutoplay() {
  setStatus("Connecting...");
  try {
    await ensureSource();
    await audio.play();
    playing = true;
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    setStatus("");
  } catch (err) {
    // Browser requires a user gesture first — fall back to the play button and
    // pause the loader so nothing streams in the background. The source stays
    // attached so a later tap can start playback immediately.
    console.log("Autoplay blocked:", err && err.name);
    playing = false;
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M8 5v14l11-7z"/></svg>';
    setStatus("");
    if (hls) hls.stopLoad();
  }
}

tryAutoplay();
