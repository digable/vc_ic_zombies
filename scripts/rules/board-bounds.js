function boardBounds() {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  state.board.forEach((_, k) => {
    const { x, y } = parseKey(k);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  if (minX === Infinity) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return {
    minX: minX - 1,
    maxX: maxX + 1,
    minY: minY - 1,
    maxY: maxY + 1
  };
}
