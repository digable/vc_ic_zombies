// POST /api/games/:code/leave

const { getDb } = require("../../_db");
const { cors, send, err } = require("../../_helpers");

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return err(res, 405, "Method not allowed");

  const code = String(req.query.code || "").toUpperCase();
  if (!code) return err(res, 400, "Missing game code");

  try {
    const db = await getDb();
    const { playerId } = req.body || {};

    const session = await db.collection("sessions").findOne({ code });
    if (!session) return err(res, 404, "Game not found");

    if (session.status === "lobby") {
      await db.collection("sessions").updateOne(
        { code },
        {
          $pull: { players: { id: playerId } },
          $set: { lastActivityAt: new Date() }
        }
      );
      return send(res, 200, { ok: true });
    }

    if (session.status === "playing") {
      const slot = session.players.findIndex((p) => p.id === playerId);
      // Player not found — already removed or never in this game; no-op
      if (slot === -1) return send(res, 200, { ok: true });

      const leftEntry = { name: session.players[slot].name, slot };
      const newPlayers = session.players.filter((_, i) => i !== slot);

      // If no players remain, just end the session
      if (newPlayers.length === 0) {
        await db.collection("sessions").updateOne(
          { code },
          {
            $set: { status: "done", lastActivityAt: new Date() },
            $push: { leftLog: leftEntry }
          }
        );
        return send(res, 200, { ok: true });
      }

      // Splice the leaving player out of the stored game state
      let newState = session.state;
      if (newState && Array.isArray(newState.players)) {
        const origIndex = newState.currentPlayerIndex ?? 0;
        const updatedPlayers = newState.players.filter((_, i) => i !== slot);
        let updatedIndex = origIndex;
        let wasTheirTurn = false;

        if (slot === origIndex) {
          // It was the leaving player's turn — advance to the next player (wraps at end)
          updatedIndex = slot % updatedPlayers.length;
          wasTheirTurn = true;
        } else if (slot < origIndex) {
          // Leaver had a lower slot — current index shifts down by one
          updatedIndex = origIndex - 1;
        }
        // slot > origIndex — no adjustment needed

        newState = { ...newState, players: updatedPlayers, currentPlayerIndex: updatedIndex };

        if (wasTheirTurn) {
          // End the leaving player's turn cleanly — reset step and all mid-turn pending state
          // so the next player starts fresh instead of inheriting a half-finished turn.
          newState = {
            ...newState,
            step: "DRAW_TILE",
            movesRemaining: 0,
            currentMoveRoll: null,
            currentZombieRoll: null,
            selectedHandIndex: null,
            movementBonus: 0,
            moveFloorThisTurn: 0,
            doubleMovementThisTurn: false,
            playerTrail: [],
            lastCombatResult: null,
            lastPlayedEventCard: null,
            // Pending tile placement
            pendingTile: null,
            pendingRotation: 0,
            pendingTileOptions: [],
            pendingCompanionTiles: [],
            pendingTileDeck: "base",
            // Pending interactions / combat
            pendingCombatDecision: null,
            combatMoveResume: null,
            combatZombiePhaseResume: null,
            pendingEventChoice: null,
            pendingZombieReplace: null,
            pendingZombieDiceChallenge: null,
            pendingZombiePlace: null,
            pendingZombieMovement: null,
            pendingForcedMove: null,
            pendingBuildingSelect: null,
            pendingDynamiteTarget: null,
            pendingMinefield: null,
            pendingRocketLauncher: null,
            pendingZombieFlood: null,
            pendingBreakthrough: null,
            pendingSpaceSelect: null,
            pendingDuctChoice: null,
          };
        }
      }

      await db.collection("sessions").updateOne(
        { code },
        {
          $set: { players: newPlayers, state: newState, lastActivityAt: new Date() },
          $push: { leftLog: leftEntry }
        }
      );
      return send(res, 200, { ok: true });
    }

    // status === "done" — nothing to do
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(`POST /api/games/${code}/leave`, e);
    return err(res, 500, "Internal server error");
  }
};
