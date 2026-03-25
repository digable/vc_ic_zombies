// ---------------------------------------------------------------------------
// Save / Load panel rendering
// ---------------------------------------------------------------------------

function formatSavedAt(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const mo = d.toLocaleString("en-US", { month: "short" });
    const dy = d.getDate();
    const hr = d.getHours().toString().padStart(2, "0");
    const mn = d.getMinutes().toString().padStart(2, "0");
    return `${mo} ${dy} ${hr}:${mn}`;
  } catch { return ""; }
}

function renderSaveLoadPanel() {
  const panel = document.getElementById("saveLoadPanel");
  if (!panel) return;

  const gameActive  = state.players.length > 0;
  const canSave     = gameActive && !hasPendingState();
  const saveTitle   = !gameActive      ? "No active game"
                    : !canSave         ? "Resolve pending action first"
                    : "";

  let html = "";
  for (let slot = 0; slot < SAVE_SLOTS; slot++) {
    const meta    = getSlotMeta(slot);
    const isEmpty = !meta;
    const label   = isEmpty
      ? "(empty)"
      : `Turn ${meta.turnNumber} · ${meta.playerCount}P · ${formatSavedAt(meta.savedAt)}`;

    const saveDisabled = canSave ? "" : "disabled";
    const loadDisabled = isEmpty ? "disabled" : "";
    const delDisabled  = isEmpty ? "disabled" : "";

    const saveBtn = `<button class="save-slot-btn" title="${saveTitle}" ${saveDisabled} onclick="confirmSave(${slot})">Save</button>`;
    const loadBtn = `<button class="save-slot-btn" ${loadDisabled} onclick="confirmLoad(${slot})">Load</button>`;
    const delBtn  = `<button class="save-slot-btn save-slot-del" ${delDisabled} onclick="confirmDelete(${slot})" title="Delete save">✕</button>`;

    html += `<div class="save-slot-row">
      <span class="save-slot-num">Slot ${slot + 1}</span>
      <span class="save-slot-label">${label}</span>
      <span class="save-slot-actions">${saveBtn}${loadBtn}${delBtn}</span>
    </div>`;
  }

  panel.innerHTML = html;
}

function confirmSave(slot) {
  const meta = getSlotMeta(slot);
  if (meta && !confirm(`Overwrite Slot ${slot + 1}?\n(${formatSavedAt(meta.savedAt)})`)) return;
  saveGame(slot);
}

function confirmLoad(slot) {
  if (state.players.length > 0 && !confirm(`Load Slot ${slot + 1}? Current game will be lost.`)) return;
  loadGame(slot);
}

function confirmDelete(slot) {
  if (!confirm(`Delete Slot ${slot + 1}?`)) return;
  deleteSave(slot);
}
