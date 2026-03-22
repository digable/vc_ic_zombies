// render-panels.js — UI panel rendering functions.
// Handles deck info, players, hand, combat, zombie panels, event choice, log, meta, and game over.

function renderDeckInfo() {
  const box = document.getElementById("deckInfoBox");
  if (!box) return;
  const totalStart = state.deckStartTotal ?? (state.mapDeck.length + state.discardPile.length);
  const totalPlayed = state.discardPile.length;
  const totalLeft = state.mapDeck.length;

  function tileRow(t, posStr, played) {
    const meta = state.deckStartCounts?.[t.name];
    const total = meta?.count ?? 1;
    const copy = total > 1 ? ` <span class="deck-info-copy">${t._copyNum}/${total}</span>` : "";
    return `<div class="deck-info-row${played ? " deck-info-row--played" : ""}">`
      + `<span class="deck-info-name">${t.name} <em class="deck-info-type">(${t.type})</em>${t.collection ? ` <em class="deck-info-collection">${t.collection}</em>` : ""}${copy}</span>`
      + `<span class="deck-info-pos">${posStr}</span>`
      + `</div>`;
  }

  const deckRows = state.mapDeck.map((t, i) => tileRow(t, `#${i + 1}`, false)).join("");

  const playedRows = state.discardPile.map((t) => {
    const meta = state.deckStartCounts?.[t.name];
    const posStr = meta?.prePlaced ? "pre-placed" : "played";
    return tileRow(t, posStr, true);
  }).join("");

  const detailsOpen = box.querySelector(".deck-info-details")?.open ?? false;
  box.innerHTML = `
    <div>Total in Deck (start): ${totalStart}</div>
    <div>Total Played: ${totalPlayed}</div>
    <div>Total Left: ${totalLeft}</div>
    <details class="deck-info-details"${detailsOpen ? " open" : ""}>
      <summary>Show cards</summary>
      <div class="deck-info-breakdown">${deckRows}${playedRows ? `<div class="deck-info-divider"></div>${playedRows}` : ""}</div>
    </details>
  `;
}

function renderEventDeckInfo() {
  const box = document.getElementById("eventDeckInfoBox");
  if (!box) return;

  const totalStart = state.eventDeckStartTotal ?? 0;

  const inDeck = state.eventDeck.length;
  const inHands = state.players?.reduce((s, p) => s + (p.hand?.length ?? 0), 0) ?? 0;
  const discarded = state.eventDiscardPile?.length ?? 0;

  function cardRow(c, label, played) {
    const total = c.count ?? 1;
    return `<div class="deck-info-row${played ? " deck-info-row--played" : ""}">`
      + `<span class="deck-info-name">${c.name}${c.collection ? ` <em class="deck-info-collection">${c.collection}</em>` : ""}</span>`
      + `<span class="deck-info-pos">${label}</span>`
      + `</div>`;
  }

  const deckRows = state.eventDeck.map((c, i) => cardRow(c, `#${i + 1}`, false)).join("");

  const handRows = (state.players ?? []).flatMap((p) =>
    (p.hand ?? []).map((c) => cardRow(c, p.name, false))
  ).join("");

  const playedRows = (state.eventDiscardPile ?? []).map((c) => cardRow(c, "played", true)).join("");

  const detailsOpen = box.querySelector(".deck-info-details")?.open ?? false;
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
      Hearts: ${cp.hearts} | Bullets: ${cp.bullets} | Kills: ${cp.kills} | Attack: ${cp.attack || 0}${cp.tempCombatBonus ? ` (+${cp.tempCombatBonus} turn)` : ""}${cp.shotgunCharges ? ` | Shotgun: ${cp.shotgunCharges}` : ""}${cp.movementBonus ? ` | Move +${cp.movementBonus}` : ""}<br />
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
      Hearts: ${p.hearts} | Bullets: ${p.bullets} | Kills: ${p.kills} | Attack: ${p.attack || 0}${p.tempCombatBonus ? ` (+${p.tempCombatBonus} turn)` : ""}${p.shotgunCharges ? ` | Shotgun: ${p.shotgunCharges}` : ""}${p.movementBonus ? ` | Move +${p.movementBonus}` : ""}<br />
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
    Boolean(state.pendingZombiePlace) || Boolean(state.pendingForcedMove);

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
    el.innerHTML = `
      <strong>${card.name}</strong><br />
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
        ${card.combatWeapon ? `<span class="small dim">Use in combat</span>` : `<button ${activateDisabled ? "disabled" : ""} data-activate-item-index="${index}">Activate &amp; Discard</button>`}
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
    `<button data-combat-action="B" ${player.bullets > 0 ? "" : "disabled"}>Spend 1 Bullet (+1)</button>`,
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
        const boost = c.combatBoost || c.permanentAttackBoost;
        const newTotal = roll + boost;
        const wHint = newTotal >= WIN ? "kills the zombie!" : `→ total: ${newTotal}`;
        const wClass = newTotal >= WIN ? "good" : "muted";
        return actionWrap(
          `<button data-combat-action="W:${c.name}" ${pending.weaponUsed ? "disabled" : ""}>${c.name} (+${boost})</button>`,
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
    const available = [...state.zombies.keys()].filter((zk) => !pzm.movedKeys.has(zk) && !pzm.stuckKeys.has(zk));
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="combat-decision-title">Zombie Movement — ${pzm.remaining} move(s) remaining</div>
      <div class="small">Click a zombie on the board to move it, or auto-move the rest.</div>
      <div class="combat-decision-actions">
        <button data-zombie-move-action="auto" ${available.length === 0 ? "disabled" : ""}>Auto-move remaining</button>
        <button data-zombie-move-action="done">Skip remaining</button>
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
  const instruction = pzr.selectedZombieKey
    ? `Zombie at ${pzr.selectedZombieKey} selected — click a destination space. Click the same zombie to deselect.`
    : `Click a zombie on the board to select it.`;
  panel.innerHTML = `
    <div class="combat-decision-title">This Isn't So Bad — Move ${pzr.remaining} zombie(s)</div>
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
  panel.innerHTML = `
    <div class="combat-decision-title">Card Choice: ${pending.cardName} — ${player.name}</div>
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
  refs.moveRollOutput.textContent = `Move Roll: ${state.currentMoveRoll ?? "-"} | Remaining: ${state.movesRemaining}`;
  refs.zombieRollOutput.textContent = `Zombie Roll: ${state.currentZombieRoll ?? "-"}`;
  refs.pendingTileInfo.textContent = state.pendingTile
    ? `Pending Tile: ${getTileDisplayName(state.pendingTile)} (${state.pendingTileOptions.length} valid placements)`
    : "Pending Tile: -";
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
    return;
  }
  const lastLogEntry = state.logs[state.logs.length - 1];
  const lastLog = lastLogEntry ? lastLogEntry.text : "";
  refs.gameOverMessage.textContent = lastLog;
  refs.gameOverOverlay.classList.remove("hidden");
}
