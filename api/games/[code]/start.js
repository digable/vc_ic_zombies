// POST /api/games/:code/start  (host only)

const { getDb } = require("../../_db");
const { cors, getIp, send, err } = require("../../_helpers");

const MAX_STATE_BYTES = 200 * 1024;

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return err(res, 405, "Method not allowed");

  const code = String(req.query.code || "").toUpperCase();
  if (!code) return err(res, 400, "Missing game code");

  try {
    const db = await getDb();
    const { hostId, gameState } = req.body || {};
    if (!hostId) return err(res, 400, "hostId is required");
    if (!gameState) return err(res, 400, "gameState is required");

    const stateJson = JSON.stringify(gameState);
    if (Buffer.byteLength(stateJson) > MAX_STATE_BYTES) {
      return err(res, 413, "State payload too large");
    }

    const session = await db.collection("sessions").findOne({ code });
    if (!session) return err(res, 404, "Game not found");
    if (session.hostId !== hostId) return err(res, 403, "Not the host");
    if (session.status !== "lobby") return err(res, 409, "Game already started");
    if (session.players.length < 1) return err(res, 409, "Need at least 1 player to start");

    await db.collection("sessions").updateOne(
      { code },
      { $set: { status: "playing", state: gameState, lastActivityAt: new Date() } }
    );
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(`POST /api/games/${code}/start`, e);
    return err(res, 500, "Internal server error");
  }
};
