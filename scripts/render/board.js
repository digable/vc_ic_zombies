// render-board.js — Board rendering functions.
// Handles renderBoard (tile grid + occupants), renderPlayerTrailSvg, and renderMoveStatus.

// Incremental DOM cache for renderBoard (#1 optimization)
var _boardBoundsCache = { minX: null, maxX: null, minY: null, maxY: null };
var _boardCellFps = new Map(); // key(x,y) → fingerprint string

// Trail SVG cache — avoids getBoundingClientRect reflow when trail/view unchanged
var _trailFp = null;
var _trailSvgEl = null;

var ISO_BTN_CUBE_HTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><polygon points="8,2 14,5 8,8 2,5"/><polygon points="14,5 14,11 8,14 8,8"/><polygon points="2,5 8,8 8,14 2,11"/></svg>';
var ISO_BTN_SQUARE_HTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.5"/></svg>';
var RESET_VIEW_BTN_HTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8,3 3,3 3,8"/><polyline points="16,21 21,21 21,16"/><line x1="19" y1="5" x2="13" y2="11"/><polyline points="16,10 13,11 14,8"/><line x1="5" y1="19" x2="11" y2="13"/><polyline points="8,14 11,13 10,16"/></svg>';

function updateIsoBtnIcon() {
  if (refs.isoToggleBtn) refs.isoToggleBtn.innerHTML = state.isoView ? ISO_BTN_SQUARE_HTML : ISO_BTN_CUBE_HTML;
}

function applyIsoTransform() {
  var zoom = state.boardZoom || 1.0;
  var px = state.boardPanX || 0;
  var py = state.boardPanY || 0;
  var pan = "translate(" + px + "px," + py + "px)";
  if (state.isoView) {
    refs.board.style.transform = pan + " scale(" + zoom + ") rotateX(" + state.isoRotateX + "deg) rotateZ(" + state.isoRotateZ + "deg) scale(1.1)";
    refs.board.style.setProperty("--iso-rx", state.isoRotateX + "deg");
    refs.board.style.setProperty("--iso-rz", state.isoRotateZ + "deg");
  } else {
    refs.board.style.transform = pan + " scale(" + zoom + ")";
    refs.board.style.removeProperty("--iso-rx");
    refs.board.style.removeProperty("--iso-rz");
  }
  if (refs.isoTiltSlider) refs.isoTiltSlider.value = state.isoRotateX;
  if (refs.isoSpinSlider) refs.isoSpinSlider.value = state.isoRotateZ;
  if (refs.isoTiltVal)    refs.isoTiltVal.textContent = state.isoRotateX + "°";
  if (refs.isoSpinVal)    refs.isoSpinVal.textContent = state.isoRotateZ + "°";
  if (refs.resetViewBtn) {
    var changed = px !== 0 || py !== 0 || Math.abs(zoom - 1.0) > 0.001;
    refs.resetViewBtn.classList.toggle("hidden", !changed);
    if (!refs.resetViewBtn.dataset.iconSet) {
      refs.resetViewBtn.innerHTML = RESET_VIEW_BTN_HTML;
      refs.resetViewBtn.dataset.iconSet = "1";
    }
  }
  updateIsoBtnIcon();
}

function centerBoardOnPlayer(player) {
  if (!window.matchMedia("(max-width: 1080px)").matches) return;
  var porthole = document.querySelector(".porthole");
  if (!porthole || !refs.board) return;

  var { minX, minY } = boardBounds();
  var CELL = 96;
  var GAP  = 6;

  // Tile coord of this player
  var tx = spaceToTileCoord(player.x);
  var ty = spaceToTileCoord(player.y);

  // Pixel center of that tile within the board element (relative to board top-left)
  var tileCol = tx - minX;  // 0-based column index
  var tileRow = ty - minY;
  var tileCx  = tileCol * (CELL + GAP) + CELL / 2;
  var tileCy  = tileRow * (CELL + GAP) + CELL / 2;

  // Porthole center
  var portholeW = porthole.clientWidth;
  var portholeH = porthole.clientHeight;
  var zoom = state.boardZoom || 1.0;

  // Pan so the tile center lands at the porthole center
  state.boardPanX = portholeW / 2 - tileCx * zoom;
  state.boardPanY = portholeH / 2 - tileCy * zoom;
  applyIsoTransform();
}

