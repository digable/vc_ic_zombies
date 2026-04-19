function collTagsHtml(meta) {
  const isBase = meta.requiresBase === null;
  const isBoth = isBase && meta.standaloneDeck;
  if (isBoth) {
    return `<span class="coll-tag coll-tag-base">base</span> <span class="coll-tag coll-tag-expansion">expansion</span>`;
  }
  return `<span class="coll-tag ${isBase ? "coll-tag-base" : "coll-tag-expansion"}">${isBase ? "base" : "expansion"}</span>`;
}

function buildCollectionRows() {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;
  const eventCounts = getEventCardCountsByCollection();
  const mapCounts   = getMapTileCountsByCollection();

  Object.entries(COLLECTION_META).forEach(([collKey, meta]) => {
    const isBase = meta.requiresBase === null;

    const nameSpan = document.createElement("span");
    nameSpan.className = "setup-coll-name";
    nameSpan.setAttribute("data-coll", collKey);
    const sc = meta.shortCode ? ` <span class="coll-short-code">${meta.shortCode}</span>` : "";
    nameSpan.innerHTML = `${meta.label}${sc} ${collTagsHtml(meta)}<br><span class="coll-counts" data-coll-counts="${collKey}"></span>`;

    grid.appendChild(nameSpan);

    if (mapCounts[collKey]) {
      const mapInput = document.createElement("input");
      mapInput.type = "checkbox";
      mapInput.setAttribute("data-deck-coll", collKey);
      mapInput.setAttribute("data-deck-state", "enabled");
      if (collKey === COLLECTIONS.DIRECTORS_CUT) mapInput.checked = true;
      if (!isBase) mapInput.setAttribute("data-requires-base", meta.requiresBase);
      grid.appendChild(mapInput);
    } else {
      grid.appendChild(document.createElement("span"));
    }

    if (eventCounts[collKey]) {
      const eventInput = document.createElement("input");
      eventInput.type = "checkbox";
      eventInput.setAttribute("data-event-coll", collKey);
      eventInput.setAttribute("data-event-state", "enabled");
      if (collKey === COLLECTIONS.DIRECTORS_CUT) eventInput.checked = true;
      if (!isBase) eventInput.setAttribute("data-event-requires-base", meta.requiresBase);
      grid.appendChild(eventInput);
    } else {
      grid.appendChild(document.createElement("span"));
    }
  });
}

function rebuildStandaloneDrawBtns() {
  const container = document.getElementById("standaloneDrawBtns");
  if (!container) return;
  container.innerHTML = "";
  Object.keys(state.standaloneDecks).forEach((collKey) => {
    const meta = COLLECTION_META[collKey];
    const label = meta?.label || collKey;
    const btn = document.createElement("button");
    btn.id = `drawBtn_${collKey}`;
    btn.textContent = `Draw ${label} Tile`;
    btn.className = "standalone-draw-btn";
    const deck = state.standaloneDecks[collKey];
    btn.disabled = !state.activeStandaloneDecks.has(collKey) || (deck && deck.length === 0);
    btn.addEventListener("click", () => drawAndPlaceTile(collKey));
    const row = document.createElement("div");
    row.className = "row";
    row.appendChild(btn);
    container.appendChild(row);
  });
}

// When an expansion without Z1 enabled is combined with another expansion,
// auto-enable Z1 because expansions can only be mixed via Z1.
// When an expansion is unchecked, uncheck any other expansions that can't be
// paired without Z1.
function enforceCollectionCompatibility() {
  const z1Key = COLLECTIONS.DIRECTORS_CUT;
  const z1Checkbox = document.querySelector(`[data-deck-coll="${z1Key}"][data-deck-state="enabled"]`);
  if (!z1Checkbox) return;

  const enabledKeys = [];
  document.querySelectorAll("[data-deck-coll][data-deck-state='enabled']").forEach((el) => {
    if (el.checked) enabledKeys.push(el.getAttribute("data-deck-coll"));
  });

  // Count standalone/expansion collections that are enabled (excluding Z1 itself)
  const expansionsEnabled = enabledKeys.filter((c) => {
    if (c === z1Key) return false;
    const meta = COLLECTION_META[c];
    return meta && meta.compatibleWith;
  });

  // If 2+ expansions are enabled and Z1 is not, auto-enable Z1
  if (expansionsEnabled.length >= 2 && !z1Checkbox.checked) {
    z1Checkbox.checked = true;
  }

  // If an expansion that only supports Z1 pairings is enabled alongside an
  // incompatible expansion (and Z1 is not), warn by unchecking incompatible ones
  if (!z1Checkbox.checked && expansionsEnabled.length >= 2) {
    // uncheck all but the most recently toggled — we can't tell which that is,
    // so leave the first and uncheck the rest
    expansionsEnabled.slice(1).forEach((c) => {
      const el = document.querySelector(`[data-deck-coll="${c}"][data-deck-state="enabled"]`);
      if (el) el.checked = false;
    });
  }
}

