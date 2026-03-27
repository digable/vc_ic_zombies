// render-panels.js — UI panel rendering functions.
// Handles deck info, players, hand, combat, zombie panels, event choice, log, meta, and game over.

function renderDeckInfo(previewDeck) {
  const box = document.getElementById("deckInfoBox");
  if (!box) return;

  function tileRow(t, posStr, played, copyStr, deckId, dragIdx) {
    const coll = getCollectionLabel(t.collection);
    const copy = copyStr ? ` <span class="deck-info-copy">${copyStr}</span>` : "";
    const drag = (!played && deckId !== undefined && dragIdx !== undefined)
      ? ` draggable="true" data-drag-deck="${deckId}" data-drag-idx="${dragIdx}"`
      : "";
    return `<div class="deck-info-row${played ? " deck-info-row--played" : ""}"${drag}>`
      + `<span class="deck-info-name">${t.name} <em class="deck-info-type">(${t.type})</em>${coll ? ` <em class="deck-info-collection">${coll}</em>` : ""}${copy}</span>`
      + `<span class="deck-info-pos">${posStr}</span>`
      + `</div>`;
  }

  const detailsOpen = box.querySelector(".deck-info-details")?.open ?? false;

  if (previewDeck) {
    const startTile = buildStartTile(readCurrentFilters());
    const startRow = tileRow(startTile, "pre-placed", true, null);
    const previewRows = previewDeck.map((t, i) => tileRow(t, `#${i + 1}`, false, null)).join("");
    box.innerHTML = `
      <div>Total in Deck (start): ${previewDeck.length + 1}</div>
      <div>Total Played: 1</div>
      <div>Total Left: ${previewDeck.length}</div>
      <details class="deck-info-details"${detailsOpen ? " open" : ""}>
        <summary>Show cards</summary>
        <div class="deck-info-breakdown">${previewRows}<div class="deck-info-divider"></div>${startRow}</div>
      </details>
    `;
    return;
  }

  const totalStart = state.deckStartTotal ?? (state.mapDeck.length + state.discardPile.length);
  const totalPlayed = state.discardPile.length;
  const standaloneLeft = Object.values(state.standaloneDecks || {}).reduce((s, d) => s + d.length, 0);
  const totalLeft = state.mapDeck.length + standaloneLeft;

  const deckRows = state.mapDeck.map((t, i) => {
    const meta = state.deckStartCounts?.[t.name];
    const total = meta?.count ?? 1;
    const copy = total > 1 ? `${t._copyNum}/${total}` : null;
    return tileRow(t, `#${i + 1}`, false, copy, "base", i);
  }).join("");

  const standaloneRows = Object.entries(state.standaloneDecks || {}).map(([collKey, deck]) => {
    const label = COLLECTION_META[collKey]?.label || collKey;
    const rows = deck.map((t, i) => {
      const meta = state.deckStartCounts?.[t.name];
      const total = meta?.count ?? 1;
      const copy = total > 1 ? `${t._copyNum}/${total}` : null;
      return tileRow(t, `#${i + 1}`, false, copy, collKey, i);
    }).join("");
    return rows ? `<div class="deck-info-divider"></div><div class="deck-info-section-label">${label} Deck</div>${rows}` : "";
  }).join("");

  const playedRows = state.discardPile.map((t) => {
    const meta = state.deckStartCounts?.[t.name];
    const posStr = meta?.prePlaced ? "pre-placed" : "played";
    const total = meta?.count ?? 1;
    const copy = total > 1 ? `${t._copyNum}/${total}` : null;
    return tileRow(t, posStr, true, copy);
  }).join("");

  const baseDeckEmpty = state.mapDeck.length === 0;
  const allDecksEmpty = totalLeft === 0;
  const emptyBadge = baseDeckEmpty && standaloneLeft > 0 && (state.baseMapDeckStartCount ?? 1) > 0
    ? ` <span class="deck-empty-badge">BASE DECK EMPTY — draw from standalone deck(s)</span>`
    : allDecksEmpty
      ? ` <span class="deck-empty-badge">DECK EMPTY — tile draw step skipped</span>`
      : "";
  box.innerHTML = `
    <div>Total in Deck (start): ${totalStart}</div>
    <div>Total Played: ${totalPlayed}</div>
    <div>Total Left: ${totalLeft}${emptyBadge}</div>
    <details class="deck-info-details"${detailsOpen ? " open" : ""}>
      <summary>Show cards</summary>
      <div class="deck-info-breakdown">${deckRows}${standaloneRows}${playedRows ? `<div class="deck-info-divider"></div>${playedRows}` : ""}</div>
    </details>
  `;
}

