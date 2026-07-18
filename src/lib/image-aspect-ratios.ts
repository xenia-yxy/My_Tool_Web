export type ImageAspectRatioPreset =
  | "square"
  | "portrait"
  | "landscape"
  | "1:1"
  | "3:4"
  | "4:3"
  | "9:16"
  | "16:9"
  | "xiaohongshu";

export const IMAGE_ASPECT_RATIO_OPTIONS: Array<[ImageAspectRatioPreset, string]> = [
  ["3:4", "小红书 3:4"],
  ["9:16", "短视频 9:16"],
  ["16:9", "横版 16:9"],
  ["4:3", "商品横图 4:3"],
  ["1:1", "方图 1:1"],
  ["portrait", "竖图 2:3"],
  ["landscape", "横图 3:2"],
];

export function getImageAspectClass(value: string) {
  return {
    "1:1": "aspect-square",
    "3:4": "aspect-[3/4]",
    "4:3": "aspect-[4/3]",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-video",
    landscape: "aspect-[3/2]",
    portrait: "aspect-[2/3]",
    square: "aspect-square",
    xiaohongshu: "aspect-[3/4]",
  }[value] || "aspect-square";
}

export function isImageAspectRatioPreset(value: unknown): value is ImageAspectRatioPreset {
  return [
    "square",
    "portrait",
    "landscape",
    "1:1",
    "3:4",
    "4:3",
    "9:16",
    "16:9",
    "xiaohongshu",
  ].includes(value as string);
}

export function imageAspectRatioToSize(value?: string | null) {
  if (value === "portrait") return "1024x1536";
  if (value === "landscape") return "1536x1024";
  if (value === "3:4" || value === "xiaohongshu") return "1056x1408";
  if (value === "4:3") return "1408x1056";
  if (value === "9:16") return "1008x1792";
  if (value === "16:9") return "1792x1008";
  return "1024x1024";
}
