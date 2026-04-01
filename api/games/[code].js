// GET  /api/games/:code        — poll session (state + players + status)
// POST /api/games/:code        — push updated game state (active player only)
// POST /api/games/:code/join   — join lobby
// POST /api/games/:code/start  — host starts the game
// POST /api/games/:code/leave  — leave session

const { getDb } = require("../_db");
const { checkRateLimit } = require("../_rateLimit");
const { cors, getIp, send, err } = require("../_helpers");
const { randomUUID } = require("crypto");

const MAX_STATE_BYTES = 200 * 1024; // 200 KB
const MAX_PLAYERS = 6;
const MAX_NAME_LEN = 32;

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const { code, action } = req.query; // action = join | start | leave (or undefined)
  if (!code) return err(res, 400, "Missing game code");
  const upperCode = String(code).toUpperCase();
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
        { code: upperCode },
        { projection: { hostId: 0, hostIp: 0, createdByIp: 0 } }
      );
      if (!session) return err(res, 404, "Game not found");
      return send(res, 200, session);
    }

    if (req.method !== "POST") return err(res, 405, "Method not allowed");

    // -------------------------------------------------------------------------
    // POST /api/games/:code/join
    // -------------------------------------------------------------------------
    if (action === "join") {
      await checkRateLimit(db, ip, "join", 10, 3600);

      const { displayName, deviceId } = req.body || {};
      if (!displayName || typeof displayName !== "string") {
        return err(res, 400, "displayName is required");
      }
      const name = displayName.trim().slice(0, MAX_NAME_LEN);
      if (!name) return err(res, 400, "displayName cannot be empty");

      const session = await sessions.findOne({ code: upperCode });
      if (!session) return err(res, 404, "Game not found");
      if (session.status !== "lobby") return err(res, 409, "Game already started");
      if (session.players.length >= MAX_PLAYERS) return err(res, 409, "Lobby is full");

      // Prevent duplicate deviceId rejoins creating a second entry
      const existingPlayer = session.players.find((p) => p.deviceId === deviceId);
      if (existingPlayer) {
        return send(res, 200, { playerId: existingPlayer.id, rejoined: true });
      }

      const playerId = randomUUID();
      await sessions.updateOne(
        { code: upperCode },
        {
          $push: { players: { id: playerId, name, deviceId: deviceId || null } },
          $set: { lastActivityAt: new Date() }
        }
      );
      return send(res, 200, { playerId });
    }

    // -------------------------------------------------------------------------
    // POST /api/games/:code/start
    // -------------------------------------------------------------------------
    if (action === "start") {
      const { hostId, gameState } = req.body || {};
      if (!hostId) return err(res, 400, "hostId is required");

      const session = await sessions.findOne({ code: upperCode });
      if (!session) return err(res, 404, "Game not found");
      if (session.hostId !== hostId) return err(res, 403, "Not the host");
      if (session.status !== "lobby") return err(res, 409, "Game already started");
      if (session.players.length < 1) return err(res, 409, "Need at least 1 player to start");

      const stateJson = JSON.stringify(gameState);
      if (Buffer.byteLength(stateJson) > MAX_STATE_BYTES) {
        return err(res, 413, "State payload too large");
      }

      await sessions.updateOne(
        { code: upperCode },
        { $set: { status: "playing", state: gameState, lastActivityAt: new Date() } }
      );
      return send(res, 200, { ok: true });
    }

    // -------------------------------------------------------------------------
    // POST /api/games/:code/leave
    // -------------------------------------------------------------------------
    if (action === "leave") {
      const { playerId } = req.body || {};

      const session = await sessions.findOne({ code: upperCode });
      if (!session) return err(res, 404, "Game not found");

      if (session.status === "lobby") {
        // Remove from lobby
        await sessions.updateOne(
          { code: upperCode },
          {
            $pull: { players: { id: playerId } },
            $set: { lastActivityAt: new Date() }
          }
        );
      } else {
        // Mid-game leave ends the session
        await sessions.updateOne(
          { code: upperCode },
          { $set: { status: "done", lastActivityAt: new Date() } }
        );
      }
      return send(res, 200, { ok: true });
    }

    // -------------------------------------------------------------------------
    // POST /api/games/:code — push state (active player only)
    // -------------------------------------------------------------------------
    await checkRateLimit(db, ip, "push_state", 60, 60);

    const { playerId, gameState } = req.body || {};
    if (!playerId) return err(res, 400, "playerId is required");
    if (!gameState) return err(res, 400, "gameState is required");

    const stateJson = JSON.stringify(gameState);
    if (Buffer.byteLength(stateJson) > MAX_STATE_BYTES) {
      return err(res, 413, "State payload too large");
    }

    const session = await sessions.findOne({ code: upperCode });
    if (!session) return err(res, 404, "Game not found");
    if (session.status !== "playing") return err(res, 409, "Game is not in progress");

    const playerInSession = session.players.find((p) => p.id === playerId);
    if (!playerInSession) return err(res, 403, "Player not in this session");

    // Validate it's this player's turn (gameState.currentPlayerIndex matches their slot)
    const playerSlot = session.players.findIndex((p) => p.id === playerId);
    if (gameState.currentPlayerIndex !== playerSlot) {
      return err(res, 403, "Not your turn");
    }

    await sessions.updateOne(
      { code: upperCode },
      { $set: { state: gameState, lastActivityAt: new Date() } }
    );
    return send(res, 200, { ok: true });

  } catch (e) {
    if (e.status === 429) return err(res, 429, e.message, { retryAfter: e.retryAfter });
    console.error(`/api/games/${code}`, e);
    return err(res, 500, "Internal server error");
  }
};
