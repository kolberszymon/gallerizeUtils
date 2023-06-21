import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

let client: MongoClient | null = null;

async function getMongoClient() {
  console.log(process.env.MONGODB_URI);
  console.log(process.env.MONGODB_DB_NAME);

  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI as string, {});
    await client.connect();
  }

  return client.db(process.env.MONGODB_DB_NAME);
}

export default getMongoClient;
