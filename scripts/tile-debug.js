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
  // Connectors field (comma-separated directions)
  const connectorsRaw = (document.getElementById("newTileConnectors")?.value || "").trim();
  const connectorsText = connectorsRaw.length > 0
    ? connectorsRaw.split(/[,\s]+/).map((d) => d.trim().toUpperCase()).filter((d) => ["N","E","S","W"].includes(d))
    : [];

  const connectorIds = ["N", "E", "S", "W"];
  const connectors = connectorIds.filter((dir) => {
    const el = document.getElementById(`newTileConnector${dir}`);
    return Boolean(el?.checked);
  });

  const subTilesTemplateRaw = (document.getElementById("newTileSubTilesTemplate")?.value || "").trim();
  const extraParamsRaw = (document.getElementById("newTileExtraParams")?.value || "").trim();

  let extraParams = {};
  let extraParamsError = "";
  if (extraParamsRaw.length > 0) {
    try {
      const parsed = JSON.parse(extraParamsRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        extraParams = parsed;
      } else {
        extraParamsError = "Extra Parameters JSON must be an object.";
      }
    } catch {
      extraParamsError = "Extra Parameters JSON is invalid.";
    }
  }

  // Build the output code (minimal placeholder, you may want to expand this)
  let output = `{
  name: "${name}",
  type: "${type}",
  count: ${count},
  connectors: ${JSON.stringify(connectors.length ? connectors : connectorsText)},
  zombieSpawnMode: "${zombieSpawnMode}",
  zombieCount: ${zombieCount},
  hearts: ${hearts},
  bullets: ${bullets},
  fullAccess: ${fullAccess},
  subTilesTemplate: ${subTilesTemplateRaw || '{}'},
  extraParams: ${JSON.stringify(extraParams)}
}`;
  return { output, extraParamsError };
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


function attachNewTileGenerator() {
  const generateBtn = document.getElementById("generateNewTileCodeBtn");
  const copyBtn = document.getElementById("copyNewTileCodeBtn");
  const outputEl = document.getElementById("newTileCodeOutput");
  const statusEl = document.getElementById("newTileCodeStatus");
  if (!(generateBtn instanceof HTMLButtonElement) || !(copyBtn instanceof HTMLButtonElement) || !(outputEl instanceof HTMLElement) || !(statusEl instanceof HTMLElement)) {
    return;
  }

  const refreshOutput = () => {
    const { output, extraParamsError } = buildNewTileCodeFromInputs();
    outputEl.textContent = output;
    statusEl.textContent = extraParamsError || "";
  };

  generateBtn.addEventListener("click", refreshOutput);

  const container = document.getElementById("newTileGenerator");
  container?.addEventListener("change", refreshOutput);
  container?.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT") {
      refreshOutput();
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

  refreshOutput();
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

    const card = copyBtn.closest(".deck-tile");
    const codeBlock = card?.querySelector(".deck-code");
    const statusEl = card?.querySelector(".deck-copy-status");
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
attachNewTileGenerator();
attachTileDebugListeners();
renderMapDeckDebug();
