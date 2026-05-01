// ---------------------------------------------------------------------------
// Z7 — Send in the Clowns player event cards
// Appended to playerEventCards after player-cards.js loads.
// ---------------------------------------------------------------------------

const Z7 = COLLECTIONS.SEND_IN_THE_CLOWNS;

function canPlayImmediately(card, player) {
  if (!card) return false;
  if (card.canPlay && !card.canPlay()) return false;
  if (card.isItem && player.items.some((c) => c.name === card.name)) return false;
  return true;
}

function promptClownsEatMePlay(player, drawn) {
  const playable = drawn.filter((c) => canPlayImmediately(c, player));
  const options = playable.map((c) => ({ key: c.name, label: `Play: ${c.name}` }));
  const restCount = drawn.length;
  options.push({ key: "__done__", label: restCount === 0 ? "Done" : `Discard rest (${restCount})` });

  state.pendingEventChoice = {
    playerId: player.id,
    title: "Can't Sleep. Clowns Will Eat Me!",
    cardName: "Can't Sleep. Clowns Will Eat Me!",
    options,
    resolve(choice) {
      if (choice === "__done__") {
        drawn.forEach((c) => state.eventDiscardPile.push(c));
        if (drawn.length > 0) logLine(`${player.name} discarded ${drawn.length} drawn card(s).`);
        checkWin(player);
        render();
        return;
      }
      const chosenCard = playable.find((c) => c.name === choice);
      if (!chosenCard) { render(); return; }
      drawn.splice(drawn.indexOf(chosenCard), 1);
      if (chosenCard.cardType === CARD_TYPE.BOTD_PAGE) {
        player.botdPages.push(chosenCard);
        logLine(`${player.name} immediately stages page: ${chosenCard.name}.`);
      } else {
        logLine(`${player.name} immediately plays ${chosenCard.name}.`);
        chosenCard.apply(player, buildEventDeckHelpers());
        state.eventDiscardPile.push(chosenCard);
      }
      const pKey = playerKey(player);
      if (!state.gameOver && state.zombies.has(pKey) && !playerHasNoCombat(player)) {
        resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
      }
      if (!state.gameOver) {
        if (drawn.length > 0 && !state.pendingEventChoice) {
          promptClownsEatMePlay(player, drawn);
        } else {
          drawn.forEach((c) => state.eventDiscardPile.push(c));
          checkWin(player);
        }
      }
      render();
    }
  };
}

