# 🧟 VC IC Zombies

A browser-based board game adaptation of zombie survival set in Iowa City. Draw tiles to build the city, fight zombies, grab loot, and reach the Helipad before the horde overwhelms you.

[![Play Now](https://img.shields.io/badge/Play%20Now-digable.github.io-orange)](https://digable.github.io/vc_ic_zombies/)
![Game Type](https://img.shields.io/badge/Type-Board%20Game-red)
![Platform](https://img.shields.io/badge/Platform-Web-green)
![Build](https://img.shields.io/badge/Build-None%20Required-brightgreen)

## 📖 Story

The dead have risen in Iowa City. Streets are overrun, buildings are locked down, and the only way out is the Helipad on the edge of town. You and your fellow survivors must draw tiles to reveal the city block by block, battle zombies in every corner, scavenge hearts and bullets from named buildings, and race to escape — or rack up 25 kills and prove you're the last one standing.

## 🕹️ Play Now

**[▶ Play in your browser →](https://digable.github.io/vc_ic_zombies/)**

Or clone the repo and open `index.html` locally — no server or build step required.

## ✨ Features

### 🗺️ Tile-Based City Building
- Draw and place map tiles each turn to reveal new city blocks
- Road tiles connect via compass connectors — roads must align
- Named buildings spawn zombies and loot when placed
- Helipad shuffled into the second half of the deck — escape is possible but never guaranteed
- Tile editor tool (`tile-editor.html`) for creating and previewing custom tiles
- Collection metadata (type, version, year, description, creator) shown as tooltip on setup checkboxes

### ⚔️ Combat System
- Combat triggers when entering or sharing a space with a zombie
- Roll d6 + attack bonus + temporary bonus; kill threshold depends on zombie type (regular: 4+, government-enhanced: 5+)
- On failure: spend a bullet for +1, spend a heart to reroll, use a weapon item, or take the loss
- Combat panel shows current hearts and bullets, with smart hints (e.g. warns if spending bullets won't be enough to win)
- All decisions resolved in-page — no browser prompts
- Knockout: lose half your kills (rounded down), respawn at Town Square, reset to 3 hearts / 3 bullets — a toast banner confirms the event and auto-dismisses after 5 seconds

### 🧟 Zombie AI
- Zombies move toward the nearest player each phase
- Movement respects walls, doors, and tile connectors
- One zombie per space; blocked zombies skip their move slot
- Zombie count per roll capped at total zombies on the board
- Zombie types have distinct stats defined in `ZOMBIE_TYPES` (`constants.js`):

| Type | Kill Roll | Movement |
|------|-----------|----------|
| Regular | 4+ | 1 space |
| Government-Enhanced | 5+ | 2 spaces |

### 🎴 Event Cards
- Draw up to 3 event cards per turn
- Play one card per turn cycle (resets at the start of your next turn)
- Card types: player buffs/recovery, opponent disruption, zombie spawns/removals/moves

### 🏆 Win Conditions
- **Escape** — reach the center square of the Helipad tile
- **Last Stand** — accumulate 25 zombie kills

---

## 🎮 Turn Order

Each turn follows this sequence:

| Step | Action |
|------|--------|
| 1 | **Draw & Place Tile** — reveal and place a new city block |
| 2 | **Combat Current Space** — fight any zombies sharing your space |
| 3 | **Draw to 3 Events** — top up your event hand |
| 4 | **Roll Movement** — roll and move with direction buttons |
| 5 | **Move Zombies** — roll and advance the horde |
| 6 | **Discard Event** — discard a card from your hand if desired |
| 7 | **End Turn** — pass to the next player |

---

## 📁 Project Structure

```
vc_ic_zombies/
├── index.html                        # Game UI
├── tile-editor.html                  # Tile debug / editor panel
├── README.md                         # This file
├── scripts/
│   ├── constants.js                  # Shared numeric constants (TILE_DIM, WIN_KILLS, etc.)
│   ├── core.js                       # State, collections, shared helpers
│   ├── render-helpers.js             # Rendering utilities (formatTileCode, micro-grid, etc.)
│   ├── render-board.js               # Board grid, player trail SVG, move status
│   ├── render-panels.js              # Sidebar panels, combat UI, log, knockout banner
│   ├── render-debug.js               # Tile editor / map deck debug rendering
│   ├── render.js                     # Render orchestrator (updateButtons + render())
│   ├── bootstrap.js                  # Event listener wiring, game boot
│   ├── tile-debug.js                 # Tile editor page logic
│   ├── subtile-editor-row.js         # Subtile editor row renderer
│   ├── compass-checkboxes.js         # Compass direction checkbox helper
│   ├── actions/
│   │   ├── setup.js                  # Game setup, tile draw/place
│   │   ├── combat.js                 # Combat resolution and knockout
│   │   ├── movement.js               # Player movement roll/step/end
│   │   ├── zombies.js                # Zombie movement phase
│   │   ├── events.js                 # Event hand draw/play/discard
│   │   ├── turn-end.js               # End-turn cleanup
│   │   └── win.js                    # Win condition checks
│   ├── rules/
│   │   ├── placement.js              # Tile placement and connector validation
│   │   ├── combat-flow.js            # Combat/zombie-step skip gating
│   │   ├── movement.js               # Step legality across subtiles and tile edges
│   │   ├── zombie-ai.js              # Zombie targeting and one-step movement
│   │   └── board-bounds.js           # Dynamic board render bounds
│   └── data/
│       ├── map-deck.js               # Tile definitions and buildMapDeck()
│       ├── event-deck.js             # Event deck builder
│       └── event-cards/
│           ├── helpers.js            # Shared event utilities
│           ├── player-cards.js       # Player buff/recovery cards
│           ├── opponent-cards.js     # Opponent disruption cards
│           └── zombie-cards.js       # Zombie spawn/remove/move cards
└── styles/
    ├── base.css                      # Design tokens, CSS variables, global element defaults
    ├── layout.css                    # Page layout, panels, responsive rules
    ├── components.css                # Tiles, micro-grid, badges, markers
    └── tile-debug.css                # Tile editor specific styles
```

---

## 🛠️ Technical Details

- **Pure Vanilla JS** — no frameworks, no bundler, no build step
- **Global scope** — all files load via `<script>` tags in order; no ES modules
- **3×3 subtile grid** — each map tile has a 3×3 movement grid with walkability, walls, and doors
- **In-page decisions** — combat choices, rotation, and placement are all handled in the UI

### Subtile Authoring

Tiles can define explicit 3×3 movement data via `subTilesTemplate`. Each key is `"x,y"` where x and y are `0..2`.

Supported per-subtile properties:

| Property | Description |
|----------|-------------|
| `walkable: true\|false` | Whether the subtile can be entered |
| `walls: ["N","E","S","W"]` | Directions that are always closed |
| `doors: ["N","E","S","W"]` | Directions that are always open |
| `type: "road"\|"building"\|...` | Visual and logic type |

**Example:**
```js
{
  name: "Corner Store",
  type: "named",
  count: 1,
  enabled: true,
  connectors: ["N", "E"],
  zombieSpawnMode: "by_card",
  zombieCount: 2,
  hearts: 1,
  bullets: 1,
  subTilesTemplate: {
    "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
    "1,1": { walkable: true, type: "road" },
    "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
    "0,0": { walkable: false },
    "2,0": { walkable: false },
    "0,1": { walkable: false },
    "0,2": { walkable: false },
    "1,2": { walkable: false },
    "2,2": { walkable: false }
  }
}
```

### Collections

Tiles and event cards belong to a collection, selected at game setup. Collections are defined in `COLLECTIONS` in `core.js`:

| Key | Value | Description |
|-----|-------|-------------|
| `DIRECTORS_CUT` | `"directors_cut"` | Base game — can be played standalone |
| `IOWA_CITY` | `"iowa_city"` | Expansion — requires Director's Cut |
| `NOT_USED` | `"not_used"` | Excluded from all play |

Collections are configured in `map-deck.js` via `buildStartTile`/`buildMapDeck` and in `event-deck.js` via `buildEventDeck`. Metadata for each collection is defined in `COLLECTION_META` in `core.js`:

| Property | Description |
|----------|-------------|
| `label` | Display name |
| `type` | `"base"` or `"expansion"` |
| `version` | Version string — integers and dot-notation (e.g. `2`, `0.1.0`) are prefixed with `v`; text values like `"2nd Edition"` are shown as-is |
| `year` | Release year |
| `description` | Short description shown in the setup tooltip |
| `creator` | Author or creator name |
| `requiresBase` | `null` for standalone base games; `COLLECTIONS.X` for expansions that need a base |

If an expansion is selected without its required base game, the engine falls back to Director's Cut's Town Square (start tile) and Helipad (win tile), and uses Director's Cut events if the expansion has none of its own.

### Tile Properties

| Property | Description |
|----------|-------------|
| `name` | Display name |
| `type` | `"road"`, `"named"`, `"helipad"`, `"special"` |
| `count` | Number of copies in the deck |
| `enabled` | `false` to exclude from play |
| `collection` | `COLLECTIONS.DIRECTORS_CUT`, `IOWA_CITY`, or `NOT_USED` — controls which game setup filter includes this tile |
| `connectors` | Array of `"N"`,`"E"`,`"S"`,`"W"` — road connection points |
| `zombieSpawnMode` | `"by_card"` uses `zombieCount`; `"by_exits"` spawns one per connector |
| `zombieCount` | Zombies to spawn when placed (by_card mode) |
| `hearts` | Heart tokens placed on the tile when drawn |
| `bullets` | Bullet tokens placed on the tile when drawn |
| `isStartTile` | `true` — tile placed at (0,0) to start the game; one per standalone collection |
| `isWinTile` | `true` — tile shuffled into the back half of the deck; reaching its center wins the game |

---

## 📋 Rule Summary

- Players start at Town Square with 3 hearts and 3 bullets
- Before starting, choose which tile collections (Director's Cut, Iowa City, Not Used) to include — if only an expansion is selected without its base game, Town Square and Helipad are used as fallbacks for the start and win tiles
- Tile placement requires connector alignment — roads must connect to roads
- Helipad is shuffled into the second half of the deck
- Zombies spawn on tiles when placed based on `zombieSpawnMode`
- Combat roll: d6 + attack bonus + temp bonus; kill threshold varies by zombie type (regular 4+, government-enhanced 5+)
- Failed combat options: spend bullet (+1), spend heart (reroll), or accept loss
- Knockout: lose half kills (rounded down), respawn Town Square, reset stats
- Hearts are capped at 5
- One event card may be played per turn cycle; some cards have timing restrictions (e.g. Much Needed Rest must be played before rolling movement)
- Zombie movement is non-diagonal, one zombie per space; government-enhanced zombies move 2 spaces per slot
- Win by reaching the **center square** of the Helipad or reaching 25 kills

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs or broken tile definitions
- Suggest new named tiles or event cards
- Submit pull requests for rule clarifications or balance tweaks

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ for Iowa City
