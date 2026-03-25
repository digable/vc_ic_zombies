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

  Object.entries(COLLECTION_META).forEach(([collKey, meta]) => {
    const isBase = meta.requiresBase === null;

    const nameSpan = document.createElement("span");
    nameSpan.className = "setup-coll-name";
    nameSpan.setAttribute("data-coll", collKey);
    const sc = meta.shortCode ? ` <span class="coll-short-code">${meta.shortCode}</span>` : "";
    nameSpan.innerHTML = `${meta.label}${sc} ${collTagsHtml(meta)}<br><span class="coll-counts" data-coll-counts="${collKey}"></span>`;

    const mapInput = document.createElement("input");
    mapInput.type = "checkbox";
    mapInput.setAttribute("data-deck-coll", collKey);
    mapInput.setAttribute("data-deck-state", "enabled");
    if (isBase && !meta.standaloneDeck) mapInput.checked = true;
    if (!isBase) mapInput.setAttribute("data-requires-base", meta.requiresBase);

    grid.appendChild(nameSpan);
    grid.appendChild(mapInput);

    if (eventCounts[collKey]) {
      const eventInput = document.createElement("input");
      eventInput.type = "checkbox";
      eventInput.setAttribute("data-event-coll", collKey);
      eventInput.setAttribute("data-event-state", "enabled");
      if (isBase && !meta.standaloneDeck) eventInput.checked = true;
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

function attachListeners() {
  refs.newGameBtn.addEventListener("click", () => {
    refs.newGameBtn.classList.remove("needs-restart");
    const count = Number(refs.playerCount.value) || 2;
    setupGame(Math.max(1, Math.min(4, count)), readCurrentFilters(), readCurrentEventFilters());
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
    grid.addEventListener("change", updateDeckPreviewCounts);
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
    if (playIndex !== null) {
      playEvent(Number(playIndex));
      return;
    }

    const selectIndex = target.getAttribute("data-select-index");
    if (selectIndex !== null) {
      toggleHandSelection(Number(selectIndex));
      return;
    }

    const activateIndex = target.getAttribute("data-activate-item-index");
    if (activateIndex !== null) {
      activateItem(Number(activateIndex));
    }
  });

  // Board click — routes to whichever pending interaction is active.
  // Priority order matters: zombie movement consumes micro-cell clicks before
  // building select or zombie place, and tile placement (cell-level) is last.
  refs.board.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (state.pendingZombieMovement) {
      const mc = target.closest(".micro-cell");
      if (mc instanceof HTMLElement && mc.dataset.sx !== undefined) {
        manualMoveZombie(key(Number(mc.dataset.sx), Number(mc.dataset.sy)));
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
      if (zmAction === "done") { autoFinishZombieMovement(); return; }
      if (event.target.id === "zombieReplaceDoneBtn") {
        if (state.pendingZombiePlace) finishZombiePlace();
        else finishZombieReplace();
      }
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

buildCollectionRows();
attachListeners();
populateCollectionCounts();
applyCollectionTooltips();
updateDeckPreviewCounts();
const _baseFilter = { [getBaseCollection()]: { enabled: true, disabled: false } };
setupGame(2, _baseFilter, _baseFilter);