playerEventCards.push(
  {
    name: "Clown Nose",
    description: "Play this card in front of you. Discard this card to take the top card from the discard pile and place it in your hand.",
    collection: { [Z7]: 2 },
    isItem: true,
    activateItem(player) {
      if (state.eventDiscardPile.length === 0) {
        logLine(`${player.name} tried to use Clown Nose but the event discard pile is empty.`);
        return false;
      }
      const card = state.eventDiscardPile.pop();
      player.hand.push(card);
      logLine(`${player.name} used Clown Nose — took ${card.name} from the event discard pile into their hand.`);
      return true;
    }
  },
  {
    name: "Cotton Candy",
    description: "Play this card to add +1 to any roll. You may play this card after the roll.",
    collection: { [Z7]: 2 },
    apply(player) {
      if (state.pendingCombatDecision && state.pendingCombatDecision.playerId === player.id) {
        const pending = state.pendingCombatDecision;
        pending.modifiedRoll += 1;
        logLine(`${player.name} played Cotton Candy — +1 to current combat roll (now ${pending.modifiedRoll}).`);
        if (pending.modifiedRoll >= pending.killRoll) {
          const pKey = pending.pKey;
          decrementZombieAt(pKey);
          player.kills += 1;
          player.cardPlayFrozenUntilKill = false;
          handleSendInTheClownsKill(player, pending.zombieType);
          state.lastCombatResult = `Success (${pending.modifiedRoll})`;
          state.recentKillKey = pKey;
          state.recentKillByPlayerId = player.id;
          logLine(`${player.name} raised the roll to ${pending.modifiedRoll} and killed the zombie.`, "kill");
          const options = pending.options;
          state.pendingCombatDecision = null;
          checkWin(player);
          applyCombatPostStep(player, pKey, options);
        }
      } else if (state.step === STEP.MOVE && (state.movesRemaining ?? 0) > 0) {
        state.movesRemaining += 1;
        logLine(`${player.name} played Cotton Candy — +1 movement (${state.movesRemaining} space(s) remaining).`);
      } else {
        player.tempCombatBonus = (player.tempCombatBonus || 0) + 1;
        logLine(`${player.name} played Cotton Candy — +1 to next combat roll this turn.`);
      }
    }
  },
  {
    name: "I Hate Clowns!",
    description: "Play this card to add +1 to all combat rolls against all Zombie Clowns for 1 turn.",
    collection: { [Z7]: 2 },
    apply(player) {
      player.clownCombatBonus = (player.clownCombatBonus || 0) + 1;
      logLine(`${player.name} played I Hate Clowns! — +1 to all combat rolls vs clown zombies this turn.`);
    }
  },
  {
    name: "Important Clown Business",
    description: "Take 1 clown zombie from each player's collection and add them to any legal circus (Z7) tile.",
    collection: { [Z7]: 2 },
    apply(player) {
      const others = state.players.filter(p => p.id !== player.id && p.kills > 0);
      const count = others.length;
      others.forEach(p => {
        p.kills -= 1;
        logLine(`${player.name} took 1 clown zombie from ${p.name}'s collection (${p.kills} remaining).`);
      });
      if (count === 0) {
        logLine(`${player.name} played Important Clown Business — no other players have zombies to take.`);
        return;
      }
      const validSpaces = new Set();
      state.board.forEach((tile, tileKey) => {
        if (!isZ7Tile(tile)) return;
        const parts = tileKey.split(',');
        const tx = parseInt(parts[0], 10);
        const ty = parseInt(parts[1], 10);
        for (let lx = 0; lx < 3; lx++) {
          for (let ly = 0; ly < 3; ly++) {
            const sub = (tile.subTiles || {})[key(lx, ly)];
            if (!sub || !sub.walkable) continue;
            const sx = tx * 3 + lx;
            const sy = ty * 3 + ly;
            const spk = key(sx, sy);
            if (!state.zombies.has(spk) && !state.players.some(p => key(p.x, p.y) === spk)) {
              validSpaces.add(spk);
            }
          }
        }
      });
      if (validSpaces.size === 0) {
        logLine(`${player.name} played Important Clown Business — no valid circus tile spaces to place zombies.`);
        return;
      }
      state.pendingZombiePlace = {
        playerId: player.id,
        cardName: "Important Clown Business",
        remaining: count,
        zombieType: ZOMBIE_TYPE.CLOWN,
        validSpaces
      };
      logLine(`${player.name} played Important Clown Business — place ${count} clown zombie(s) on Z7 tiles.`);
    }
  },
  {
    name: "Seltzer Bottle",
    description: "Play this card to avoid combat with all zombies for 1 turn. This effect only applies to you.",
    collection: { [Z7]: 2 },
    apply(player) {
      player.noCombatThisTurn = true;
      logLine(`${player.name} played Seltzer Bottle — no combat this turn.`);
    }
  },
  {
    name: "Send in the Clowns!",
    description: "Play this card at the beginning of your turn. Any clown zombies you kill during this turn may be placed on any other player's space.",
    collection: { [Z7]: 2 },
    apply(player) {
      player.sendInTheClownsActive = true;
      logLine(`${player.name} played Send in the Clowns! — killed clown zombies this turn can be placed on opponents' spaces.`);
    }
  }
);

