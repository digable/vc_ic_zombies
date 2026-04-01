// ---------------------------------------------------------------------------
// Multiplayer — online session management
// All paths are gated behind state.multiplayerSession?.mode === "online".
// Same-device play is completely unaffected when multiplayerSession is null.
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1500;
const API_BASE = "/api/games";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mpSession() { return state.multiplayerSession; }
function isOnlineMode() { return mpSession()?.mode === "online"; }
function isMyTurn() {
  const mp = mpSession();
  return mp ? state.currentPlayerIndex === mp.myPlayerSlot : true;
}

function getOrCreateDeviceId() {
  let id = sessionStorage.getItem("vc_deviceId");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("vc_deviceId", id);
  }
  return id;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw Object.assign(new Error(`API route not found: ${path}`), { status: 404 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status, data });
  return data;
}

function setLobbyStatus(msg, isError = false) {
  const el = document.getElementById("mpLobbyStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = "mp-lobby-status" + (isError ? " mp-lobby-error" : "");
}

function renderLobbyPanel(session) {
  const players = session?.players || [];
  const listEl = document.getElementById("mpPlayerList");
  if (listEl) {
    listEl.innerHTML = players.length === 0
      ? "<em>Waiting for players...</em>"
      : players.map((p) => `<div class="mp-player-entry">${p.name}</div>`).join("");
  }
  const codeEl = document.getElementById("mpShareCode");
  if (codeEl && session?.code) {
    const url = `${location.origin}${location.pathname}?game=${session.code}`;
    codeEl.innerHTML = `Code: <strong>${session.code}</strong> &nbsp;|&nbsp;
      <button onclick="navigator.clipboard.writeText('${url}')" class="mp-copy-btn">Copy Link</button>`;
  }
  const mp = mpSession();
  const startBtn = document.getElementById("mpStartBtn");
  if (startBtn) {
    const isHost = mp?.isHost === true;
    startBtn.style.display = isHost ? "" : "none";
    startBtn.disabled = !isHost || players.length < 1;
  }
}

function showLobbySection() {
  document.getElementById("mpLobbySection")?.classList.remove("hidden");
  document.getElementById("mpCreateJoinSection")?.classList.add("hidden");
  document.getElementById("newGameBtn").style.display = "none";
}

function showCreateJoinSection() {
  document.getElementById("mpLobbySection")?.classList.add("hidden");
  document.getElementById("mpCreateJoinSection")?.classList.remove("hidden");
  document.getElementById("newGameBtn").style.display = "";
  setLobbyStatus("");
}

// Called once the game is live — collapses the MP panel for both host and joiner
function hideMpPanel() {
  const panel = document.getElementById("mpPanel");
  if (panel) panel.removeAttribute("open");
}

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

function startPolling() {
  const mp = mpSession();
  if (!mp) return;
  stopPolling();
  mp.pollInterval = setInterval(pollFromCloud, POLL_INTERVAL_MS);
}

function stopPolling() {
  const mp = mpSession();
  if (mp?.pollInterval) {
    clearInterval(mp.pollInterval);
    mp.pollInterval = null;
  }
}

async function pollFromCloud() {
  const mp = mpSession();
  if (!mp) return;

  try {
    const session = await apiFetch(`${API_BASE}/${mp.code}`);

    if (session.status === "done") {
      stopPolling();
      setLobbyStatus("Session ended.");
      return;
    }

    if (session.status === "lobby") {
      renderLobbyPanel(session);
      return;
    }

    // status === "playing"
    if (!session.state) return;

    const incoming = session.state;

    // Use a composite key to detect real state changes.
    // On first "playing" poll (mp.lastStateKey is unset), always apply.
    const stateKey = `${incoming.turnNumber}:${incoming.currentPlayerIndex}:${incoming.step}`;
    if (mp.lastStateKey === stateKey) return;
    mp.lastStateKey = stateKey;

    // First time seeing "playing" — close the lobby panel
    if (!mp.gameStarted) {
      mp.gameStarted = true;
      hideMpPanel();
    }

    deserializeState(incoming);
    updateMpTurnBanner();
    render();

    if (isMyTurn()) {
      stopPolling();
    }
  } catch (e) {
    console.warn("pollFromCloud failed:", e.message);
  }
}

// ---------------------------------------------------------------------------
// syncToCloud — called from endTurn() after state advances to next player
// ---------------------------------------------------------------------------

async function syncToCloud() {
  if (!isOnlineMode()) return;
  const mp = mpSession();
  try {
    const serialized = serializeState();
    await apiFetch(`${API_BASE}/${mp.code}`, {
      method: "POST",
      body: { playerId: mp.myPlayerId, gameState: serialized }
    });
    // Update our own key so we don't re-apply our own push when polling resumes
    mp.lastStateKey = `${serialized.turnNumber}:${serialized.currentPlayerIndex}:${serialized.step}`;
    if (!isMyTurn()) startPolling();
  } catch (e) {
    console.warn("syncToCloud failed:", e.message);
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

async function createMultiplayerGame() {
  const nameInput = document.getElementById("mpHostName");
  const displayName = nameInput?.value.trim();
  if (!displayName) { setLobbyStatus("Enter your display name first.", true); return; }

  const btn = document.getElementById("mpCreateBtn");
  if (btn) btn.disabled = true;
  setLobbyStatus("Creating game...");

  try {
    const deviceId = getOrCreateDeviceId();
    const { code, hostId } = await apiFetch(API_BASE, { method: "POST" });

    const { playerId } = await apiFetch(`${API_BASE}/${code}/join`, {
      method: "POST",
      body: { displayName, deviceId }
    });

    sessionStorage.setItem("vc_mp_code", code);
    sessionStorage.setItem("vc_mp_playerId", playerId);
    sessionStorage.setItem("vc_mp_hostId", hostId);

    state.multiplayerSession = {
      code, myPlayerId: playerId, myDeviceId: deviceId,
      myPlayerSlot: 0, isHost: true, hostId, mode: "online",
      pollInterval: null, gameStarted: false, lastStateKey: null
    };

    showLobbySection();
    setLobbyStatus(`Share this link or code: ${code}`);
    renderLobbyPanel({ code, players: [{ id: playerId, name: displayName }] });
    startPolling();
  } catch (e) {
    setLobbyStatus(e.message || "Failed to create game.", true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Join
// ---------------------------------------------------------------------------

async function joinMultiplayerGame() {
  const codeInput = document.getElementById("mpJoinCode");
  const nameInput = document.getElementById("mpJoinName");
  const code = codeInput?.value.trim().toUpperCase();
  const displayName = nameInput?.value.trim();

  if (!code || code.length !== 4) { setLobbyStatus("Enter a 4-character game code.", true); return; }
  if (!displayName) { setLobbyStatus("Enter your name first.", true); return; }

  const btn = document.getElementById("mpJoinBtn");
  if (btn) btn.disabled = true;
  setLobbyStatus("Joining...");

  try {
    const deviceId = getOrCreateDeviceId();
    const { playerId, rejoined, status: joinStatus } = await apiFetch(`${API_BASE}/${code}/join`, {
      method: "POST",
      body: { displayName, deviceId }
    });

    sessionStorage.setItem("vc_mp_code", code);
    sessionStorage.setItem("vc_mp_playerId", playerId);

    const session = await apiFetch(`${API_BASE}/${code}`);
    const slot = session.players.findIndex((p) => p.id === playerId);

    state.multiplayerSession = {
      code, myPlayerId: playerId, myDeviceId: deviceId,
      myPlayerSlot: slot, isHost: false, hostId: null, mode: "online",
      pollInterval: null, gameStarted: false, lastStateKey: null
    };

    // If the game is already playing (rejoining mid-game), skip the lobby
    // and go straight to polling for the current game state
    if (joinStatus === "playing" || session.status === "playing") {
      showLobbySection();
      setLobbyStatus("Rejoining game in progress...");
      startPolling();
      return;
    }

    showLobbySection();
    setLobbyStatus(rejoined ? "Rejoined! Waiting for host to start..." : "Joined! Waiting for host to start...");
    renderLobbyPanel(session);
    startPolling();
  } catch (e) {
    setLobbyStatus(e.data?.error || e.message || "Failed to join.", true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Start (host only)
// ---------------------------------------------------------------------------

async function startMultiplayerGame() {
  const mp = mpSession();
  if (!mp?.isHost) return;

  const btn = document.getElementById("mpStartBtn");
  if (btn) btn.disabled = true;
  setLobbyStatus("Starting...");

  try {
    const session = await apiFetch(`${API_BASE}/${mp.code}`);
    const lobbyPlayers = session.players;

    stopPolling();

    const pcInput = document.getElementById("playerCount");
    if (pcInput) pcInput.value = lobbyPlayers.length;

    state.gameActive = true;
    setupGame(lobbyPlayers.length, readCurrentFilters(), readCurrentEventFilters());

    lobbyPlayers.forEach((lp, i) => {
      if (state.players[i]) state.players[i].name = lp.name;
    });

    mp.myPlayerSlot = session.players.findIndex((p) => p.id === mp.myPlayerId);

    const initialState = serializeState();
    mp.lastStateKey = `${initialState.turnNumber}:${initialState.currentPlayerIndex}:${initialState.step}`;
    mp.gameStarted = true;

    await apiFetch(`${API_BASE}/${mp.code}/start`, {
      method: "POST",
      body: { hostId: mp.hostId, gameState: initialState }
    });

    hideMpPanel();
    updateMpTurnBanner();
    render();
  } catch (e) {
    setLobbyStatus(e.message || "Failed to start game.", true);
    if (btn) btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

async function leaveMultiplayerGame() {
  const mp = mpSession();
  if (!mp) return;
  stopPolling();
  try {
    await apiFetch(`${API_BASE}/${mp.code}/leave`, {
      method: "POST",
      body: { playerId: mp.myPlayerId }
    });
  } catch { /* best-effort */ }
  state.multiplayerSession = null;
  sessionStorage.removeItem("vc_mp_code");
  sessionStorage.removeItem("vc_mp_playerId");
  sessionStorage.removeItem("vc_mp_hostId");
  showCreateJoinSection();
  document.getElementById("mpPanel")?.setAttribute("open", "");
  updateMpTurnBanner();
  render();
}

// ---------------------------------------------------------------------------
// Turn banner
// ---------------------------------------------------------------------------

function updateMpTurnBanner() {
  const el = document.getElementById("mpTurnBanner");
  if (!el) return;
  const mp = mpSession();
  if (!mp || !mp.gameStarted) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  if (isMyTurn()) {
    el.textContent = "Your turn";
    el.className = "mp-turn-banner mp-your-turn";
  } else {
    const cp = currentPlayer();
    el.textContent = `Waiting for ${cp?.name ?? "opponent"}...`;
    el.className = "mp-turn-banner mp-waiting";
  }
}

// ---------------------------------------------------------------------------
// Auto-detect invite link on page load
// ---------------------------------------------------------------------------

function tryAutoRejoin() {
  const urlCode = new URLSearchParams(location.search).get("game")?.toUpperCase();
  const savedCode = sessionStorage.getItem("vc_mp_code");
  const code = urlCode || savedCode;
  if (!code) return;

  // Open the MP panel
  const panel = document.getElementById("mpPanel");
  if (panel) panel.setAttribute("open", "");

  // If this is an invite link, hide the Create section and show invite note
  if (urlCode) {
    document.getElementById("mpCreateSection")?.classList.add("hidden");
    const note = document.getElementById("mpInviteNote");
    if (note) {
      note.textContent = `You've been invited to game ${urlCode}. Enter your name to join.`;
      note.classList.remove("hidden");
    }
    // Hide the code input row — code is already known from URL
    document.getElementById("mpJoinCodeRow")?.classList.add("hidden");
  }

  // Pre-fill code and focus name
  const codeInput = document.getElementById("mpJoinCode");
  if (codeInput) codeInput.value = code;
  document.getElementById("mpJoinName")?.focus();
}
