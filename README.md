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
- Combat roll: 4-6 win, 1-3 lose.
- On combat loss, player pays deficit with hearts/bullets (player chooses payment priority each fight).
- If hearts run out, player loses half kills (rounded down), respawns at Town Square, and resets to 3 hearts/3 bullets.
- Named tiles place zombies/items based on card stats when played.
- Hearts are capped at 5.
- Event cards can be played at any time during your turn, max one per turn.
- Zombie movement is non-diagonal, one step each, and one zombie per space.
- Win by reaching Helipad or getting 25 zombie kills.

## Project Structure

The code is split into small browser scripts for easier human maintenance:

- `scripts/core.js`: shared constants, state, refs, utility helpers, token and zombie spawn helpers
- `scripts/data.js`: map/event deck definitions and card stats
- `scripts/rules.js`: placement/movement/combat eligibility rules
- `scripts/actions.js`: turn actions and game-state mutations
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