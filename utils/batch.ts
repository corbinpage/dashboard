import { removeEmptyValues } from "./parseAttributes";
import { Json, NFTMetadataInput } from "@thirdweb-dev/sdk";
import { useMemo } from "react";

export interface CSVData extends Record<string, string | undefined> {
  name: string;
  description?: string;
  external_url?: string;
  background_color?: string;
  youtube_url?: string;
}

export const csvMimeTypes = [
  "text/csv",
  "text/plain",
  "text/x-csv",
  "application/vnd.ms-excel",
  "application/csv",
  "application/x-csv",
  "text/comma-separated-values",
  "text/x-comma-separated-values",
  "text/tab-separated-values",
];

export const jsonMimeTypes = [
  "application/json",
  "application/x-json",
  "application/ld+json",
  "application/json-ld",
  "application/x-json-ld",
];

export const transformHeader = (h: string) => {
  const headersToTransform = [
    "name",
    "description",
    "image",
    "animation_url",
    "external_url",
    "background_color",
    "youtube_url",
  ];

  if (headersToTransform.includes(h.trim().toLowerCase())) {
    return h.trim().toLowerCase();
  }
  return h.trim();
};

function removeSpecialCharacters(str: string) {
  return str.replace(/[^a-zA-Z0-9 ]/g, "");
}

function sortAscending(a: File, b: File) {
  return (
    parseInt(removeSpecialCharacters(a.name)) -
    parseInt(removeSpecialCharacters(b.name))
  );
}

export const getAcceptedFiles = async (acceptedFiles: File[]) => {
  const jsonFiles = acceptedFiles
    .filter((f) => jsonMimeTypes.includes(f.type) || f.name.endsWith(".json"))
    .sort(sortAscending);

  let json: Json[] = [];

  for (const f of jsonFiles) {
    const text = await f.text();
    // can be either a single json object or an array of json objects
    const parsed: Json | Json[] = JSON.parse(text);
    // just concat it always (even if it's a single object
    // this will add the object to the end of the array or append the array to the end of the array)
    json = json.concat(parsed);
  }

  const csv = acceptedFiles.find(
    (f) => csvMimeTypes.includes(f.type) || f.name.endsWith(".csv"),
  );
  const images = acceptedFiles
    .filter((f) => f.type.includes("image/"))
    .sort(sortAscending);
  const videos = acceptedFiles
    .filter(
      (f) =>
        f.type.includes("video/") ||
        f.type.includes("audio") ||
        f.type.includes("model") ||
        f.type.includes("pdf") ||
        f.type.includes("text") ||
        f.name.endsWith(".glb") ||
        f.name.endsWith(".usdz"),
    )
    .filter((f) => f.name !== csv?.name)
    .sort(sortAscending);

  return { csv, json, images, videos };
};

export const removeEmptyKeysFromObject = (obj: any) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === "" || obj[key] === null || obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

export const convertToOsStandard = (obj: NFTMetadataInput["attributes"]) => {
  const attributes = Object.entries(obj || {}).map(([trait_type, value]) => ({
    trait_type,
    value,
  }));

  return removeEmptyValues(attributes);
};

export const useMergedData = (
  csvData: Papa.ParseResult<CSVData> | undefined,
  jsonData: any,
  imageFiles: File[],
  videoFiles: File[],
) => {
  return useMemo(() => {
    if (csvData?.data) {
      return csvData.data.map((row, index) => {
        const {
          name,
          description,
          image,
          animation_url,
          external_url,
          background_color,
          youtube_url,
          ...properties
        } = row;

        return removeEmptyKeysFromObject({
          name: name.toString(),
          description: description?.toString(),
          external_url,
          background_color,
          youtube_url,
          attributes: convertToOsStandard(
            removeEmptyKeysFromObject(properties),
          ),
          image:
            imageFiles.find((img) => img.name === image) ||
            imageFiles[index] ||
            image ||
            undefined,
          animation_url:
            videoFiles.find((video) => video.name === animation_url) ||
            videoFiles[index] ||
            animation_url ||
            undefined,
        });
      });
    } else if (Array.isArray(jsonData)) {
      return jsonData.map((nft: any, index: number) => ({
        ...nft,
        image:
          imageFiles.find((img) => img.name === nft.image) ||
          imageFiles[index] ||
          nft.image ||
          nft.file_url ||
          undefined,
        animation_url:
          videoFiles.find((video) => video.name === nft.animation_url) ||
          videoFiles[index] ||
          nft.animation_url ||
          undefined,
      }));
    } else {
      return [];
    }
  }, [csvData, jsonData, imageFiles, videoFiles]);
};

export const shuffleData = (array: NFTMetadataInput[]) =>
  array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
