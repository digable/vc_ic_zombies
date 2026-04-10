// render.js — Thin orchestrator. Wires updateButtons and the main render() call.
// All rendering helpers live in render-helpers.js, render-board.js, render-panels.js, render-debug.js.

let _lastPhaseSheetPhase = null;

function updatePhaseSheet() {
  const sheet = document.getElementById("phaseSheet");
  if (!sheet) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobile || !state.gameActive) {
    sheet.classList.add("hidden");
    _lastPhaseSheetPhase = null;
    return;
  }

  const activePhase = PHASE_FOR_STEP[state.step];

  if (!activePhase) {
    sheet.classList.add("hidden");
    _lastPhaseSheetPhase = null;
    return;
  }

  // Auto-expand and update label when phase changes
  if (activePhase !== _lastPhaseSheetPhase) {
    document.body.classList.remove("sheet-collapsed");
    _lastPhaseSheetPhase = activePhase;
    const labelEl = document.getElementById("phaseSheetLabel");
    if (labelEl) {
      const group = document.querySelector(`.phase-group[data-phase="${activePhase}"]`);
      labelEl.textContent = group?.querySelector(".phase-label")?.textContent ?? activePhase;
    }
  }

  sheet.classList.remove("hidden");
}

const PHASE_FOR_STEP = {
  [STEP.DRAW_TILE]:    "tile",
  [STEP.COMBAT]:       "combat",
  [STEP.DRAW_EVENTS]:  "events",
  [STEP.ROLL_MOVE]:    "movement",
  [STEP.MOVE]:         "movement",
  [STEP.MOVE_ZOMBIES]: "zombies",
  [STEP.DISCARD]:      "end",
  [STEP.END]:          "end"
};

function updateActivePhaseGroup() {
  if (!state.gameActive) {
    document.querySelectorAll(".phase-group[data-phase]").forEach((g) => {
      g.classList.remove("phase-inactive", "phase-active");
    });
    return;
  }
  const activePhase = PHASE_FOR_STEP[state.step];
  document.querySelectorAll(".phase-group[data-phase]").forEach((g) => {
    const isActive = g.dataset.phase === activePhase;
    g.classList.toggle("phase-inactive", !isActive);
    g.classList.toggle("phase-active", isActive);
  });
}

function isPendingInteraction() {
  return !!(state.pendingCombatDecision || state.pendingEventChoice || state.pendingZombieReplace ||
    state.pendingZombieDiceChallenge || state.pendingZombiePlace || state.pendingZombieMovement ||
    state.pendingForcedMove || state.pendingBuildingSelect || state.pendingDynamiteTarget ||
    state.pendingMinefield || state.pendingRocketLauncher || state.pendingZombieFlood ||
    state.pendingBreakthrough || state.pendingSpaceSelect || state.pendingDuctChoice);
}

