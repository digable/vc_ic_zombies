// POST /api/games — create a new multiplayer session
// Returns { code, hostId }

const { getDb } = require("./_db");
const { checkRateLimit } = require("./_rateLimit");
const { cors, getIp, send, err, generateCode } = require("./_helpers");
const { randomUUID } = require("crypto");

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return err(res, 405, "Method not allowed");

  const ip = getIp(req);

  try {
    const db = await getDb();

    await checkRateLimit(db, ip, "create_game", 20, 3600);

    // Max 10 active sessions per IP
    const activeSessions = await db.collection("sessions").countDocuments({
      createdByIp: ip,
      status: { $in: ["lobby", "playing"] }
    });
    if (activeSessions >= 10) {
      return err(res, 429, "Too many active sessions from this IP");
    }

    // Generate a unique code (retry up to 5 times on collision)
    let code;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const existing = await db.collection("sessions").findOne({ code: candidate });
      if (!existing) { code = candidate; break; }
    }
    if (!code) return err(res, 500, "Could not generate a unique game code — try again");

    const hostId = randomUUID();
    const now = new Date();

    await db.collection("sessions").insertOne({
      code,
      hostId,
      hostIp: ip,
      createdByIp: ip,
      status: "lobby",
      state: null,
      players: [],
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h TTL
    });

    return send(res, 201, { code, hostId });
  } catch (e) {
    if (e.status === 429) return err(res, 429, e.message, { retryAfter: e.retryAfter });
    console.error("POST /api/games", e);
    return err(res, 500, "Internal server error");
  }
};
