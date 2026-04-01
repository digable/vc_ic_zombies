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
    } else {
      await db.collection("sessions").updateOne(
        { code },
        { $set: { status: "done", lastActivityAt: new Date() } }
      );
    }
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(`POST /api/games/${code}/leave`, e);
    return err(res, 500, "Internal server error");
  }
};