playerEventCards.push(
  {
    name: "Stuffed Animal",
    description: "Play this card in front of you. Discard this card at any time instead of discarding a life token.",
    collection: { [Z7]: 2 },
    isItem: true,
    // Auto-fires in handleKnockout — no manual activation
    activateItem() { return false; }
  },
  {
    name: "That's not a mask!",
    description: "Play this card to switch target player with any zombie clown on the Big Top map tiles.",
    collection: { [Z7]: 2 },
    apply(player) {
      const clownSpaces = [];
      state.zombies.forEach((data, spk) => {
        if (data.type !== ZOMBIE_TYPE.CLOWN) return;
        const parts = spk.split(',');
        const sx = parseInt(parts[0], 10), sy = parseInt(parts[1], 10);
        const tile = getTileAtSpace(sx, sy);
        if (tile && isZ7Tile(tile)) clownSpaces.push(spk);
      });
      if (clownSpaces.length === 0) {
        logLine(`${player.name} played That's not a mask! — no clown zombies on Z7 tiles.`);
        return;
      }
      const playerOptions = state.players.map(p => ({ key: `p${p.id}`, label: p.name }));
      state.pendingEventChoice = {
        playerId: player.id,
        title: "That's not a mask! — Choose Target Player",
        cardName: "That's not a mask!",
        options: playerOptions,
        resolve(playerChoice) {
          const target = getPlayerById(parseInt(playerChoice.replace('p', ''), 10));
          if (!target) { render(); return; }
          const zombieOptions = clownSpaces.map(spk => ({ key: spk, label: `Clown at (${spk})` }));
          state.pendingEventChoice = {
            playerId: player.id,
            title: "That's not a mask! — Choose Clown Zombie",
            cardName: "That's not a mask!",
            options: zombieOptions,
            resolve(zombieSpk) {
              if (!state.zombies.has(zombieSpk)) { render(); return; }
              const clownParts = zombieSpk.split(',');
              const cx = parseInt(clownParts[0], 10), cy = parseInt(clownParts[1], 10);
              const oldPKey = key(target.x, target.y);
              state.zombies.delete(zombieSpk);
              state.zombies.set(oldPKey, { type: ZOMBIE_TYPE.CLOWN });
              target.x = cx;
              target.y = cy;
              logLine(`${player.name} played That's not a mask! — ${target.name} swapped with clown zombie.`);
              render();
            }
          };
          render();
        }
      };
      render();
    }
  },
  {
    name: "That's not an exit!",
    description: "Play this card when target player is leaving the Funhouse. Send that player to any square on a different Funhouse map tile.",
    collection: { [Z7]: 2 },
    apply(player) {
      const playerOptions = state.players.map(p => ({ key: `p${p.id}`, label: p.name }));
      state.pendingEventChoice = {
        playerId: player.id,
        title: "That's not an exit! — Choose Target Player",
        cardName: "That's not an exit!",
        options: playerOptions,
        resolve(playerChoice) {
          const target = getPlayerById(parseInt(playerChoice.replace('p', ''), 10));
          if (!target) { render(); return; }
          const currentTileKey = key(spaceToTileCoord(target.x), spaceToTileCoord(target.y));
          const destOptions = [];
          state.board.forEach((tile, tileKey) => {
            if (!tile.funhouse || tileKey === currentTileKey) return;
            const tp = tileKey.split(',');
            const tx = parseInt(tp[0], 10), ty = parseInt(tp[1], 10);
            for (let lx = 0; lx < 3; lx++) {
              for (let ly = 0; ly < 3; ly++) {
                const sub = (tile.subTiles || {})[key(lx, ly)];
                if (!sub || !sub.walkable) continue;
                const sx = tx * 3 + lx, sy = ty * 3 + ly;
                destOptions.push({ key: key(sx, sy), label: `${tile.name} (${sx},${sy})` });
              }
            }
          });
          if (destOptions.length === 0) {
            logLine(`${player.name} played That's not an exit! — no valid funhouse destinations.`);
            render();
            return;
          }
          state.pendingEventChoice = {
            playerId: player.id,
            title: `That's not an exit! — Destination for ${target.name}`,
            cardName: "That's not an exit!",
            options: destOptions,
            resolve(destKey) {
              const dp = destKey.split(',');
              target.x = parseInt(dp[0], 10);
              target.y = parseInt(dp[1], 10);
              logLine(`${player.name} played That's not an exit! — ${target.name} sent to funhouse (${target.x},${target.y}).`);
              render();
            }
          };
          render();
        }
      };
      render();
    }
  },
  {
    name: "Whoaaa!",
    description: "Target player halves movement (rounded down) on next turn and immediately discards 1 item from play.",
    collection: { [Z7]: 2 },
    apply(player) {
      const playerOptions = state.players.map(p => ({ key: `p${p.id}`, label: p.name }));
      state.pendingEventChoice = {
        playerId: player.id,
        title: "Whoaaa! — Choose Target Player",
        cardName: "Whoaaa!",
        options: playerOptions,
        resolve(playerChoice) {
          const target = getPlayerById(parseInt(playerChoice.replace('p', ''), 10));
          if (!target) { render(); return; }
          target.halfMovementNextTurn = true;
          logLine(`${player.name} played Whoaaa! — ${target.name}'s movement is halved next turn.`);
          if (target.items.length === 0) {
            logLine(`${target.name} has no items to discard.`);
            render();
            return;
          }
          if (target.items.length === 1) {
            const discarded = target.items.pop();
            state.eventDiscardPile.push(discarded);
            logLine(`${target.name} discarded ${discarded.name} (Whoaaa!).`);
            render();
            return;
          }
          const itemOptions = target.items.map((c, i) => ({ key: String(i), label: c.name }));
          state.pendingEventChoice = {
            playerId: target.id,
            title: `Whoaaa! — ${target.name}: discard 1 item`,
            cardName: "Whoaaa!",
            options: itemOptions,
            resolve(idxStr) {
              const idx = parseInt(idxStr, 10);
              if (isNaN(idx) || idx < 0 || idx >= target.items.length) { render(); return; }
              const [discarded] = target.items.splice(idx, 1);
              state.eventDiscardPile.push(discarded);
              logLine(`${target.name} discarded ${discarded.name} (Whoaaa!).`);
              render();
            }
          };
          render();
        }
      };
      render();
    }
  },
  {
    name: "You are going to DIE!",
    description: "Send target player to the Fortune Teller map tile. That player rolls 1d6: 6 = no life lost, 2–5 = lose 1 life, 1 = lose 2 lives.",
    collection: { [Z7]: 2 },
    apply(player) {
      const playerOptions = state.players.map(p => ({ key: `p${p.id}`, label: p.name }));
      state.pendingEventChoice = {
        playerId: player.id,
        title: "You are going to DIE! — Choose Target Player",
        cardName: "You are going to DIE!",
        options: playerOptions,
        resolve(playerChoice) {
          const target = getPlayerById(parseInt(playerChoice.replace('p', ''), 10));
          if (!target) { render(); return; }
          let ftKey = null;
          state.board.forEach((tile, tileKey) => {
            if (tile.name === "Fortune Teller") ftKey = tileKey;
          });
          if (!ftKey) {
            logLine(`${player.name} played You are going to DIE! — Fortune Teller tile is not in play.`);
            render();
            return;
          }
          const fp = ftKey.split(',');
          const tx = parseInt(fp[0], 10), ty = parseInt(fp[1], 10);
          target.x = tx * 3 + 1;
          target.y = ty * 3 + 1;
          const roll = rollD6();
          logLine(`${player.name} played You are going to DIE! — ${target.name} sent to Fortune Teller, rolled ${roll}.`);
          if (roll === 6) {
            logLine(`${target.name} rolled 6 — no life lost!`);
          } else if (roll === 1) {
            target.hearts -= 2;
            logLine(`${target.name} rolled 1 — loses 2 life tokens! (${target.hearts} remaining)`);
            if (target.hearts <= 0) handleKnockout(target, { endStep: false });
          } else {
            target.hearts -= 1;
            logLine(`${target.name} rolled ${roll} — loses 1 life token. (${target.hearts} remaining)`);
            if (target.hearts <= 0) handleKnockout(target, { endStep: false });
          }
          checkWin(player);
          render();
        }
      };
      render();
    }
  },
  {
    name: "What do you mean, funny?!?",
    description: "Play this card to immediately send target player to any square in the Funhouse.",
    collection: { [Z7]: 1 },
    apply(player) {
      const playerOptions = state.players.map(p => ({ key: `p${p.id}`, label: p.name }));
      state.pendingEventChoice = {
        playerId: player.id,
        title: "What do you mean, funny?!? — Choose Target Player",
        cardName: "What do you mean, funny?!?",
        options: playerOptions,
        resolve(playerChoice) {
          const target = getPlayerById(parseInt(playerChoice.replace('p', ''), 10));
          if (!target) { render(); return; }
          const destOptions = [];
          state.board.forEach((tile, tileKey) => {
            if (!tile.funhouse) return;
            const tp = tileKey.split(',');
            const tx = parseInt(tp[0], 10), ty = parseInt(tp[1], 10);
            for (let lx = 0; lx < 3; lx++) {
              for (let ly = 0; ly < 3; ly++) {
                const sub = (tile.subTiles || {})[key(lx, ly)];
                if (!sub || !sub.walkable) continue;
                const sx = tx * 3 + lx, sy = ty * 3 + ly;
                destOptions.push({ key: key(sx, sy), label: `${tile.name} (${sx},${sy})` });
              }
            }
          });
          if (destOptions.length === 0) {
            logLine(`${player.name} played What do you mean, funny?!? — no funhouse tiles on the board.`);
            render();
            return;
          }
          state.pendingEventChoice = {
            playerId: player.id,
            title: `What do you mean, funny?!? — Destination for ${target.name}`,
            cardName: "What do you mean, funny?!?",
            options: destOptions,
            resolve(destKey) {
              const dp = destKey.split(',');
              target.x = parseInt(dp[0], 10);
              target.y = parseInt(dp[1], 10);
              logLine(`${player.name} played What do you mean, funny?!? — ${target.name} teleported to funhouse (${target.x},${target.y}).`);
              render();
            }
          };
          render();
        }
      };
      render();
    }
  },
  {
    name: "What the ____!?!",
    description: "Play this card on a target player. That player may not play any cards from their hand until they kill 1 zombie.",
    collection: { [Z7]: 1 },
    apply(player) {
      const others = state.players.filter(p => p.id !== player.id);
      const targets = others.length > 0 ? others : state.players;
      const playerOptions = targets.map(p => ({ key: `p${p.id}`, label: p.name }));
      state.pendingEventChoice = {
        playerId: player.id,
        title: "What the ____!?! — Choose Target Player",
        cardName: "What the ____!?!",
        options: playerOptions,
        resolve(playerChoice) {
          const target = getPlayerById(parseInt(playerChoice.replace('p', ''), 10));
          if (!target) { render(); return; }
          target.cardPlayFrozenUntilKill = true;
          logLine(`${player.name} played What the ____!?! — ${target.name} cannot play cards until they kill a zombie.`);
          render();
        }
      };
      render();
    }
  }
);

playerEventCards.push(
  {
    name: "Can't Sleep. Clowns Will Eat Me!",
    description: "Draw 3 cards from the draw pile. Immediately play as many as you like (and can legally play). Discard the rest.",
    collection: { [Z7]: 2 },
    apply(player) {
      const drawn = [];
      for (let i = 0; i < 3; i++) {
        if (state.eventDeck.length === 0) {
          if (state.eventDiscardPile.length === 0) break;
          reshuffleEventDeckIfEmpty();
        }
        if (state.eventDeck.length === 0) break;
        drawn.push(state.eventDeck.shift());
      }
      const names = drawn.map((c) => c.name).join(", ");
      logLine(`${player.name} played Can't Sleep. Clowns Will Eat Me! — drew ${drawn.length} card(s): ${names || "none"}.`);
      if (drawn.length === 0) return;
      promptClownsEatMePlay(player, drawn);
    }
  }
);
