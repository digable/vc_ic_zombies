// Populate the tile type dropdown from TILE_TYPE constant
function populateTileTypeDropdown() {
  const sel = document.getElementById("newTileType");
  if (!sel) return;
  sel.innerHTML = Object.values(TILE_TYPE)
    .map((v) => `<option value="${v}"${v === TILE_TYPE.NAMED ? " selected" : ""}>${v}</option>`)
    .join("");
}

function populateSpawnModeDropdown() {
  const sel = document.getElementById("newTileSpawnMode");
  if (!sel) return;
  sel.innerHTML = Object.values(ZOMBIE_SPAWN_MODE)
    .map((v) => `<option value="${v}"${v === ZOMBIE_SPAWN_MODE.BY_CARD ? " selected" : ""}>${v}</option>`)
    .join("");
}

function populateZombieTypeDropdown() {
  const sel = document.getElementById("newTileZombieType");
  if (!sel) return;
  sel.innerHTML = Object.values(ZOMBIE_TYPE)
    .map((v) => `<option value="${v}"${v === ZOMBIE_TYPE.REGULAR ? " selected" : ""}>${v}</option>`)
    .join("");
}

function populateConnectorRuleSelects() {
  const options = Object.values(CONNECTOR_RULE)
    .map((v) => `<option value="${v}"${v === CONNECTOR_RULE.SAME ? " selected" : ""}>${v}</option>`)
    .join("");
  DIRECTION_ORDER.forEach((dir) => {
    const sel = document.getElementById(`newTileConnectorRule${dir}`);
    if (sel) sel.innerHTML = options;
  });
}

// Attach event listeners for subtile editor controls
function attachNewTileSubtileEditorListeners() {
  const container = document.getElementById("newTileSubtileEditor");
  if (!container) return;
  container.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const coord = target.getAttribute("data-debug-coord");
    const field = target.getAttribute("data-debug-field");
    const dir = target.getAttribute("data-debug-dir");
    if (!coord || !field || !newTileGeneratorCells[coord]) return;
    if (field === "walkable" && target instanceof HTMLInputElement) {
      newTileGeneratorCells[coord].walkable = target.checked;
    } else if (field === "type" && target instanceof HTMLSelectElement) {
      newTileGeneratorCells[coord].type = target.value;
    } else if ((field === "walls" || field === "doors" || field === "airDucts") && dir && target instanceof HTMLInputElement) {
      const set = new Set(newTileGeneratorCells[coord][field] || []);
      if (target.checked) {
        set.add(dir);
      } else {
        set.delete(dir);
      }
      newTileGeneratorCells[coord][field] = ["N", "E", "S", "W"].filter((d) => set.has(d));
    }
    refreshNewTilePreview();
  });
}

// Renders the subtile editor UI for the new tile generator
function renderNewTileSubtileEditor() {
  const container = document.getElementById("newTileSubtileEditor");
  if (!container) return;
  const subtileRows = [];
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const coord = key(lx, ly);
      const cell = newTileGeneratorCells[coord];
      if (window.renderSubtileEditorRow && window.renderCompassCheckboxes) {
        subtileRows.push(window.renderSubtileEditorRow({
          prefix: "data-debug-",
          coord,
          lx,
          ly,
          cell,
          renderCompassCheckboxes: window.renderCompassCheckboxes
        }));
      } else {
        subtileRows.push(`<div>${coord}</div>`);
      }
    }
  }
  container.innerHTML = `<div class="deck-subtiles">${subtileRows.join("")}</div>`;
}

function copyTextToClipboard(text) {
  return navigator.clipboard.writeText(text);
}