function autoCheckGutsForZ5() {
  const gutsCheckbox = document.getElementById("useGutsCheckbox");
  if (!gutsCheckbox) return;
  const z5Key = COLLECTIONS.SCHOOLS_OUT_FOREVER;
  const z5MapChecked = document.querySelector(`[data-deck-coll="${z5Key}"][data-deck-state="enabled"]`)?.checked;
  const z5EventChecked = document.querySelector(`[data-event-coll="${z5Key}"][data-event-state="enabled"]`)?.checked;
  if (z5MapChecked || z5EventChecked) {
    gutsCheckbox.checked = true;
  }
}

function autoCheckSewerTokensForZ6() {
  const sewerCheckbox = document.getElementById("useSewerTokensCheckbox");
  if (!sewerCheckbox) return;
  const z6Key = COLLECTIONS.SIX_FEET_UNDER;
  const z6MapChecked = document.querySelector(`[data-deck-coll="${z6Key}"][data-deck-state="enabled"]`)?.checked;
  if (z6MapChecked) {
    sewerCheckbox.checked = true;
  }
}

function attachListeners() {
  refs.newGameBtn.addEventListener("click", () => {
    refs.newGameBtn.classList.remove("needs-restart");
    const count = Number(refs.playerCount.value) || 2;
    state.gameActive = true;
    state.useGuts = !!(document.getElementById("useGutsCheckbox")?.checked);
    state.useSewerTokens = !!(document.getElementById("useSewerTokensCheckbox")?.checked);
    setupGame(Math.max(1, Math.min(MAX_PLAYERS, count)), readCurrentFilters(), readCurrentEventFilters());
    if (window.matchMedia("(max-width: 1080px)").matches) switchMobileTab("map");
  });

  document.querySelectorAll("[data-requires-base][data-deck-state='enabled']").forEach((el) => {
    el.addEventListener("change", () => {
      if (!el.checked) return;
      const baseCol = el.getAttribute("data-requires-base");
      const baseEnabled = document.querySelector(
        `[data-deck-coll="${baseCol}"][data-deck-state="enabled"]`
      );
      if (baseEnabled && !baseEnabled.checked) {
        baseEnabled.checked = true;
        updateDeckPreviewCounts();
      }
    });
  });

  const grid = document.getElementById("collectionGrid");
  if (grid) {
    grid.addEventListener("change", () => {
      enforceCollectionCompatibility();
      updateDeckPreviewCounts();
      autoCheckGutsForZ5();
      autoCheckSewerTokensForZ6();
    });
  }

  document.querySelectorAll("[data-event-requires-base][data-event-state='enabled']").forEach((el) => {
    el.addEventListener("change", () => {
      if (!el.checked) return;
      const baseCol = el.getAttribute("data-event-requires-base");
      const baseEnabled = document.querySelector(
        `[data-event-coll="${baseCol}"][data-event-state="enabled"]`
      );
      if (baseEnabled && !baseEnabled.checked) {
        baseEnabled.checked = true;
        updateDeckPreviewCounts();
      }
    });
  });


  if (refs.gameOverNewGameBtn) {
    refs.gameOverNewGameBtn.addEventListener("click", () => {
      refs.gameOverOverlay.classList.add("hidden");
      document.getElementById("setupSection").classList.remove("hidden");
      updateDeckPreviewCounts();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    switch (e.key) {
      case "r": case "R": rotatePendingTile(1); break;
      case "q": case "Q": state.isoRotateZ = (state.isoRotateZ || 45) - 45; applyIsoTransform(); break;
      case "e": case "E": state.isoRotateZ = (state.isoRotateZ || 45) + 45; applyIsoTransform(); break;
      case "x": case "X": state.boardPanX = 0; state.boardPanY = 0; state.boardZoom = 1.0; applyIsoTransform(); break;
      case "z": case "Z": toggleIsoView(); break;
      case "w": case "W": refs.moveDirBtns.find(b => b.dataset.dir === "N")?.click(); break;
      case "s": case "S": refs.moveDirBtns.find(b => b.dataset.dir === "S")?.click(); break;
      case "a": case "A": refs.moveDirBtns.find(b => b.dataset.dir === "W")?.click(); break;
      case "d": case "D": refs.moveDirBtns.find(b => b.dataset.dir === "E")?.click(); break;
      case "PageUp":   e.preventDefault(); state.boardZoom = Math.min(ZOOM_MAX, (state.boardZoom || 1.0) + ZOOM_INCREMENT); applyIsoTransform(); break;
      case "PageDown": e.preventDefault(); state.boardZoom = Math.max(ZOOM_MIN, (state.boardZoom || 1.0) - ZOOM_INCREMENT); applyIsoTransform(); break;
      case "ArrowUp":    e.preventDefault(); state.boardPanY = (state.boardPanY || 0) - 80; applyIsoTransform(); break;
      case "ArrowDown":  e.preventDefault(); state.boardPanY = (state.boardPanY || 0) + 80; applyIsoTransform(); break;
      case "ArrowLeft":  e.preventDefault(); state.boardPanX = (state.boardPanX || 0) - 80; applyIsoTransform(); break;
      case "ArrowRight": e.preventDefault(); state.boardPanX = (state.boardPanX || 0) + 80; applyIsoTransform(); break;
      case "Enter": endTurnWithLockCheck(); break;
    }
  });

  refs.drawTileBtn.addEventListener("click", () => drawAndPlaceTile("base"));
  refs.rotateLeftBtn.addEventListener("click", () => rotatePendingTile(-1));
  refs.rotateRightBtn.addEventListener("click", () => rotatePendingTile(1));
  refs.combatBtn.addEventListener("click", resolveCombatOnCurrentTile);
  refs.drawEventsBtn.addEventListener("click", drawEventsToThree);
  refs.rollMoveBtn.addEventListener("click", rollMovement);
  refs.endMoveBtn.addEventListener("click", endMovementEarly);
  refs.moveZombiesBtn.addEventListener("click", startZombieMovement);
  refs.discardBtn.addEventListener("click", discardSelected);
  refs.endTurnBtn.addEventListener("click", endTurnWithLockCheck);
  if (refs.performSpellBtn) refs.performSpellBtn.addEventListener("click", attemptSpell);
  if (refs.placeSewerTokenBtn) {
    refs.placeSewerTokenBtn.addEventListener("click", () => {
      if (!state.useSewerTokens) return;
      if (state.pendingSewerTokenPlace) {
        state.pendingSewerTokenPlace = null;
        logLine("Sewer token placement cancelled.");
        render();
        return;
      }
      const player = currentPlayer();
      if (!player || player.sewerTokensAvailable <= 0 || (state.step !== STEP.ROLL_MOVE && state.step !== STEP.MOVE) || state.gameOver) return;
      state.pendingSewerTokenPlace = { playerId: player.id };
      logLine(`${player.name} is placing a sewer token — click any road space.`);
      render();
    });
  }

  refs.moveDirBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.pendingForcedMove) {
        forcedMoveTarget(btn.dataset.dir);
      } else {
        movePlayer(btn.dataset.dir);
      }
    });
  });

  refs.handList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const playIndex = target.getAttribute("data-play-index");
    if (playIndex !== null) { playEvent(Number(playIndex)); return; }

    const stageIndex = target.getAttribute("data-stage-index");
    if (stageIndex !== null) { stagePage(Number(stageIndex)); return; }

    const usePageIndex = target.getAttribute("data-use-page-index");
    if (usePageIndex !== null) { usePage(Number(usePageIndex)); return; }

    const selectIndex = target.getAttribute("data-select-index");
    if (selectIndex !== null) { toggleHandSelection(Number(selectIndex)); return; }

    const activateIndex = target.getAttribute("data-activate-item-index");
    if (activateIndex !== null) { activateItem(Number(activateIndex)); }
  });

  // Mobile hand panel — same delegation as refs.handList so cards can be played from Hand tab.
  const mobileHandPanel = document.getElementById("mobileHandPanel");
  if (mobileHandPanel) {
    mobileHandPanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const playIndex = target.getAttribute("data-play-index");
      if (playIndex !== null) { playEvent(Number(playIndex)); return; }
      const stageIndex = target.getAttribute("data-stage-index");
      if (stageIndex !== null) { stagePage(Number(stageIndex)); return; }
      const usePageIndex = target.getAttribute("data-use-page-index");
      if (usePageIndex !== null) { usePage(Number(usePageIndex)); return; }
      const selectIndex = target.getAttribute("data-select-index");
      if (selectIndex !== null) { toggleHandSelection(Number(selectIndex)); return; }
      const activateIndex = target.getAttribute("data-activate-item-index");
      if (activateIndex !== null) { activateItem(Number(activateIndex)); }
    });
  }

  // Board click — routes to whichever pending interaction is active.
  // See pending state priority order documented in core.js state definition.
  refs.board.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (state.pendingZombieMovement) {
      const blockedByOther = !!(state.pendingCombatDecision || state.pendingEventChoice ||
        state.pendingZombieReplace || state.pendingZombieDiceChallenge || state.pendingZombiePlace ||
        state.pendingForcedMove || state.pendingBuildingSelect || state.pendingDynamiteTarget ||
        state.pendingMinefield || state.pendingRocketLauncher || state.pendingZombieFlood ||
        state.pendingBreakthrough || state.pendingSpaceSelect || state.pendingDuctChoice);
      if (!blockedByOther) {
        const mc = target.closest(".micro-cell");
        if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
          manualMoveZombie(key(Number(mc.dataset.sx), Number(mc.dataset.sy)));
        }
      }
      return;
    }

    if (state.pendingRocketLauncher) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleRocketLauncherClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingZombieFlood) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleZombieFloodClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingSpaceSelect) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleSpaceSelectClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingMinefield) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleMinefieldClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingDynamiteTarget) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleDynamiteTargetClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingFrisbeeTarget) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleFrisbeeTargetClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingSewerTokenPlace) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        placeSewerToken(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingBuildingSelect) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleBuildingSelectClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingZombiePlace) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleZombiePlaceClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    if (state.pendingZombieReplace) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        handleZombieReplaceClick(Number(mc.dataset.sx), Number(mc.dataset.sy));
      }
      return;
    }

    const cell = target.closest(".cell");
    if (!(cell instanceof HTMLElement)) return;

    const x = cell.dataset.placeX;
    const y = cell.dataset.placeY;
    if (x !== undefined && y !== undefined) {
      placePendingTileAt(Number(x), Number(y));
    }
  });

  if (refs.zombieDiceChallengePanel) {
    refs.zombieDiceChallengePanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-zdice-action");
      if (action) resolveZombieDiceChallenge(action);
    });
  }

  if (refs.zombieReplacePanel) {
    refs.zombieReplacePanel.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      const forcedAction = event.target.getAttribute("data-forced-move-action");
      if (forcedAction === "end") { endForcedMovement(); return; }
      if (event.target.classList.contains("pfm-dir-btn")) {
        const dir = event.target.getAttribute("data-dir");
        if (dir) { forcedMoveTarget(dir); return; }
      }
      const zmAction = event.target.getAttribute("data-zombie-move-action");
      if (zmAction === "auto") { autoFinishZombieMovement(); return; }
      if (zmAction === "done") { flushZombieMovement(); return; }
      if (event.target.id === "zombieReplaceDoneBtn") {
        if (state.pendingRocketLauncher) finishRocketLauncher();
        else if (state.pendingZombieFlood) finishZombieFlood();
        else if (state.pendingSpaceSelect) finishSpaceSelect();
        else if (state.pendingMinefield) finishMinefield();
        else if (state.pendingDynamiteTarget) finishDynamite();
        else if (state.pendingFrisbeeTarget) finishFrisbee();
        else if (state.pendingZombiePlace) finishZombiePlace();
        else finishZombieReplace();
      }
    });
  }

  if (refs.ductChoicePanel) {
    refs.ductChoicePanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const destIndex = target.getAttribute("data-duct-dest");
      if (destIndex !== null) { confirmDuctTeleport(Number(destIndex)); return; }
      if (target.getAttribute("data-duct-skip")) skipDuct();
    });
  }

  if (refs.eventChoicePanel) {
    refs.eventChoicePanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const choice = target.getAttribute("data-event-choice");
      if (choice) resolveEventChoice(choice);
    });
  }

  if (refs.combatDecisionPanel) {
    refs.combatDecisionPanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const action = target.getAttribute("data-combat-action");
      if (action) {
        resolvePendingCombatDecision(action);
      }
    });
  }

  // Pan (left drag) + Spin/Tilt (right drag in iso mode)
  const boardWrap = document.querySelector(".board-wrap");
  if (boardWrap) {
    let isPanning = false;
    let isSpinning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOriginX = 0;
    let panOriginY = 0;
    let spinStartAngle = 0;
    let spinOriginZ = 0;

    boardWrap.addEventListener("mousedown", (e) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, input, select, label, a")) return;
      if (e.button === 0) {
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panOriginX = state.boardPanX || 0;
        panOriginY = state.boardPanY || 0;
        boardWrap.classList.add("panning");
        e.preventDefault();
      } else if (e.button === 2 && state.isoView) {
        isSpinning = true;
        const boardEl = document.getElementById("board");
        const br = boardEl ? boardEl.getBoundingClientRect() : boardWrap.getBoundingClientRect();
        const wr = boardWrap.getBoundingClientRect();
        const cx = br.left + br.width / 2;
        const cy = br.top + br.height / 2;
        spinStartAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        spinOriginZ = state.isoRotateZ;
        boardWrap.classList.add("panning");
        const svg = document.getElementById("spinIndicator");
        const centerMark = document.getElementById("spinCenterMark");
        const cursorDot  = document.getElementById("spinCursorDot");
        const radiusLine = document.getElementById("spinRadiusLine");
        if (svg && centerMark && cursorDot && radiusLine) {
          const bx = cx - wr.left;
          const by = cy - wr.top;
          const mx = e.clientX - wr.left;
          const my = e.clientY - wr.top;
          centerMark.setAttribute("cx", bx);
          centerMark.setAttribute("cy", by);
          cursorDot.setAttribute("cx", mx);
          cursorDot.setAttribute("cy", my);
          radiusLine.setAttribute("x1", bx); radiusLine.setAttribute("y1", by);
          radiusLine.setAttribute("x2", mx); radiusLine.setAttribute("y2", my);
          svg.classList.remove("hidden");
        }
        e.preventDefault();
      }
    });

    boardWrap.addEventListener("contextmenu", (e) => {
      if (state.isoView) e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (isPanning) {
        state.boardPanX = panOriginX + (e.clientX - panStartX);
        state.boardPanY = panOriginY + (e.clientY - panStartY);
        applyIsoTransform();
      } else if (isSpinning) {
        const wr2 = boardWrap.getBoundingClientRect();
        const boardEl2 = document.getElementById("board");
        const br2 = boardEl2 ? boardEl2.getBoundingClientRect() : wr2;
        const cx2 = br2.left + br2.width / 2;
        const cy2 = br2.top + br2.height / 2;
        const angle = Math.atan2(e.clientY - cy2, e.clientX - cx2) * (180 / Math.PI);
        const raw = spinOriginZ + (angle - spinStartAngle);
        state.isoRotateZ = Math.round(raw / ISO_SPIN_SNAP) * ISO_SPIN_SNAP;
        applyIsoTransform();
        const cursorDot  = document.getElementById("spinCursorDot");
        const radiusLine = document.getElementById("spinRadiusLine");
        if (cursorDot && radiusLine) {
          const mx = e.clientX - wr2.left;
          const my = e.clientY - wr2.top;
          cursorDot.setAttribute("cx", mx);
          cursorDot.setAttribute("cy", my);
          radiusLine.setAttribute("x2", mx);
          radiusLine.setAttribute("y2", my);
        }
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) { isPanning = false; }
      if (e.button === 2) {
        isSpinning = false;
        const svg = document.getElementById("spinIndicator");
        if (svg) svg.classList.add("hidden");
      }
      if (!isPanning && !isSpinning) boardWrap.classList.remove("panning");
    });

    // Zoom: ctrl+wheel (zooms toward cursor)
    boardWrap.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const porthole = boardWrap.querySelector(".porthole");
      const rect = (porthole || boardWrap).getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const oldZoom = state.boardZoom || 1.0;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldZoom + (e.deltaY > 0 ? -ZOOM_INCREMENT : ZOOM_INCREMENT)));
      const px = state.boardPanX || 0;
      const py = state.boardPanY || 0;
      state.boardPanX = cursorX - (cursorX - px) * (newZoom / oldZoom);
      state.boardPanY = cursorY - (cursorY - py) * (newZoom / oldZoom);
      state.boardZoom = newZoom;
      applyIsoTransform();
    }, { passive: false });

    // Pan + zoom: touch
    let lastPinchDist = null;
    let lastTouchX = null;
    let lastTouchY = null;

    boardWrap.addEventListener("touchstart", (e) => {
      // On mobile, only pan/zoom when the touch starts inside the porthole.
      // This lets the turn-strip and board-header scroll/interact normally.
      const porthole = boardWrap.querySelector(".porthole");
      if (porthole && !porthole.contains(e.target)) return;

      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchX = null;
        lastTouchY = null;
      } else if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        lastPinchDist = null;
      }
    }, { passive: true });

    boardWrap.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && lastPinchDist !== null) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        state.boardZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (state.boardZoom || 1.0) * (dist / lastPinchDist)));
        lastPinchDist = dist;
        applyIsoTransform();
      } else if (e.touches.length === 1 && lastTouchX !== null) {
        e.preventDefault();
        state.boardPanX = (state.boardPanX || 0) + (e.touches[0].clientX - lastTouchX);
        state.boardPanY = (state.boardPanY || 0) + (e.touches[0].clientY - lastTouchY);
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        applyIsoTransform();
      }
    }, { passive: false });

    boardWrap.addEventListener("touchend", () => {
      lastPinchDist = null;
      lastTouchX = null;
      lastTouchY = null;
    }, { passive: true });
  }

  // Turn-strip direction buttons (proxy for the main moveDirBtns)
  document.querySelectorAll(".ts-moveDirBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.pendingForcedMove) {
        forcedMoveTarget(btn.dataset.dir);
      } else {
        movePlayer(btn.dataset.dir);
      }
    });
  });

}


