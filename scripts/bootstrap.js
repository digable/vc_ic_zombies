function attachListeners() {
  refs.newGameBtn.addEventListener("click", () => {
    const setupSection = document.getElementById("setupSection");
    if (setupSection.classList.contains("hidden")) {
      setupSection.classList.remove("hidden");
      return;
    }
    setupSection.classList.add("hidden");
    const count = Number(refs.playerCount.value) || 2;
    const filters = {};
    document.querySelectorAll("[data-deck-coll]").forEach((el) => {
      const col = el.getAttribute("data-deck-coll");
      const st = el.getAttribute("data-deck-state");
      if (!filters[col]) filters[col] = { enabled: false, disabled: false };
      if (el.checked) filters[col][st] = true;
    });
    setupGame(Math.max(1, Math.min(4, count)), filters);
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
      }
    });
  });

  if (refs.gameOverNewGameBtn) {
    refs.gameOverNewGameBtn.addEventListener("click", () => {
      refs.gameOverOverlay.classList.add("hidden");
      document.getElementById("setupSection").classList.remove("hidden");
    });
  }

  refs.drawTileBtn.addEventListener("click", drawAndPlaceTile);
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
}

attachListeners();
populateCollectionCounts();
setupGame(2, { [TILE_COLLECTIONS.DIRECTORS_CUT]: { enabled: true, disabled: false } });
document.getElementById("setupSection").classList.add("hidden");
