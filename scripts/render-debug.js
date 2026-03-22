// render-debug.js — Tile editor debug panel rendering functions.
// Handles the map deck debug panel (tile-editor.html / .deck-debug scoped UI).

let mapDeckDebugIdCounter = 1;
const mapDeckDebugEdits = new Map();
const mapDeckDebugFilters = { collection: "all", enabled: "all" };

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
      }
      entries.push(`  "${coord}": { ${parts.join(", ")} }`);
    }
  }
  return `subTilesTemplate: {\n${entries.join(",\n")}\n}`;
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
    if (tile?.type === "helipad" || tile?.type === "special" || tile?.isWinTile || tile?.isStartTile) return "Special Cards";
    return "Special Cards";
  };

  const grouped = new Map([
    ["Buildings", []],
    ["Road", []],
    ["Special Cards", []]
  ]);

  const collectionOptions = [["all", "All Collections"], ...Object.entries(COLLECTIONS).map(([k, v]) => [v, k])];
  const enabledOptions = [["all", "All"], ["true", "Enabled"], ["false", "Disabled"]];
  const filterBar = `
    <div class="deck-debug-filters">
      <label>Collection
        <select data-debug-filter="collection">
          ${collectionOptions.map(([v, label]) => `<option value="${v}" ${mapDeckDebugFilters.collection === v ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>Enabled
        <select data-debug-filter="enabled">
          ${enabledOptions.map(([v, label]) => `<option value="${v}" ${mapDeckDebugFilters.enabled === v ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
    </div>
  `;

  const seenNames = new Set();
  state.mapDeck.forEach((tile, index) => {
    if (seenNames.has(tile.name)) return;
    seenNames.add(tile.name);
    if (mapDeckDebugFilters.collection !== "all" && (tile.collection || getBaseCollection()) !== mapDeckDebugFilters.collection) return;
    if (mapDeckDebugFilters.enabled !== "all" && String(tile.enabled !== false) !== mapDeckDebugFilters.enabled) return;
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
        <div class="deck-tile-edit-line">
          <strong>${getTileDisplayName(tileForRender)}</strong>
          <select data-debug-tile-id="${tileId}" data-debug-field="collection">
            ${Object.entries(COLLECTIONS).map(([key, val]) =>
              `<option value="${val}" ${(tileForRender.collection || getBaseCollection()) === val ? "selected" : ""}>${key}</option>`
            ).join("")}
          </select>
        </div>
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
          <strong>Enabled</strong>
          <input type="checkbox" data-debug-tile-id="${tileId}" data-debug-field="enabled" ${tileForRender.enabled !== false ? "checked" : ""} />
        </label>
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

  refs.mapDeckDebug.innerHTML = filterBar + sections.join("");
}
