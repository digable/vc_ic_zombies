// render-helpers.js — Pure helper functions shared by board and debug renderers.
// No DOM manipulation; no side effects. Used by render-board.js, render-debug.js, render-panels.js.

function formatTileCode(obj) {
  const identRe = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  // Reverse maps so runtime values render as their constant expressions
  const collectionsReverse = Object.fromEntries(
    Object.entries(COLLECTIONS).map(([k, v]) => [v, `COLLECTIONS.${k}`])
  );
  const zombieTypeReverse = Object.fromEntries(
    Object.entries(ZOMBIE_TYPE).map(([k, v]) => [v, `ZOMBIE_TYPE.${k}`])
  );

  function fmtKey(k) {
    return identRe.test(k) ? k : JSON.stringify(k);
  }

  function fmtComputedKey(k, reverseMap) {
    return reverseMap[k] ? `[${reverseMap[k]}]` : fmtKey(k);
  }

  // fieldName is the parent property name, used to pick the right key formatter
  function fmt(val, depth, fieldName) {
    if (val === null) return "null";
    if (typeof val === "string") return JSON.stringify(val);
    if (typeof val !== "object") return String(val);
    if (Array.isArray(val)) {
      return "[" + val.map((v) => fmt(v, depth + 1)).join(", ") + "]";
    }
    const entries = Object.entries(val);
    if (entries.length === 0) return "{}";

    // collection and zombies: always one entry per line with computed key notation
    if (fieldName === "collection" || fieldName === "zombies") {
      const reverseMap = fieldName === "collection" ? collectionsReverse : zombieTypeReverse;
      const pad = "  ".repeat(depth + 1);
      const close = "  ".repeat(depth);
      return "{\n" + entries.map(([k, v]) => `${pad}${fmtComputedKey(k, reverseMap)}: ${fmt(v, depth + 1)}`).join(",\n") + ",\n" + close + "}";
    }

    if (depth >= 2) {
      return "{ " + entries.map(([k, v]) => `${fmtKey(k)}: ${fmt(v, depth + 1)}`).join(", ") + " }";
    }
    const pad = "  ".repeat(depth + 1);
    const close = "  ".repeat(depth);
    return "{\n" + entries.map(([k, v]) => `${pad}${fmtKey(k)}: ${fmt(v, depth + 1, k)}`).join(",\n") + "\n" + close + "}";
  }
  return fmt(obj, 0);
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

function getSubTileSideDirs(tileLike, lx, ly, field) {
  const sub = tileLike?.subTiles?.[key(lx, ly)];
  if (!sub) return [];
  return normalizeDirList(sub[field]);
}

function getSubTileDoorDirs(tileLike, lx, ly) {
  return getSubTileSideDirs(tileLike, lx, ly, "doors");
}

function getSubTileAirDuctDirs(tileLike, lx, ly) {
  return getSubTileSideDirs(tileLike, lx, ly, "airDucts");
}

function getSubTileType(tileLike, lx, ly) {
  const sub = tileLike?.subTiles?.[key(lx, ly)];
  if (!sub) {
    return null;
  }
  const raw = sub.type ?? null;
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
  if (!tile?.type) return "tile-road";
  return "tile-" + tile.type.replaceAll(" ", "-");
}

function getTileBackgroundStyle(type) {
  const map = {
    named:          "#8f6b40",
    building:       "#c59f6a",
    road:           "#d6d6d6",
    helipad:        "#2f9e44",
    town:           "linear-gradient(135deg, #f7c88f 0%, #ebb36e 100%)",
    grass:          "linear-gradient(135deg, #b6e7a7 60%, #7fd97f 100%)",
    "mall hallway": "#b0b8c1",
    "mall store":   "#d4b896",
    escalator:      "#7eafc9",
  };
  return map[type] || "#d6d6d6";
}

function getCollectionLabel(collection) {
  if (!collection) return "";
  const keys = typeof collection === "object" && !Array.isArray(collection)
    ? Object.keys(collection)
    : [collection];
  return keys.map((k) => COLLECTION_META[k]?.label ?? k).join(", ");
}

function getCollectionShortCode(collection, deckKey) {
  if (!collection) return "";
  if (deckKey && COLLECTION_META[deckKey]?.shortCode) {
    return COLLECTION_META[deckKey].shortCode;
  }
  const keys = typeof collection === "object" && !Array.isArray(collection)
    ? Object.keys(collection)
    : [collection];
  const filters = typeof state !== "undefined" && state.deckFilters;
  const activeKeys = filters
    ? keys.filter((k) => filters[k]?.enabled)
    : keys;
  const display = (activeKeys.length > 0 ? activeKeys : keys);
  return display.map((k) => COLLECTION_META[k]?.shortCode ?? "").filter(Boolean).join("/");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
      const doorDirs = getSubTileDoorDirs(tileForRender, lx, ly);
      const ductDirs = getSubTileAirDuctDirs(tileForRender, lx, ly);
      const doorLabels = doorDirs.map((dir) => `<span class="side-label side-label-${dir.toLowerCase()} door-side">D</span>`).join("");
      const ductLabels = ductDirs.map((dir) => {
        const horiz = dir === "E" || dir === "W";
        const svg = horiz
          ? `<svg class="duct-wave" width="10" height="7" viewBox="0 0 12 7" xmlns="http://www.w3.org/2000/svg"><path d="M0,2 C2,0 4,0 6,2 C8,4 10,4 12,2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M0,5 C2,3 4,3 6,5 C8,7 10,7 12,5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`
          : `<svg class="duct-wave" width="7" height="10" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg"><path d="M2,0 C0,2 0,4 2,6 C4,8 4,10 2,12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M5,0 C3,2 3,4 5,6 C7,8 7,10 5,12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
        return `<span class="side-label side-label-${dir.toLowerCase()} duct-side">${svg}</span>`;
      }).join("");
      const subTypeClass = subType ? ` ${subType.replaceAll(" ", "-")}-subtile` : "";
      micro.push(
        `<span class="micro-cell${subTypeClass}${!isWalkable ? " blocked-subtile" : ""}">${lanes}${walls}${doorLabels}${ductLabels}${!isWalkable ? '<span class="mark blocked">X</span>' : ""}${isExit ? '<span class="mark exit">E</span>' : ""}</span>`
      );
    }
  }
  return micro.join("");
}
