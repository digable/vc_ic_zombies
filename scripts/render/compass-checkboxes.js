// Shared function to render compass layout checkboxes for subtile walls/doors
// Usage: renderCompassCheckboxes({
//   prefix: 'data-gen-',
//   coord, field, checkedDirs: cell[field], tileId: '', extraAttrs: ''
// })
function renderCompassCheckboxes({ prefix, coord, field, checkedDirs, tileId = '', extraAttrs = '' }) {
  const tileAttr = tileId ? ` ${prefix}tile-id="${tileId}"` : '';
  return `
    <div class="compass-checkboxes">
      <div class="compass-row compass-n">
        <label><input type="checkbox" ${prefix}coord="${coord}" ${prefix}field="${field}" ${prefix}dir="N"${tileAttr} ${checkedDirs.includes('N') ? 'checked' : ''} ${extraAttrs}/></label>
      </div>
      <div class="compass-row compass-middle">
        <label class="compass-w"><input type="checkbox" ${prefix}coord="${coord}" ${prefix}field="${field}" ${prefix}dir="W"${tileAttr} ${checkedDirs.includes('W') ? 'checked' : ''} ${extraAttrs}/></label>
        <span class="compass-center"></span>
        <label class="compass-e"><input type="checkbox" ${prefix}coord="${coord}" ${prefix}field="${field}" ${prefix}dir="E"${tileAttr} ${checkedDirs.includes('E') ? 'checked' : ''} ${extraAttrs}/></label>
      </div>
      <div class="compass-row compass-s">
        <label><input type="checkbox" ${prefix}coord="${coord}" ${prefix}field="${field}" ${prefix}dir="S"${tileAttr} ${checkedDirs.includes('S') ? 'checked' : ''} ${extraAttrs}/></label>
      </div>
    </div>
  `;
}

// Attach to window for browser use
window.renderCompassCheckboxes = renderCompassCheckboxes;