function renderStandaloneDeckInfo(previewDecks) {
  // Render per-standalone-deck info below the base deck info box.
  // previewDecks: optional { [collKey]: tile[] } — used during setup preview (no active game).
  const box = document.getElementById("deckInfoBox");
  if (!box) return;

  const source = previewDecks || state.standaloneDecks;
  if (!source || Object.keys(source).length === 0) return;

  Object.entries(source).forEach(([collKey, deck]) => {
    const label = COLLECTION_META[collKey]?.label || collKey;
    const remaining = deck.length;
    const divider = document.createElement("div");
    divider.className = "deck-info-divider";
    box.appendChild(divider);
    const header = document.createElement("div");
    header.style.fontWeight = "700";
    header.style.fontSize = "0.8rem";

    if (previewDecks) {
      header.textContent = `${label} Deck (preview)`;
    } else {
      const isActive = state.activeStandaloneDecks.has(collKey);
      header.textContent = `${label} Deck${isActive ? "" : " \uD83D\uDD12"}`;
    }

    box.appendChild(header);
    const countDiv = document.createElement("div");
    countDiv.style.fontSize = "0.78rem";
    countDiv.textContent = previewDecks
      ? `${remaining} tile(s) in deck`
      : (state.activeStandaloneDecks.has(collKey)
          ? `${remaining} tile(s) remaining`
          : "Locked — place gateway tile to unlock");
    box.appendChild(countDiv);
  });
}

function renderEventDeckInfo(previewDeck) {
  const box = document.getElementById("eventDeckInfoBox");
  if (!box) return;

  function cardRow(c, label, played, dragIdx) {
    const coll = getCollectionLabel(c.collection);
    const drag = (!played && dragIdx !== undefined)
      ? ` draggable="true" data-drag-event-idx="${dragIdx}"`
      : "";
    return `<div class="deck-info-row${played ? " deck-info-row--played" : ""}"${drag}>`
      + `<span class="deck-info-name">${c.name}${coll ? ` <em class="deck-info-collection">${coll}</em>` : ""}</span>`
      + `<span class="deck-info-pos">${label}</span>`
      + `</div>`;
  }

  const detailsOpen = box.querySelector(".deck-info-details")?.open ?? false;

  if (previewDeck) {
    const previewRows = previewDeck.map((c, i) => cardRow(c, `#${i + 1}`, false)).join("");
    box.innerHTML = `
      <div>Total in Deck (start): ${previewDeck.length}</div>
      <div>In Deck: ${previewDeck.length} &nbsp; In Hands: 0 &nbsp; Played: 0</div>
      <details class="deck-info-details"${detailsOpen ? " open" : ""}>
        <summary>Show cards</summary>
        <div class="deck-info-breakdown">${previewRows}</div>
      </details>
    `;
    return;
  }

  const totalStart = state.eventDeckStartTotal ?? 0;
  const inDeck = state.eventDeck.length;
  const inHands = state.players?.reduce((s, p) => s + (p.hand?.length ?? 0), 0) ?? 0;
  const discarded = state.eventDiscardPile?.length ?? 0;

  const deckRows = state.eventDeck.map((c, i) => cardRow(c, `#${i + 1}`, false, i)).join("");
  const handRows = (state.players ?? []).flatMap((p) =>
    (p.hand ?? []).map((c) => cardRow(c, p.name, false))
  ).join("");
  const playedRows = (state.eventDiscardPile ?? []).map((c) => cardRow(c, "played", true)).join("");

  box.innerHTML = `
    <div>Total in Deck (start): ${totalStart}</div>
    <div>In Deck: ${inDeck} &nbsp; In Hands: ${inHands} &nbsp; Played: ${discarded}</div>
    <details class="deck-info-details"${detailsOpen ? " open" : ""}>
      <summary>Show cards</summary>
      <div class="deck-info-breakdown">
        ${deckRows}
        ${handRows ? `<div class="deck-info-divider"></div>${handRows}` : ""}
        ${playedRows ? `<div class="deck-info-divider"></div>${playedRows}` : ""}
      </div>
    </details>
  `;
}