function updateButtons() {
  // No game started yet — disable all action buttons
  if (!state.gameActive) {
    [refs.drawTileBtn, refs.rotateLeftBtn, refs.rotateRightBtn, refs.combatBtn,
     refs.drawEventsBtn, refs.rollMoveBtn, refs.endMoveBtn, refs.moveZombiesBtn,
     refs.discardBtn, refs.endTurnBtn, refs.performSpellBtn].forEach((b) => { if (b) b.disabled = true; });
    document.querySelectorAll(".standalone-draw-btn").forEach((b) => { b.disabled = true; });
    refs.moveDirBtns.forEach((b) => { b.disabled = true; });
    return;
  }

  // Online mode: disable everything when it's not this device's turn
  if (state.multiplayerSession?.mode === "online" && !isMyTurn()) {
    [refs.drawTileBtn, refs.rotateLeftBtn, refs.rotateRightBtn, refs.combatBtn,
     refs.drawEventsBtn, refs.rollMoveBtn, refs.endMoveBtn, refs.moveZombiesBtn,
     refs.discardBtn, refs.endTurnBtn, refs.performSpellBtn].forEach((b) => { if (b) b.disabled = true; });
    document.querySelectorAll(".standalone-draw-btn").forEach((b) => { b.disabled = true; });
    refs.moveDirBtns.forEach((b) => { b.disabled = true; });
    updateMpTurnBanner();
    return;
  }
  updateMpTurnBanner();

  if (isPendingInteraction()) {
    refs.drawTileBtn.disabled = true;
    document.querySelectorAll(".standalone-draw-btn").forEach((b) => { b.disabled = true; });
    refs.rotateLeftBtn.disabled = true;
    refs.rotateRightBtn.disabled = true;
    refs.combatBtn.disabled = true;
    refs.drawEventsBtn.disabled = true;
    refs.rollMoveBtn.disabled = true;
    refs.endMoveBtn.disabled = true;
    refs.moveZombiesBtn.disabled = true;
    refs.discardBtn.disabled = true;
    refs.endTurnBtn.disabled = true;
    if (refs.performSpellBtn) refs.performSpellBtn.disabled = true;
    // Direction buttons stay enabled during forced movement so the controller
    // can move the target player (Brain Cramp / Where Did Everybody Go?).
    refs.moveDirBtns.forEach((btn) => {
      btn.disabled = !state.pendingForcedMove;
    });
    return;
  }

  const p = currentPlayer();
  const combatRequired = isCombatRequiredForCurrentPlayer();

  const hasBaseDeck = state.mapDeck && state.mapDeck.length > 0;
  refs.drawTileBtn.style.display = (state.standaloneDecks && Object.keys(state.standaloneDecks).length > 0 && !hasBaseDeck) ? "none" : "";
  refs.drawTileBtn.disabled = state.step !== STEP.DRAW_TILE || state.gameOver || Boolean(state.pendingTile) || state.mapDeck.length === 0;
  // Once any tile is drawn, disable all standalone draw buttons — only one draw per turn.
  if (state.step !== STEP.DRAW_TILE || state.pendingTile || state.gameOver) {
    document.querySelectorAll(".standalone-draw-btn").forEach((b) => { b.disabled = true; });
  }
  refs.rotateLeftBtn.disabled = !state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE;
  refs.rotateRightBtn.disabled = !state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE;
  refs.combatBtn.disabled = state.step !== STEP.COMBAT || state.gameOver || !combatRequired;
  refs.drawEventsBtn.disabled = state.step !== STEP.DRAW_EVENTS || state.gameOver;
  refs.rollMoveBtn.disabled = state.step !== STEP.ROLL_MOVE || state.gameOver;
  if (state.step === STEP.ROLL_MOVE && !state.gameOver) {
    if (p.pendingDuctTeleport) {
      const destTile = getTileAtSpace(p.pendingDuctTeleport.x, p.pendingDuctTeleport.y);
      refs.rollMoveBtn.textContent = `Air Duct → ${destTile?.name || "store"}`;
    } else {
      refs.rollMoveBtn.textContent = "Roll Movement";
    }
  } else {
    refs.rollMoveBtn.textContent = "Roll Movement";
  }
  const mustExitBuilding = p.claustrophobiaActive && isSpaceBuilding(p.x, p.y);
  refs.endMoveBtn.disabled = state.step !== STEP.MOVE || state.gameOver || mustExitBuilding;
  refs.moveZombiesBtn.disabled = state.step !== STEP.MOVE_ZOMBIES || state.gameOver || state.zombies.size === 0;
  refs.discardBtn.disabled = state.step !== STEP.DISCARD || state.gameOver;
  refs.endTurnBtn.disabled = state.step !== STEP.END || state.gameOver;
  if (refs.performSpellBtn) {
    refs.performSpellBtn.disabled = state.gameOver || state.step !== STEP.END || !canAttemptSpell(p);
  }

  const claustroInBuilding = p.claustrophobiaActive && isSpaceBuilding(p.x, p.y);
  refs.moveDirBtns.forEach((btn) => {
    const dir = btn.dataset.dir;
    const mover = state.pendingForcedMove
      ? state.players.find((pl) => pl.id === state.pendingForcedMove.targetPlayerId) ?? p
      : p;
    let disabled = state.step !== STEP.MOVE || state.gameOver || state.movesRemaining <= 0 || !canMove(mover, dir);
    // Claustrophobia: while inside a building, block directions leading to more building subtiles
    if (!disabled && claustroInBuilding) {
      const d = DIRS[dir];
      if (isSpaceBuilding(mover.x + d.x, mover.y + d.y)) disabled = true;
    }
    btn.disabled = disabled;
  });
}

function render() {
  renderMeta();
  renderBoard();
  renderPlayerTrailSvg();
  renderPlayers();
  renderPlayerStrip();

  renderHand();
  renderSheetCardTray();
  renderDeckInfo();
  renderStandaloneDeckInfo();
  renderEventDeckInfo();
  renderCombatDecision();
  renderEventChoice();
  renderZombieReplacePanel();
  renderZombieDiceChallenge();
  renderDuctChoice();
  renderLog();
  rebuildStandaloneDrawBtns();
  updateButtons();
  updateActivePhaseGroup();
  updatePhaseSheet();
  renderMoveStatus();
  renderGameOver();
  renderKnockoutBanner();
  renderSaveLoadPanel();
}
