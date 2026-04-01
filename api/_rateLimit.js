// Per-IP rate limiting backed by MongoDB (rateLimits collection with TTL index).
// Call checkRateLimit(db, ip, action, max, windowSecs) — throws on limit exceeded.

async function checkRateLimit(db, ip, action, max, windowSecs) {
  const col = db.collection("rateLimits");
  const now = new Date();
  const windowStart = new Date(now - windowSecs * 1000);
  const docId = `${action}:${ip}`;

  // Upsert: push current timestamp into hits[], prune old ones in same op
  await col.updateOne(
    { _id: docId },
    {
      $push: { hits: { $each: [now], $slice: -200 } },
      $setOnInsert: { expiresAt: new Date(now.getTime() + windowSecs * 1000) }
    },
    { upsert: true }
  );

  // Re-fetch and count hits within the window
  const doc = await col.findOne({ _id: docId });
  const recent = (doc?.hits || []).filter((t) => new Date(t) > windowStart);

  if (recent.length > max) {
    const retryAfter = Math.ceil(windowSecs - (now - new Date(recent[0])) / 1000);
    const err = new Error("Too many requests");
    err.status = 429;
    err.retryAfter = Math.max(1, retryAfter);
    throw err;
  }
}

module.exports = { checkRateLimit };
