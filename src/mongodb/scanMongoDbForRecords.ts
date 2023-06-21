import getMongoClient from "./client";

const inputTable = "input";
const conceptTable = "concepts-info";

export default async function scanDynamoDbForRecords() {
  const db = await getMongoClient();

  const inputCollection = db.collection(inputTable);
  const conceptCollection = db.collection(conceptTable);

  const nonBlankFilter = { blank: { $ne: true } };

  const inputFields = { concept: 1, id: 1, stim_url: 1 };
  const inputResult = await inputCollection
    .find({})
    .project(inputFields)
    .toArray();

  const conceptsFields = { concept_name: 1, display_count: 1 };
  const conceptResult = await conceptCollection
    .find({})
    .project(conceptsFields)
    .toArray();
}

const main = async () => {
  scanDynamoDbForRecords();
};

main();
