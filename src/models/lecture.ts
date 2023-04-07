import { Video } from "./video";

export interface Lecture {
  index: number;
  name: string;
  videos: Video[];
  videosTotalTimeInSeconds: number;
}
