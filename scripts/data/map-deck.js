function buildMapDeck() {
  const roadTiles = [
    {
      name: "",
      type: "road",
      connectors: ["N", "S"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["E", "W"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["E", "W"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "S"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["E", "S"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["S", "W"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "E"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["N", "W"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["E", "S"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["N", "E", "W"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["S"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "",
      type: "road",
      connectors: ["N", "E", "S"],
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Parking Lot",
      type: "road",
      connectors: ["N", "S", "E", "W"],
      fullAccess: true,
      zombieSpawnMode: "by_exits",
      subTilesTemplate: {
        "0,0": { walkable: true, walls: ["N", "W"] },
        "1,0": { walkable: true, doors: ["N"] },
        "2,0": { walkable: true, walls: ["N", "E"] },
        "0,1": { walkable: true, doors: ["W"] },
        "1,1": { walkable: true },
        "2,1": { walkable: true, doors: ["E"] },
        "0,2": { walkable: true, walls: ["S", "W"] },
        "1,2": { walkable: true, doors: ["S"] },
        "2,2": { walkable: true, walls: ["S", "E"] }
      }
    }
  ];

  const namedTiles = [
    {
      name: "Army Surplus",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 0,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Gas Station",
      type: "named",
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "E"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Police Station",
      type: "named",
      connectors: ["W", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 2,
      bullets: 4,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "E"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Hospital",
      type: "named",
      connectors: ["N", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 8,
      hearts: 4,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["E", "S"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Pharmacy",
      type: "named",
      connectors: ["W", "N"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 3,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["E", "S"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Fire Station",
      type: "named",
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 4,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "E"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Toy Store",
      type: "named",
      connectors: ["N", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["E", "S"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Skate Shop",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 0,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Florist",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Sporting Goods Store",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 2,
      bullets: 4,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Lawn & Garden Store",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
      hearts: 2,
      bullets: 3,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },

    // INFO: These are not in the main game
    {
      name: "Bank",
      type: "named",
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 0,
      bullets: 3,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "S"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Bar",
      type: "named",
      connectors: ["S", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Courthouse",
      type: "named",
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["E", "W"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Hair Salon",
      type: "named",
      connectors: ["E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 0,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Supermarket",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 4,
      hearts: 1,
      bullets: 2,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Lighting Store",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 0,
      hearts: 0,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Church",
      type: "named",
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 1,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["E", "W"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Book Store",
      type: "named",
      connectors: ["W", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 1,
      hearts: 0,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "S"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "Electronics Store",
      type: "named",
      connectors: ["S", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["N", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    },
    {
      name: "House A",
      type: "named",
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { walkable: true, walls: ["E", "W"], doors: ["N"] },
        "2,0": { blocked: true },
        "0,1": { blocked: true },
        "1,1": { walkable: true, walls: ["S", "W"] },
        "2,1": { walkable: true, walls: ["N", "S"], doors: ["E"] },
        "0,2": { blocked: true },
        "1,2": { blocked: true },
        "2,2": { blocked: true }
      }
    },
    {
      name: "House B",
      type: "named",
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
      hearts: 1,
      bullets: 1,
      subTilesTemplate: {
        "0,0": { blocked: true },
        "1,0": { blocked: true },
        "2,0": { blocked: true },
        "0,1": { walkable: true, walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, walls: ["N", "E"] },
        "2,1": { blocked: true },
        "0,2": { blocked: true },
        "1,2": { walkable: true, walls: ["E", "W"], doors: ["S"] },
        "2,2": { blocked: true }
      }
    }
  ];

  const cards = [...roadTiles, ...namedTiles];

  const helipad = {
    name: "Helipad",
    type: "helipad",
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
  cards.push(helipad);
  return cards;
}

function buildTownSquareTile() {
  return {
    name: "Town Square",
    type: "town",
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
    zombieCount: 0,
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { blocked: true },
      "1,0": { walkable: true, walls: ["E", "W"] },
      "2,0": { blocked: true},
      "0,1": { walkable: true, walls: ["N", "S"] },
      "1,1": { walkable: true },
      "2,1": { walkable: true, walls: ["N", "S"] },
      "0,2": { blocked: true },
      "1,2": { walkable: true, walls: ["E", "W"] },
      "2,2": { blocked: true }
    }
  };
}