function updateMapDeckDebugEdit(tileId, coord, field, value, dir = null) {
  const tile = state.mapDeck.find((t) => t._debugTileId === tileId);

  // Tile-level fields
  if (field === "tileType") {
    if (!tile) return;
    tile.type = typeof value === "string" ? value.trim().toLowerCase() : tile.type;
    renderMapDeckDebug(); // full re-render: may change group membership
    return;
  }

  if (field === "collectionCount") {
    if (!tile) return;
    const colCounts = resolveCollectionCounts(tile);
    const n = Math.max(0, parseInt(value, 10) || 0);
    if (n === 0) { delete colCounts[dir]; } else { colCounts[dir] = n; }
    tile.collection = colCounts;
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "zombieSpawnMode") {
    if (!tile) return;
    tile.zombieSpawnMode = typeof value === "string" ? value.trim() : tile.zombieSpawnMode;
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "zombieCount") {
    if (!tile) return;
    const zombieType = dir || ZOMBIE_TYPE.REGULAR;
    const n = Math.max(0, parseInt(value, 10) || 0);
    if (!tile.zombies) tile.zombies = {};
    if (n === 0) { delete tile.zombies[zombieType]; } else { tile.zombies[zombieType] = n; }
    if (Object.keys(tile.zombies).length === 0) delete tile.zombies;
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "zombieType") {
    if (!tile) return;
    const currentZombies = tile.zombies || {};
    const total = Object.values(currentZombies).reduce((s, n) => s + n, 0);
    tile.zombies = total > 0 ? { [value]: total } : {};
    if (Object.keys(tile.zombies).length === 0) delete tile.zombies;
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "hearts") {
    if (!tile) return;
    tile.hearts = Math.max(0, parseInt(value, 10) || 0);
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "bullets") {
    if (!tile) return;
    tile.bullets = Math.max(0, parseInt(value, 10) || 0);
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "connectors") {
    if (!tile) return;
    const isObj = tile.connectors && !Array.isArray(tile.connectors);
    if (isObj) {
      const updated = { ...tile.connectors };
      if (value) { updated[dir] = updated[dir] || CONNECTOR_RULE.SAME; } else { delete updated[dir]; }
      tile.connectors = updated;
    } else {
      const set = new Set(getConnectorDirs(tile.connectors));
      if (value) { set.add(dir); } else { set.delete(dir); }
      tile.connectors = ["N", "E", "S", "W"].filter((d) => set.has(d));
    }
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "connectorRule") {
    if (!tile) return;
    // Upgrade array to object format when setting a rule
    if (!tile.connectors || Array.isArray(tile.connectors)) {
      const dirs = getConnectorDirs(tile.connectors);
      tile.connectors = Object.fromEntries(dirs.map((d) => [d, d === dir ? value : CONNECTOR_RULE.SAME]));
    } else {
      tile.connectors = { ...tile.connectors, [dir]: value };
    }
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "isStartTile" || field === "isWinTile" || field === "firstDrawWhenSolo") {
    if (!tile) return;
    if (value) { tile[field] = true; } else { delete tile[field]; }
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "companionDir") {
    if (!tile) return;
    if (value) { tile.companionDir = value; } else { delete tile.companionDir; }
    scheduleRerenderCard(tileId);
    return;
  }

  if (field === "companionTiles") {
    if (!tile) return;
    if (value) { tile.companionTiles = [{ name: value }]; } else { delete tile.companionTiles; }
    scheduleRerenderCard(tileId);
    return;
  }

  // Subtile-level fields
  const editedCells = mapDeckDebugEdits.get(tileId);
  if (!editedCells || (coord && !editedCells[coord])) {
    return;
  }

  if (field === "walkable") {
    editedCells[coord].walkable = Boolean(value);
  } else if (field === "type") {
    editedCells[coord].type = typeof value === "string" ? value.trim().toLowerCase() : "";
  } else if ((field === "walls" || field === "doors" || field === "airDucts") && dir) {
    const set = new Set(editedCells[coord][field] || []);
    if (value) { set.add(dir); } else { set.delete(dir); }
    editedCells[coord][field] = ["N", "E", "S", "W"].filter((d) => set.has(d));
  }

  scheduleRerenderCard(tileId);
}