function renderPlayers() {
  const cp = currentPlayer();
  const cptx = spaceToTileCoord(cp.x);
  const cpty = spaceToTileCoord(cp.y);
  const cplx = getLocalCoord(cp.x, cptx);
  const cply = getLocalCoord(cp.y, cpty);

  refs.currentPlayerCard.innerHTML = `
    <div class="player-card">
      <strong>${cp.name}</strong><br />
      Hearts: ${cp.hearts} | Bullets: ${cp.bullets} | Kills: ${cp.kills} | Attack: ${cp.attack || 0}${cp.tempCombatBonus ? ` (+${cp.tempCombatBonus} turn)` : ""}${cp.shotgunCharges ? ` | Shotgun: ${cp.shotgunCharges}` : ""}${cp.movementBonus ? ` | Move +${cp.movementBonus}` : ""}${cp.hasJeep ? " | Jeep" : ""} | KO: ${cp.knockouts || 0}<br />
      Position: Tile (${cptx}, ${cpty}) / Space (${cplx}, ${cply})
    </div>
  `;

  refs.playersList.innerHTML = "";
  state.players.forEach((p) => {
    const ptx = spaceToTileCoord(p.x);
    const pty = spaceToTileCoord(p.y);
    const plx = getLocalCoord(p.x, ptx);
    const ply = getLocalCoord(p.y, pty);
    const el = document.createElement("div");
    el.className = "player-card";
    el.innerHTML = `
      <strong>${p.name}</strong><br />
      Hearts: ${p.hearts} | Bullets: ${p.bullets} | Kills: ${p.kills} | Attack: ${p.attack || 0}${p.tempCombatBonus ? ` (+${p.tempCombatBonus} turn)` : ""}${p.shotgunCharges ? ` | Shotgun: ${p.shotgunCharges}` : ""}${p.movementBonus ? ` | Move +${p.movementBonus}` : ""}${p.hasJeep ? " | Jeep" : ""} | KO: ${p.knockouts || 0}<br />
      Position: Tile (${ptx}, ${pty}) / Space (${plx}, ${ply})
    `;
    refs.playersList.appendChild(el);
  });
}

