import * as fs from "fs";
import path from "path";
import { Item } from "../types/Item";

const dataFileName = "data.json";
const dataFilePath = path.resolve(__dirname, "..", "..", dataFileName);

export function parseJSONFile(filePath = dataFilePath): Item[] {
  const rawData = fs.readFileSync(filePath);
  const jsonData = JSON.parse(rawData.toString());
  const items: Item[] = [];

  for (const [key, value] of Object.entries(jsonData)) {
    const item: Item = {
      id: value["_id"],
      filename_prod: value["filename_prod"],
      filename_recog: value["filename_recog"],
      concept: value["concept"],
      iteration: value["iteration"],
      stim_url: value["stim_url"],
    };
    items.push(item);
  }

  return items;
}
