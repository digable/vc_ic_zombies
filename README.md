# 🧟 VC IC Zombies

A browser-based board game adaptation of zombie survival. Draw tiles to build the city, fight zombies, grab loot, and reach the Helipad before the horde overwhelms you — or perform the Cabin Spell in The End (Z4) to win by dark magic.

[![Play Now](https://img.shields.io/badge/Play%20Now-digable.github.io-orange)](https://digable.github.io/vc_ic_zombies/)
![Game Type](https://img.shields.io/badge/Type-Board%20Game-red)
![Platform](https://img.shields.io/badge/Platform-Web-green)
![Build](https://img.shields.io/badge/Build-None%20Required-brightgreen)

## 📖 Story

The dead have risen. Streets are overrun, buildings are locked down, and the only way out is the Helipad on the edge of town. You and your fellow survivors must draw tiles to reveal the city block by block, battle zombies in every corner, scavenge hearts and bullets from named buildings, and race to escape — or rack up 25 kills and prove you're the last one standing.

## 🕹️ Play Now

**[▶ Play in your browser → (https://vc-ic-zombies.vercel.app/)](https://vc-ic-zombies.vercel.app/)**

Or clone the repo and open `index.html` locally — no server or build step required.

## ✨ Features

### 🗺️ Tile-Based City Building
- Draw and place map tiles each turn to reveal new city blocks
- Road tiles connect via compass connectors — roads must align; wall-to-wall adjacency is allowed as long as at least one side has a road-to-road connection
- Named buildings spawn zombies and loot when placed
- Helipad shuffled into the second half of the deck — escape is possible but never guaranteed
- Tile editor tool (`tile-editor.html`) for creating and previewing custom tiles — supports all tile fields including flags, zone gateway, and companion tiles; tile groups collapse for performance, subtile editors expand on demand
- Collection metadata (type, version, year, description, creator) shown as tooltip on setup checkboxes
- Each tile and event card shows a short collection code badge (Z1, Z2, IC, MW) — on the board, in your event hand, and in the setup panel

### 🎲 Isometric View
- Toggle an isometric 3D view of the board at any time with the **Iso View** button in the map header
- **Tilt** (20°–80°) and **Spin** sliders for fine angle control; step buttons for 5° tilt / 45° spin increments; Reset snaps back to defaults
- **3D elevation** — building subtiles rise above the ground plane; walls fold upward from tile edges and are semi-transparent so you can see through them
- **Vertical pawns** — players, zombies, and zombie dogs render as standing pawn figures (body + round head) that always face the camera regardless of spin/tilt angle; player IDs are shown on the body
- **Token icons** — heart tokens show ♥ and bullet tokens show ⬡ with counts in iso mode
- **Zoom** — mouse wheel or pinch-to-zoom (mobile) to scale the board; range 0.3×–3.0×
- **Pan** — click-and-drag (desktop) or single-finger drag (mobile) to move the board freely in any direction
- Switching back to flat view restores the standard grid layout with no data loss

### 🌐 Online Multiplayer
- Create or join a game with a 4-character room code — share the link and anyone can join instantly
- **Host controls** — only the host can start the game; other players see a waiting state until the game begins
- **Turn enforcement** — all game buttons are disabled when it's not your turn; a banner shows whose turn it is
- **Automatic state sync** — game state is pushed to the cloud after every turn and polled every 1.5 seconds by other players
- **Invite links** — joining via a `?game=XXXX` URL pre-fills the code and hides local-game setup
- **Rejoin support** — closing and reopening the same invite link rejoins an in-progress game automatically
- Powered by Vercel serverless functions and MongoDB Atlas — no dedicated game server required

### ⚔️ Combat System
- Combat triggers when entering or sharing a space with a zombie
- Roll d6 + attack bonus + temporary bonus; kill threshold depends on zombie type (regular: 4+, government-enhanced: 5+)
- On failure: spend a bullet for +1, spend a heart to reroll, use a weapon item, or take the loss
- **Zombie dogs** deal ½ heart damage on a loss instead of a full heart; the reroll button shows the total half-hearts remaining (e.g. 3 hearts = 6 half-hearts). Full-heart reroll only appears when fighting human zombies
- **Mid-movement combat** — combat triggered while moving must fully resolve before movement continues; remaining moves are preserved and resumed after the fight
- Combat panel shows current hearts and bullets, with smart hints (e.g. warns if spending bullets won't be enough to win)
- All decisions resolved in-page — no browser prompts
- Knockout: lose half your kills (rounded down), respawn at the nearest start tile, reset to 3 hearts / 3 bullets — a toast banner confirms the event (including the respawn tile name) and auto-dismisses after 5 seconds
- **Lucky Shot** — when in your hand, a button appears in the combat panel; spend 1 bullet to auto-kill the current zombie
- **Weapons Jammed** — the Jammed event card blocks bullet tokens and weapon items for all players until the end of your next turn; affected buttons are disabled with a jammed indicator in the combat panel

### 🧟 Zombie AI
- Zombies move toward the nearest player each phase
- Movement respects walls, doors, and tile connectors
- One zombie per space; blocked zombies skip their move slot
- Zombie count per roll capped at total zombies on the board
- **Zombie dogs** are tracked individually — two dogs on the same space each get their own move slot and are rendered as separate markers
- **Dog Repellent** (Z4 event card) prevents all dogs from moving closer to the protected player until the effect expires
- Zombie types have distinct stats defined in `ZOMBIE_TYPES` (`constants.js`):

| Type | Kill Roll | Movement | Damage |
|------|-----------|----------|--------|
| Regular | 4+ | 1 space | 1 heart |
| Government-Enhanced | 5+ | 2 spaces | 1 heart |
| Zombie Dog | 4+ | 2 spaces | ½ heart |

### 🎴 Event Cards
- Draw up to 3 event cards per turn
- Play one card per turn cycle (resets at the start of your next turn)
- Card types: player buffs/recovery, opponent disruption, zombie spawns/removals/moves, and Book of the Dead pages
- Event card collections are configured independently from map tile collections at setup — you can mix any combination
- **Opponent disruption cards** include multi-step interactions: forced movement (Brain Cramp), tile placement hijacking (I Think It's Over Here), item theft (You Don't Need That!), card redirect (You Lookin' at Me?!?), hand wipe (Weekend Pass: DENIED!), and forced tile restriction (What is That Smell?!?)
- **That Didn't Just Happen!?! (Z4)** — can be played immediately after any opponent plays a card; cancels the effect, clears any pending state the card set up, and refunds the opponent's play slot for the turn
- **Mall Walkers (Z3) cards** include location-gated items and global effects:

| Card | Effect |
|------|--------|
| Aww, isn't he cute! | Item (Pet Store). Discard to ignore all zombie combat on your current tile for the rest of the turn |
| Sprinkler System | No zombies in the mall may move until the end of your next turn |
| One Man's Garbage | Item (Consignment Shop). Discard to retrieve the top card of the event discard pile |
| Now that's just gross! | Item (Lingerie Shop). Discard and teleport to any space adjoining a building or store |
| Jammed | Blocks all bullet tokens and weapons for all players until the end of your next turn |
| Lots of Luck with That! | Play when sharing a space with another player — end your movement and take 1 bullet + 1 random card from them |
| Lucky Shot | In combat only — spend 1 bullet to automatically kill the current zombie |

### 📖 Book of the Dead (BOTD) Page Cards
Page cards are shuffled into the event deck and drawn like regular event cards. They follow special rules:

- **Stage** — move a page from your hand to in front of you; uses your event play slot for the turn. Some pages trigger an immediate effect when staged (`onStage`).
- **Use & Discard** — trigger the card's effect and remove it from the game; only one page may be removed per round.
- Players may have any number of pages staged in front of them at once.

**The End (Z4) Book of the Dead pages:**

| Card | Count | Effect |
|------|-------|--------|
| Twist of Fate | 2 | Remove to take 1 bullet from each other player |
| Return to Sender | 2 | Remove to teleport one opponent from inside the Cabin to an outside Cabin subtile |
| The Trees Are Alive! | 2 | Remove to spawn a zombie on every opponent currently on a wooded subtile |
| Here Doggie! | 3 | On stage: fill the Pet Cemetery with 9 zombie dogs. Remove at any time |
| Something Doesn't Feel Quite Right | 3 | Remove to permanently delete any 3 non-page cards from the deck or discard pile |

### 🌲 The End (Z4) Event Cards

| Card | Count | Effect |
|------|-------|--------|
| Amulet | 2 | Item (Abandoned Cars). Discard to teleport to any space on an adjacent map tile |
| Rolled-Up Newspaper | 2 | Move 1 zombie from your subtile to an opponent's subtile |
| Sickle | 2 | Item (Z4 named buildings). +1 to first combat roll per combat; also drives another dog off the space when used |
| Spear | 2 | Item (Z4 named buildings). +1 to all attack rolls permanently while in play |
| Talk to the Hand | 2 | Move one opponent on your map tile to any adjacent map tile of your choice |
| Tranquilizer Gun | 2 | Item (Z4 named buildings). Discard to defeat all zombie dogs on any one subtile |
| Bad Zombie, No Biscuit! | 3 | Move all zombies on your map tile to an adjacent tile. Cannot be used on Cabin or Helipad tiles |
| Dog Repellent | 3 | No zombie dogs may move closer to you until the end of your next turn |
| Fully Loaded | 3 | Match any one other player's current bullets and life tokens |
| Clair Warlock | 3 | Move an opponent to any woods tile adjacent to their current map tile |
| We're All Friends Here. | 2 | Take a BOTD page card staged by another player and place it in front of you; `onStage` fires again for the new owner |
| Lost in the Woods | 2 | Target opponent may not move off their current map tile until the end of their next turn |
| Magic Key | 2 | Item (Cave). Discard to look at an opponent's hand and take 1 card; discard down to 3 afterwards |
| Monkeys are Funny! | 2 | Move through wooded subtiles without fighting zombies; auto-discards when you enter a non-wooded subtile |
| Portal | 2 | Play on the Altar. Immediately swap positions with another player |
| That Didn't Just Happen!?! | 2 | Cancel any card just played by an opponent — clears pending effects and refunds their play slot |
| Full Moon Fever | 2 | Target opponent becomes a werewolf on their next turn. Both players roll d6 and may spend bullets; the loser moves to the Bridge |

### 🏬 Air Ducts (Mall Walkers)
- Certain mall store subtiles have air duct connections, shown as blue wave markers on the board
- When a player ends movement on a duct subtile, a panel appears offering to use the duct or stay
- Choosing a destination costs the player's next movement turn — the teleport fires when they click Roll Movement
- Destinations include any adjacent store tile (including diagonals) that also has a duct subtile
- If the destination is itself a duct space, the offer appears again next turn — allowing chaining across multiple stores at the cost of one turn each
- Zombies cannot use air ducts

### 💾 Save / Load
- 5 save slots stored in `localStorage` — no account or server required
- Accessible via the collapsible **Save / Load** panel in Game Controls
- Saves the full game state: board layout, all player stats, decks, zombies, tokens, event hand, and turn number
- On load, the setup UI (collection checkboxes, player count, deck preview) syncs to match the loaded game's configuration
- Saving is blocked while any pending action (combat choice, zombie placement, etc.) is in progress

**Export / Import** — each save slot has its own Export and Import buttons:
- **Export** downloads the slot's data as a timestamped `.json` file (e.g. `vc-zombies-slot1-2026-03-28T14-30-00.json`). Useful for backing up a game, sharing a save with another player, or attaching to a bug report.
- **Import** opens a file picker and loads a `.json` file into that slot. If the slot already has data you'll be asked to confirm the overwrite. After importing, press **Load** to start playing from that save.

### 🐛 Bug Reports
- A **Report a Bug** button in the top bar opens the bug report modal at any time
- Enter a title and optional description — game state and the last 20 log entries are attached automatically
- On submit, a GitHub Issue is created with the full save file embedded in a collapsible block
- After submission you can view the issue on GitHub or download the save file as a `.json` for local import

### 📱 Mobile UI

The game has a dedicated mobile layout (≤ 1080px) optimized for single-device and pass-and-play multiplayer.

**Tab bar (bottom of screen)**

| Tab | What it shows |
|-----|---------------|
| Controls | Game setup, player count, collection selection, online multiplayer |
| Map | Pannable/zoomable board in a bordered porthole viewport |
| Game Info | Map/event deck info, all player stats, log |
| Hand (N) | Current player's hand — N updates live with card count |

**Map tab — Turn Strip**

A collapsible accordion strip sits between the board and the tab bar with one row per turn phase. The active game step auto-opens and stays highlighted (colored step badge + warm left border) even when you manually expand a different step. Pending interactions (combat decision, zombie dice challenge, duct choice, etc.) override the highlight to show the correct step. Each accordion row contains the relevant action buttons and panels — Draw Tile, Combat, Events/choices, Movement (directions + duct choice), Move Zombies, and End Turn/Cabin Spell.

**Hand tab**

- The porthole map is shown at the top (~38% screen height) so you can see the board while reviewing your hand
- All Play / Stage / Select / Activate buttons work directly from the Hand tab — no need to switch to Map first
- If playing a card opens a pending interaction (event choice, zombie dice challenge, etc.), the app automatically switches to the Map tab and opens the relevant turn-strip step

**Board header player strip**

All players are shown as compact pills in the map header (name · ♥ hearts · ⬤ bullets). The current player's pill is highlighted in the accent color.

**Item chips on player cards**

Each player card in Game Info shows pill badges for every active item they hold, plus green badges for staged Book of the Dead pages.

**Pass-device lock screen (single-device multiplayer)**

When End Turn is clicked in a local multi-player game, a full-screen dark overlay appears — *"Pass device to [PlayerName]. Tap anywhere to start your turn."* Tapping dismisses it and switches to the Map tab so the next player lands on the board ready to go.

### 🃏 Deck Management
- **"Show cards"** dropdown in Map Deck Info and Event Deck Info panels lists every card in the remaining deck
- Cards in both panels support **drag-and-drop reordering** — grab any row and drop it to a new position to manually arrange the draw order

### 🏆 Win Conditions
- **Escape** — reach the center square of the Helipad tile
- **Last Stand** — accumulate 25 zombie kills
- **Cabin Spell** *(The End / Z4)* — perform the spell at the Cabin tile to win instantly:
  - You must be on a **building subtile** of the Cabin tile
  - All **zombie dogs** must be cleared from every building subtile of the Cabin
  - Roll a d6 — you need **6+** to succeed; each BotD page you have staged reduces the target by 1 (e.g. 3 pages → need 3+; minimum target is 1)
  - One attempt per turn; the **Cabin Spell** button appears in the End Turn phase when all conditions are met

---

## 🎮 Turn Order

Each turn follows this sequence:

| Step | Action |
|------|--------|
| 1 | **Draw & Place Tile** — reveal and place a new city block |
| 2 | **Combat Current Space** — fight any zombies sharing your space |
| 3 | **Draw to 3 Events** — top up your event hand |
| 4 | **Roll Movement** — roll and move with direction buttons; air duct offer appears if on a duct space |
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
├── LICENSE                           # MIT License
├── RULES_REFERENCE.md                # Official Zombies!!! rules & FAQ summary
├── vercel.json                       # Vercel deployment config
├── package.json                      # Node dependencies (mongodb)
├── api/
│   ├── _db.js                        # Shared MongoDB Atlas connection
│   ├── _helpers.js                   # CORS, error helpers, code generator
│   ├── _rateLimit.js                 # Per-IP rate limiting (Atlas-backed)
│   ├── games.js                      # POST /api/games — create session
│   ├── bug-report.js                 # POST /api/bug-report — create GitHub issue
│   └── games/[code]/
│       ├── index.js                  # GET poll + POST state push
│       ├── join.js                   # POST join session
│       ├── start.js                  # POST start game (host only)
│       └── leave.js                  # POST leave session
├── scripts/
│   ├── constants.js                  # Shared numeric constants (TILE_DIM, WIN_KILLS, etc.)
│   ├── core.js                       # State, collections, shared helpers
│   ├── bootstrap.js                  # Event listener wiring, game boot
│   ├── tile-debug.js                 # Tile editor page logic
│   ├── subtile-editor-row.js         # Subtile editor row renderer
│   ├── render/
│   │   ├── helpers.js                # Rendering utilities (formatTileCode, collection labels, road lines, air duct SVG)
│   │   ├── board.js                  # Board grid, player trail SVG, move status
│   │   ├── panels.js                 # Sidebar panels, combat UI, log, knockout banner, duct choice panel
│   │   ├── debug.js                  # Tile editor / map deck debug rendering
│   │   ├── render.js                 # Render orchestrator (updateButtons + render())
│   │   ├── save-load-panel.js        # Save/Load slot panel rendering
│   │   └── compass-checkboxes.js     # Compass direction checkbox helper (tile editor)
│   ├── actions/
│   │   ├── setup.js                  # Game setup, tile draw/place, companion tile logic
│   │   ├── combat.js                 # Combat resolution and knockout
│   │   ├── movement.js               # Player movement roll/step/end, air duct teleport
│   │   ├── zombies.js                # Zombie movement phase
│   │   ├── events.js                 # Event hand draw/play/discard, pending action handlers
│   │   ├── turn-end.js               # End-turn cleanup, multiplayer sync
│   │   ├── save-load.js              # Save/load/export/import game state
│   │   ├── multiplayer.js            # Online session create/join/start/leave/poll/sync
│   │   ├── bug-report.js             # Bug report modal, compression, API call
│   │   └── win.js                    # Win condition checks (helipad, kills, Cabin Spell)
│   ├── rules/
│   │   ├── placement.js              # Tile placement, connector validation, zone isolation
│   │   ├── combat-flow.js            # Combat/zombie-step skip gating
│   │   ├── movement.js               # Step legality, air duct destination finding
│   │   ├── zombie-ai.js              # Zombie targeting and one-step movement
│   │   └── board-bounds.js           # Dynamic board render bounds
│   └── data/
│       ├── map-tiles.js              # Tile definitions (roadTiles, namedTiles, specialTiles)
│       ├── map-deck.js               # buildMapDeck(), buildStartTile(), tile filtering/shuffling
│       ├── event-deck.js             # Event deck builder
│       └── event-cards/
│           ├── helpers.js            # Shared event utilities
│           ├── player-cards.js       # Player buff/recovery cards (Z1/Z2/Z3)
│           ├── player-cards-z35.js   # NOT_DEAD_YET player cards
│           ├── player-cards-z4.js    # THE_END (Z4) player cards
│           ├── opponent-cards.js     # Opponent disruption cards
│           ├── zombie-cards.js       # Zombie spawn/remove/move cards
│           └── page-cards.js         # Book of the Dead page cards (Z4)
└── styles/
    ├── base.css                      # Design tokens, CSS variables, global element defaults
    ├── layout.css                    # Page layout, panels, topbar
    ├── components.css                # Tiles, micro-grid, badges, markers, multiplayer UI, bug report modal
    └── tile-debug.css                # Tile editor specific styles
```

---

## 🛠️ Technical Details

- **Pure Vanilla JS** — no frameworks, no bundler, no build step
- **Global scope** — all files load via `<script>` tags in order; no ES modules
- **3×3 subtile grid** — each map tile has a 3×3 movement grid with walkability, walls, doors, and air ducts
- **In-page decisions** — combat choices, rotation, placement, and duct choices are all handled in the UI
- **Serverless backend** — Vercel functions handle multiplayer sessions and bug reports; MongoDB Atlas stores session state with TTL indexes for automatic cleanup

### Online Multiplayer Architecture

Multiplayer is polling-based — no WebSockets required:

- **Create** (`POST /api/games`) — generates a 4-character code and stores a session document in Atlas
- **Join** (`POST /api/games/[code]/join`) — adds a player slot; rejoining with the same device ID is always allowed regardless of session status
- **Start** (`POST /api/games/[code]/start`) — host-only; sets status to `"playing"` and activates the game
- **Sync** (`POST /api/games/[code]`) — current player pushes serialized game state after their turn ends; server validates it was actually that player's turn using the previous slot index
- **Poll** (`GET /api/games/[code]`) — all players poll every 1.5 seconds; state only applies when the composite `turnNumber:playerIndex:step` key changes
- **Leave** (`POST /api/games/[code]/leave`) — removes the player from the session

Rate limiting is enforced per IP (20 game creates / hour, 50 joins / hour) using a separate Atlas collection with a TTL index.

### Subtile Authoring

Tiles can define explicit 3×3 movement data via `subTilesTemplate`. Each key is `"x,y"` where x and y are `0..2`.

Supported per-subtile properties:

| Property | Description |
|----------|-------------|
| `walkable: true\|false` | Whether the subtile can be entered |
| `walls: ["N","E","S","W"]` | Directions that are always closed |
| `doors: ["N","E","S","W"]` | Directions that are always open |
| `type: "road"\|"building"\|...` | Visual and logic type |
| `airDucts: ["N","E","S","W"]` | Directions the air duct faces — enables duct teleportation from this subtile |
| `type: "wooded"` | Wooded area — targeted by The Trees Are Alive! and Monkeys are Funny! |
| `type: "cave"` | Cave interior — required to play the Magic Key item card |

**Example:**
```js
{
  name: "Corner Store",
  type: "named",
  collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
  connectors: ["N", "E"],
  zombieSpawnMode: "by_card",
  zombies: { [ZOMBIE_TYPE.REGULAR]: 2 },
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

Tiles and event cards belong to a collection, selected at game setup. Collections are defined in `COLLECTIONS` and `COLLECTION_META` in `core.js`. The setup panel UI, default game start, and all fallback logic derive from these automatically — adding a new collection only requires editing `core.js`.

Current collections:

| Key | Value | Description |
|-----|-------|-------------|
| `DIRECTORS_CUT` | `"directors_cut"` | Base game — can be played standalone |
| `ZOMBIE_CORPS_E_` | `"zombie_corps_e_"` | Standalone or expansion — playable alone or alongside Director's Cut; tiles form an isolated zone when mixed |
| `MALL_WALKERS` | `"mall_walkers"` | Standalone or expansion — mall-themed tiles with 2-floor mechanics, air ducts, and companion tile placement; includes Escalator and a mall Helipad |
| `NOT_DEAD_YET` | `"not_dead_yet"` | Event cards only — no map tiles; add to any game configuration |
| `THE_END` | `"the_end"` | Standalone or expansion — playable alone or alongside Director's Cut; bridge-themed zone with its own gateway tile |
| `IOWA_CITY` | `"iowa_city"` | Standalone or expansion — Iowa City themed locations; playable alone or alongside Director's Cut |

Map tile and event card collections are configured **independently** in the setup panel. Both use the same collection keys defined in `COLLECTION_META` in `core.js`. Deck builders are in `map-deck.js` (`buildMapDeck`) and `event-deck.js` (`buildEventDeck`).

Collections marked as **standalone decks** (`standaloneDeck: true` in `COLLECTION_META`) get their own separate tile deck. When mixed with a base collection, their tiles can only be placed adjacent to tiles from the same collection — the one exception is the **gateway tile** (e.g. Front Gate, Front Door, Bridge, Ped Mall), which has a `CONNECTOR_RULE.DISABLE_ON_SOLO` connector on its map-facing side. That side acts as an open (`ANY`) connector in mixed play, allowing it to connect to base-zone tiles. The gateway tile is shuffled into the base deck and unlocks the standalone deck when placed. When played solo (no base collection), the gateway tile is pre-placed at (0,0) at game start with any companion tiles (e.g. Front Gate → Straight → 4-Way), and the standalone deck is immediately available.

**Zone isolation in mixed play:** standalone-deck tiles cannot connect to the base zone except through the gateway tile's `DISABLE_ON_SOLO` connector side. Base tiles connect to the gateway tile's open map-facing side; further standalone tiles connect only to other standalone tiles via `SAME` connectors. Town Square uses `SAME` on all sides, so only Z1 tiles can attach directly to it.

| Property | Description |
|----------|-------------|
| `label` | Display name |
| `type` | Free-form display string (e.g. `"Base Game"`, `"Expansion"`, `"Standalone / Expansion"`) |
| `version` | Version string — integers and dot-notation (e.g. `2`, `0.1.0`) are prefixed with `v`; text values like `"2nd Edition"` are shown as-is |
| `year` | Release year |
| `description` | Short description shown in the setup tooltip |
| `creator` | Author or creator name |
| `requiresBase` | `null` if the collection can be played without any other collection; `COLLECTIONS.X` if it always requires a specific base |
| `standaloneDeck` | `true` if the collection's tiles form their own isolated deck and placement zone when active alongside a base collection |
| `compatibleWith` | Array of `COLLECTIONS.*` keys this collection can be mixed with in multi-deck play. If two collections without a shared `compatibleWith` are both enabled, Z1 (Director's Cut) is auto-enabled to bridge them. |

If a collection with `requiresBase` set is selected without its required base game, the map deck falls back to Director's Cut's Town Square (start tile) and Helipad (win tile). Event cards have no fallback — if no event collections are enabled you simply play with an empty event deck.

### Tile Properties

| Property | Description |
|----------|-------------|
| `name` | Display name |
| `type` | `"road"`, `"named"`, `"helipad"`, `"special"`, `"grass"`, `"mall hallway"`, `"mall store"`, `"escalator"` |
| `collection` | Object keyed by `COLLECTIONS.*` with per-collection copy counts, e.g. `{ [COLLECTIONS.DIRECTORS_CUT]: 2 }` |
| `connectors` | Array `["N","S"]` or object `{ N: CONNECTOR_RULE.ANY, S: CONNECTOR_RULE.SAME }` — road connection points with optional per-direction rules. Array format defaults all directions to `SAME`. |
| `connectors` — rule values | `ANY`: connect to any collection. `SAME`: same collection only (default). `DISABLE_ON_SOLO`: acts as `ANY` in mixed play; closed in solo play of own collection (gateway tiles). `ONLY`: connects only to the tile named in `connectorOnlyTarget`. |
| `zombieSpawnMode` | `"by_card"` uses `zombies` counts; `"by_exits"` spawns one per connector |
| `zombies` | Object keyed by zombie type with spawn counts, e.g. `{ [ZOMBIE_TYPE.REGULAR]: 2 }` |
| `hearts` | Heart tokens placed on the tile when drawn |
| `bullets` | Bullet tokens placed on the tile when drawn |
| `isStartTile` | `true` — tile placed at (0,0) to start the game; one per standalone collection |
| `isWinTile` | `true` — tile shuffled into the back half of the deck; reaching its center wins the game |
| `firstDrawWhenSolo` | `true` — tile is moved to position 0 in the shuffled deck when its collection is the only enabled collection. Ignored in mixed-collection games. |
| `companionTiles` | Array of `{ name }` objects — tiles pulled from the deck and auto-placed in a chain when this tile is drawn. e.g. `[{ name: "Straight" }, { name: "4-Way (mall)" }]` |
| `companionDir` | Which connector side companions chain from in the tile's unrotated orientation (default `"S"`). The opposite side is treated as the map-connection side. The engine auto-detects if the tile is placed reversed and flips the chain accordingly. |
| `connectorOnlyTarget` | Object mapping connector direction to a tile name, e.g. `{ S: "Helipad" }`. Required when a connector uses `CONNECTOR_RULE.ONLY`. |
| `floor1Connectors` | Connectors on this tile that belong to floor 1. Used by the Escalator tile to separate the two floor zones. |
| `floor2Connectors` | Connectors on this tile that lead to floor 2 after traversal. Companions placed via these connectors are treated as floor 2 tiles. |

---

## 📋 Rule Summary

- Players start at Town Square with 3 hearts and 3 bullets
- Before starting, choose which tile collections and event card collections to include independently — each collection has its own start tile (`isStartTile: true`); the active base collection determines which one is placed at (0,0)
- Tile placement requires connector alignment — roads must connect to roads
- Helipad is shuffled into the second half of the deck
- Zombies spawn on tiles when placed based on `zombieSpawnMode`
- Combat roll: d6 + attack bonus + temp bonus; kill threshold varies by zombie type (regular 4+, government-enhanced 5+)
- Failed combat options: spend bullet (+1), spend heart (reroll), use a weapon item, or accept loss
- Knockout: lose half kills (rounded down), respawn Town Square, reset stats
- Hearts are capped at 5
- One event card may be played per turn cycle; some cards have timing restrictions (e.g. Much Needed Rest must be played before rolling movement)
- **Book of the Dead pages** — staging a page uses your event play slot; only one page may be removed (used) per round; any number of pages may be staged in front of you at once
- Players may cross to any adjacent tile from any edge-facing walkable subtile — movement is gated by walls/doors only, not limited to road connectors
- Zombie movement is non-diagonal, one zombie per space; government-enhanced zombies move 2 spaces per slot; zombie dogs move 2 spaces and deal ½ heart damage on a hit
- Zombie auto-move plays out one zombie per tick (350 ms delay); spaces where zombies landed pulse red until the player ends their turn — a **Skip animation** button flushes the remaining moves instantly
- **Air Ducts (Mall Walkers):** landing on a duct space offers a choice to teleport to any adjacent store (including diagonals) with a duct subtile; using it costs your next movement roll; zombies cannot use ducts
- Win by reaching the **center square** of the Helipad, reaching 25 kills, or **performing the Cabin Spell** (Z4: clear all dogs from Cabin building, be on a building subtile, roll d6 ≥ 6 minus your staged BotD page count — once per turn)

---

## 📚 Rules Reference

A full summary of the official Zombies!!! rulebooks (base game through expansion 15), including official card rulings and FAQ answers from Twilight Creations, Inc., is available in [RULES_REFERENCE.md](RULES_REFERENCE.md).

---

## 🎲 Original Game

This project is a fan adaptation inspired by the physical board game series by **Twilight Creations, Inc.** If you enjoy this, consider supporting the original creators and picking up the physical version.

**[▶ Shop at Twilight Creations →](https://www.twilightcreationsinc.com/)**

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs via the in-game **Report a Bug** button or directly on GitHub Issues
- Suggest new named tiles or event cards
- Submit pull requests for rule clarifications or balance tweaks

## 📄 License

```
MIT License

Copyright (c) 2026 digable

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

Made with ❤️ for Iowa City
