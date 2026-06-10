import { diffWordsWithSpace } from "diff";

export function buildVersionDiff(previousText: string, nextText: string) {
  return diffWordsWithSpace(previousText, nextText);
}
