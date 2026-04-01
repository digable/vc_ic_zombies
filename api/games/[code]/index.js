// GET  /api/games/:code  — poll session (state + players + status)
// POST /api/games/:code  — push updated game state (active player only)

const { getDb } = require("../../_db");
const { checkRateLimit } = require("../../_rateLimit");
const { cors, getIp, send, err } = require("../../_helpers");

const MAX_STATE_BYTES = 200 * 1024;

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const code = String(req.query.code || "").toUpperCase();
  if (!code) return err(res, 400, "Missing game code");
  const ip = getIp(req);

  try {
    const db = await getDb();
    const sessions = db.collection("sessions");

    // -------------------------------------------------------------------------
    // GET — poll
    // -------------------------------------------------------------------------
    if (req.method === "GET") {
      await checkRateLimit(db, ip, "poll", 120, 60);

      const session = await sessions.findOne(
        { code },
        { projection: { hostId: 0, hostIp: 0, createdByIp: 0 } }
      );
      if (!session) return err(res, 404, "Game not found");
      return send(res, 200, session);
    }

    if (req.method !== "POST") return err(res, 405, "Method not allowed");

    // -------------------------------------------------------------------------
    // POST — push state (active player only)
    // -------------------------------------------------------------------------
    await checkRateLimit(db, ip, "push_state", 60, 60);

    const { playerId, gameState } = req.body || {};
    if (!playerId) return err(res, 400, "playerId is required");
    if (!gameState) return err(res, 400, "gameState is required");

    const stateJson = JSON.stringify(gameState);
    if (Buffer.byteLength(stateJson) > MAX_STATE_BYTES) {
      return err(res, 413, "State payload too large");
    }

    const session = await sessions.findOne({ code });
    if (!session) return err(res, 404, "Game not found");
    if (session.status !== "playing") return err(res, 409, "Game is not in progress");

    const playerInSession = session.players.find((p) => p.id === playerId);
    if (!playerInSession) return err(res, 403, "Player not in this session");

    const playerSlot = session.players.findIndex((p) => p.id === playerId);
    const n = session.players.length;
    // After endTurn the index is already advanced to the next player.
    // Valid if: this player just finished their turn (previous slot) OR
    // they took an extra turn (index unchanged — same slot).
    const prevSlot = (gameState.currentPlayerIndex - 1 + n) % n;
    if (playerSlot !== prevSlot && playerSlot !== gameState.currentPlayerIndex) {
      return err(res, 403, "Not your turn");
    }

    await sessions.updateOne(
      { code },
      { $set: { state: gameState, lastActivityAt: new Date() } }
    );
    return send(res, 200, { ok: true });

  } catch (e) {
    if (e.status === 429) return err(res, 429, e.message, { retryAfter: e.retryAfter });
    console.error(`/api/games/${code}`, e);
    return err(res, 500, "Internal server error");
  }
};
