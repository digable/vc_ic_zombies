function formatTileCode(obj) {
  const identRe = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
  function fmtKey(k) {
    return identRe.test(k) ? k : JSON.stringify(k);
  }
  function fmt(val, depth) {
    if (val === null) return "null";
    if (typeof val === "string") return JSON.stringify(val);
    if (typeof val !== "object") return String(val);
    if (Array.isArray(val)) {
      return "[" + val.map((v) => fmt(v, depth + 1)).join(", ") + "]";
    }
    const entries = Object.entries(val);
    if (entries.length === 0) return "{}";
    if (depth >= 2) {
      return "{ " + entries.map(([k, v]) => `${fmtKey(k)}: ${fmt(v, depth + 1)}`).join(", ") + " }";
    }
    const pad = "  ".repeat(depth + 1);
    const close = "  ".repeat(depth);
    return "{\n" + entries.map(([k, v]) => `${pad}${fmtKey(k)}: ${fmt(v, depth + 1)}`).join(",\n") + "\n" + close + "}";
  }
  return fmt(obj, 0);
}

function renderDeckInfo() {
  const box = document.getElementById("deckInfoBox");
  if (!box) return;
  const totalStart = state.mapDeck.length + state.discardPile.length;
  const totalPlayed = state.discardPile.length;
  const totalLeft = state.mapDeck.length;
  box.innerHTML = `
    <div><strong>Deck Info</strong></div>
    <div>Total in Deck (start): ${totalStart}</div>
    <div>Total Played: ${totalPlayed}</div>
    <div>Total Left: ${totalLeft}</div>
  `;
}

function getRoadLineDirs(tileLike, lx, ly, getAdjacentTile) {
  if (!tileLike || getSubTileType(tileLike, lx, ly) !== "road") {
    return [];
  }
  const dirs = [];
  Object.entries(DIRS).forEach(([dir, d]) => {
    const nx = lx + d.x;
    const ny = ly + d.y;
    if (nx >= 0 && nx <= 2 && ny >= 0 && ny <= 2) {
      if (getSubTileType(tileLike, nx, ny) === "road") {
        dirs.push(dir);
      }
    } else if (getAdjacentTile && getAdjacentTile(dir)?.type === "road") {
      dirs.push(dir);
    }
  });
  return dirs;
}

function getSubTileWallDirs(tileLike, lx, ly) {
  const sub = tileLike?.subTiles?.[key(lx, ly)];
  if (!sub) {
    return [];
  }

  const rawWallDirs = (() => {
    if (sub.walkable === false) {
      return ["N", "E", "S", "W"];
    }

    const walls = sub.walls || sub.wall;
    if (!walls) {
      return [];
    }

    if (Array.isArray(walls)) {
      return walls.filter((dir) => dir === "N" || dir === "E" || dir === "S" || dir === "W");
    }

    if (typeof walls === "object") {
      return Object.entries(walls)
        .filter(([dir, isWall]) => Boolean(isWall) && (dir === "N" || dir === "E" || dir === "S" || dir === "W"))
        .map(([dir]) => dir);
    }

    return [];
  })();

  const hasWall = (tileRef, x, y, dir) => {
    const cell = tileRef?.subTiles?.[key(x, y)];
    if (!cell) {
      return false;
    }
    if (cell.walkable === false) {
      return true;
    }
    const cellWalls = cell.walls || cell.wall;
    if (!cellWalls) {
      return false;
    }
    if (Array.isArray(cellWalls)) {
      return cellWalls.includes(dir);
    }
    if (typeof cellWalls === "object") {
      return Boolean(cellWalls[dir]);
    }
    return false;
  };

  const isBlockedCell = (tileRef, x, y) => {
    const cell = tileRef?.subTiles?.[key(x, y)];
    if (!cell) {
      return false;
    }
    return cell.walkable === false;
  };

  return rawWallDirs.filter((dir) => {
    const d = DIRS[dir];
    const nx = lx + d.x;
    const ny = ly + d.y;
    if (nx < 0 || nx > 2 || ny < 0 || ny > 2) {
      return true;
    }

    if (sub.walkable === false && isBlockedCell(tileLike, nx, ny)) {
      return false;
    }

    const opposite = d.opposite;
    if (!hasWall(tileLike, nx, ny, opposite)) {
      return true;
    }

    if (dir === "N" || dir === "W") {
      return true;
    }
    return false;
  });
}

