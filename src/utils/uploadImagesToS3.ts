import * as dotenv from "dotenv";
import * as AWS from "aws-sdk";
import * as fs from "fs-extra";
import * as path from "path";
import { Item } from "../types/Item";

dotenv.config();

// Initialize env variables
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const region = process.env.AWS_REGION as string;
const bucketName = process.env.S3_BUCKET_NAME as string;

// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const parentDirPath = path.resolve(__dirname, "..", "..", "images");

// Create S3 client object
const s3 = new AWS.S3();

// Define the S3 bucket and base key where the files will be uploaded
const baseKey = "images/";

// Read the directories in the parent directory
const subDirs = fs
  .readdirSync(parentDirPath, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const uploadToS3 = async () => {
  for (const subDir of subDirs) {
    // Define the prefix to use for the S3 object keys
    const prefix = baseKey + subDir + "/";

    // Read the files in the subdirectory
    const files = fs
      .readdirSync(path.join(parentDirPath, subDir))
      .filter((filename) => filename.endsWith(".png"));

    console.log(files);

    // Iterate over each file in the subdirectory and upload it to S3
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const key =
        prefix + subDir + "_" + (i + 1).toString().padStart(2, "0") + ".png";
      const filePath = path.join(parentDirPath, subDir, file);
      const fileData = await fs.readFile(filePath);

      // Set the S3 object params and upload the file
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileData,
        ContentType: "image/png",
      };
      await s3.upload(params).promise();

      console.log(`Uploaded ${file} to ${key}`);
    }
  }
};

// Uncomment this to upload images to S3
// uploadToS3();

export async function getS3ObjectUrls(bucketName: string): Promise<string[]> {
  // List all objects in the bucket
  const objects = await s3.listObjectsV2({ Bucket: bucketName }).promise();

  // Generate URLs for each object
  const objectUrls = objects.Contents?.map((object) => {
    const objectKey = object.Key;
    return s3.getSignedUrl("getObject", { Bucket: bucketName, Key: objectKey });
  });

  // Filter out undefined values and return the URLs
  return (
    objectUrls
      ?.filter((url) => url !== undefined)
      .map((url) => url.split("?")[0]) || []
  );
}

export async function createItemsFromS3(): Promise<Item[]> {
  const urls = await getS3ObjectUrls(bucketName);

  const items: Item[] = urls.map((url) => {
    const imageName = url.split("/").pop();
    const filename = imageName?.split(".")[0];
    const concept = filename?.split("_")[0];

    return {
      id: filename,
      filename_prod: filename,
      filename_recog: filename,
      concept,
      iteration: "pilot_0",
      stim_url: url,
    };
  });

  return items;
}

// const main = async () => {
//   const urls = await getS3ObjectUrls(bucketName);
//   console.log(urls);
// };