function toggleIsoView() {
  state.isoView = !state.isoView;
  refs.board.classList.toggle("iso-view", state.isoView);
  updateIsoBtnIcon();
  if (refs.isoControls) refs.isoControls.classList.toggle("hidden", !state.isoView);
  applyIsoTransform();
  renderPlayerTrailSvg();
}

function renderBoard() {
  const adjBuildingSpaces = state.pendingSpaceSelect
    ? (state.pendingSpaceSelect.validSpaces ?? getSpacesAdjoiningBuilding())
    : null;

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

  const pendingCoords = new Set(
    state.pendingTileOptions
      .filter((o) => o.rotation === state.pendingRotation)
      .map((o) => key(o.x, o.y))
  );

  const globalOccupantMap = buildGlobalOccupantMap();

  // Global pending fingerprint — same for all cells this render pass.
  // Captures all state that drives per-space highlighting.
  const pzmState = state.pendingZombieMovement;
  const pzrState = state.pendingZombieReplace;
  const globalPendingFp = [
    pzmState ? `zm${pzmState.remaining}${pzmState.movedFromCounts.size}${pzmState.stuckKeys.size}` : "",
    state.pendingBuildingSelect ? "bs" : "",
    state.pendingRocketLauncher ? "rl" : "",
    state.pendingMinefield ? "mf" : "",
    state.pendingDynamiteTarget ? state.pendingDynamiteTarget.playerId : "",
    state.pendingSpaceSelect ? (state.pendingSpaceSelect.validSpaces ? state.pendingSpaceSelect.validSpaces.size : "ss") : "",
    state.pendingZombiePlace ? (state.pendingZombiePlace.validSpaces ? state.pendingZombiePlace.validSpaces.size : "zp") : "",
    pzrState ? (pzrState.selectedZombieKey || "0") : "",
  ].join("|");

  // Determine if the board grid dimensions changed (new tile placed, etc.)
  const boundsChanged = minX !== _boardBoundsCache.minX || maxX !== _boardBoundsCache.maxX ||
                        minY !== _boardBoundsCache.minY || maxY !== _boardBoundsCache.maxY;

  // Remove the player-trail SVG — renderPlayerTrailSvg will re-append it below.
  const existingTrailSvg = refs.board.querySelector(".player-trail-svg");
  if (existingTrailSvg) existingTrailSvg.remove();

  if (boundsChanged) {
    refs.board.innerHTML = "";
    _boardCellFps.clear();
    _boardBoundsCache = { minX, maxX, minY, maxY };
    _trailFp = null;
    _trailSvgEl = null;
  }

  const cols = maxX - minX + 1;
  refs.board.style.gridTemplateColumns = `repeat(${cols}, 96px)`;
  refs.board.style.width = "max-content";

  // When bounds are unchanged, reuse existing cell elements (already in DOM order).
  const existingCells = boundsChanged ? null : refs.board.querySelectorAll(".cell");
  let cellIndex = 0;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const ck = key(x, y);
      const tile = state.board.get(ck);

      // Compute a fingerprint for this cell's current visual state.
      let cellFp;
      if (!tile) {
        if (state.pendingTile && pendingCoords.has(ck)) {
          cellFp = `po|${ck}|${state.pendingRotation}`;
        } else if (companionPreviewMap.has(ck)) {
          cellFp = `cp|${companionPreviewMap.get(ck).tile.name}`;
        } else {
          cellFp = "e";
        }
      } else {
        // Summarise occupants across the 9 sub-spaces of this tile.
        let occFp = "";
        for (let ly2 = 0; ly2 < TILE_DIM; ly2 += 1) {
          for (let lx2 = 0; lx2 < TILE_DIM; lx2 += 1) {
            const d = globalOccupantMap.get(key(x * TILE_DIM + lx2, y * TILE_DIM + ly2));
            if (d) occFp += `${lx2}${ly2}:${d.players.join("")}${d.zombieType || ""}${d.zombieCount}${d.hearts}${d.bullets};`;
          }
        }
        if (state.recentKillKey) {
          const { x: kx, y: ky } = parseKey(state.recentKillKey);
          if (spaceToTileCoord(kx) === x && spaceToTileCoord(ky) === y) occFp += "kf;";
        }
        state.zombieMovedSpaces.forEach((sk) => {
          const { x: zx, y: zy } = parseKey(sk);
          if (spaceToTileCoord(zx) === x && spaceToTileCoord(zy) === y) occFp += `zm${zx}${zy};`;
        });
        cellFp = `t|${occFp}|${globalPendingFp}`;
      }

      const ci = cellIndex;
      cellIndex += 1;

      // Skip this cell if nothing has changed.
      if (!boundsChanged && _boardCellFps.get(ck) === cellFp) continue;
      _boardCellFps.set(ck, cellFp);

      // Reuse the existing DOM element or create a fresh one.
      const cell = boundsChanged ? document.createElement("div") : existingCells[ci];
      cell.className = "cell";

      if (!tile) {
        cell.classList.add("empty");
        if (state.pendingTile && pendingCoords.has(ck)) {
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
        } else if (companionPreviewMap.has(ck)) {
          const { tile: cTile } = companionPreviewMap.get(ck);
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
        } else {
          cell.innerHTML = "";
          delete cell.dataset.placeX;
          delete cell.dataset.placeY;
        }
        if (boundsChanged) refs.board.appendChild(cell);
        continue;
      }

      cell.classList.add(getTileClassName(tile));

      const getAdjacentTile = (dir) => {
        const d = DIRS[dir];
        return state.board.get(key(x + d.x, y + d.y));
      };
      if (getRoadLineDirs(tile, DOOR_LOCAL.N.x, DOOR_LOCAL.N.y, getAdjacentTile).includes("N")) cell.classList.add("connects-n");
      if (getRoadLineDirs(tile, DOOR_LOCAL.S.x, DOOR_LOCAL.S.y, getAdjacentTile).includes("S")) cell.classList.add("connects-s");

      const micro = [];
      for (let ly = 0; ly < TILE_DIM; ly += 1) {
        for (let lx = 0; lx < TILE_DIM; lx += 1) {
          const isWalkable = isLocalWalkable(tile, lx, ly);
          const sx = x * TILE_DIM + lx;
          const sy = y * TILE_DIM + ly;
          const data = globalOccupantMap.get(key(sx, sy)) || { players: [], zombieType: null, zombieCount: 1, hearts: 0, bullets: 0 };
          const parts = [];
          const subType = getSubTileType(tile, lx, ly);
          const lineDirs = getRoadLineDirs(tile, lx, ly, getAdjacentTile);
          const lanes = lineDirs
            .map((dir) => {
              const isOuter = (dir === "N" && ly === 0) || (dir === "S" && ly === TILE_DIM - 1) ||
                              (dir === "E" && lx === TILE_DIM - 1) || (dir === "W" && lx === 0);
              return `<span class="lane lane-${dir.toLowerCase()}${isOuter ? " lane-connector" : ""}"></span>`;
            })
            .join("");
          const wallDirs = getSubTileWallDirs(tile, lx, ly);
          const walls = wallDirs
            .map((dir) => `<span class="wall wall-${dir.toLowerCase()}"></span>`)
            .join("");
          const ductDirs = getSubTileAirDuctDirs(tile, lx, ly);
          const ductLabels = ductDirs.map((dir) => {
            const horiz = dir === "E" || dir === "W";
            const svg = horiz
              ? `<svg class="duct-wave" width="10" height="7" viewBox="0 0 12 7" xmlns="http://www.w3.org/2000/svg"><path d="M0,2 C2,0 4,0 6,2 C8,4 10,4 12,2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M0,5 C2,3 4,3 6,5 C8,7 10,7 12,5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`
              : `<svg class="duct-wave" width="7" height="10" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg"><path d="M2,0 C0,2 0,4 2,6 C4,8 4,10 2,12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M5,0 C3,2 3,4 5,6 C7,8 7,10 5,12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
            return `<span class="side-label side-label-${dir.toLowerCase()} duct-side">${svg}</span>`;
          }).join("");

          if (!isWalkable) {
            parts.push('<span class="mark blocked">X</span>');
          }

          if (data.players.length) {
            const activeId = `P${currentPlayer().id}`;
            data.players.forEach((pid) => {
              const cls = pid === activeId ? "mark player active" : "mark player";
              parts.push(`<span class="${cls}" data-pid="${pid}">${pid}</span>`);
            });
          }
          if (data.zombieType) {
            if (data.zombieType === ZOMBIE_TYPE.DOG) {
              const dogCount = data.zombieCount ?? 1;
              for (let i = 0; i < dogCount; i++) {
                parts.push(`<span class="mark zombie zombie-dog">D</span>`);
              }
            } else {
              const zombieCls = data.zombieType === ZOMBIE_TYPE.ENHANCED ? "mark zombie zombie-enhanced" : "mark zombie";
              parts.push(`<span class="${zombieCls}">Z</span>`);
            }
          }
          if (data.hearts > 0) {
            parts.push(`<span class="mark token token-heart" data-count="${data.hearts}">H${data.hearts}</span>`);
          }
          if (data.bullets > 0) {
            parts.push(`<span class="mark token token-bullet" data-count="${data.bullets}">B${data.bullets}</span>`);
          }
          const pzr = pzrState;
          const spaceKey = key(sx, sy);

          let zombieClass = "";
          if (state.recentKillKey === spaceKey) {
            zombieClass = " zombie-kill-flash";
          }
          const pzm = pzmState;
          if (pzm && data.zombieType && isAvailableForMove(pzm, spaceKey)) {
            zombieClass = " zombie-selectable";
          } else if (state.pendingBuildingSelect && subType === "building" && isWalkable) {
            zombieClass = " zombie-target";
          } else if (state.pendingRocketLauncher && tile.type !== "helipad" && isBoardEdgeTile(x, y)) {
            zombieClass = " zombie-target";
          } else if (state.pendingMinefield && data.zombieType && subType === "road") {
            zombieClass = " zombie-selectable";
          } else if (state.pendingDynamiteTarget && data.zombieType) {
            const dp = getPlayerById(state.pendingDynamiteTarget.playerId);
            if (dp && manhattanDist(sx, sy, dp.x, dp.y) <= 1 && !(sx === dp.x && sy === dp.y)) {
              zombieClass = " zombie-selectable";
            }
          } else if (state.pendingSpaceSelect && isWalkable && adjBuildingSpaces?.has(spaceKey)) {
            zombieClass = " zombie-target";
          } else if (state.pendingZombiePlace && isWalkable && !data.zombieType &&
                     (!state.pendingZombiePlace.validSpaces || state.pendingZombiePlace.validSpaces.has(spaceKey))) {
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
          const movedClass = state.zombieMovedSpaces.has(spaceKey) ? " zombie-moved" : "";
          micro.push(`<span class="micro-cell${subTypeClass}${!isWalkable ? " blocked-subtile" : ""}${zombieClass}${movedClass}" data-sx="${sx}" data-sy="${sy}">${lanes}${walls}${ductLabels}${parts.join("")}</span>`);
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

      if (boundsChanged) refs.board.appendChild(cell);
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

// Build a single occupant map for the whole board, keyed by global space key(sx, sy).
// Called once per renderBoard() instead of once per tile.
function buildGlobalOccupantMap() {
  const map = new Map();
  const ensure = (sx, sy) => {
    const k = key(sx, sy);
    if (!map.has(k)) map.set(k, { players: [], zombieType: null, zombieCount: 1, hearts: 0, bullets: 0 });
    return map.get(k);
  };

  state.players.forEach((p) => {
    ensure(p.x, p.y).players.push(`P${p.id}`);
  });

  state.zombies.forEach((zdata, zk) => {
    const { x: zx, y: zy } = parseKey(zk);
    const cell = ensure(zx, zy);
    cell.zombieType = zdata.type;
    cell.zombieCount = zdata.count ?? 1;
  });

  state.spaceTokens.forEach((tokens, tk) => {
    const { x: tx, y: ty } = parseKey(tk);
    const cell = ensure(tx, ty);
    cell.hearts += tokens.hearts || 0;
    cell.bullets += tokens.bullets || 0;
  });

  return map;
}

function renderPlayerTrailSvg() {
  if (!state.playerTrail || state.playerTrail.length < 2) {
    _trailFp = null;
    _trailSvgEl = null;
    return;
  }

  // Fingerprint covers the trail path and any view state that affects pixel positions.
  const fp = state.playerTrail.join(",") + "|" +
    (state.boardZoom || 1) + "|" + (state.boardPanX || 0) + "|" + (state.boardPanY || 0) + "|" +
    (state.isoView ? state.isoRotateX + "," + state.isoRotateZ : "0");

  if (fp === _trailFp && _trailSvgEl) {
    // Trail and view unchanged — re-append the cached SVG element (no reflow).
    refs.board.appendChild(_trailSvgEl);
    return;
  }

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
  svg.setAttribute("class", "player-trail-svg");
  svg.setAttribute("style", "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;overflow:visible;");

  const ptStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const polyline = document.createElementNS(NS, "polyline");
  polyline.setAttribute("points", ptStr);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("class", "player-trail-line");
  svg.appendChild(polyline);

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

  _trailFp = fp;
  _trailSvgEl = svg;
  refs.board.appendChild(svg);
}

function renderMoveStatus() {
  if (!refs.moveStatusMsg) return;
  const p = state.players[state.currentPlayerIndex];
  if (!p || state.gameOver) { refs.moveStatusMsg.classList.add("hidden"); return; }

  const msgs = [];
  if (state.step === STEP.ROLL_MOVE || state.step === STEP.MOVE) {
    if (p.cannotMoveTurns > 0)         msgs.push("Fear: you cannot move this turn.");
    if ((p.lockedToTileTurns ?? 0) > 0) msgs.push("Lost in the Woods: you cannot leave this tile.");
    if (p.claustrophobiaActive) {
      if (isSpaceBuilding(p.x, p.y)) {
        msgs.push("Claustrophobia: you must exit the building — only moves toward the exit are available.");
      } else {
        msgs.push("Claustrophobia: cannot enter any buildings this turn.");
      }
    }
    if (p.halfMovementNextTurn)         msgs.push("Your Shoe's Untied: movement roll will be halved.");
    if (p.brainCramp)                   msgs.push("Brain Cramp: an opponent will control your movement.");
    if (p.dieRollPenalty > 0)           msgs.push(`Abandon All Hope: -${p.dieRollPenalty} to all die rolls this turn.`);
    if (state.pendingBreakthrough)      msgs.push("Breakthrough: choose a direction to attempt to break through a wall (5–6 succeeds, 4 or less loses 1 life and ends movement).");
    if (state.pendingForcedMove) {
      const target = getPlayerById(state.pendingForcedMove.targetPlayerId);
      const targetName = target ? target.name : "Unknown";
      msgs.push(`Forced movement: moving ${targetName} — ${state.pendingForcedMove.remaining} space(s) remaining.`);
    }
  }

  if (msgs.length === 0) { refs.moveStatusMsg.classList.add("hidden"); return; }
  refs.moveStatusMsg.classList.remove("hidden");
  refs.moveStatusMsg.innerHTML = msgs.map((m) => `<div>${m}</div>`).join("");
}