function populateCollectionCounts() {
  const tileCounts = getMapTileCountsByCollection();
  const eventCounts = getEventCardCountsByCollection();
  document.querySelectorAll("[data-coll-counts]").forEach((el) => {
    const col = el.getAttribute("data-coll-counts");
    const tiles = tileCounts[col] || 0;
    const events = eventCounts[col] || 0;
    if (tiles === 0 && events === 0) {
      el.textContent = "";
    } else {
      el.textContent = `(${tiles} map tiles, ${events} event cards)`;
    }
  });
  document.querySelectorAll("[data-event-coll-counts]").forEach((el) => {
    const col = el.getAttribute("data-event-coll-counts");
    const events = eventCounts[col] || 0;
    el.textContent = events ? `(${events})` : "";
  });
}

function readCurrentFilters() {
  const filters = {};
  document.querySelectorAll("[data-deck-coll]").forEach((el) => {
    const col = el.getAttribute("data-deck-coll");
    const st = el.getAttribute("data-deck-state");
    if (!filters[col]) filters[col] = { enabled: false };
    if (el.checked) filters[col][st] = true;
  });
  return filters;
}

function readCurrentEventFilters() {
  const filters = {};
  document.querySelectorAll("[data-event-coll]").forEach((el) => {
    const col = el.getAttribute("data-event-coll");
    const st = el.getAttribute("data-event-state");
    if (!filters[col]) filters[col] = { enabled: false };
    if (el.checked) filters[col][st] = true;
  });
  return filters;
}

