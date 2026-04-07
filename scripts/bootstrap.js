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

function attachListeners() {
  refs.newGameBtn.addEventListener("click", () => {
    refs.newGameBtn.classList.remove("needs-restart");
    const count = Number(refs.playerCount.value) || 2;
    state.gameActive = true;
    setupGame(Math.max(1, Math.min(MAX_PLAYERS, count)), readCurrentFilters(), readCurrentEventFilters());
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

  refs.drawTileBtn.addEventListener("click", () => drawAndPlaceTile("base"));
  refs.rotateLeftBtn.addEventListener("click", () => rotatePendingTile(-1));
  refs.rotateRightBtn.addEventListener("click", () => rotatePendingTile(1));
  refs.combatBtn.addEventListener("click", resolveCombatOnCurrentTile);
  refs.drawEventsBtn.addEventListener("click", drawEventsToThree);
  refs.rollMoveBtn.addEventListener("click", rollMovement);
  refs.endMoveBtn.addEventListener("click", endMovementEarly);
  refs.moveZombiesBtn.addEventListener("click", startZombieMovement);
  refs.discardBtn.addEventListener("click", discardSelected);
  refs.endTurnBtn.addEventListener("click", endTurn);
  if (refs.performSpellBtn) refs.performSpellBtn.addEventListener("click", attemptSpell);

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

  // Board click — routes to whichever pending interaction is active.
  // Priority order matters: zombie movement consumes micro-cell clicks before
  // building select or zombie place, and tile placement (cell-level) is last.
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
      const zmAction = event.target.getAttribute("data-zombie-move-action");
      if (zmAction === "auto") { autoFinishZombieMovement(); return; }
      if (zmAction === "done") { flushZombieMovement(); return; }
      if (event.target.id === "zombieReplaceDoneBtn") {
        if (state.pendingRocketLauncher) finishRocketLauncher();
        else if (state.pendingZombieFlood) finishZombieFlood();
        else if (state.pendingSpaceSelect) finishSpaceSelect();
        else if (state.pendingMinefield) finishMinefield();
        else if (state.pendingDynamiteTarget) finishDynamite();
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

    // Zoom: mouse wheel
    boardWrap.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_INCREMENT : ZOOM_INCREMENT;
      state.boardZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (state.boardZoom || 1.0) + delta));
      applyIsoTransform();
    }, { passive: false });

    // Pan + zoom: touch
    let lastPinchDist = null;
    let lastTouchX = null;
    let lastTouchY = null;

    boardWrap.addEventListener("touchstart", (e) => {
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