function getSubTileType(tileLike, lx, ly) {
  const sub = tileLike?.subTiles?.[key(lx, ly)];
  if (!sub) {
    return null;
  }
  const raw = sub.type ?? sub.subTileType ?? sub.subtype ?? null;
  if (typeof raw !== "string") {
    return null;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function isRoadStyledSubtile(tileLike, lx, ly, isWalkable) {
  if (!isWalkable) {
    return false;
  }
  const subTileType = getSubTileType(tileLike, lx, ly);
  return subTileType === "road";
}

function getTileClassName(tile) {
  if (tile?.type === "town") return "tile-town";
  if (tile?.type === "building") return "tile-building";
  if (tile?.type === "grass") return "tile-grass";
  if (tile?.type === "named") return "tile-named";
  if (tile?.type === "helipad") return "tile-helipad";
  return "tile-road";
}

function getTileBackgroundStyle(type) {
  const map = {
    named: "#8f6b40",
    building: "#c59f6a",
    road: "#9faab4",
    helipad: "#2f9e44",
    town: "linear-gradient(135deg, #f7c88f 0%, #ebb36e 100%)",
    grass: "linear-gradient(135deg, #b6e7a7 60%, #7fd97f 100%)",
  };
  return map[type] || "#9faab4";
}

let mapDeckDebugIdCounter = 1;
const mapDeckDebugEdits = new Map();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureMapDeckDebugTileId(tile) {
  if (tile._debugTileId) {
    return tile._debugTileId;
  }
  for (const t of state.mapDeck) {
    if (t !== tile && t.name === tile.name && t.type === tile.type && t.count === tile.count && t._debugTileId) {
      tile._debugTileId = t._debugTileId;
      return tile._debugTileId;
    }
  }
  tile._debugTileId = `tile-${mapDeckDebugIdCounter}`;
  mapDeckDebugIdCounter += 1;
  return tile._debugTileId;
}

function normalizeDirList(value) {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value)
    ? value
    : Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([dir]) => dir);
  return ["N", "E", "S", "W"].filter((dir) => list.includes(dir));
}

function createEditableSubtileCells(tile) {
  const base = buildSubTilesForTile(tile);
  const rawTemplate = getTileSubTileMap(tile) || {};
  const actualSubTiles = tile.subTiles || {};
  const out = {};
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const coord = key(lx, ly);
      const actual = actualSubTiles[coord] || {};
      const raw = rawTemplate[coord] || {};
      const cell = base?.[coord] || {};
      out[coord] = {
        walkable:
          typeof actual.walkable === "boolean" ? actual.walkable :
          typeof raw.walkable === "boolean" ? raw.walkable :
          typeof cell.walkable === "boolean" ? cell.walkable : false,
        type:
          typeof actual.type === "string" ? actual.type :
          typeof raw.type === "string" ? raw.type :
          typeof cell.type === "string" ? cell.type : "",
        walls: normalizeDirList(
          actual.walls || actual.wall || raw.walls || raw.wall || cell.walls || cell.wall
        ),
        doors: normalizeDirList(
          actual.doors || actual.door || raw.doors || raw.door || cell.doors || cell.door
        )
      };
    }
  }
  return out;
}

function ensureMapDeckDebugEdits(tile) {
  const tileId = ensureMapDeckDebugTileId(tile);
  if (!mapDeckDebugEdits.has(tileId)) {
    mapDeckDebugEdits.set(tileId, createEditableSubtileCells(tile));
  }
  return { tileId, editedCells: mapDeckDebugEdits.get(tileId) };
}

