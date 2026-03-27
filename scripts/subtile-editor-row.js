// Shared function to render a subtile editor row for both tile editor and map deck debug
// Usage: renderSubtileEditorRow({
//   coord, lx, ly, cell, prefix, tileId, typeOptions, renderCompassCheckboxes
// })
function renderSubtileEditorRow({
  coord, lx, ly, cell, prefix, tileId = '', typeOptions = null, renderCompassCheckboxes
}) {
  const opts = typeOptions ?? Object.values(SUBTILE_TYPE);
  const tileAttr = tileId ? ` ${prefix}tile-id="${tileId}"` : '';
  return `
    <div class="deck-subtile-row">
      <div class="deck-subtile-head">
        <code class="deck-subtile-coord">${lx},${ly}</code>
      </div>
      <label class="deck-subtile-edit-line">
        <strong>Walkable</strong>
        <input type="checkbox"${tileAttr} ${prefix}coord="${coord}" ${prefix}field="walkable" ${cell.walkable ? "checked" : ""} />
      </label>
      <label class="deck-subtile-edit-line">
        <strong>Type</strong>
        <select${tileAttr} ${prefix}coord="${coord}" ${prefix}field="type">
          <option value="" ${!cell.type ? "selected" : ""}>-</option>
          ${opts.map(opt => `<option value="${opt}" ${cell.type === opt ? "selected" : ""}>${opt}</option>`).join("")}
        </select>
      </label>
      <div class="deck-subtile-edit-dirs-row side-by-side">
        <div class="deck-subtile-edit-dirs">
          <strong>Walls</strong>
          ${renderCompassCheckboxes({ prefix, coord, field: 'walls', checkedDirs: cell.walls, tileId })}
        </div>
        <div class="deck-subtile-edit-dirs">
          <strong>Doors</strong>
          ${renderCompassCheckboxes({ prefix, coord, field: 'doors', checkedDirs: cell.doors, tileId })}
        </div>
      </div>
    </div>
  `;
}

// Attach to window for browser use
window.renderSubtileEditorRow = renderSubtileEditorRow;