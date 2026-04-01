// Shared MongoDB connection — reused across warm serverless invocations
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI environment variable is not set");

let client;
let db;

async function getDb() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
  }
  db = client.db(); // database name comes from the URI path
  return db;
}

module.exports = { getDb };
