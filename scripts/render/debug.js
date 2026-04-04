// render-debug.js — Tile editor debug panel rendering functions.
// Handles the map deck debug panel (tile-editor.html / .deck-debug scoped UI).

let mapDeckDebugIdCounter = 1;
const mapDeckDebugEdits = new Map();
const mapDeckDebugFilters = { collection: "all" };
const mapDeckExpandedTiles = new Set();   // tileIds with subtile editor open
const mapDeckOpenGroups = new Set();      // group names that are expanded (default: all collapsed)
const _pendingRerenderIds = new Set();
let _renderDebounceTimer = null;

function ensureMapDeckDebugTileId(tile) {
  if (tile._debugTileId) {
    return tile._debugTileId;
  }
  for (const t of state.mapDeck) {
    if (t !== tile && t.name === tile.name && t.type === tile.type && t._debugTileId) {
      tile._debugTileId = t._debugTileId;
      return tile._debugTileId;
    }
  }
  tile._debugTileId = `tile-${mapDeckDebugIdCounter}`;
  mapDeckDebugIdCounter += 1;
  return tile._debugTileId;
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
        ),
        airDucts: normalizeDirList(
          actual.airDucts || raw.airDucts || cell.airDucts
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
      const cell = editedCells?.[coord] || { walkable: false, type: "", walls: [], doors: [], airDucts: [] };
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
        if (cell.airDucts?.length) {
          row.airDucts = [...cell.airDucts];
        }
        template[coord] = row;
      }
    }
  }
  return template;
}

function buildSubTilesTemplateCode(editedCells) {
  const template = editableCellsToTemplate(editedCells);
  const entries = [];
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
          parts.push(`type: "${row.type}"`);
        }
        if (row.walls?.length) {
          parts.push(`walls: [${row.walls.map((dir) => `"${dir}"`).join(", ")}]`);
        }
        if (row.doors?.length) {
          parts.push(`doors: [${row.doors.map((dir) => `"${dir}"`).join(", ")}]`);
        }
        if (row.airDucts?.length) {
          parts.push(`airDucts: [${row.airDucts.map((dir) => `"${dir}"`).join(", ")}]`);
        }
      }
      entries.push(`  "${coord}": { ${parts.join(", ")} }`);
    }
  }
  return `subTilesTemplate: {\n${entries.join(",\n")}\n}`;
}

function formatDirs(value) {
  if (!value) return "-";
  const dirs = Array.isArray(value)
    ? value
    : Object.entries(value).filter(([, allowed]) => Boolean(allowed)).map(([dir]) => dir);
  if (dirs.length === 0) return "-";
  return dirs.map(directionToArrow).join(" ");
}