function editableCellsToTemplate(editedCells) {
  const template = {};
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const coord = key(lx, ly);
      const cell = editedCells?.[coord] || { walkable: false, type: "", walls: [], doors: [] };
      if (!cell.walkable) {
        template[coord] = { walkable: false };
      } else {
        const row = { walkable: true };
        if (cell.type && cell.type.trim()) {
          row.type = cell.type.trim();
        }
        if (cell.walls?.length) {
          row.walls = [...cell.walls];
        }
        if (cell.doors?.length) {
          row.doors = [...cell.doors];
        }
        template[coord] = row;
      }
    }
  }
  return template;
}

function buildSubTilesTemplateCode(editedCells) {
  const template = editableCellsToTemplate(editedCells);
  const lines = ["subTilesTemplate: {"];
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const coord = key(lx, ly);
      const row = template[coord];
      const parts = [];
      if (row.walkable === false) {
        parts.push("walkable: false");
      } else {
        parts.push("walkable: true");
        if (row.type) {
          parts.push(`type: \"${row.type}\"`);
        }
        if (row.walls?.length) {
          parts.push(`walls: [${row.walls.map((dir) => `\"${dir}\"`).join(", ")}]`);
        }
        if (row.doors?.length) {
          parts.push(`doors: [${row.doors.map((dir) => `\"${dir}\"`).join(", ")}]`);
        }
      }
      lines.push(`  \"${coord}\": { ${parts.join(", ")} },`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

// Builds micro-grid HTML from an already-resolved tileForRender (subTiles already set).
function buildMicroGridHtml(tileForRender) {
  const micro = [];
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const isWalkable = isLocalWalkable(tileForRender, lx, ly);
      const subType = getSubTileType(tileForRender, lx, ly);
      const lineDirs = getRoadLineDirs(tileForRender, lx, ly);
      const lanes = lineDirs.map((dir) => `<span class="lane lane-${dir.toLowerCase()}"></span>`).join("");
      const wallDirs = getSubTileWallDirs(tileForRender, lx, ly);
      const walls = wallDirs.map((dir) => `<span class="wall wall-${dir.toLowerCase()}"></span>`).join("");
      const isExit = (tileForRender.connectors || []).some((dir) => {
        const door = DOOR_LOCAL[dir];
        return door && door.x === lx && door.y === ly;
      });
      micro.push(
        `<span class="micro-cell${subType ? ` ${subType}-subtile` : ""}${!isWalkable ? " blocked-subtile" : ""}">${lanes}${walls}${!isWalkable ? '<span class="mark blocked">X</span>' : ""}${isExit ? '<span class="mark exit">E</span>' : ""}</span>`
      );
    }
  }
  return micro.join("");
}

function renderMapDeckDebug() {
  if (!refs.mapDeckDebug || !refs.mapDeckDebugCount) {
    return;
  }

  refs.mapDeckDebugCount.textContent = `${state.mapDeck.length} tile(s)`;
  if (state.mapDeck.length === 0) {
    refs.mapDeckDebug.innerHTML = "<div class='small'>Map deck is empty.</div>";
    return;
  }

  const getDebugGroup = (tile) => {
    if (tile?.type === "building" || tile?.type === "named") return "Buildings";
    if (tile?.type === "road") return "Road";
    if (tile?.type === "helipad" || tile?.type === "special" || tile?.isHelipad || tile?.isTownSquare) return "Special Cards";
    return "Special Cards";
  };

  const grouped = new Map([
    ["Buildings", []],
    ["Road", []],
    ["Special Cards", []]
  ]);

  state.mapDeck.forEach((tile, index) => {
    const group = getDebugGroup(tile);
    grouped.get(group)?.push({ tile, deckIndex: index });
  });

  grouped.forEach((entries) => {
    entries.sort((a, b) => {
      const an = getTileDisplayName(a.tile).toLowerCase();
      const bn = getTileDisplayName(b.tile).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return a.deckIndex - b.deckIndex;
    });
  });

  const renderCard = ({ tile, deckIndex }) => {
    const { tileId, editedCells } = ensureMapDeckDebugEdits(tile);

    // Build tileForRender from stored editedCells — never re-derive from raw tile data.
    const editableTemplate = editableCellsToTemplate(editedCells);
    const tileForRender = {
      ...tile,
      subTilesTemplate: editableTemplate,
      subTiles: buildSubTilesForTile({ ...tile, subTilesTemplate: editableTemplate })
    };

    // Micro grid — pass the already-resolved tileForRender.
    const microHtml = buildMicroGridHtml(tileForRender);

    // Subtile editor rows — tileId is passed so all inputs get data-debug-tile-id.
    const subtileRows = [];
    for (let ly = 0; ly < 3; ly += 1) {
      for (let lx = 0; lx < 3; lx += 1) {
        const coord = key(lx, ly);
        const cell = editedCells?.[coord] || { walkable: false, type: "", walls: [], doors: [] };
        if (window.renderSubtileEditorRow && window.renderCompassCheckboxes) {
          subtileRows.push(window.renderSubtileEditorRow({
            prefix: "data-debug-",
            coord,
            lx,
            ly,
            cell,
            tileId,
            renderCompassCheckboxes: window.renderCompassCheckboxes
          }));
        } else {
          subtileRows.push(`<div>${coord}</div>`);
        }
      }
    }

    const formatDirs = (value) => {
      if (!value) return "-";
      const dirs = Array.isArray(value)
        ? value
        : Object.entries(value)
          .filter(([, allowed]) => Boolean(allowed))
          .map(([dir]) => dir);
      if (dirs.length === 0) return "-";
      return dirs.map(directionToArrow).join(" ");
    };

    const generatedCode = buildSubTilesTemplateCode(editedCells);
    const { _debugTileId, subTiles, ...tileForCode } = tileForRender;
    const fullTileCode = formatTileCode(tileForCode);

    return `
      <div class="deck-tile ${getTileClassName(tileForRender)}" data-debug-card-id="${tileId}" style="background: ${getTileBackgroundStyle(tileForRender.type)}">
        <div class="small">#${deckIndex + 1}</div>
        <div><strong>${getTileDisplayName(tileForRender)}</strong></div>
        <div class="deck-tile-edit-line">
          <strong>Type</strong>
          <select data-debug-tile-id="${tileId}" data-debug-field="tileType">
            <option value="named" ${tileForRender.type === "named" ? "selected" : ""}>named</option>
            <option value="building" ${tileForRender.type === "building" ? "selected" : ""}>building</option>
            <option value="road" ${tileForRender.type === "road" ? "selected" : ""}>road</option>
            <option value="helipad" ${tileForRender.type === "helipad" ? "selected" : ""}>helipad</option>
            <option value="town" ${tileForRender.type === "town" ? "selected" : ""}>town</option>
          </select>
        </div>
        <div class="deck-tile-edit-line">
          <strong>Spawn Mode</strong>
          <select data-debug-tile-id="${tileId}" data-debug-field="zombieSpawnMode">
            <option value="by_card" ${(tileForRender.zombieSpawnMode || "by_card") === "by_card" ? "selected" : ""}>by_card</option>
            <option value="by_exits" ${tileForRender.zombieSpawnMode === "by_exits" ? "selected" : ""}>by_exits</option>
            <option value="none" ${tileForRender.zombieSpawnMode === "none" ? "selected" : ""}>none</option>
          </select>
        </div>
        <label class="deck-tile-edit-line">
          <strong>Count</strong>
          <input type="number" min="1" value="${tileForRender.count || 1}" data-debug-tile-id="${tileId}" data-debug-field="count" class="deck-tile-count-input" />
        </label>
        <div class="deck-tile-edit-line">
          <strong>Connectors</strong>
          <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="connectors" data-debug-dir="N" ${Array.isArray(tileForRender.connectors) && tileForRender.connectors.includes("N") ? "checked" : ""}/>N</label>
          <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="connectors" data-debug-dir="E" ${Array.isArray(tileForRender.connectors) && tileForRender.connectors.includes("E") ? "checked" : ""}/>E</label>
          <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="connectors" data-debug-dir="S" ${Array.isArray(tileForRender.connectors) && tileForRender.connectors.includes("S") ? "checked" : ""}/>S</label>
          <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="connectors" data-debug-dir="W" ${Array.isArray(tileForRender.connectors) && tileForRender.connectors.includes("W") ? "checked" : ""}/>W</label>
        </div>
        <div class="small">Connectors: ${formatDirs(tileForRender.connectors)}</div>
        <div class="small">
          Z${tileForRender.zombieCount || 0},
          L${tileForRender.hearts || 0},
          B${tileForRender.bullets || 0}
        </div>
        <div class="micro-grid">${microHtml}</div>
        <div class="deck-subtiles">${subtileRows.join("")}</div>
        <details class="deck-code-wrap">
          <summary>Generated subTilesTemplate code</summary>
          <div class="deck-code-actions">
            <button type="button" class="deck-copy-btn" data-debug-copy-code="1">Copy</button>
            <span class="deck-copy-status" aria-live="polite"></span>
          </div>
          <pre class="deck-code">${escapeHtml(generatedCode)}</pre>
        </details>
        <details class="deck-code-wrap">
          <summary>Generated full tile object code</summary>
          <div class="deck-code-actions">
            <button type="button" class="deck-copy-btn" data-debug-copy-code="2">Copy</button>
            <span class="deck-copy-status" aria-live="polite"></span>
          </div>
          <pre class="deck-code">${escapeHtml(fullTileCode)}</pre>
        </details>
      </div>
    `;
  };

  const sectionOrder = ["Buildings", "Road", "Special Cards"];
  const sections = sectionOrder.map((section) => {
    const entries = grouped.get(section) || [];
    if (entries.length === 0) return "";
    return `
      <section class="map-deck-group">
        <h4 class="map-deck-group-title">${section} (${entries.length})</h4>
        <div class="map-deck-group-grid">
          ${entries.map((entry) => renderCard(entry)).join("")}
        </div>
      </section>
    `;
  });

  refs.mapDeckDebug.innerHTML = sections.join("");
}

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

          cell.classList.add(getTileClassName(previewTile));

          const sourceSubTiles = getTileSubTileMap(previewTile);
          const rotatedSubTiles = getRotatedSubTiles(sourceSubTiles, state.pendingRotation);
          const previewTileForWalk = {
            type: previewTile.type,
            connectors: option?.connectors || [],
            fullAccess: previewTile.fullAccess,
            ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
          };

          cell.innerHTML = `
            <div><strong>${getTileDisplayName(previewTile)}</strong></div>
            <div class="small">
              Z${getZombieSpawnCountForPlacedTile(previewTile, option?.connectors || [])},
              L${previewTile.hearts || 0},
              B${previewTile.bullets || 0}
            </div>
            <div class="micro-grid">${buildMicroGridHtml(previewTileForWalk)}</div>
            <div class="small">Click to place</div>
          `;
        }
        refs.board.appendChild(cell);
        continue;
      }

      cell.classList.add(getTileClassName(tile));

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
          const isWalkable = isLocalWalkable(tile, lx, ly);
          const data = occupantMap.get(key(lx, ly)) || { players: [], zombie: false, hearts: 0, bullets: 0 };
          const parts = [];
          const subType = getSubTileType(tile, lx, ly);
          const lineDirs = getRoadLineDirs(tile, lx, ly, (dir) => {
            const d = DIRS[dir];
            return state.board.get(key(x + d.x, y + d.y));
          });
          const lanes = lineDirs
            .map((dir) => `<span class="lane lane-${dir.toLowerCase()}"></span>`)
            .join("");
          const wallDirs = getSubTileWallDirs(tile, lx, ly);
          const walls = wallDirs
            .map((dir) => `<span class="wall wall-${dir.toLowerCase()}"></span>`)
            .join("");

          if (!isWalkable) {
            parts.push('<span class="mark blocked">X</span>');
          }

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
          micro.push(`<span class="micro-cell${subType ? ` ${subType}-subtile` : ""}${!isWalkable ? " blocked-subtile" : ""}">${lanes}${walls}${parts.join("")}</span>`);
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
      Hearts: ${cp.hearts} | Bullets: ${cp.bullets} | Kills: ${cp.kills} | Attack: ${cp.attack || 0}${cp.tempCombatBonus ? ` (+${cp.tempCombatBonus} turn)` : ""}<br />
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
      Hearts: ${p.hearts} | Bullets: ${p.bullets} | Kills: ${p.kills} | Attack: ${p.attack || 0}${p.tempCombatBonus ? ` (+${p.tempCombatBonus} turn)` : ""}<br />
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

    const playDisabled = state.gameOver || player.eventUsedThisRound || player.cannotPlayCardTurns > 0 || Boolean(state.pendingCombatDecision);
    const showSelect = state.step === STEP.DISCARD && !state.pendingCombatDecision;
    el.innerHTML = `
      <strong>${card.name}</strong><br />
      <span class="small">${card.description}</span><br />
      <button ${playDisabled ? "disabled" : ""} data-play-index="${index}">Play</button>
      ${showSelect ? `<button data-select-index="${index}">Select</button>` : ""}
    `;

    refs.handList.appendChild(el);
  });
}

