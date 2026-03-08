function renderBoard() {
  const { minX, maxX, minY, maxY } = boardBounds();
  const cols = maxX - minX + 1;
  refs.board.style.gridTemplateColumns = `repeat(${cols}, minmax(74px, 84px))`;
  refs.board.innerHTML = "";

  const pendingCoords = new Set(
    state.pendingTileOptions
      .filter((o) => o.rotation === state.pendingRotation)
      .map((o) => key(o.x, o.y))
  );

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const tile = state.board.get(key(x, y));
      const cell = document.createElement("div");
      cell.className = "cell";

      if (!tile) {
        cell.classList.add("empty");
        const k = key(x, y);
        if (state.pendingTile && pendingCoords.has(k)) {
          cell.classList.add("place-option");
          cell.dataset.placeX = String(x);
          cell.dataset.placeY = String(y);

          const option = state.pendingTileOptions.find(
            (o) => o.x === x && o.y === y && o.rotation === state.pendingRotation
          );
          const previewTile = state.pendingTile;

          let previewClass = "tile-road";
          if (previewTile.type === "town") {
            previewClass = "tile-town";
          } else if (previewTile.type === "building") {
            previewClass = "tile-building";
          } else if (previewTile.type === "named") {
            previewClass = "tile-named";
          } else if (previewTile.type === "helipad") {
            previewClass = "tile-helipad";
          }

          cell.classList.add(previewClass);

          const previewMicro = [];
          for (let ly = 0; ly < 3; ly += 1) {
            for (let lx = 0; lx < 3; lx += 1) {
              const isExit = (option?.connectors || []).some((dir) => {
                const door = DOOR_LOCAL[dir];
                return door && door.x === lx && door.y === ly;
              });
              previewMicro.push(
                `<span class="micro-cell">${isExit ? '<span class="mark exit">E</span>' : ""}</span>`
              );
            }
          }

          cell.innerHTML = `
            <div><strong>${getTileDisplayName(previewTile)}</strong></div>
            <div class="small">
              Z${getZombieSpawnCountForPlacedTile(previewTile, option?.connectors || [])},
              L${previewTile.hearts || 0},
              B${previewTile.bullets || 0}
            </div>
            <div class="micro-grid">${previewMicro.join("")}</div>
            <div class="small">Click to place</div>
          `;
        }
        refs.board.appendChild(cell);
        continue;
      }

      let tileClass = "tile-road";
      if (tile.type === "town") {
        tileClass = "tile-town";
      } else if (tile.type === "building") {
        tileClass = "tile-building";
      } else if (tile.type === "named") {
        tileClass = "tile-named";
      } else if (tile.type === "helipad") {
        tileClass = "tile-helipad";
      }

      cell.classList.add(tileClass);

      const occupantMap = new Map();
      const ensureCell = (lx, ly) => {
        const k = key(lx, ly);
        if (!occupantMap.has(k)) {
          occupantMap.set(k, { players: [], zombie: false, hearts: 0, bullets: 0 });
        }
        return occupantMap.get(k);
      };

      state.players.forEach((p) => {
        const ptx = spaceToTileCoord(p.x);
        const pty = spaceToTileCoord(p.y);
        if (ptx === x && pty === y) {
          const lx = getLocalCoord(p.x, ptx);
          const ly = getLocalCoord(p.y, pty);
          ensureCell(lx, ly).players.push(`P${p.id}`);
        }
      });

      state.zombies.forEach((zk) => {
        const z = parseKey(zk);
        const ztx = spaceToTileCoord(z.x);
        const zty = spaceToTileCoord(z.y);
        if (ztx === x && zty === y) {
          const lx = getLocalCoord(z.x, ztx);
          const ly = getLocalCoord(z.y, zty);
          ensureCell(lx, ly).zombie = true;
        }
      });

      state.spaceTokens.forEach((tokens, tk) => {
        const t = parseKey(tk);
        const ttx = spaceToTileCoord(t.x);
        const tty = spaceToTileCoord(t.y);
        if (ttx === x && tty === y) {
          const lx = getLocalCoord(t.x, ttx);
          const ly = getLocalCoord(t.y, tty);
          const cellData = ensureCell(lx, ly);
          cellData.hearts += tokens.hearts || 0;
          cellData.bullets += tokens.bullets || 0;
        }
      });

      const micro = [];
      for (let ly = 0; ly < 3; ly += 1) {
        for (let lx = 0; lx < 3; lx += 1) {
          const data = occupantMap.get(key(lx, ly)) || { players: [], zombie: false, hearts: 0, bullets: 0 };
          const parts = [];

          const isExit = (tile.connectors || []).some((dir) => {
            const door = DOOR_LOCAL[dir];
            return door && door.x === lx && door.y === ly;
          });
          if (isExit) {
            parts.push('<span class="mark exit">E</span>');
          }

          if (data.players.length) {
            parts.push(`<span class="mark player">${data.players.join(",")}</span>`);
          }
          if (data.zombie) {
            parts.push('<span class="mark zombie">Z</span>');
          }
          if (data.hearts > 0) {
            parts.push(`<span class="mark token">H${data.hearts}</span>`);
          }
          if (data.bullets > 0) {
            parts.push(`<span class="mark token">B${data.bullets}</span>`);
          }
          micro.push(`<span class="micro-cell">${parts.join("")}</span>`);
        }
      }

      cell.innerHTML = `
        <div><strong>${getTileDisplayName(tile)}</strong></div>
        <div class="small">
          Z${getZombieSpawnCountForPlacedTile(tile, tile.connectors || [])},
          L${tile.hearts || 0},
          B${tile.bullets || 0}
        </div>
        <div class="micro-grid">${micro.join("")}</div>
      `;

      refs.board.appendChild(cell);
    }
  }
}

