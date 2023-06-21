import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Initialize env variables
const accessKeyId = process.env.ACCESS_KEY_AWS as string;
const secretAccessKey = process.env.SECRET_KEY_AWS as string;
const region = process.env.REGION_AWS as string;
const tableName = process.env.TABLE_NAME as string;

// Fetch all items with the given concept
async function getItemsByConcept(
  tableName: string,
  concept: string
): Promise<AWS.DynamoDB.DocumentClient.AttributeMap[]> {
  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: tableName,
    KeyConditionExpression: "concept = :concept",
    ExpressionAttributeValues: {
      ":concept": concept,
    },
  };

  const items: AWS.DynamoDB.DocumentClient.AttributeMap[] = [];

  let done = false;
  while (!done) {
    try {
      const response = await dynamoDB.query(params).promise();
      //@ts-ignore
      items.push(...response.Items);

      if (response.LastEvaluatedKey) {
        params.ExclusiveStartKey = response.LastEvaluatedKey;
      } else {
        done = true;
      }
    } catch (err) {
      console.error("Error querying items by concept:", err);
      done = true;
    }
  }

  return items;
}

// Randomly select x items from the given array
async function getRandomItems(
  concept: string,
  numItemsToSelect: number
): Promise<AWS.DynamoDB.DocumentClient.AttributeMap[]> {
  const items = await getItemsByConcept(tableName, concept);
  const selectedItems: AWS.DynamoDB.DocumentClient.AttributeMap[] = [];

  for (let i = 0; i < numItemsToSelect; i++) {
    const randomIndex = Math.floor(Math.random() * items.length);
    selectedItems.push(...items.splice(randomIndex, 1));
  }

  return selectedItems;
}

export default getRandomItems;
