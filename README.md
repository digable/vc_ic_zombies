# VC IC Zombies (Browser Prototype)

A JavaScript/HTML/CSS board-game adaptation of your zombie survival rules.

## Run

1. Open `index.html` in your browser.
2. Choose player count (1-4).
3. Click `New Game`.

No build step is required.

## Gameplay Flow

Use the control buttons in order each turn:

1. `Draw & Place Tile`
2. `Combat Current Space`
3. `Draw to 3 Events`
4. `Roll Movement`, then move with direction buttons
5. `Move Zombies`
6. `Discard Selected Event`
7. `End Turn`

## Rule Coverage Implemented

- Town Square starts at the center with all players on it.
- Players start with 3 hearts and 3 bullets.
- Tile deck is shuffled and Helipad is placed as the last map tile.
- Tile placement obeys connector matching (roads must connect).
- Zombie spawn on tiles that indicate spawn.
- Combat is required when entering a zombie space.
- Combat total is `d6 + attack bonus + temporary combat bonus`; 4+ wins.
- On failed combat, the active player must choose in the in-page combat decision box: spend bullet (+1), spend life token to reroll, or lose combat.
- The combat decision box always names the player who must choose and pauses other actions until a choice is made.
- If hearts run out, player loses half kills (rounded down), respawns at Town Square, and resets to 3 hearts/3 bullets.
- Named tiles place zombies/items based on card stats when played.
- Hearts are capped at 5.
- Event cards can be played at any time during your turn, max one from the start of your turn to the start of your next turn.
- Zombie movement is non-diagonal, one step each, and one zombie per space.
- Win by reaching Helipad or getting 25 zombie kills.

## Project Structure

The code is split into small browser scripts for easier human maintenance:

- `scripts/core.js`: shared constants, state, refs, utility helpers, token and zombie spawn helpers
- `scripts/data/map-deck.js`: map deck definitions and tile stats
- `scripts/data/event-deck.js`: event deck builder/orchestrator
- `scripts/data/event-cards/helpers.js`: shared event helper utilities
- `scripts/data/event-cards/player-cards.js`: self-targeting player buff/recovery cards
- `scripts/data/event-cards/opponent-cards.js`: opponent-targeting disruption cards
- `scripts/data/event-cards/zombie-cards.js`: zombie spawn/remove/move cards
- `scripts/rules/placement.js`: tile placement and connector validation rules
- `scripts/rules/combat-flow.js`: current-player and combat/zombie-step skip gating
- `scripts/rules/movement.js`: player/zombie step legality across subtiles and tile edges
- `scripts/rules/zombie-ai.js`: zombie targeting and one-step movement selection
- `scripts/rules/board-bounds.js`: dynamic board render bounds helper
- `scripts/actions/setup.js`: game setup and map draw/place actions
- `scripts/actions/win.js`: win condition checks
- `scripts/actions/combat.js`: combat resolution and knockout handling
- `scripts/actions/movement.js`: player movement roll/step/end-move flow
- `scripts/actions/zombies.js`: zombie movement phase actions
- `scripts/actions/events.js`: draw/play/discard event-hand actions
- `scripts/actions/turn-end.js`: end-turn cleanup and hand-limit enforcement
- `scripts/render.js`: board/UI rendering and button state updates
- `scripts/bootstrap.js`: event listeners and initial game boot

`index.html` loads these files in order.

Styles are also split for readability:

- `styles/base.css`: design tokens and global element defaults
- `styles/layout.css`: page/layout/section structure and responsive rules
- `styles/components.css`: game UI components (tiles, cards, micro-grid markers)

## Notes

- No build step is required.
- The board uses 3x3 movement spaces inside each tile.
- Combat does not rely on browser `prompt()` dialogs; decisions are handled in-page.