function renderPlayers() {
  const cp = currentPlayer();
  const cptx = spaceToTileCoord(cp.x);
  const cpty = spaceToTileCoord(cp.y);
  const cplx = getLocalCoord(cp.x, cptx);
  const cply = getLocalCoord(cp.y, cpty);

  refs.currentPlayerCard.innerHTML = `
    <div class="player-card">
      <strong>${cp.name}</strong><br />
      Hearts: ${cp.hearts} | Bullets: ${cp.bullets} | Kills: ${cp.kills}<br />
      Position: Tile (${cptx}, ${cpty}) / Space (${cplx}, ${cply})
    </div>
  `;

  refs.playersList.innerHTML = "";
  state.players.forEach((p) => {
    const ptx = spaceToTileCoord(p.x);
    const pty = spaceToTileCoord(p.y);
    const plx = getLocalCoord(p.x, ptx);
    const ply = getLocalCoord(p.y, pty);
    const el = document.createElement("div");
    el.className = "player-card";
    el.innerHTML = `
      <strong>${p.name}</strong><br />
      Hearts: ${p.hearts} | Bullets: ${p.bullets} | Kills: ${p.kills}<br />
      Position: Tile (${ptx}, ${pty}) / Space (${plx}, ${ply})
    `;
    refs.playersList.appendChild(el);
  });
}

function renderHand() {
  const player = currentPlayer();
  refs.handList.innerHTML = "";

  if (player.hand.length === 0) {
    refs.handList.innerHTML = "<div class='small'>No event cards in hand.</div>";
    return;
  }

  player.hand.forEach((card, index) => {
    const el = document.createElement("div");
    el.className = "hand-card";
    if (index === state.selectedHandIndex) {
      el.classList.add("selected");
    }

    const playDisabled = state.gameOver || state.eventUsedThisTurn;
    el.innerHTML = `
      <strong>${card.name}</strong><br />
      <span class="small">${card.description}</span><br />
      <button ${playDisabled ? "disabled" : ""} data-play-index="${index}">Play</button>
      <button data-select-index="${index}">Select</button>
    `;

    refs.handList.appendChild(el);
  });
}

function renderLog() {
  refs.log.innerHTML = state.logs.map((line) => `<div class="log-line">${line}</div>`).join("");
}

function updateButtons() {
  const p = currentPlayer();
  const combatRequired = isCombatRequiredForCurrentPlayer();

  refs.drawTileBtn.disabled = state.step !== STEP.DRAW_TILE || state.gameOver || Boolean(state.pendingTile);
  refs.rotateLeftBtn.disabled = !state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE;
  refs.rotateRightBtn.disabled = !state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE;
  refs.combatBtn.disabled = state.step !== STEP.COMBAT || state.gameOver || !combatRequired;
  refs.drawEventsBtn.disabled = state.step !== STEP.DRAW_EVENTS || state.gameOver;
  refs.rollMoveBtn.disabled = state.step !== STEP.ROLL_MOVE || state.gameOver;
  refs.endMoveBtn.disabled = state.step !== STEP.MOVE || state.gameOver;
  refs.moveZombiesBtn.disabled = state.step !== STEP.MOVE_ZOMBIES || state.gameOver || state.zombies.size === 0;
  refs.discardBtn.disabled = state.step !== STEP.DISCARD || state.gameOver;
  refs.endTurnBtn.disabled = state.step !== STEP.END || state.gameOver;

  refs.moveDirBtns.forEach((btn) => {
    const dir = btn.dataset.dir;
    const disabled = state.step !== STEP.MOVE || state.gameOver || state.movesRemaining <= 0 || !canMove(p, dir);
    btn.disabled = disabled;
  });
}

function renderMeta() {
  refs.turnInfo.textContent = `Turn ${state.turnNumber} | ${currentPlayer().name} | Step: ${state.step}`;
  refs.moveRollOutput.textContent = `Move Roll: ${state.currentMoveRoll ?? "-"} | Remaining: ${state.movesRemaining}`;
  refs.zombieRollOutput.textContent = `Zombie Roll: ${state.currentZombieRoll ?? "-"}`;
  refs.pendingTileInfo.textContent = state.pendingTile
    ? `Pending Tile: ${getTileDisplayName(state.pendingTile)} (${state.pendingTileOptions.length} valid placements)`
    : "Pending Tile: -";
}

function render() {
  renderMeta();
  renderBoard();
  renderPlayers();
  renderHand();
  renderLog();
  updateButtons();
}