function renderHand() {
  const player = currentPlayer();
  refs.handList.innerHTML = "";

  if (player.hand.length === 0) {
    refs.handList.innerHTML = "<div class='small'>No event cards in hand.</div>";
    return;
  }

  const globallyBlocked = state.gameOver || player.eventUsedThisRound || player.cannotPlayCardTurns > 0 ||
    Boolean(state.pendingCombatDecision) || Boolean(state.pendingEventChoice) ||
    Boolean(state.pendingZombieReplace) || Boolean(state.pendingZombieDiceChallenge) ||
    Boolean(state.pendingZombiePlace) || Boolean(state.pendingForcedMove) ||
    Boolean(state.pendingDynamiteTarget) || Boolean(state.pendingMinefield) ||
    Boolean(state.pendingRocketLauncher) || Boolean(state.pendingZombieFlood) ||
    Boolean(state.pendingBuildingSelect);

  const isCardPlayable = (card) => {
    if (globallyBlocked) return false;
    if (card.canPlay && !card.canPlay()) return false;
    if (card.isItem && player.items && player.items.some((c) => c.name === card.name)) return false;
    if (card.isItem && card.requiresTile) {
      const tile = getTileAtSpace(player.x, player.y);
      const allowed = Array.isArray(card.requiresTile) ? card.requiresTile : [card.requiresTile];
      if (!tile || !allowed.includes(tile.name)) return false;
    }
    return true;
  };

  player.hand.forEach((card, index) => {
    const el = document.createElement("div");
    el.className = "hand-card";
    if (index === state.selectedHandIndex) {
      el.classList.add("selected");
    }

    const canPlay = isCardPlayable(card);
    el.classList.add(canPlay ? "playable" : "blocked");

    const playDisabled = !canPlay || globallyBlocked;
    const showSelect = state.step === STEP.DISCARD && !state.pendingCombatDecision;
    const cardShortCode = getCollectionShortCode(card.collection);
    el.innerHTML = `
      <strong>${card.name}</strong>${cardShortCode ? ` <span class="coll-short-code">${cardShortCode}</span>` : ""}<br />
      <span class="small">${card.description}</span><br />
      <button ${playDisabled ? "disabled" : ""} data-play-index="${index}">Play</button>
      ${showSelect ? `<button data-select-index="${index}">Select</button>` : ""}
    `;

    refs.handList.appendChild(el);
  });

  if (player.items && player.items.length > 0) {
    const divider = document.createElement("div");
    divider.className = "hand-items-divider";
    divider.textContent = "Items in play:";
    refs.handList.appendChild(divider);

    player.items.forEach((card, index) => {
      const el = document.createElement("div");
      el.className = "hand-card hand-item";
      const activateDisabled = state.gameOver || Boolean(state.pendingCombatDecision) || Boolean(state.pendingEventChoice);
      el.innerHTML = `
        <strong>${card.name}</strong><br />
        <span class="small">${card.description}</span><br />
        ${card.combatWeapon ? `<span class="small dim">Use in combat</span>` : card.activateItem ? `<button ${activateDisabled ? "disabled" : ""} data-activate-item-index="${index}">Activate &amp; Discard</button>` : `<span class="small dim">Triggers automatically</span>`}
      `;
      refs.handList.appendChild(el);
    });
  }
}

