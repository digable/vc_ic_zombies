function buildMapDeck() {
  const roadTiles = [
    { name: "", type: "road", connectors: ["N", "S"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["E", "W"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["N", "E"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["E", "S"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["S", "W"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["N", "W"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["N", "E", "W"], zombieSpawnMode: "by_exits" },
    { name: "", type: "road", connectors: ["N", "E", "S"], zombieSpawnMode: "by_exits" },
    {
      name: "Parking Lot",
      type: "road",
      connectors: ["N", "S", "E", "W"],
      fullAccess: true,
      zombieSpawnMode: "by_exits"
    }
  ];

  const namedTiles = [
    { name: "Army Surplus", type: "named", connectors: ["N", "E"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 0, bullets: 2 },
    { name: "Gas Station", type: "named", connectors: ["S", "W"], zombieSpawnMode: "by_card", zombieCount: 3, hearts: 1, bullets: 2 },
    { name: "Police Station", type: "named", connectors: ["W", "S"], zombieSpawnMode: "by_card", zombieCount: 4, hearts: 0, bullets: 3 },
    { name: "Hospital", type: "named", connectors: ["N", "W"], zombieSpawnMode: "by_card", zombieCount: 3, hearts: 2, bullets: 1 },
    { name: "School", type: "named", connectors: ["N", "E"], zombieSpawnMode: "by_card", zombieCount: 4, hearts: 1, bullets: 1 },
    { name: "Bank", type: "named", connectors: ["E", "W"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 0, bullets: 3 },
    { name: "Bar", type: "named", connectors: ["S", "E"], zombieSpawnMode: "by_card", zombieCount: 3, hearts: 1, bullets: 1 },
    { name: "Courthouse", type: "named", connectors: ["N", "S"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 1, bullets: 2 },
    { name: "Hair Salon", type: "named", connectors: ["E", "S"], zombieSpawnMode: "by_card", zombieCount: 3, hearts: 0, bullets: 1 },
    { name: "Supermarket", type: "named", connectors: ["N", "E"], zombieSpawnMode: "by_card", zombieCount: 4, hearts: 1, bullets: 2 },
    { name: "Pharmacy", type: "named", connectors: ["W", "N"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 2, bullets: 1 },
    { name: "Fire Station", type: "named", connectors: ["S", "W"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 1, bullets: 2 },
    { name: "Lighting Store", type: "named", connectors: ["N", "E"], zombieSpawnMode: "by_card", zombieCount: 0, hearts: 0, bullets: 0 },
    { name: "Church", type: "named", connectors: ["N", "S"], zombieSpawnMode: "by_card", zombieCount: 1, hearts: 1, bullets: 1 },
    { name: "Book Store", type: "named", connectors: ["W", "E"], zombieSpawnMode: "by_card", zombieCount: 1, hearts: 0, bullets: 1 },
    { name: "Toy Store", type: "named", connectors: ["N", "W"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 0, bullets: 1 },
    { name: "Electronics Store", type: "named", connectors: ["S", "E"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 1, bullets: 1 },
    { name: "House A", type: "named", connectors: ["N", "E"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 1, bullets: 1 },
    { name: "House B", type: "named", connectors: ["S", "W"], zombieSpawnMode: "by_card", zombieCount: 2, hearts: 1, bullets: 1 }
  ];

  const cards = [
    ...roadTiles.map((t) => structuredClone(t)),
    ...namedTiles.map((t) => structuredClone(t))
  ];

  const helipad = {
    name: "Helipad",
    type: "helipad",
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
    zombieCount: 1,
    hearts: 0,
    bullets: 0,
    isHelipad: true
  };

  shuffle(cards);
  cards.push(helipad);
  return cards;
}
