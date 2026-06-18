const STREAM_URL = "https://stream.rcast.net/73642";
const METADATA_URL = "https://status.rcast.net/73642";
const ARTWORK_URL = "https://artwork.rcast.net/73642";
const API_PROXY = "https://bethel-radio-redirect-resolver.vercel.app/api/resolve";

const audio = document.getElementById("radio");
const playBtn = document.getElementById("playBtn");
const volumeBtn = document.getElementById("volumeBtn");
const cover = document.getElementById("cover");
const connectionStatus = document.getElementById("connectionStatus");

audio.src = STREAM_URL;

let playing = false;
let volume = 0.8;
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
    audio.load();
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
      audio.src = STREAM_URL;
      audio.load();
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
  } catch {
    setStatus("Tap play again");
    setTimeout(async () => {
      if (!playing) {
        try {
          audio.src = STREAM_URL;
          audio.load();
          await audio.play();
          playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
          playing = true;
          setStatus("");
        } catch {}
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

audio.addEventListener("error", () => { if (playing) attemptReconnect(); });
audio.addEventListener("stalled", () => { if (playing) setStatus("Buffering..."); });
audio.addEventListener("waiting", () => { if (playing) setStatus("Buffering..."); });
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

async function fetchMetadata() {
  try {
    const response = await fetch(API_PROXY + "?url=" + encodeURIComponent(METADATA_URL));
    const data = await response.json();
    const text = data.content || data.finalUrl;

    if (!text || text.includes("error") || text.includes("localhost") || text.includes("development")) {
      throw new Error("Proxy error");
    }

    const parts = text.split(" - ");
    const title = parts.slice(0, -1).join(" - ");
    const artist = parts[parts.length - 1];

    document.getElementById("songTitle").innerText = title || "Estas Escuchando:";
    document.getElementById("nowPlaying").innerText = artist || "";

    // Artwork fetching temporarily disabled
    // const artworkUrl = await getArtworkUrl();
    // if (artworkUrl && !artworkUrl.includes("error")) {
    //   cover.src = artworkUrl;
    // }
  } catch (err) {
    console.error("Metadata fetch error:", err);
    document.getElementById("songTitle").innerText = "Estas Escuchando:";
    document.getElementById("nowPlaying").innerText = "";
    cover.src = "images/fallback.webp";
  }
}

const POLL_INTERVAL = 12000;
const BACKGROUND_POLL_INTERVAL = 60000;
let metadataInterval = null;

function startMetadataPolling(ms) {
  if (metadataInterval) clearInterval(metadataInterval);
  metadataInterval = setInterval(fetchMetadata, ms);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    startMetadataPolling(BACKGROUND_POLL_INTERVAL);
  } else {
    startMetadataPolling(POLL_INTERVAL);
    fetchMetadata();
  }
});

fetchMetadata();
startMetadataPolling(POLL_INTERVAL);