function renderCombatDecision() {
  const panel = refs.combatDecisionPanel;
  if (!panel) {
    return;
  }

  const pending = state.pendingCombatDecision;
  if (!pending) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const player = state.players.find((p) => p.id === pending.playerId);
  if (!player) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const WIN = pending.killRoll;
  const roll = pending.modifiedRoll;
  const zombieLabel = pending.isEnhanced ? "Government-Enhanced Zombie" : "Zombie";

  function actionWrap(btnHtml, hintText, hintClass) {
    const hint = hintText ? `<span class="combat-hint ${hintClass || ""}">${hintText}</span>` : "";
    return `<div class="combat-action-wrap">${btnHtml}${hint}</div>`;
  }

  const bulletsNeededToWin = Math.max(0, WIN - roll);
  const bulletWins = roll + 1 >= WIN;
  const canWinWithBullets = roll + player.bullets >= WIN;
  const bulletResult = bulletWins
    ? "kills the zombie!"
    : canWinWithBullets
      ? `need ${bulletsNeededToWin} total to win`
      : "won't be enough — wasted bullet";
  const bulletHintClass = bulletWins ? "good" : canWinWithBullets ? "good" : "warn";
  const bulletBtn = actionWrap(
    `<button data-combat-action="B" ${player.bullets > 0 ? "" : "disabled"}>Spend 1 Bullet (+1) — ${player.bullets} left</button>`,
    player.bullets > 0 ? `→ ${bulletResult}` : null,
    bulletHintClass
  );

  const heartsAfterReroll = player.hearts - 1;
  const rerollHint = player.hearts === 0 ? null
    : player.hearts === 1 ? "last heart ⚠"
    : `${heartsAfterReroll} heart${heartsAfterReroll !== 1 ? "s" : ""} left`;
  const rerollHintClass = player.hearts === 1 ? "warn" : "muted";
  const rerollBtn = actionWrap(
    `<button data-combat-action="H" ${player.hearts > 0 ? "" : "disabled"}>Spend 1 Life Token (Reroll)</button>`,
    rerollHint,
    rerollHintClass
  );

  const fakBtn = player.items && player.items.some((c) => c.name === "First Aid Kit")
    ? actionWrap(`<button data-combat-action="FAK">Use First Aid Kit (free reroll)</button>`, "no cost", "muted")
    : "";

  const weaponBtns = player.items
    ? player.items.filter((c) => c.combatWeapon).map((c) => {
        const boost = c.combatBoost || c.turnCombatBoost || c.permanentAttackBoost || c.oncePerTurnCombatBoost;
        const newTotal = roll + boost;
        const isOncePer = Boolean(c.oncePerTurnCombatBoost);
        const isTurnBoost = Boolean(c.turnCombatBoost);
        const turnNote = isOncePer ? " (once this turn)" : isTurnBoost ? ` (+${boost} all combats this turn)` : "";
        const wHint = newTotal >= WIN
          ? `kills the zombie!${turnNote}`
          : `→ total: ${newTotal}${turnNote}`;
        const wClass = newTotal >= WIN ? "good" : "muted";
        const isDisabled = isOncePer
          ? (player.itemsUsedThisTurn || []).includes(c.name)
          : pending.weaponUsed;
        return actionWrap(
          `<button data-combat-action="W:${c.name}" ${isDisabled ? "disabled" : ""}>${c.name} (+${boost})</button>`,
          wHint, wClass
        );
      }).join("")
    : "";

  const loseBtn = actionWrap(
    `<button data-combat-action="L">Lose Combat</button>`,
    "respawns at Town Square — loses half your kills",
    "muted"
  );

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="combat-decision-title">Combat vs ${zombieLabel}: ${player.name}</div>
    <div class="small">
      Rolled ${pending.baseRoll} (d6 ${pending.roll} + attack ${pending.permanentBonus} + temp ${pending.tempBonus}) — need ${WIN}+ to win.<br />
      Current total: <span class="combat-roll-total">${roll}</span>
    </div>
    <div class="combat-resources"><span class="bullet-icon">⬤</span> ${player.bullets}&ensp;·&ensp;❤️ ${player.hearts}</div>
    <div class="combat-decision-actions">
      ${bulletBtn}${rerollBtn}${fakBtn}${weaponBtns}${loseBtn}
    </div>
  `;
}

function renderZombieDiceChallenge() {
  const panel = refs.zombieDiceChallengePanel;
  if (!panel) return;

  const pzdc = state.pendingZombieDiceChallenge;
  if (!pzdc) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const target = state.players.find((p) => p.id === pzdc.targetPlayerId);
  if (!target) { panel.classList.add("hidden"); return; }

  const failing = pzdc.dice.filter((d) => d <= 3);
  const outcome = failing.length > 0
    ? `<span style="color:#c0392b">Fail — ${failing.length} die(dice) ≤ 3. ${target.name} loses 2 kills.</span>`
    : `<span style="color:#27ae60">Pass — all dice above 3. No kills lost.</span>`;

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="combat-decision-title">Zombie Dice Challenge — ${target.name}</div>
    <div class="small">
      Dice: [${pzdc.dice.join("] [")}] — ${outcome}<br/>
      ${target.name} may spend bullets or hearts to modify the dice.
    </div>
    <div class="combat-decision-actions">
      <button data-zdice-action="B0" ${target.bullets > 0 ? "" : "disabled"}>Spend Bullet (+1 to die 1: ${pzdc.dice[0]})</button>
      <button data-zdice-action="B1" ${target.bullets > 0 ? "" : "disabled"}>Spend Bullet (+1 to die 2: ${pzdc.dice[1]})</button>
      <button data-zdice-action="H0" ${target.hearts > 0 ? "" : "disabled"}>Spend Heart (reroll die 1: ${pzdc.dice[0]})</button>
      <button data-zdice-action="H1" ${target.hearts > 0 ? "" : "disabled"}>Spend Heart (reroll die 2: ${pzdc.dice[1]})</button>
      <button data-zdice-action="ACCEPT">Accept Result</button>
    </div>
  `;
}

