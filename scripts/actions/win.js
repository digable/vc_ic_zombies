function checkWin(player) {
  const tile = getTileAtSpace(player.x, player.y);
  if (tile && tile.isHelipad) {
    state.gameOver = true;
    logLine(`${player.name} reached the Helipad and wins.`);
    return true;
  }

  if (player.kills >= 25) {
    state.gameOver = true;
    logLine(`${player.name} reached 25 kills and wins.`);
    return true;
  }

  return false;
}
