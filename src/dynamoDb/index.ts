import * as dotenv from "dotenv";
import * as AWS from "aws-sdk";
import { Item } from "../types/Item";
import { parseJSONFile } from "../utils/parseJson";
import { createItemsFromS3 } from "../utils/uploadImagesToS3";
import { getFormattedCsv } from "../utils/cleanCsv";

dotenv.config();

// Initialize env variables
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const region = process.env.AWS_REGION as string;
const tableName = process.env.TABLE_NAME as string;

// console.log(accessKeyId, secretAccessKey, region, tableName);

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

async function saveItemToDynamoDB(
  tableName: string,
  data: Item
): Promise<void> {
  // Define the parameters for the item to be saved
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: data,
  };

  console.log(params);

  try {
    // Save the item to the DynamoDB table
    const result = await dynamoDB.put(params).promise();
    console.log("Item saved to DynamoDB:", result);
  } catch (err) {
    console.error("Error saving item to DynamoDB:", err);
  }
}

async function fetchUniqueConceptKeyFromDynamoDb() {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: tableName,
    ProjectionExpression: "concept",
  };

  try {
    const result = await dynamoDB.scan(params).promise();

    // count items in every concept
    const conceptCount = result.Items?.reduce((acc: any, item: any) => {
      const concept = item.concept;
      if (acc[concept]) {
        acc[concept] += 1;
      } else {
        acc[concept] = 1;
      }
      return acc;
    }, {});

    // // Convert the object into an array of key-value pairs
    // const unsortedArray = Object.entries(conceptCount);

    // // Sort the array by the value of each element in descending order
    // const sortedArray = unsortedArray.sort((a: any, b: any) => b[1] - a[1]);

    // // Convert the sorted array back into an object
    // const sortedConceptCount = Object.fromEntries(sortedArray);

    console.log(conceptCount);
  } catch (err) {
    console.error("Error saving item to DynamoDB:", err);
  }
}

// For creating items from S3 and saving it

// const main = async () => {
//   const items = await createItemsFromS3();

//   for (const item of items) {
//     await saveItemToDynamoDB(tableName, item);
//   }
// };

// main();

// For saving items that already exist in S3

const main = async () => {
  const items = await getFormattedCsv();

  console.log("items");
  console.log(items);

  // for (const item of items) {
  //   await saveItemToDynamoDB(tableName, item);
  // }
};

main();

// For fetching unique concepts

// const main = async () => {
//   await fetchUniqueConceptKeyFromDynamoDb();
// };

// main();
