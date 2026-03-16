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
    } else if ((field === "walls" || field === "doors") && dir && target instanceof HTMLInputElement) {
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
        // fallback: simple display
        subtileRows.push(`<div>${coord}</div>`);
      }
    }
  }
  container.innerHTML = `<div class="deck-subtiles">${subtileRows.join("")}</div>`;
}
function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "absolute";
      fallback.style.left = "-9999px";
      document.body.appendChild(fallback);
      fallback.select();
      const success = document.execCommand("copy");
      document.body.removeChild(fallback);
      if (!success) {
        reject(new Error("copy command failed"));
        return;
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


function updateMapDeckDebugEdit(tileId, coord, field, value, dir = null) {
  // Handle tile-level type change
  if (field === "tileType") {
    const tile = state.mapDeck.find((t) => t._debugTileId === tileId);
    if (!tile) return;
    const newType = typeof value === "string" ? value.trim().toLowerCase() : tile.type;
    tile.type = newType;
    renderMapDeckDebug();
    return;
  }

  // Handle connectors (tile-level)
  if (field === "connectors") {
    const tile = state.mapDeck.find((t) => t._debugTileId === tileId);
    if (!tile) return;
    const set = new Set(Array.isArray(tile.connectors) ? tile.connectors : []);
    if (value) {
      set.add(dir);
    } else {
      set.delete(dir);
    }
    // Update connectors and force re-render with new reference
    tile.connectors = ["N", "E", "S", "W"].filter((d) => set.has(d));
    renderMapDeckDebug();
    return;
  }

  const editedCells = mapDeckDebugEdits.get(tileId);
  if (!editedCells || (coord && !editedCells[coord])) {
    return;
  }

  if (field === "walkable") {
    editedCells[coord].walkable = Boolean(value);
  } else if (field === "type") {
    editedCells[coord].type = typeof value === "string" ? value.trim().toLowerCase() : "";
  } else if ((field === "walls" || field === "doors") && dir) {
    const set = new Set(editedCells[coord][field] || []);
    if (value) {
      set.add(dir);
    } else {
      set.delete(dir);
    }
    editedCells[coord][field] = ["N", "E", "S", "W"].filter((d) => set.has(d));
  }

  renderMapDeckDebug();
}


function extractTileInputValues() {
  const name = (document.getElementById("newTileName")?.value || "New Tile").trim();
  const type = (document.getElementById("newTileType")?.value || "named").trim();
  const count = Number(document.getElementById("newTileCount")?.value || 1);
  const zombieSpawnMode = (document.getElementById("newTileSpawnMode")?.value || "by_card").trim();
  const zombieCount = Number(document.getElementById("newTileZombieCount")?.value || 0);
  const hearts = Number(document.getElementById("newTileHearts")?.value || 0);
  const bullets = Number(document.getElementById("newTileBullets")?.value || 0);
  const fullAccess = Boolean(document.getElementById("newTileFullAccess")?.checked);
  const connectors = ["N", "E", "S", "W"].filter((dir) => {
    const el = document.getElementById(`newTileConnector${dir}`);
    return Boolean(el?.checked);
  });
  return { name, type, count, connectors, zombieSpawnMode, zombieCount, hearts, bullets, fullAccess };
}

function buildNewTileObjectFromInputs() {
  return { ...extractTileInputValues(), subTilesTemplate: editableCellsToTemplate(newTileGeneratorCells), _isGeneratedPreview: true };
}

const newTileGeneratorCells = {};
(function () {
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      newTileGeneratorCells[key(lx, ly)] = { walkable: lx === 1 && ly === 1, type: "", walls: [], doors: [] };
    }
  }
})();



function refreshNewTilePreview() {
  const outputEl = document.getElementById("newTileCodeOutput");
  const statusEl = document.getElementById("newTileCodeStatus");
  const previewEl = document.getElementById("newTileLivePreview");
  const tile = buildNewTileObjectFromInputs();
  const { _isGeneratedPreview, ...tileForCode } = tile;
  if (outputEl instanceof HTMLElement) {
    outputEl.textContent = JSON.stringify(tileForCode, null, 2);
  }
  if (statusEl instanceof HTMLElement) {
    statusEl.textContent = "";
  }
  if (previewEl instanceof HTMLElement) {
    const editedCells = typeof createEditableSubtileCells !== 'undefined' ? createEditableSubtileCells(tile) : {};
    const editableTemplate = typeof editableCellsToTemplate !== 'undefined' ? editableCellsToTemplate(editedCells) : {};
    const tileForRender = {
      ...tile,
      subTilesTemplate: editableTemplate,
      subTiles: typeof buildSubTilesForTile !== 'undefined' ? buildSubTilesForTile({ ...tile, subTilesTemplate: editableTemplate }) : {}
    };
    previewEl.innerHTML = `
      <div><strong>${tileForRender.name || "New Tile"}</strong></div>
      <div class="small">
        Z${tileForRender.zombieCount || 0},
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

  // Removed generateBtn click handler as code updates on change

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

    const tileId = target.getAttribute("data-debug-tile-id");
    const coord = target.getAttribute("data-debug-coord");
    const field = target.getAttribute("data-debug-field");
    const dir = target.getAttribute("data-debug-dir");
    if (!tileId || !field) {
      return;
    }
    if (field === "count" && target instanceof HTMLInputElement && target.type === "number") {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "tileType" && target instanceof HTMLSelectElement) {
      updateMapDeckDebugEdit(tileId, null, field, target.value, null);
      return;
    }
    if (field === "connectors" && target instanceof HTMLInputElement && target.type === "checkbox") {
      updateMapDeckDebugEdit(tileId, null, field, target.checked, dir);
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

state.mapDeck = buildMapDeck();
renderNewTileSubtileEditor();
attachNewTileSubtileEditorListeners();
attachNewTileGenerator();
attachTileDebugListeners();
renderMapDeckDebug();