function updateDeckPreviewCounts() {
  refs.newGameBtn.classList.add("needs-restart");
  const el = document.getElementById("deckPreviewCount");
  if (!el) return;
  const filters = readCurrentFilters();
  const mapPreview = buildMapDeck(filters);
  const eventPreview = buildEventDeck(readCurrentEventFilters());

  // Build standalone deck previews for any enabled standalone collections
  const standalonePreview = {};
  Object.entries(COLLECTION_META).forEach(([collKey, meta]) => {
    if (!meta.standaloneDeck) return;
    const rule = filters[collKey];
    if (!rule || !rule.enabled) return;
    standalonePreview[collKey] = buildStandaloneDeck(collKey, filters);
  });
  const standaloneTotal = Object.values(standalonePreview).reduce((s, d) => s + d.length, 0);

  const mapTotal = mapPreview.length + 1 + standaloneTotal; // +1 for pre-placed town square
  el.textContent = `Deck preview: ${mapTotal} map tile${mapTotal !== 1 ? "s" : ""}, ${eventPreview.length} event card${eventPreview.length !== 1 ? "s" : ""}`;
  renderDeckInfo(mapPreview);
  renderStandaloneDeckInfo(Object.keys(standalonePreview).length > 0 ? standalonePreview : null);
  renderEventDeckInfo(eventPreview);
}

