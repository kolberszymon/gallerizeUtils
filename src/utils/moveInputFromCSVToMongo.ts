import * as fs from "fs";
import csv from "csv-parser";
import { MongoClient } from "mongodb";
import path from "path";

const INPUT_CSV_NAME = "vab_production_formatted.csv";
const INPUT_CSV_PATH = path.resolve(__dirname, "..", "..", INPUT_CSV_NAME);

const CONCEPT_INFO_CSV_NAME = "concept_info.csv";
const CONCEPT_INFO_CSV_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  CONCEPT_INFO_CSV_NAME
);

const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "gallerize";
const INPUT_COLLECTION_NAME = "gallerize-vab128-input";
const CONCEPT_INFO_COLLECTION_NAME = "gallerize-vab128-concepts-info";

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
        if (!!data.blank) {
          records.push(data);
        }
      })
      .on("end", async () => {
        console.log("records");
        console.log(records);
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
        records.push(data);
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