function renderCombatDecision() {
  const panel = refs.combatDecisionPanel;
  if (!panel) {
    return;
  }

  const pending = state.pendingCombatDecision;
  if (!pending) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const player = state.players.find((p) => p.id === pending.playerId);
  if (!player) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="combat-decision-title">Combat Decision Required: ${player.name}</div>
    <div class="small">
      ${player.name} rolled ${pending.baseRoll} (d6 ${pending.roll} + attack ${pending.permanentBonus} + temp ${pending.tempBonus}).<br />
      Current combat total: ${pending.modifiedRoll}. Choose one action:
    </div>
    <div class="combat-decision-actions">
      <button data-combat-action="B" ${player.bullets > 0 ? "" : "disabled"}>Spend 1 Bullet (+1)</button>
      <button data-combat-action="H" ${player.hearts > 0 ? "" : "disabled"}>Spend 1 Life Token (Reroll)</button>
      <button data-combat-action="L">Lose Combat</button>
    </div>
  `;
}

function renderLog() {
  refs.log.innerHTML = state.logs.map((line) => `<div class="log-line">${line}</div>`).join("");
}

function updateButtons() {
  if (state.pendingCombatDecision) {
    refs.drawTileBtn.disabled = true;
    refs.rotateLeftBtn.disabled = true;
    refs.rotateRightBtn.disabled = true;
    refs.combatBtn.disabled = true;
    refs.drawEventsBtn.disabled = true;
    refs.rollMoveBtn.disabled = true;
    refs.endMoveBtn.disabled = true;
    refs.moveZombiesBtn.disabled = true;
    refs.discardBtn.disabled = true;
    refs.endTurnBtn.disabled = true;
    refs.moveDirBtns.forEach((btn) => {
      btn.disabled = true;
    });
    return;
  }

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
  const combatText = state.lastCombatResult ? ` | Combat: ${state.lastCombatResult}` : "";
  refs.turnInfo.textContent = `Turn ${state.turnNumber} | ${currentPlayer().name} | Step: ${state.step}${combatText}`;
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
  renderDeckInfo();
  renderCombatDecision();
  renderLog();
  updateButtons();
}