function applyCollectionTooltips() {
  document.querySelectorAll(".setup-coll-name[data-coll]").forEach((el) => {
    const meta = COLLECTION_META[el.getAttribute("data-coll")];
    if (!meta) return;

    const headerParts = [];
    if (meta.type)    headerParts.push(meta.type);
    if (meta.version) headerParts.push(/^\d+(\.\d+)*$/.test(String(meta.version)) ? `v${meta.version}` : meta.version);
    if (meta.year)    headerParts.push(meta.year);

    const lines = [];
    if (headerParts.length) lines.push(headerParts.join("  ·  "));
    if (meta.description)   lines.push(meta.description);
    if (meta.creator)       lines.push(`By ${meta.creator}`);

    if (lines.length) el.setAttribute("data-tooltip", lines.join("\n"));
  });
}

// Maps each dynamic panel to its sentinel (home in .controls) and its slot in the turn-strip.
// Moving the actual DOM node keeps all refs, event listeners, and render targets intact.
var PANEL_MOUNTS = [
  { id: "standaloneDrawBtns",      sentinel: "sentinel-standalone",    slot: "ts-slot-standalone"    },
  { id: "combatDecisionPanel",     sentinel: "sentinel-combat",        slot: "ts-slot-combat"        },
  { id: "eventChoicePanel",        sentinel: "sentinel-events-choice", slot: "ts-slot-events-choice" },
  { id: "zombieDiceChallengePanel",sentinel: "sentinel-events-dice",   slot: "ts-slot-events-dice"   },
  { id: "moveStatusMsg",           sentinel: "sentinel-move-status",   slot: "ts-slot-move-status"   },
  { id: "ductChoicePanel",         sentinel: "sentinel-move-duct",     slot: "ts-slot-move-duct"     },
  { id: "zombieReplacePanel",      sentinel: "sentinel-zombies",       slot: "ts-slot-zombies"       },
];