function renderCard({ tile, deckIndex }) {
  const { tileId, editedCells } = ensureMapDeckDebugEdits(tile);
  const editableTemplate = editableCellsToTemplate(editedCells);
  // Use editableTemplate directly as subTiles — connectivity (enterFrom/exitTo) not needed for the micro-grid
  const tileForRender = { ...tile, subTilesTemplate: editableTemplate, subTiles: editableTemplate };
  const microHtml = buildMicroGridHtml(tileForRender);

  const isExpanded = mapDeckExpandedTiles.has(tileId);
  let subtileSection = "";
  if (isExpanded) {
    const subtileRows = [];
    for (let ly = 0; ly < 3; ly += 1) {
      for (let lx = 0; lx < 3; lx += 1) {
        const coord = key(lx, ly);
        const cell = editedCells?.[coord] || { walkable: false, type: "", walls: [], doors: [], airDucts: [] };
        if (window.renderSubtileEditorRow && window.renderCompassCheckboxes) {
          subtileRows.push(window.renderSubtileEditorRow({
            prefix: "data-debug-",
            coord, lx, ly, cell, tileId,
            renderCompassCheckboxes: window.renderCompassCheckboxes
          }));
        }
      }
    }
    subtileSection = `
      <button type="button" class="deck-expand-btn deck-expand-btn--open" data-debug-expand-tile="${tileId}">Subtiles ▲</button>
      <div class="deck-subtiles">${subtileRows.join("")}</div>
    `;
  } else {
    subtileSection = `<button type="button" class="deck-expand-btn" data-debug-expand-tile="${tileId}">Edit Subtiles ▼</button>`;
  }

  const zombieTotal = Object.values(tileForRender.zombies || {}).reduce((s, n) => s + n, 0);
  const currentZombieType = Object.keys(tileForRender.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
  const sc = getCollectionShortCode(tileForRender.collection);
  const scBadge = sc ? ` <span class="coll-short-code">${sc}</span>` : "";

  const generatedCode = buildSubTilesTemplateCode(editedCells);
  const { _debugTileId, subTiles, ...tileForCode } = tileForRender;
  const fullTileCode = formatTileCode(tileForCode);

  return `
    <div class="deck-tile ${getTileClassName(tileForRender)}" data-debug-card-id="${tileId}" style="background: ${getTileBackgroundStyle(tileForRender.type)}">
      <div class="small">#${deckIndex + 1}</div>
      <div class="deck-tile-edit-line">
        <strong>${getTileDisplayName(tileForRender)}</strong>${scBadge}
      </div>
      <div class="deck-tile-collections">
        <strong>Collections</strong>
        <div class="deck-tile-collections-grid">
          ${Object.entries(COLLECTIONS).map(([k, v]) => {
            const cnt = resolveCollectionCounts(tileForRender)[v] || 0;
            return `<label style="opacity:${cnt > 0 ? 1 : 0.4}">${k}:<input type="number" min="0" value="${cnt}" data-debug-tile-id="${tileId}" data-debug-field="collectionCount" data-debug-dir="${v}" class="deck-tile-count-input" /></label>`;
          }).join("")}
        </div>
      </div>
      <div class="deck-tile-edit-line">
        <strong>Type</strong>
        <select data-debug-tile-id="${tileId}" data-debug-field="tileType">
          ${Object.values(TILE_TYPE).map((v) => `<option value="${v}" ${tileForRender.type === v ? "selected" : ""}>${v}</option>`).join("")}
        </select>
      </div>
      <div class="deck-tile-edit-line">
        <strong>Spawn Mode</strong>
        <select data-debug-tile-id="${tileId}" data-debug-field="zombieSpawnMode">
          ${Object.values(ZOMBIE_SPAWN_MODE).map((m) => `<option value="${m}" ${(tileForRender.zombieSpawnMode || ZOMBIE_SPAWN_MODE.BY_CARD) === m ? "selected" : ""}>${m}</option>`).join("")}
        </select>
      </div>
      <div class="deck-tile-edit-line">
        <strong>Zombies</strong>
        <input type="number" min="0" value="${zombieTotal}" data-debug-tile-id="${tileId}" data-debug-field="zombieCount" data-debug-dir="${currentZombieType}" class="deck-tile-count-input" />
        <select data-debug-tile-id="${tileId}" data-debug-field="zombieType">
          ${Object.keys(ZOMBIE_TYPES).map((zt) => `<option value="${zt}" ${currentZombieType === zt ? "selected" : ""}>${zt}</option>`).join("")}
        </select>
      </div>
      <div class="deck-tile-edit-line">
        <strong>Hearts</strong>
        <input type="number" min="0" value="${tileForRender.hearts || 0}" data-debug-tile-id="${tileId}" data-debug-field="hearts" class="deck-tile-count-input" />
        <strong>Bullets</strong>
        <input type="number" min="0" value="${tileForRender.bullets || 0}" data-debug-tile-id="${tileId}" data-debug-field="bullets" class="deck-tile-count-input" />
      </div>
      <div class="deck-tile-edit-line">
        <strong>Connectors</strong>
        ${["N","E","S","W"].map((dir) => {
          const isObj = tileForRender.connectors && !Array.isArray(tileForRender.connectors);
          const checked = getConnectorDirs(tileForRender.connectors).includes(dir);
          const rule = isObj ? (tileForRender.connectors[dir] || CONNECTOR_RULE.SAME) : CONNECTOR_RULE.SAME;
          const ruleSelect = checked
            ? `<select data-debug-tile-id="${tileId}" data-debug-field="connectorRule" data-debug-dir="${dir}" style="font-size:0.7em">` +
              Object.values(CONNECTOR_RULE).map((v) => `<option value="${v}"${rule === v ? " selected" : ""}>${v}</option>`).join("") +
              `</select>`
            : "";
          return `<label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="connectors" data-debug-dir="${dir}" ${checked ? "checked" : ""}>${dir}</label>${ruleSelect}`;
        }).join("")}
      </div>
      <div class="deck-tile-edit-line">
        <strong>Flags</strong>
        <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="isStartTile" ${tileForRender.isStartTile ? "checked" : ""} />isStartTile</label>
        <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="isWinTile" ${tileForRender.isWinTile ? "checked" : ""} />isWinTile</label>
        <label><input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="firstDrawWhenSolo" ${tileForRender.firstDrawWhenSolo ? "checked" : ""} />firstDrawWhenSolo</label>
      </div>
      <div class="small">Connectors: ${formatDirs(tileForRender.connectors)}</div>
      <div class="small">Z${zombieTotal}, L${tileForRender.hearts || 0}, B${tileForRender.bullets || 0}</div>
      <div class="micro-grid">${microHtml}</div>
      ${subtileSection}
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
}

function rerenderCard(tileId) {
  if (!refs.mapDeckDebug) return;
  const tile = state.mapDeck.find((t) => t._debugTileId === tileId);
  if (!tile) { renderMapDeckDebug(); return; }
  const deckIndex = state.mapDeck.indexOf(tile);
  const existing = refs.mapDeckDebug.querySelector(`[data-debug-card-id="${tileId}"]`);
  if (!existing) { renderMapDeckDebug(); return; }
  const temp = document.createElement("div");
  temp.innerHTML = renderCard({ tile, deckIndex });
  const newEl = temp.firstElementChild;
  if (newEl) existing.replaceWith(newEl);
}

function scheduleRerenderCard(tileId) {
  _pendingRerenderIds.add(tileId);
  clearTimeout(_renderDebounceTimer);
  _renderDebounceTimer = setTimeout(() => {
    _renderDebounceTimer = null;
    const ids = new Set(_pendingRerenderIds);
    _pendingRerenderIds.clear();
    ids.forEach((id) => rerenderCard(id));
  }, 80);
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
    if (tile?.type === "grass") return "Grass";
    return "Special Cards";
  };

  const grouped = new Map([
    ["Buildings", []],
    ["Road", []],
    ["Grass", []],
    ["Special Cards", []]
  ]);

  const collectionOptions = [["all", "All Collections"], ...Object.entries(COLLECTIONS).map(([k, v]) => [v, k])];
  const filterBar = `
    <div class="deck-debug-filters">
      <label>Collection
        <select data-debug-filter="collection">
          ${collectionOptions.map(([v, label]) => `<option value="${v}" ${mapDeckDebugFilters.collection === v ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
    </div>
  `;

  const seenNames = new Set();
  state.mapDeck.forEach((tile, index) => {
    if (seenNames.has(tile.name)) return;
    seenNames.add(tile.name);
    if (mapDeckDebugFilters.collection !== "all" && !Object.keys(resolveCollectionCounts(tile)).includes(mapDeckDebugFilters.collection)) return;
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

  const sectionOrder = ["Buildings", "Road", "Grass", "Special Cards"];
  const sections = sectionOrder.map((section) => {
    const entries = grouped.get(section) || [];
    if (entries.length === 0) return "";
    const isOpen = mapDeckOpenGroups.has(section);
    return `
      <section class="map-deck-group">
        <button type="button" class="map-deck-group-title" data-deck-group-toggle="${section}">
          ${section} (${entries.length}) ${isOpen ? "▲" : "▼"}
        </button>
        ${isOpen ? `<div class="map-deck-group-grid">${entries.map((entry) => renderCard(entry)).join("")}</div>` : ""}
      </section>
    `;
  });

  refs.mapDeckDebug.innerHTML = filterBar + sections.join("");
}