function extractTileInputValues() {
  const name = (document.getElementById("newTileName")?.value || "New Tile").trim();
  const type = (document.getElementById("newTileType")?.value || "named").trim();
  const zombieSpawnMode = (document.getElementById("newTileSpawnMode")?.value || ZOMBIE_SPAWN_MODE.BY_CARD).trim();
  const zombieCount = Number(document.getElementById("newTileZombieCount")?.value || 0);
  const zombieType = (document.getElementById("newTileZombieType")?.value || ZOMBIE_TYPE.REGULAR);
  const hearts = Number(document.getElementById("newTileHearts")?.value || 0);
  const bullets = Number(document.getElementById("newTileBullets")?.value || 0);
  const companionDir = document.getElementById("newTileCompanionDir")?.value || "";
  const companionName = document.getElementById("newTileCompanionTile")?.value || "";

  // Per-collection counts
  const collection = {};
  Object.values(COLLECTIONS).forEach((collKey) => {
    const el = document.getElementById(`newTileCollCount_${collKey}`);
    const n = Math.max(0, parseInt(el?.value || "0", 10) || 0);
    if (n > 0) collection[collKey] = n;
  });

  const connectorDirs = ["N", "E", "S", "W"].filter((dir) =>
    Boolean(document.getElementById(`newTileConnector${dir}`)?.checked)
  );
  const connectorRules = Object.fromEntries(
    connectorDirs.map((dir) => [dir, document.getElementById(`newTileConnectorRule${dir}`)?.value || CONNECTOR_RULE.SAME])
  );
  const connectors = connectorDirs.length > 0 ? connectorRules : connectorDirs;

  const result = {
    name, type,
    collection: Object.keys(collection).length > 0 ? collection : { [getBaseCollection()]: 1 },
    connectors, zombieSpawnMode,
    zombies: zombieSpawnMode === ZOMBIE_SPAWN_MODE.D6_ROLL
      ? { [zombieType]: -1 }
      : (zombieCount > 0 ? { [zombieType]: zombieCount } : {}),
    hearts, bullets,
  };

  if (document.getElementById("newTileIsStartTile")?.checked) result.isStartTile = true;
  if (document.getElementById("newTileIsWinTile")?.checked) result.isWinTile = true;
  if (document.getElementById("newTileFirstDrawWhenSolo")?.checked) result.firstDrawWhenSolo = true;
  if (companionDir) result.companionDir = companionDir;
  if (companionName) result.companionTiles = [{ name: companionName }];

  return result;
}

function renderNewTileCompanionSelect() {
  const sel = document.getElementById("newTileCompanionTile");
  if (!sel) return;

  const selectedCollections = new Set(
    Object.values(COLLECTIONS).filter((collKey) => {
      const el = document.getElementById(`newTileCollCount_${collKey}`);
      return Math.max(0, parseInt(el?.value || "0", 10) || 0) > 0;
    })
  );

  const tileNames = [...new Set(
    state.mapDeck
      .filter((t) => {
        const counts = resolveCollectionCounts(t);
        return Object.keys(counts).some((k) => selectedCollections.has(k));
      })
      .map((t) => t.name)
  )].sort();

  const prev = sel.value;
  sel.innerHTML = '<option value="">— none —</option>' +
    tileNames.map((n) => `<option value="${n}"${prev === n ? " selected" : ""}>${n}</option>`).join("");
}

function renderNewTileCollectionInputs() {
  const container = document.getElementById("newTileCollectionInputs");
  if (!container) return;
  container.innerHTML = Object.entries(COLLECTIONS).map(([enumKey, collKey]) => {
    const meta = COLLECTION_META[collKey];
    const label = meta?.label || enumKey;
    const sc = meta?.shortCode ? ` <span class="coll-short-code">${meta.shortCode}</span>` : "";
    return `<label>${label}${sc} <input id="newTileCollCount_${collKey}" type="number" min="0" value="0" style="width:3.5rem" /></label>`;
  }).join("");
}

function buildNewTileObjectFromInputs() {
  return { ...extractTileInputValues(), subTilesTemplate: editableCellsToTemplate(newTileGeneratorCells), _isGeneratedPreview: true };
}

const newTileGeneratorCells = {};
(function () {
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      newTileGeneratorCells[key(lx, ly)] = { walkable: lx === 1 && ly === 1, type: "", walls: [], doors: [], airDucts: [] };
    }
  }
})();