function syncMobilePanels(toMap) {
  PANEL_MOUNTS.forEach(function(m) {
    var panel = document.getElementById(m.id);
    if (!panel) return;
    if (toMap) {
      var slot = document.getElementById(m.slot);
      if (slot) slot.appendChild(panel);
    } else {
      var sentinel = document.getElementById(m.sentinel);
      if (sentinel) sentinel.parentNode.insertBefore(panel, sentinel.nextSibling);
    }
  });
}

function openTurnStep(step) {
  var activeStep = getActiveStep();
  document.querySelectorAll(".turn-pill").forEach(function(el) {
    el.classList.toggle("turn-step--open", el.dataset.step === step);
    el.classList.toggle("turn-step--active", el.dataset.step === activeStep);
  });
  document.querySelectorAll(".turn-body").forEach(function(el) {
    el.classList.toggle("turn-step--open", el.dataset.step === step);
  });
}

function getActiveStep() {
  if (!state.gameActive) return "tile";
  // Pending interactions override state.step so the right accordion opens.
  if (state.pendingCombatDecision)                                    return "combat";
  if (state.pendingEventChoice || state.pendingZombieDiceChallenge)   return "events";
  if (state.pendingZombieReplace || state.pendingZombiePlace ||
      state.pendingZombieMovement || state.pendingForcedMove)          return "zombies";
  if (state.pendingDuctChoice)                                        return "move";
  switch (state.step) {
    case STEP.DRAW_TILE:   return "tile";
    case STEP.COMBAT:      return "combat";
    case STEP.DRAW_EVENTS: return "events";
    case STEP.ROLL_MOVE:
    case STEP.MOVE:        return "move";
    case STEP.MOVE_ZOMBIES:return "zombies";
    case STEP.DISCARD:
    case STEP.END:         return "end";
    default:               return "tile";
  }
}

