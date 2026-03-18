function attachListeners() {
  refs.newGameBtn.addEventListener("click", () => {
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

  refs.drawTileBtn.addEventListener("click", drawAndPlaceTile);
  refs.rotateLeftBtn.addEventListener("click", () => rotatePendingTile(-1));
  refs.rotateRightBtn.addEventListener("click", () => rotatePendingTile(1));
  refs.combatBtn.addEventListener("click", resolveCombatOnCurrentTile);
  refs.drawEventsBtn.addEventListener("click", drawEventsToThree);
  refs.rollMoveBtn.addEventListener("click", rollMovement);
  refs.endMoveBtn.addEventListener("click", endMovementEarly);
  refs.moveZombiesBtn.addEventListener("click", moveZombies);
  refs.discardBtn.addEventListener("click", discardSelected);
  refs.endTurnBtn.addEventListener("click", endTurn);

  refs.moveDirBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      movePlayer(btn.dataset.dir);
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
    }
  });

  refs.board.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const cell = target.closest(".cell");
    if (!(cell instanceof HTMLElement)) {
      return;
    }

    const x = cell.dataset.placeX;
    const y = cell.dataset.placeY;
    if (x !== undefined && y !== undefined) {
      placePendingTileAt(Number(x), Number(y));
    }
  });

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

attachListeners();
setupGame(2, { [TILE_COLLECTIONS.ORIGINAL]: { enabled: true, disabled: false } });
