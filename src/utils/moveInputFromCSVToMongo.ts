import * as dotenv from "dotenv";
import * as fs from "fs";
import csv from "csv-parser";
import { MongoClient } from "mongodb";
import path from "path";
import { Item } from "Item";

dotenv.config();

const INPUT_CSV_NAME = "vab_production_formatted.csv";
const INPUT_CSV_PATH = path.resolve(__dirname, "..", "..", INPUT_CSV_NAME);

const CONCEPT_INFO_CSV_NAME = "concept_info.csv";
const CONCEPT_INFO_CSV_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  CONCEPT_INFO_CSV_NAME
);

const MONGO_URL = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME;
const INPUT_COLLECTION_NAME = process.env.MONGODB_INPUT_COLLECTION_NAME;
const CONCEPT_INFO_COLLECTION_NAME =
  process.env.MONGODB_CONCEPT_INFO_COLLECTION_NAME;

async function saveInputCSVToMongoDB(): Promise<void> {
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(INPUT_COLLECTION_NAME);

    // Read the CSV file and insert the records to MongoDB
    const records = [];
    fs.createReadStream(INPUT_CSV_PATH, "utf-8")
      .pipe(csv())
      .on("data", (data) => {
        const item: Item = {
          id: data.id,
          concept: data.concept,
          filename: data.filename,
          sketchId: data.sketchId,
          stim_url: data.stim_url,
          display_count: Number(data.display_count),
          blank: data.blank.toLowerCase() === "true",
        };

        records.push(item);
      })
      .on("end", async () => {
        await collection.insertMany(records);
        console.log("CSV data saved to MongoDB successfully");
        client.close();
      });
  } catch (error) {
    console.error("Error saving CSV data to MongoDB:", error);
  }
}

async function saveConceptInfoCsvToMongoDB(): Promise<void> {
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(CONCEPT_INFO_COLLECTION_NAME);

    // Read the CSV file and insert the records to MongoDB
    const records = [];
    fs.createReadStream(CONCEPT_INFO_CSV_PATH, "utf-8")
      .pipe(csv())
      .on("data", (data) => {
        const conceptInfo: { concept_name: string; display_count: number } = {
          concept_name: data.concept_name,
          display_count: Number(data.display_count),
        };

        records.push(conceptInfo);
      })
      .on("end", async () => {
        await collection.insertMany(records);
        console.log("CSV data saved to MongoDB successfully");
        client.close();
      });
  } catch (error) {
    console.error("Error saving CSV data to MongoDB:", error);
  }
}

const main = async () => {
  saveInputCSVToMongoDB();
  saveConceptInfoCsvToMongoDB();
};

main();