function syncZombieCountToSpawnMode() {
  const modeEl = document.getElementById("newTileSpawnMode");
  const countEl = document.getElementById("newTileZombieCount");
  if (!modeEl || !countEl) return;
  const isD6Roll = modeEl.value === ZOMBIE_SPAWN_MODE.D6_ROLL;
  countEl.disabled = isD6Roll;
  if (isD6Roll) {
    countEl.value = "-1";
  } else if (Number(countEl.value) < 0) {
    countEl.value = "0";
  }
}

function refreshNewTilePreview() {
  syncZombieCountToSpawnMode();
  renderNewTileCompanionSelect();
  const outputEl = document.getElementById("newTileCodeOutput");
  const statusEl = document.getElementById("newTileCodeStatus");
  const previewEl = document.getElementById("newTileLivePreview");
  const tile = buildNewTileObjectFromInputs();
  const { _isGeneratedPreview, ...tileForCode } = tile;
  if (outputEl instanceof HTMLElement) {
    outputEl.textContent = formatTileCode(tileForCode);
  }
  if (statusEl instanceof HTMLElement) {
    statusEl.textContent = "";
  }
  if (previewEl instanceof HTMLElement) {
    const editableTemplate = typeof editableCellsToTemplate !== 'undefined' ? editableCellsToTemplate(newTileGeneratorCells) : {};
    const tileForRender = {
      ...tile,
      subTilesTemplate: editableTemplate,
      subTiles: typeof buildSubTilesForTile !== 'undefined' ? buildSubTilesForTile({ ...tile, subTilesTemplate: editableTemplate }) : {}
    };
    const sc = getCollectionShortCode(tileForRender.collection);
    const scBadge = sc ? ` <span class="coll-short-code">${sc}</span>` : "";
    previewEl.innerHTML = `
      <div><strong>${tileForRender.name || "New Tile"}</strong>${scBadge}</div>
      <div class="small">
        Z${Object.values(tileForRender.zombies || {}).reduce((s,n)=>s+n,0)},
        L${tileForRender.hearts || 0},
        B${tileForRender.bullets || 0}
      </div>
      <div class="micro-grid">${buildMicroGridHtml(tileForRender)}</div>
    `;
  }
}

function attachNewTileGenerator() {
  const copyBtn = document.getElementById("copyNewTileCodeBtn");
  const outputEl = document.getElementById("newTileCodeOutput");
  const statusEl = document.getElementById("newTileCodeStatus");
  if (!(copyBtn instanceof HTMLButtonElement) || !(outputEl instanceof HTMLElement) || !(statusEl instanceof HTMLElement)) {
    return;
  }

  const container = document.getElementById("newTileGenerator");
  container?.addEventListener("change", refreshNewTilePreview);
  container?.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT") {
      refreshNewTilePreview();
    }
  });

  copyBtn.addEventListener("click", async () => {
    const text = outputEl.textContent || "";
    if (!text.trim()) {
      statusEl.textContent = "Nothing to copy";
      return;
    }

    try {
      await copyTextToClipboard(text);
      statusEl.textContent = "Tile code copied";
    } catch {
      statusEl.textContent = "Copy failed";
    }
  });

  refreshNewTilePreview();
}

