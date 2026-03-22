function checkWin(player) {
  const tile = getTileAtSpace(player.x, player.y);
  if (tile && tile.isWinTile) {
    const tx = spaceToTileCoord(player.x);
    const ty = spaceToTileCoord(player.y);
    const lx = getLocalCoord(player.x, tx);
    const ly = getLocalCoord(player.y, ty);
    if (lx === 1 && ly === 1) {
      state.gameOver = true;
      logLine(`${player.name} reached the center of the Helipad and wins!`);
      return true;
    }
  }

  if (player.kills >= WIN_KILLS) {
    state.gameOver = true;
    logLine(`${player.name} reached ${WIN_KILLS} kills and wins.`);
    return true;
  }

  return false;
}
