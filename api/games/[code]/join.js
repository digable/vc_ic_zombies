// POST /api/games/:code/join

const { getDb } = require("../../_db");
const { checkRateLimit } = require("../../_rateLimit");
const { cors, getIp, send, err } = require("../../_helpers");
const { randomUUID } = require("crypto");

const MAX_PLAYERS = 6;
const MAX_NAME_LEN = 32;

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return err(res, 405, "Method not allowed");

  const code = String(req.query.code || "").toUpperCase();
  if (!code) return err(res, 400, "Missing game code");
  const ip = getIp(req);

  try {
    const db = await getDb();
    await checkRateLimit(db, ip, "join", 50, 3600);

    const { displayName, deviceId } = req.body || {};
    if (!displayName || typeof displayName !== "string") {
      return err(res, 400, "displayName is required");
    }
    const name = displayName.trim().slice(0, MAX_NAME_LEN);
    if (!name) return err(res, 400, "displayName cannot be empty");

    const session = await db.collection("sessions").findOne({ code });
    if (!session) return err(res, 404, "Game not found");
    if (session.status === "done") return err(res, 409, "Game has ended");

    // Always allow rejoin by deviceId regardless of status
    const existingPlayer = session.players.find((p) => p.deviceId === deviceId);
    if (existingPlayer) {
      return send(res, 200, { playerId: existingPlayer.id, rejoined: true, status: session.status });
    }

    // New player — only allowed while in lobby
    if (session.status !== "lobby") return err(res, 409, "Game already started — ask the host to create a new game");
    if (session.players.length >= MAX_PLAYERS) return err(res, 409, "Lobby is full");

    const playerId = randomUUID();
    await db.collection("sessions").updateOne(
      { code },
      {
        $push: { players: { id: playerId, name, deviceId: deviceId || null } },
        $set: { lastActivityAt: new Date() }
      }
    );
    return send(res, 200, { playerId });
  } catch (e) {
    if (e.status === 429) return err(res, 429, e.message, { retryAfter: e.retryAfter });
    console.error(`POST /api/games/${code}/join`, e);
    return err(res, 500, "Internal server error");
  }
};
