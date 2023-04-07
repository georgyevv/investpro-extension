import { Course } from "./course";
import { Lecture } from "./lecture";
import { Video } from "./video";

export interface State {
  allCourses: Course[];
  currentCourse: Course;
  currentCourseLecture: Lecture;
  currentCourseLectureVideo: Video;
  videoElement: any;
}