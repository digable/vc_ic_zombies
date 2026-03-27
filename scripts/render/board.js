// render-board.js — Board rendering functions.
// Handles renderBoard (tile grid + occupants), renderPlayerTrailSvg, and renderMoveStatus.

function renderBoard() {
  // Build companion preview map: cellKey → { tile } for every valid gate placement option.
  // Compound direction is determined per-option: away from the side that connects to the
  // existing board, so companions always extend into open space regardless of gate rotation.
  const companionPreviewMap = new Map();
  if (state.pendingTile && state.pendingCompanionTiles && state.pendingCompanionTiles.length > 0) {
    state.pendingTileOptions
      .filter((o) => o.rotation === state.pendingRotation)
      .forEach((o) => {
        const r = o.rotation;
        const baseDir = state.pendingTile.companionDir || "S";
        const companionSide = rotateDir(baseDir, r);
        const mapSide = rotateDir(DIRS[baseDir].opposite, r);
        const companionNeighbor = key(o.x + DIRS[companionSide].x, o.y + DIRS[companionSide].y);
        const mapNeighbor = key(o.x + DIRS[mapSide].x, o.y + DIRS[mapSide].y);
        // Compound faces away from the existing map connection
        const compoundDir = state.board.has(mapNeighbor) ? companionSide
          : state.board.has(companionNeighbor) ? mapSide
          : companionSide;
        const ddx = DIRS[compoundDir].x;
        const ddy = DIRS[compoundDir].y;

        let blocked = false;
        state.pendingCompanionTiles.forEach((companion, idx) => {
          if (blocked) return;
          const cx = o.x + ddx * (idx + 1);
          const cy = o.y + ddy * (idx + 1);
          const ck = key(cx, cy);
          if (state.board.has(ck)) { blocked = true; return; }
          if (!companionPreviewMap.has(ck)) {
            companionPreviewMap.set(ck, { tile: companion });
          }
        });
      });
  }

  let { minX, maxX, minY, maxY } = boardBounds();
  companionPreviewMap.forEach((_, ck) => {
    const { x, y } = parseKey(ck);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  const cols = maxX - minX + 1;
  refs.board.style.gridTemplateColumns = `repeat(${cols}, minmax(84px, 96px))`;
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

          cell.classList.add(getTileClassName(previewTile));

          const sourceSubTiles = getTileSubTileMap(previewTile);
          const rotatedSubTiles = getRotatedSubTiles(sourceSubTiles, state.pendingRotation);
          const previewTileForWalk = {
            type: previewTile.type,
            connectors: option?.connectors || [],
            ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
          };

          const previewShortCode = getCollectionShortCode(previewTile.collection, state.pendingTileDeck);
          cell.innerHTML = `
            <div><strong>${getTileDisplayName(previewTile)}</strong>${previewShortCode ? ` <span class="coll-short-code">${previewShortCode}</span>` : ""}</div>
            <div class="small">
              Z${getZombieSpawnCountForPlacedTile(previewTile, option?.connectors || [])},
              L${previewTile.hearts || 0},
              B${previewTile.bullets || 0}
            </div>
            <div class="micro-grid">${buildMicroGridHtml(previewTileForWalk)}</div>
            <div class="small">Click to place</div>
          `;
        } else if (companionPreviewMap.has(k)) {
          const { tile: cTile } = companionPreviewMap.get(k);
          cell.classList.add("companion-preview");
          cell.classList.add(getTileClassName(cTile));
          const rotatedConnectors = getRotatedConnectors(cTile.connectors, state.pendingRotation);
          const cSourceSubTiles = getTileSubTileMap(cTile);
          const cRotatedSubTiles = getRotatedSubTiles(cSourceSubTiles, state.pendingRotation);
          const cPreviewTile = {
            type: cTile.type,
            connectors: rotatedConnectors,
            ...(cRotatedSubTiles ? { subTiles: cRotatedSubTiles } : {})
          };
          cell.innerHTML = `
            <div><strong>${cTile.name}</strong></div>
            <div class="small">auto-placed</div>
            <div class="micro-grid">${buildMicroGridHtml(cPreviewTile)}</div>
          `;
        }
        refs.board.appendChild(cell);
        continue;
      }

      cell.classList.add(getTileClassName(tile));

      const getAdjacentTile = (dir) => {
        const d = DIRS[dir];
        return state.board.get(key(x + d.x, y + d.y));
      };
      if (getRoadLineDirs(tile, 1, 0, getAdjacentTile).includes("N")) cell.classList.add("connects-n");
      if (getRoadLineDirs(tile, 1, 2, getAdjacentTile).includes("S")) cell.classList.add("connects-s");

      const occupantMap = buildOccupantMapForTile(x, y);

      const micro = [];
      for (let ly = 0; ly < TILE_DIM; ly += 1) {
        for (let lx = 0; lx < TILE_DIM; lx += 1) {
          const isWalkable = isLocalWalkable(tile, lx, ly);
          const data = occupantMap.get(key(lx, ly)) || { players: [], zombieType: null, hearts: 0, bullets: 0 };
          const parts = [];
          const subType = getSubTileType(tile, lx, ly);
          const lineDirs = getRoadLineDirs(tile, lx, ly, getAdjacentTile);
          const lanes = lineDirs
            .map((dir) => {
              const isOuter = (dir === "N" && ly === 0) || (dir === "S" && ly === 2) ||
                              (dir === "E" && lx === 2) || (dir === "W" && lx === 0);
              return `<span class="lane lane-${dir.toLowerCase()}${isOuter ? " lane-connector" : ""}"></span>`;
            })
            .join("");
          const wallDirs = getSubTileWallDirs(tile, lx, ly);
          const walls = wallDirs
            .map((dir) => `<span class="wall wall-${dir.toLowerCase()}"></span>`)
            .join("");

          if (!isWalkable) {
            parts.push('<span class="mark blocked">X</span>');
          }

          if (data.players.length) {
            const activeId = `P${currentPlayer().id}`;
            data.players.forEach((pid) => {
              const cls = pid === activeId ? "mark player active" : "mark player";
              parts.push(`<span class="${cls}">${pid}</span>`);
            });
          }
          if (data.zombieType) {
            const zombieCls = data.zombieType === ZOMBIE_TYPE.ENHANCED ? "mark zombie zombie-enhanced" : "mark zombie";
            parts.push(`<span class="${zombieCls}">Z</span>`);
          }
          if (data.hearts > 0) {
            parts.push(`<span class="mark token">H${data.hearts}</span>`);
          }
          if (data.bullets > 0) {
            parts.push(`<span class="mark token">B${data.bullets}</span>`);
          }
          const sx = x * TILE_DIM + lx;
          const sy = y * TILE_DIM + ly;
          const pzr = state.pendingZombieReplace;
          const spaceKey = key(sx, sy);

          let zombieClass = "";
          if (state.recentKillKey === spaceKey) {
            zombieClass = " zombie-kill-flash";
          }
          const pzm = state.pendingZombieMovement;
          if (pzm && data.zombieType && !pzm.movedKeys.has(spaceKey) && !pzm.stuckKeys.has(spaceKey)) {
            zombieClass = " zombie-selectable";
          } else if (state.pendingBuildingSelect && subType === "building" && isWalkable) {
            zombieClass = " zombie-target";
          } else if (state.pendingRocketLauncher && tile.type !== "helipad" && isBoardEdgeTile(x, y)) {
            zombieClass = " zombie-target";
          } else if (state.pendingMinefield && data.zombieType && subType === "road") {
            zombieClass = " zombie-selectable";
          } else if (state.pendingDynamiteTarget && data.zombieType) {
            const dp = state.players.find((pl) => pl.id === state.pendingDynamiteTarget.playerId);
            if (dp && manhattanDist(sx, sy, dp.x, dp.y) <= 1 && !(sx === dp.x && sy === dp.y)) {
              zombieClass = " zombie-selectable";
            }
          } else if (state.pendingZombiePlace && isWalkable && !data.zombieType) {
            zombieClass = " zombie-target";
          } else if (pzr) {
            if (pzr.selectedZombieKey === spaceKey) {
              zombieClass = " zombie-selected";
            } else if (!pzr.selectedZombieKey && data.zombieType) {
              zombieClass = " zombie-selectable";
            } else if (pzr.selectedZombieKey && isWalkable && !data.zombieType) {
              zombieClass = " zombie-target";
            }
          }
          const subTypeClass = subType ? ` ${subType.replaceAll(" ", "-")}-subtile` : "";
          micro.push(`<span class="micro-cell${subTypeClass}${!isWalkable ? " blocked-subtile" : ""}${zombieClass}" data-sx="${sx}" data-sy="${sy}">${lanes}${walls}${parts.join("")}</span>`);
        }
      }

      const tileShortCode = getCollectionShortCode(tile.collection, tile.placedDeck);
      cell.innerHTML = `
        <div><strong>${getTileDisplayName(tile)}</strong>${tileShortCode ? ` <span class="coll-short-code">${tileShortCode}</span>` : ""}</div>
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

  if (state.recentKillKey) {
    const killKey = state.recentKillKey;
    setTimeout(() => {
      if (state.recentKillKey === killKey) {
        state.recentKillKey = null;
      }
      const { x, y } = parseKey(killKey);
      const el = refs.board.querySelector(`[data-sx="${x}"][data-sy="${y}"]`);
      if (el) {
        el.classList.remove("zombie-kill-flash");
      }
    }, 700);
  }
}

function buildOccupantMapForTile(tileX, tileY) {
  const occupantMap = new Map();
  const ensureCell = (lx, ly) => {
    const k = key(lx, ly);
    if (!occupantMap.has(k)) {
      occupantMap.set(k, { players: [], zombieType: null, hearts: 0, bullets: 0 });
    }
    return occupantMap.get(k);
  };

  state.players.forEach((p) => {
    const ptx = spaceToTileCoord(p.x);
    const pty = spaceToTileCoord(p.y);
    if (ptx === tileX && pty === tileY) {
      const { lx, ly } = getSpaceLocalCoords(p.x, p.y);
      ensureCell(lx, ly).players.push(`P${p.id}`);
    }
  });

  state.zombies.forEach((zdata, zk) => {
    const { x: zx, y: zy } = parseKey(zk);
    if (spaceToTileCoord(zx) === tileX && spaceToTileCoord(zy) === tileY) {
      const { lx, ly } = getSpaceLocalCoords(zx, zy);
      ensureCell(lx, ly).zombieType = zdata.type;
    }
  });

  state.spaceTokens.forEach((tokens, tk) => {
    const { x: tx, y: ty } = parseKey(tk);
    if (spaceToTileCoord(tx) === tileX && spaceToTileCoord(ty) === tileY) {
      const { lx, ly } = getSpaceLocalCoords(tx, ty);
      const cellData = ensureCell(lx, ly);
      cellData.hearts += tokens.hearts || 0;
      cellData.bullets += tokens.bullets || 0;
    }
  });

  return occupantMap;
}

function renderPlayerTrailSvg() {
  // Board clears its innerHTML every render — SVG must be re-appended each time.
  // Measuring happens after DOM insertion so getBoundingClientRect is valid.
  if (!state.playerTrail || state.playerTrail.length < 2) return;

  const NS = "http://www.w3.org/2000/svg";
  const boardRect = refs.board.getBoundingClientRect();

  const points = [];
  for (const spaceKey of state.playerTrail) {
    const { x: sx, y: sy } = parseKey(spaceKey);
    const cell = refs.board.querySelector(`[data-sx="${sx}"][data-sy="${sy}"]`);
    if (!cell) continue;
    const r = cell.getBoundingClientRect();
    points.push({ x: r.left - boardRect.left + r.width / 2, y: r.top - boardRect.top + r.height / 2 });
  }
  if (points.length < 2) return;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("style", "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;overflow:visible;");

  // Dashed path connecting all points
  const ptStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const polyline = document.createElementNS(NS, "polyline");
  polyline.setAttribute("points", ptStr);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("class", "player-trail-line");
  svg.appendChild(polyline);

  // Directional arrow triangle at the midpoint of each segment
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    const arrow = document.createElementNS(NS, "polygon");
    arrow.setAttribute("points", "-4,-3 4,0 -4,3");
    arrow.setAttribute("class", "player-trail-mark");
    arrow.setAttribute("transform", `translate(${mx},${my}) rotate(${angle})`);
    svg.appendChild(arrow);
  }

  refs.board.appendChild(svg);
}

function renderMoveStatus() {
  if (!refs.moveStatusMsg) return;
  const p = state.players[state.currentPlayerIndex];
  if (!p || state.gameOver) { refs.moveStatusMsg.classList.add("hidden"); return; }

  const msgs = [];
  if (state.step === STEP.ROLL_MOVE || state.step === STEP.MOVE) {
    if (p.cannotMoveTurns > 0)         msgs.push("Fear: you cannot move this turn.");
    if (p.claustrophobiaActive)         msgs.push("Claustrophobia: cannot enter buildings. If in a building, exit by shortest route.");
    if (p.halfMovementNextTurn)         msgs.push("Your Shoe's Untied: movement roll will be halved.");
    if (p.brainCramp)                   msgs.push("Brain Cramp: an opponent will control your movement.");
    if (p.dieRollPenalty > 0)           msgs.push(`Abandon All Hope: -${p.dieRollPenalty} to all die rolls this turn.`);
    if (state.pendingBreakthrough)      msgs.push("Breakthrough: choose a direction to attempt to break through a wall (5–6 succeeds, 4 or less loses 1 life and ends movement).");
    if (state.pendingForcedMove) {
      const target = state.players.find((pl) => pl.id === state.pendingForcedMove.targetPlayerId);
      const targetName = target ? target.name : "Unknown";
      msgs.push(`Forced movement: moving ${targetName} — ${state.pendingForcedMove.remaining} space(s) remaining.`);
    }
  }

  if (msgs.length === 0) { refs.moveStatusMsg.classList.add("hidden"); return; }
  refs.moveStatusMsg.classList.remove("hidden");
  refs.moveStatusMsg.innerHTML = msgs.map((m) => `<div>${m}</div>`).join("");
}
