function buildMapDeck() {
  const roadTiles = [
    // Straight (N-S or E-W)
    {
      name: "Straight",
      type: "road",
      count: 4,
      enabled: true,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,1": { walkable: false },
        "0,2": { walkable: false },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false },
      }
    },
    // Corner (N-E, E-S, S-W, N-W) - only one needed, can rotate
    {
      name: "Corner",
      type: "road",
      count: 4,
      enabled: true,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, type: "road", walls: ["S", "W"] },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false },
      }
    },
    // T-Junction (N-E-W, N-E-S, E-S-W, N-S-W) - only one needed, can rotate
    {
      name: "T-Junction",
      type: "road",
      count: 4,
      enabled: true,
      connectors: ["N", "E", "W"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, type: "road", walls: ["S"] },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false },
      }
    },
    // 4-way (Parking Lot)
    {
      name: "Parking Lot",
      type: "road",
      count: 1,
      enabled: true,
      connectors: ["N", "S", "E", "W"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { walkable: true, type: "parking", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "parking", doors: ["N"] },
        "2,0": { walkable: true, type: "parking", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "parking", doors: ["W"] },
        "1,1": { walkable: true, type: "parking" },
        "2,1": { walkable: true, type: "parking", doors: ["E"] },
        "0,2": { walkable: true, type: "parking", walls: ["S", "W"] },
        "1,2": { walkable: true, type: "parking", doors: ["S"] },
        "2,2": { walkable: true, type: "parking", walls: ["S", "E"] }
      }
    }
  ];

  const namedTiles = [
    {
      name: "Army Surplus",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 0,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "1,1": { walkable: true, type: "road", walls: ["S"] },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Gas Station",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "1,1": { walkable: true, type: "road" },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "0,2": { walkable: false },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Police Station",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 2,
      bullets: 4,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "building", walls: ["S", "W"], doors: ["W"] },
        "1,1": { walkable: true, type: "building" },
        "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
        "0,2": { walkable: true, type: "parking", walls: ["N"] },
        "1,2": { walkable: true, type: "road" },
        "2,2": { walkable: true, type: "parking", walls: ["N"] }
      }
    },
    {
      name: "Hospital",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 8,
      hearts: 4,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "building", walls: ["W"] },
        "1,1": { walkable: true, type: "building", doors: ["S"] },
        "2,1": { walkable: true, type: "building", walls: ["E"] },
        "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
      }
    },
    {
      name: "Pharmacy",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 3,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "1,1": { walkable: true, type: "road", walls: ["S"] },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Fire Station",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 4,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "road", walls: ["N"], doors: ["W"] },
        "1,1": { walkable: true, type: "road", walls: ["E"] },
        "2,1": { walkable: true, type: "building", walls: ["E", "W"] },
        "0,2": { walkable: true, type: "parking" },
        "1,2": { walkable: true, type: "road", walls: ["E"] },
        "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
      }
    },
    {
      name: "Toy Store",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N", "S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
        "1,1": { walkable: true, type: "road", walls: ["N"] },
        "2,1": { walkable: true, type: "road", walls: ["N"] },
        "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Skate Shop",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 0,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "1,1": { walkable: true, type: "road" },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "0,2": { walkable: false },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Florist",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "1,1": { walkable: true, type: "road" },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "0,2": { walkable: false },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Sporting Goods Store",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 2,
      bullets: 4,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["N"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
        "1,1": { walkable: true, type: "building", doors: ["S"] },
        "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
        "0,2": { walkable: true, type: "parking", walls: ["N"] },
        "1,2": { walkable: true, type: "road" },
        "2,2": { walkable: true, type: "parking", walls: ["N"] }
      }
    },
    {
      name: "Lawn & Garden Store",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 2,
      bullets: 3,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "building", walls: ["W"] },
        "1,1": { walkable: true, type: "building", doors: ["S"] },
        "2,1": { walkable: true, type: "building", walls: ["E"] },
        "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
        "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
      }
    },
    {
      name: "Hardware Store",
      type: "named",
      count: 1,
      enabled: true,
      connectors: ["E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
        "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
        "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
        "1,1": { walkable: true, type: "road" },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
        "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
        "1,2": { walkable: true, type: "road" },
        "2,2": { walkable: false },
      }
    },

    // INFO: These are not in the main game
    {
      name: "Bank",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 0,
      bullets: 3,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "S"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Bar",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["S", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Courthouse",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["E", "W"] },
        "2,1": { walkable: false },
        "0,2": { walkable: false },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Hair Salon",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 0,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Supermarket",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 4,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Lighting Store",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 0,
      hearts: 0,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Church",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 1,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["E", "W"] },
        "2,1": { walkable: false },
        "0,2": { walkable: false },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Book Store",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["W", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 1,
      hearts: 0,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "S"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "Electronics Store",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["S", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "House A",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { walkable: false },
        "0,1": { walkable: false },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: false },
        "1,2": { walkable: false },
        "2,2": { walkable: false }
      }
    },
    {
      name: "House B",
      type: "named",
      count: 1,
      enabled: false,
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "E"] },
        "2,1": { walkable: false },
        "0,2": { walkable: false },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    }
  ];

  const expanded = [...roadTiles, ...namedTiles]
    .filter((t) => t.enabled !== false)
    .flatMap((t) => Array.from({ length: t.count || 1 }, () => ({ ...t })));

  const cards = expanded;

  const helipad = {
    name: "Helipad",
    type: "helipad",
    count: 1,
    enabled: true,
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
    zombieCount: 9,
    hearts: 0,
    bullets: 0,
    isHelipad: true,
    subTilesTemplate: {
      "0,0": { walkable: true },
      "1,0": { walkable: true },
      "2,0": { walkable: true },
      "0,1": { walkable: true },
      "1,1": { walkable: true },
      "2,1": { walkable: true },
      "0,2": { walkable: true },
      "1,2": { walkable: true },
      "2,2": { walkable: true }
    }
  };

  shuffle(cards);
  if (helipad.enabled !== false) cards.push(helipad);
  return cards;
}

function buildTownSquareTile() {
  return {
  name: "Town Square",
  type: "town",
  count: 1,
  enabled: true,
  isTownSquare: true,
  connectors: ["N", "E", "S", "W"],
  zombieSpawnMode: "by_card",
  zombieCount: 0,
  hearts: 0,
  bullets: 0,
  subTilesTemplate: {
    "0,0": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
    "1,0": { walkable: true, type: "road", walls: ["E", "W"] },
    "2,0": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
    "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
    "1,1": { walkable: true, type: "road" },
    "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
    "0,2": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
    "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
    "2,2": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] }
  }
};
}
