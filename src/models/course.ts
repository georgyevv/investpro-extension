import { Lecture } from "./lecture";

export interface Course {
  courseId: string;
  lectures: Lecture[];
  lecturesTotalTimeInSeconds: number;
}