function attachTileDebugListeners() {
  if (!refs.mapDeckDebug) {
    return;
  }

  refs.mapDeckDebug.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    // Group collapse/expand toggle
    const groupToggle = target.closest("[data-deck-group-toggle]");
    if (groupToggle instanceof HTMLElement) {
      const group = groupToggle.getAttribute("data-deck-group-toggle");
      if (group) {
        if (mapDeckOpenGroups.has(group)) { mapDeckOpenGroups.delete(group); }
        else { mapDeckOpenGroups.add(group); }
        renderMapDeckDebug();
      }
      return;
    }

    // Subtile editor expand/collapse
    const expandBtn = target.closest("[data-debug-expand-tile]");
    if (expandBtn instanceof HTMLElement) {
      const tileId = expandBtn.getAttribute("data-debug-expand-tile");
      if (tileId) {
        if (mapDeckExpandedTiles.has(tileId)) { mapDeckExpandedTiles.delete(tileId); }
        else { mapDeckExpandedTiles.add(tileId); }
        rerenderCard(tileId);
      }
      return;
    }

    const copyBtn = target.closest("[data-debug-copy-code]");
    if (!(copyBtn instanceof HTMLButtonElement)) {
      return;
    }

    const details = copyBtn.closest("details");
    const codeBlock = details?.querySelector(".deck-code");
    const statusEl = details?.querySelector(".deck-copy-status");
    if (!(codeBlock instanceof HTMLElement) || !(statusEl instanceof HTMLElement)) {
      return;
    }

    const codeText = codeBlock.textContent || "";
    if (!codeText.trim()) {
      statusEl.textContent = "Nothing to copy";
      return;
    }

    try {
        await copyTextToClipboard(codeText);
      statusEl.textContent = "Copied";
    } catch {
      statusEl.textContent = "Copy failed";
    }
  });

  refs.mapDeckDebug.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const filterKey = target.getAttribute("data-debug-filter");
    if (filterKey && target instanceof HTMLSelectElement) {
      mapDeckDebugFilters[filterKey] = target.value;
      renderMapDeckDebug();
      return;
    }

    const tileId = target.getAttribute("data-debug-tile-id");
    const coord = target.getAttribute("data-debug-coord");
    const field = target.getAttribute("data-debug-field");
    const dir = target.getAttribute("data-debug-dir");
    if (!tileId || !field) {
      return;
    }
    if (field === "collectionCount" && target instanceof HTMLInputElement && target.type === "number") {
      updateMapDeckDebugEdit(tileId, null, field, target.value, dir);
      return;
    }
    if (field === "tileType" && target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "zombieSpawnMode" && target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "zombieCount" && target instanceof HTMLInputElement && target.type === "number") {
      updateMapDeckDebugEdit(tileId, null, field, target.value, dir);
      return;
    }
    if (field === "zombieType" && target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "hearts" && target instanceof HTMLInputElement && target.type === "number") {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "bullets" && target instanceof HTMLInputElement && target.type === "number") {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "connectors" && target instanceof HTMLInputElement && target.type === "checkbox") {
      updateMapDeckDebugEdit(tileId, null, field, target.checked, dir);
      return;
    }
    if (field === "connectorRule" && target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, dir);
      return;
    }
    if ((field === "isStartTile" || field === "isWinTile" || field === "firstDrawWhenSolo") && target instanceof HTMLInputElement && target.type === "checkbox") {
      updateMapDeckDebugEdit(tileId, null, field, target.checked, null);
      return;
    }
    if (field === "companionDir" && target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "companionTiles" && target instanceof HTMLInputElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (!coord) {
      return;
    }
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      updateMapDeckDebugEdit(tileId, coord, field, target.checked, dir);
      return;
    }
    if (target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, coord, field, target.value, dir);
    }
  });
}


// Ensure refs are set for tile editor page (in case core.js ran before DOM loaded)
refs.mapDeckDebug = document.getElementById("mapDeckDebug");
refs.mapDeckDebugCount = document.getElementById("mapDeckDebugCount");

state.mapDeck = buildMapDeck(null);
state.mapDeck.push(buildTownSquareTile());
populateTileTypeDropdown();
populateSpawnModeDropdown();
populateZombieTypeDropdown();
populateConnectorRuleSelects();
renderNewTileCollectionInputs();
renderNewTileCompanionSelect();
renderNewTileSubtileEditor();
attachNewTileSubtileEditorListeners();
attachNewTileGenerator();
attachTileDebugListeners();
renderMapDeckDebug();

const toggleTileGeneratorBtn = document.getElementById("toggleTileGenerator");
const tileGeneratorSection = document.getElementById("newTileGenerator");
tileGeneratorSection.classList.add("is-collapsed");
toggleTileGeneratorBtn.addEventListener("click", () => {
  const collapsed = tileGeneratorSection.classList.toggle("is-collapsed");
  toggleTileGeneratorBtn.setAttribute("aria-expanded", !collapsed);
  toggleTileGeneratorBtn.textContent = collapsed ? "Show ▾" : "Hide ▴";
});
