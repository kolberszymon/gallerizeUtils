import * as AWS from "aws-sdk";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Initialize env variables
const accessKeyId = process.env.ACCESS_KEY_AWS as string;
const secretAccessKey = process.env.SECRET_KEY_AWS as string;
const region = process.env.REGION_AWS as string;

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

const trialsTable = "gallerize-output";

const saveObjectAsJson = (obj: object, filePath: string): void => {
  const jsonData = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, jsonData, "utf-8");
};

async function scanDynamoDbForTrials(): Promise<any> {
  const trialsParams: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: trialsTable,
    ProjectionExpression: "userId, trials",
  };

  try {
    const trialsResults = await dynamoDb.scan(trialsParams).promise();

    saveObjectAsJson(trialsResults.Items, "trials.json");

    return [];
  } catch (err) {
    console.error("Error saving item to DynamoDB:", err);
    return [[], []];
  }
}

const main = async () => {
  await scanDynamoDbForTrials();
};

main();
