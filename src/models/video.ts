import { Bookmark } from "./bookmark";

export interface Video {
  id: string;
  index: number;
  name: string;
  timeWatchedInSeconds: number;
  totalTimeInSeconds: number;
  bookmarks: Bookmark[];
}
