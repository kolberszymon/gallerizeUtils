import * as dotenv from "dotenv";
import * as AWS from "aws-sdk";
import { Item } from "../types/Item";
import {
  formatCsvToSketches,
  filterByAllowedConcepts,
  parseCsv,
} from "../utils/cleanCsv";

dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const region = process.env.AWS_REGION as string;
const sketchTableName = process.env.TABLE_NAME as string;
const conceptTableName = process.env.CONCEPT_TABLE_NAME as string;

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

async function saveItemToDynamoDB(
  tableName: string,
  data: Item
): Promise<boolean> {
  // Define the parameters for the item to be saved
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: data,
  };

  try {
    // Save the item to the DynamoDB table
    const result = await dynamoDB.put(params).promise();
    console.log("Item saved to DynamoDB:", result);
    return true;
  } catch (err) {
    console.error("Error saving item to DynamoDB:", err);
    return false;
  }
}

async function saveItemsToDynamoDB(
  tableName: string,
  data: any
): Promise<boolean> {
  // Define the parameters for the items to be saved
  const params: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
    RequestItems: {
      [tableName]: data.map((item) => ({
        PutRequest: {
          Item: item,
        },
      })),
    },
  };

  try {
    // Save the items to the DynamoDB table using batchWrite
    const result = await dynamoDB.batchWrite(params).promise();
    console.log("Items saved to DynamoDB:", result);
    return true;
  } catch (err) {
    console.error("Error saving items to DynamoDB:", err);
    return false;
  }
}

const main = async () => {
  const rows = await parseCsv();
  const filteredRows = filterByAllowedConcepts(rows, null, 25);
  const [formattedRows, uniqueConcepts] = await formatCsvToSketches(
    filteredRows
  );

  console.log("formattedRows length: ", formattedRows.length);

  const concepts = uniqueConcepts.map((concept) => {
    return {
      concept_name: concept,
      display_count: 1,
    };
  });

  console.log("concepts");
  console.log(concepts);

  let saveCounter = 0;
  let errorCounter = 0;

  let batch = [];

  // Upload sketches to DynamoDB

  // for (const item of formattedRows) {
  //   batch.push(item);

  //   if (batch.length === 25) {
  //     const result = await saveItemsToDynamoDB(sketchTableName, batch);
  //     if (result) {
  //       saveCounter += batch.length;
  //     } else {
  //       errorCounter += batch.length;
  //     }
  //     console.log(batch);
  //     batch = [];
  //   }
  // }

  // if (batch.length > 0) {
  //   const result = await saveItemsToDynamoDB(conceptTableName, batch);
  //   if (result) {
  //     saveCounter += batch.length;
  //   } else {
  //     errorCounter += batch.length;
  //   }
  //   batch = [];
  // }

  // Upload concepts to DynamoDB

  for (const concept of concepts) {
    batch.push(concept);

    if (batch.length === 25) {
      const result = await saveItemsToDynamoDB(conceptTableName, batch);
      if (result) {
        saveCounter += batch.length;
      } else {
        errorCounter += batch.length;
      }
      console.log(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    const result = await saveItemsToDynamoDB(conceptTableName, batch);
    if (result) {
      saveCounter += batch.length;
    } else {
      errorCounter += batch.length;
    }
    batch = [];
  }

  console.log("Saved items: ", saveCounter);
  console.log("Errors: ", errorCounter);
};

main();
