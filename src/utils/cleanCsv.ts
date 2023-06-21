/**
 * This script parses the kuschin csv file and returns an array of objects
 * when it comes to data structure filename is not unique
 * so we need to use id as a unique identifier
 *
 * It also filter provided images to check if they're blank
 */

import fs from "fs";
import csvParser from "csv-parser";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import { createObjectCsvWriter } from "csv-writer";

type CsvRow = {
  id: string;
  concept: string;
  filename: string;
  stim_url: string;
  sketch_id: string;
  display_count: number; // Used for randomization
  blank: boolean;
};

const DATA_FILE_NAME = "vab_production_meta.csv";
const DATA_FILE_PATH = path.resolve(__dirname, "..", "..", DATA_FILE_NAME);

const S3URL =
  "https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/";
const CHECK_IMAGES_FOR_BLANK = false;

const allowedConcepts = ["treadmill", "bag", "tarantula"];

export const parseCsv = (
  csvFilePath: string = DATA_FILE_PATH
): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    const conceptCount = {};

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (row: CsvRow) => {
        if (!conceptCount[row.concept]) {
          conceptCount[row.concept] = 0;
        } else {
          conceptCount[row.concept] += 1;
        }

        rows.push({
          ...row,
          concept: row.concept.replace(" ", "_"),
          //conceptCount: conceptCount[row.concept],
        });
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

export const filterByAllowedConcepts = (
  rows: CsvRow[],
  allowedConcepts: string[] | null,
  maxRowsInConcept?: number
): CsvRow[] => {
  if (maxRowsInConcept) {
    const itemsCount = {};

    return rows.filter((row) => {
      if (allowedConcepts && !allowedConcepts.includes(row.concept)) {
        return false;
      }

      if (!itemsCount[row.concept]) {
        itemsCount[row.concept] = 1;
      } else {
        itemsCount[row.concept] += 1;
      }

      if (itemsCount[row.concept] <= maxRowsInConcept) {
        return true;
      }
    });
  }

  return rows.filter((row) => allowedConcepts.includes(row.concept));
};

const downloadAndCheckImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Download the image using axios
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // Load the image buffer using sharp
    const image = sharp(imageBuffer);

    // Retrieve image metadata to get the image dimensions
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Create a blank white image with the same dimensions
    const blankImage = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    });

    // Compare the loaded image with the blank image
    const diffData = await image
      .raw()
      .resize(width, height)
      .toBuffer()
      .then((imgBuffer) =>
        blankImage
          .raw()
          .toBuffer()
          .then((blankBuffer) => Buffer.compare(imgBuffer, blankBuffer))
      );

    // If all pixels are the same (0 difference), the image is blank
    return diffData === 0;
  } catch (error) {
    console.error("Error downloading and checking image:", error);
    return false;
  }
};

export const formatCsvToProperScheme = async (
  rows: CsvRow[]
): Promise<[CsvRow[], string[]]> => {
  const uniqueConcepts = new Set<string>();
  const formattedRows = [];

  for (const row of rows) {
    const formattedRow = {
      id: row.sketch_id,
      concept: row.concept,
      filename: row.filename,
      stim_url: S3URL + row.sketch_id + ".png",
      display_count: 0,
      blank: false,
    };

    if (CHECK_IMAGES_FOR_BLANK) {
      const blank = await downloadAndCheckImage(formattedRow.stim_url);

      formattedRows.push({ ...formattedRow, blank });
    }

    uniqueConcepts.add(row.concept);

    formattedRows.push(formattedRow);
  }

  return [formattedRows, Array.from(uniqueConcepts)];
};

const inputCsvWriter = createObjectCsvWriter({
  path: "vab_production_formatted.csv",
  header: [
    { id: "id", title: "id" },
    { id: "concept", title: "concept" },
    { id: "filename", title: "filename" },
    { id: "stim_url", title: "stim_url" },
    { id: "sketch_id", title: "sketch_id" },
    { id: "display_count", title: "display_count" },
    { id: "blank", title: "blank" },
  ],
});

const conceptInfoCsvWriter = createObjectCsvWriter({
  path: "concept_info.csv",
  header: [
    { id: "concept_name", title: "concept_name" },
    { id: "display_count", title: "display_count" },
  ],
});

const main = async () => {
  const rows = await parseCsv();
  const [formattedRows, uniqueConcepts] = await formatCsvToProperScheme(rows);

  // Create input collection
  inputCsvWriter
    .writeRecords(formattedRows)
    .then(() => console.log("Input CSV file created successfully"))
    .catch((error) => console.error("Error creating input CSV file:", error));

  // Create concepts_info collection
  conceptInfoCsvWriter
    .writeRecords(
      uniqueConcepts.map((concept_name) => ({
        concept_name,
        display_count: 1,
      }))
    )
    .then(() => console.log("Unique Concepts CSV file created successfully"))
    .catch((error) =>
      console.error("Error creating Unique Concepts CSV file:", error)
    );
};

main();