// ---- In Play panel (turn strip + hand tab) --------------------------------

function buildInPlayHtml(excludeCurrentPlayer) {
  if (!state.gameActive || !state.players || state.players.length === 0) return "";
  var cp = currentPlayer();
  var rows = [];
  state.players.forEach(function(p) {
    if (excludeCurrentPlayer && p.id === cp.id) return;
    var cards = [];
    if (p.items) p.items.forEach(function(c) { cards.push({ name: c.name, desc: c.description }); });
    if (p.botdPages) p.botdPages.forEach(function(c) { cards.push({ name: c.name, desc: c.description, botd: true }); });
    if (cards.length === 0) return;
    var chipsHtml = cards.map(function(c) {
      return "<span class='ts-inplay-chip" + (c.botd ? " ts-inplay-chip--botd" : "") + "' title='" + (c.desc || "").replace(/'/g, "\u2019") + "'>" + c.name + "</span>";
    }).join("");
    rows.push("<div class='ts-inplay-player'><span class='ts-inplay-name'>" + p.name + "</span>" + chipsHtml + "</div>");
  });
  return rows.join("");
}

function renderInPlayRow() {
  var el = document.getElementById("tsInPlayRow");
  if (!el) return;
  var html = buildInPlayHtml(false);
  if (html) {
    el.innerHTML = "<div class='ts-inplay-label'>Cards in Play</div>" + html;
    el.style.display = "";
  } else {
    el.style.display = "none";
  }
}

function syncTurnStripButtons() {
  // Sync disabled state from the canonical refs buttons to the turn-strip proxy buttons.
  [
    ["ts-drawTileBtn",    "drawTileBtn"],
    ["ts-rotateLeftBtn",  "rotateLeftBtn"],
    ["ts-rotateRightBtn", "rotateRightBtn"],
    ["ts-combatBtn",      "combatBtn"],
    ["ts-drawEventsBtn",  "drawEventsBtn"],
    ["ts-rollMoveBtn",    "rollMoveBtn"],
    ["ts-endMoveBtn",     "endMoveBtn"],
    ["ts-moveZombiesBtn", "moveZombiesBtn"],
    ["ts-discardBtn",     "discardBtn"],
    ["ts-endTurnBtn",     "endTurnBtn"],
    ["ts-performSpellBtn","performSpellBtn"],
  ].forEach(function(pair) {
    var ts  = document.getElementById(pair[0]);
    var src = document.getElementById(pair[1]);
    if (ts && src) {
      ts.disabled = src.disabled;
      // Keep dynamic button labels in sync
      if (pair[0] === "ts-rollMoveBtn" || pair[0] === "ts-drawEventsBtn") ts.textContent = src.textContent;
    }
  });

  // Direction buttons
  document.querySelectorAll(".ts-moveDirBtn").forEach(function(btn) {
    var dir = btn.dataset.dir;
    var src = refs.moveDirBtns.find(function(b) { return b.dataset.dir === dir; });
    if (src) btn.disabled = src.disabled;
  });

  // Text span mirrors
  var tsMove = document.getElementById("ts-moveRollOutput");
  if (tsMove && refs.moveRollOutput) tsMove.textContent = refs.moveRollOutput.textContent;
  var tsZombie = document.getElementById("ts-zombieRollOutput");
  if (tsZombie && refs.zombieRollOutput) tsZombie.textContent = refs.zombieRollOutput.textContent;
  var tsPending = document.getElementById("ts-pendingTileInfo");
  if (tsPending && refs.pendingTileInfo) tsPending.textContent = refs.pendingTileInfo.textContent;
}

function syncTurnStrip() {
  syncTurnStripButtons();
  renderInPlayRow();
  var activeStep = getActiveStep();
  openTurnStep(activeStep);
  // Show/hide the forced-discard hint in the End Turn step body.
  var discardHint = document.getElementById("ts-discard-hint");
  if (discardHint) {
    var isDiscard = state.step === STEP.DISCARD;
    discardHint.style.display = isDiscard ? "" : "none";
    if (isDiscard) {
      discardHint.innerHTML = "Too many cards \u2014 go to the <button class='ts-discard-hint-link' onclick='switchMobileTab(\"hand\")'><strong>Hand</strong></button> tab to discard.";
    }
  }
  // Auto-center the map on the moving player when the move step becomes active.
  if (activeStep === "move" && state.gameActive && !state.gameOver) {
    var mover = state.pendingForcedMove
      ? getPlayerById(state.pendingForcedMove.targetPlayerId)
      : currentPlayer();
    if (mover && typeof centerBoardOnPlayer === "function") centerBoardOnPlayer(mover);
  }
}

// ---- Lock screen (pass-device single-device play) -------------------------

function endTurnWithLockCheck() {
  if (state.step !== STEP.END || state.gameOver) { endTurn(); return; }
  const isSingleDevice = !state.multiplayerSession || state.multiplayerSession.mode !== "online";
  const multiPlayer = state.players && state.players.length > 1;
  // Capture next player name before endTurn advances the index
  const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
  const nextName = state.players[nextIdx] ? state.players[nextIdx].name : "";
  endTurn();
  if (isSingleDevice && multiPlayer && state.gameActive && !state.gameOver) {
    var lockMsg = document.getElementById("lockScreenMsg");
    if (lockMsg) lockMsg.textContent = "Pass device to " + nextName + ".";
    var lockScreen = document.getElementById("lockScreen");
    if (lockScreen) lockScreen.style.display = "";
  }
}

function dismissLockScreen() {
  var lockScreen = document.getElementById("lockScreen");
  if (lockScreen) lockScreen.style.display = "none";
  if (window.matchMedia("(max-width: 1080px)").matches) {
    switchMobileTab("map");
  }
}

// ---- Mobile Hand panel ---------------------------------------------------

function renderMobileHandPanel() {
  var panel = document.getElementById("mobileHandPanel");
  if (!panel) return;
  // Mirror the fully-rendered hand list (includes Play/Stage/etc buttons with data attributes).
  // Event delegation on mobileHandPanel handles the clicks.
  var src = refs.handList;
  var handHtml = src ? src.innerHTML : "";

  // Append others' cards in play (exclude current player — they can see their own in their hand section).
  var othersHtml = buildInPlayHtml(true);
  if (othersHtml) {
    othersHtml = "<div class='ts-inplay-label hand-inplay-label'>Others' Cards in Play</div>" + othersHtml;
  }

  // Discard action bar — keeps the user on the Hand tab for the full discard flow.
  var discardBar = "";
  if (state.step === STEP.DISCARD) {
    var hasSelection = state.selectedHandIndex !== null;
    discardBar = "<div class='mobile-discard-bar'>"
      + "<span class='mobile-discard-hint'>Select a card below, then discard it.</span>"
      + "<button onclick='discardSelected()'" + (hasSelection ? "" : " disabled") + " class='mobile-discard-confirm'>Discard Selected</button>"
      + "</div>";
  }

  panel.innerHTML = discardBar + handHtml + othersHtml;

  // Update Hand tab label with card count.
  var mp = state.multiplayerSession;
  var playerIdx = (mp && mp.mode === "online" && mp.myPlayerSlot != null)
    ? mp.myPlayerSlot
    : state.currentPlayerIndex;
  var player = state.players && state.players[playerIdx];
  var count = player ? (player.hand ? player.hand.length : 0) : 0;
  var btn = document.querySelector(".mobile-tab-btn[data-tab='hand']");
  if (btn) btn.textContent = "Hand (" + count + ")";
}

function switchMobileTab(tab) {
  document.querySelectorAll(".mobile-tab-btn").forEach(function(b) {
    b.classList.toggle("mobile-tab-btn--active", b.dataset.tab === tab);
  });

  // controls / info / sidebar — show only on their own tab
  var controls = document.querySelector(".controls");
  if (controls) controls.classList.toggle("mobile-tab-active", tab === "controls");
  var sidebar = document.getElementById("sidebarPanel");
  if (sidebar) sidebar.classList.toggle("mobile-tab-active", tab === "info");

  // board-wrap (porthole) shows on BOTH map and hand tabs
  var boardWrap = document.querySelector(".board-wrap");
  if (boardWrap) boardWrap.classList.toggle("mobile-tab-active", tab === "map" || tab === "hand");

  // Body class drives compact-porthole layout on hand tab
  document.body.classList.toggle("hand-tab-active", tab === "hand");

  if (window.matchMedia("(max-width: 1080px)").matches) {
    syncMobilePanels(tab === "map");
    var strip = document.querySelector(".turn-strip");
    if (strip) strip.classList.toggle("turn-strip--visible", tab === "map");
    if (tab === "hand") renderMobileHandPanel();
  }
}

if (window.matchMedia("(max-width: 480px)").matches) {
  const s = document.getElementById("sidebarPanel");
  if (s) s.removeAttribute("open");
}

if (refs.playerCount) refs.playerCount.max = MAX_PLAYERS;
buildCollectionRows();
attachListeners();
populateCollectionCounts();
applyCollectionTooltips();
updateDeckPreviewCounts();
renderSaveLoadPanel();
attachDeckDragListeners();
const _baseFilter = { [getBaseCollection()]: { enabled: true, disabled: false } };
setupGame(2, _baseFilter, _baseFilter);
tryAutoRejoin();
switchMobileTab("controls");
updateIsoBtnIcon();