function renderZombieReplacePanel() {
  const panel = refs.zombieReplacePanel;
  if (!panel) return;

  const prl = state.pendingRocketLauncher;
  if (prl) {
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">Rocket Launcher</div>
      <div class="small">Click any space on an edge tile to destroy it. Cannot target the Helipad.</div>
      <div class="combat-decision-actions">
        <button id="zombieReplaceDoneBtn">Cancel</button>
      </div>
    `;
    return;
  }

  const pmf = state.pendingMinefield;
  if (pmf) {
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">Mine Field — Roll: ${pmf.remaining}</div>
      <div class="small">Click any space on a tile to remove up to ${pmf.remaining} zombie(s) from its road spaces.</div>
      <div class="combat-decision-actions">
        <button id="zombieReplaceDoneBtn">Skip</button>
      </div>
    `;
    return;
  }

  const pdt = state.pendingDynamiteTarget;
  if (pdt) {
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">Dynamite — Target ${pdt.remaining} space(s)</div>
      <div class="small">Click an adjacent zombie space (including diagonals) to destroy it.</div>
      <div class="combat-decision-actions">
        <button id="zombieReplaceDoneBtn">Done (skip remaining)</button>
      </div>
    `;
    return;
  }

  const pzf = state.pendingZombieFlood;
  if (pzf) {
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">${pzf.cardName || "Zombie Flood"}</div>
      <div class="small">Click a tile to flood it with zombies.</div>
      <div class="combat-decision-actions">
        <button id="zombieReplaceDoneBtn">Cancel</button>
      </div>
    `;
    return;
  }

  const pbs = state.pendingBuildingSelect;
  if (pbs) {
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">${pbs.cardName}</div>
      <div class="small">Click any space inside a building to fill it with zombies.</div>
    `;
    return;
  }

  const pfm = state.pendingForcedMove;
  if (pfm) {
    const target = state.players.find((p) => p.id === pfm.targetPlayerId);
    const targetName = target ? target.name : "opponent";
    panel.classList.remove("hidden");
    const pfmTitle = pfm.cardName || "Forced Movement";
    panel.innerHTML = `
      <div class="combat-decision-title">${pfmTitle} — Move ${targetName} ${pfm.remaining} space(s)</div>
      <div class="small">Use the movement buttons to move ${targetName}. All zombies must be fought.</div>
      <div class="combat-decision-actions">
        <button data-forced-move-action="end">End movement</button>
      </div>
    `;
    return;
  }

  const pzm = state.pendingZombieMovement;
  if (pzm) {
    const animating = Boolean(state.zombieAnimationTimer);
    const available = [...state.zombies.keys()].filter((zk) => !pzm.movedKeys.has(zk) && !pzm.stuckKeys.has(zk));
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">Zombie Movement — ${pzm.remaining} move(s) remaining</div>
      <div class="small">${animating ? "Auto-moving…" : "Click a zombie on the board to move it, or auto-move the rest."}</div>
      <div class="combat-decision-actions">
        <button data-zombie-move-action="auto" ${animating || available.length === 0 ? "disabled" : ""}>Auto-move remaining</button>
        <button data-zombie-move-action="done">${animating ? "Skip animation" : "Skip remaining"}</button>
      </div>
    `;
    return;
  }

  const pzp = state.pendingZombiePlace;
  if (pzp) {
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">We're Screwed — Place ${pzp.remaining} zombie(s)</div>
      <div class="small">Click any empty walkable space on the board to place a zombie.</div>
      <div class="combat-decision-actions">
        <button id="zombieReplaceDoneBtn">Done (skip remaining)</button>
      </div>
    `;
    return;
  }

  const pzr = state.pendingZombieReplace;
  if (!pzr) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  const instruction = pzr.adjacentToKey
    ? `Zombie selected — click an adjacent space to move it.`
    : pzr.selectedZombieKey
      ? `Zombie at ${pzr.selectedZombieKey} selected — click a destination space. Click the same zombie to deselect.`
      : `Click a zombie on the board to select it.`;
  const title = pzr.cardName || "This Isn't So Bad";
  panel.innerHTML = `
    <div class="combat-decision-title">${title} — Move ${pzr.remaining} zombie(s)</div>
    <div class="small">${instruction}</div>
    <div class="combat-decision-actions">
      <button id="zombieReplaceDoneBtn">Done (skip remaining)</button>
    </div>
  `;
}

function renderEventChoice() {
  const panel = refs.eventChoicePanel;
  if (!panel) return;

  const pending = state.pendingEventChoice;
  if (!pending) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const player = state.players.find((p) => p.id === pending.playerId);
  if (!player) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  const buttons = pending.options
    .map((o) => `<button data-event-choice="${o.key}">${o.label}</button>`)
    .join("");
  const subtitle = pending.targetName
    ? `<div class="small">${player.name} chooses what to take from ${pending.targetName}.</div>`
    : "";
  const titleText = pending.title || `Card Choice: ${pending.cardName}`;
  panel.innerHTML = `
    <div class="combat-decision-title">${titleText} — ${player.name}</div>
    ${subtitle}
    <div class="combat-decision-actions">${buttons}</div>
  `;
}

function renderLog() {
  refs.log.innerHTML = state.logs.map((entry) => {
    const typeClass = entry.type ? ` log-line--${entry.type}` : "";
    return `<div class="log-line${typeClass}">${entry.text}</div>`;
  }).join("");
}

function renderMeta() {
  const combatText = state.lastCombatResult ? ` | Combat: ${state.lastCombatResult}` : "";
  refs.turnInfo.textContent = `Turn ${state.turnNumber} | ${currentPlayer().name} | Step: ${state.step}${combatText}`;
  const cp = currentPlayer();
  const jeepHint = cp.hasJeep ? "  |  Jeep: doubles roll on road — entering a building ends it at turn's end" : "";
  refs.moveRollOutput.textContent = `Move Roll: ${state.currentMoveRoll ?? "-"} | Remaining: ${state.movesRemaining}${jeepHint}`;
  refs.zombieRollOutput.textContent = `Zombie Roll: ${state.currentZombieRoll ?? "-"}`;
  if (state.pendingTile) {
    const companions = state.pendingCompanionTiles && state.pendingCompanionTiles.length > 0
      ? ` + ${state.pendingCompanionTiles.map((t) => t.name).join(" + ")}`
      : "";
    refs.pendingTileInfo.textContent = `Pending Tile: ${getTileDisplayName(state.pendingTile)}${companions} (${state.pendingTileOptions.length} valid placements)`;
  } else {
    refs.pendingTileInfo.textContent = "Pending Tile: -";
  }
}

function renderKnockoutBanner() {
  const el = refs.knockoutBanner;
  if (!el) return;
  const ko = state.knockoutBanner;
  if (!ko) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `
    <span class="knockout-banner-icon">💀</span>
    <span class="knockout-banner-body">
      <strong>${ko.playerName} was knocked out</strong>
      <span>Lost ${ko.lostKills} kill${ko.lostKills !== 1 ? "s" : ""} — respawned at Town Square with ❤️ 3 &ensp; <span class="bullet-icon">⬤</span> 3</span>
    </span>
    <button class="knockout-banner-dismiss" onclick="state.knockoutBanner=null;render()">✕</button>
  `;
  el.classList.remove("hidden");
}

function renderGameOver() {
  if (!refs.gameOverOverlay) return;
  if (!state.gameOver) {
    refs.gameOverOverlay.classList.add("hidden");
    refs.gameOverOverlay.classList.remove("game-over-overlay--victory");
    return;
  }

  const info = state.winInfo;
  if (info) {
    refs.gameOverOverlay.classList.add("game-over-overlay--victory");
    if (refs.gameOverTitle) refs.gameOverTitle.textContent = "VICTORY!";
    const howWon = info.winType === "helipad"
      ? "escaped by helicopter"
      : `eliminated ${info.kills} zombies`;
    refs.gameOverMessage.innerHTML = `
      <div class="game-over-winner">${escapeHtml(info.playerName)}</div>
      <div class="game-over-how">${escapeHtml(howWon)}</div>
      <div class="game-over-stats">
        <span>Kills: <strong>${info.kills}</strong></span>
        <span>KOs taken: <strong>${info.knockouts}</strong></span>
      </div>
    `;
  } else {
    refs.gameOverOverlay.classList.remove("game-over-overlay--victory");
    if (refs.gameOverTitle) refs.gameOverTitle.textContent = "GAME OVER";
    const lastLogEntry = state.logs[state.logs.length - 1];
    refs.gameOverMessage.textContent = lastLogEntry ? lastLogEntry.text : "";
  }

  refs.gameOverOverlay.classList.remove("hidden");
}

// ---------------------------------------------------------------------------
// Deck drag-and-drop reordering (map deck + event deck "Show cards" rows)
// ---------------------------------------------------------------------------

function attachDeckDragListeners() {
  // --- Map / standalone deck ---
  const deckBox = document.getElementById("deckInfoBox");
  if (deckBox) {
    let dragFrom = null; // { deckId, idx }

    deckBox.addEventListener("dragstart", (e) => {
      const row = e.target.closest("[data-drag-deck]");
      if (!row) return;
      dragFrom = { deckId: row.dataset.dragDeck, idx: Number(row.dataset.dragIdx) };
      e.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
    });

    deckBox.addEventListener("dragend", () => {
      deckBox.querySelectorAll(".dragging, .drag-over").forEach((el) =>
        el.classList.remove("dragging", "drag-over")
      );
      dragFrom = null;
    });

    deckBox.addEventListener("dragover", (e) => {
      if (!dragFrom) return;
      const row = e.target.closest("[data-drag-deck]");
      if (!row || row.dataset.dragDeck !== dragFrom.deckId) return;
      e.preventDefault();
      deckBox.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      row.classList.add("drag-over");
    });

    deckBox.addEventListener("drop", (e) => {
      if (!dragFrom) return;
      const row = e.target.closest("[data-drag-deck]");
      if (!row || row.dataset.dragDeck !== dragFrom.deckId) return;
      e.preventDefault();
      const toIdx = Number(row.dataset.dragIdx);
      if (toIdx === dragFrom.idx) return;
      const deck = dragFrom.deckId === "base"
        ? state.mapDeck
        : (state.standaloneDecks || {})[dragFrom.deckId];
      if (!deck) return;
      const [item] = deck.splice(dragFrom.idx, 1);
      deck.splice(toIdx, 0, item);
      dragFrom = null;
      render();
    });
  }

  // --- Event deck ---
  const eventBox = document.getElementById("eventDeckInfoBox");
  if (eventBox) {
    let eventDragFrom = null; // index

    eventBox.addEventListener("dragstart", (e) => {
      const row = e.target.closest("[data-drag-event-idx]");
      if (!row) return;
      eventDragFrom = Number(row.dataset.dragEventIdx);
      e.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
    });

    eventBox.addEventListener("dragend", () => {
      eventBox.querySelectorAll(".dragging, .drag-over").forEach((el) =>
        el.classList.remove("dragging", "drag-over")
      );
      eventDragFrom = null;
    });

    eventBox.addEventListener("dragover", (e) => {
      if (eventDragFrom === null) return;
      const row = e.target.closest("[data-drag-event-idx]");
      if (!row) return;
      e.preventDefault();
      eventBox.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      row.classList.add("drag-over");
    });

    eventBox.addEventListener("drop", (e) => {
      if (eventDragFrom === null) return;
      const row = e.target.closest("[data-drag-event-idx]");
      if (!row) return;
      e.preventDefault();
      const toIdx = Number(row.dataset.dragEventIdx);
      if (toIdx === eventDragFrom) return;
      const [item] = state.eventDeck.splice(eventDragFrom, 1);
      state.eventDeck.splice(toIdx, 0, item);
      eventDragFrom = null;
      render();
    });
  }
}
