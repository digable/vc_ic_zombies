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


function buildNewTileCodeFromInputs() {
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

  const subTilesCode = buildSubTilesTemplateCode(newTileGeneratorCells).replace(/\n/g, "\n  ");
  const output = `{
  name: "${name}",
  type: "${type}",
  count: ${count},
  connectors: ${JSON.stringify(connectors)},
  zombieSpawnMode: "${zombieSpawnMode}",
  zombieCount: ${zombieCount},
  hearts: ${hearts},
  bullets: ${bullets},
  fullAccess: ${fullAccess},
  ${subTilesCode}
}`;
  return { output };
}

function updateMapDeckDebugEdit(tileId, coord, field, value, dir = null) {
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


function buildNewTileObjectFromInputs() {
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

  return { name, type, count, connectors, zombieSpawnMode, zombieCount, hearts, bullets, fullAccess, subTilesTemplate: editableCellsToTemplate(newTileGeneratorCells), _isGeneratedPreview: true };
}

const newTileGeneratorCells = {};
(function () {
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      newTileGeneratorCells[key(lx, ly)] = { walkable: lx === 1 && ly === 1, type: "", walls: [], doors: [] };
    }
  }
}());

function renderNewTileSubtileEditor() {
  const container = document.getElementById("newTileSubtileEditor");
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const microCells = [];
  const subtileRows = [];

  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const coord = key(lx, ly);
      const cell = newTileGeneratorCells[coord];

      microCells.push(
        `<span class="micro-cell${!cell.walkable ? " blocked-subtile" : ""}" data-gen-coord="${coord}">${!cell.walkable ? '<span class="mark blocked">X</span>' : ""}</span>`
      );

      const dirCheckboxes = (field) =>
        ["N", "E", "S", "W"].map((dir) =>
          `<label><input type="checkbox" data-gen-coord="${coord}" data-gen-field="${field}" data-gen-dir="${dir}" ${cell[field].includes(dir) ? "checked" : ""}/>${dir}</label>`
        ).join("");

      subtileRows.push(`
        <div class="deck-subtile-row">
          <div class="deck-subtile-head">
            <code class="deck-subtile-coord">${lx},${ly}</code>
          </div>
          <label class="deck-subtile-edit-line">
            <strong>Walkable</strong>
            <input type="checkbox" data-gen-coord="${coord}" data-gen-field="walkable" ${cell.walkable ? "checked" : ""} />
          </label>
          <label class="deck-subtile-edit-line">
            <strong>Type</strong>
            <select data-gen-coord="${coord}" data-gen-field="type">
              <option value="" ${!cell.type ? "selected" : ""}>-</option>
              <option value="road" ${cell.type === "road" ? "selected" : ""}>road</option>
              <option value="building" ${cell.type === "building" ? "selected" : ""}>building</option>
            </select>
          </label>
          <div class="deck-subtile-edit-dirs">
            <strong>Walls</strong>
            ${dirCheckboxes("walls")}
          </div>
          <div class="deck-subtile-edit-dirs">
            <strong>Doors</strong>
            ${dirCheckboxes("doors")}
          </div>
        </div>
      `);
    }
  }

  container.innerHTML = `
    <div class="micro-grid">${microCells.join("")}</div>
    <div class="deck-subtiles">${subtileRows.join("")}</div>
  `;

  container.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const coord = target.getAttribute("data-gen-coord");
    const field = target.getAttribute("data-gen-field");
    const dir = target.getAttribute("data-gen-dir");
    if (!coord || !field || !newTileGeneratorCells[coord]) {
      return;
    }

    if (field === "walkable" && target instanceof HTMLInputElement) {
      newTileGeneratorCells[coord].walkable = target.checked;
      const microCell = container.querySelector(`.micro-cell[data-gen-coord="${coord}"]`);
      if (microCell instanceof HTMLElement) {
        microCell.className = `micro-cell${!target.checked ? " blocked-subtile" : ""}`;
        microCell.innerHTML = !target.checked ? '<span class="mark blocked">X</span>' : "";
      }
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
    event.stopPropagation();
  });
}

function refreshNewTilePreview() {
  const outputEl = document.getElementById("newTileCodeOutput");
  const statusEl = document.getElementById("newTileCodeStatus");
  const { output } = buildNewTileCodeFromInputs();
  if (outputEl instanceof HTMLElement) {
    outputEl.textContent = output;
  }
  if (statusEl instanceof HTMLElement) {
    statusEl.textContent = "";
  }
  const previewTile = state.mapDeck.find((t) => t._isGeneratedPreview);
  if (previewTile) {
    Object.assign(previewTile, buildNewTileObjectFromInputs());
    renderMapDeckDebug();
  }
}

function attachNewTileGenerator() {
  const generateBtn = document.getElementById("generateNewTileCodeBtn");
  const copyBtn = document.getElementById("copyNewTileCodeBtn");
  const outputEl = document.getElementById("newTileCodeOutput");
  const statusEl = document.getElementById("newTileCodeStatus");
  if (!(generateBtn instanceof HTMLButtonElement) || !(copyBtn instanceof HTMLButtonElement) || !(outputEl instanceof HTMLElement) || !(statusEl instanceof HTMLElement)) {
    return;
  }

  generateBtn.addEventListener("click", () => {
    refreshNewTilePreview();
    state.mapDeck = state.mapDeck.filter((t) => !t._isGeneratedPreview);
    state.mapDeck.push(buildNewTileObjectFromInputs());
    renderMapDeckDebug();
    refs.mapDeckDebug?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

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
attachNewTileGenerator();
attachTileDebugListeners();
renderMapDeckDebug();
