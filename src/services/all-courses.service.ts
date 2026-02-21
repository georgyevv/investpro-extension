import { Utils } from "../utils/utils";
import { Course } from "../models/course";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";
import { StorageService } from "./storage.service";
import { UIRendererService } from "./ui-renderer.service";
import { DOMSelectors } from "../utils/dom-selectors";

export class AllCoursesService {
  private notAnalyzedCourses: number = 0;
  private allCoursesTotalTime: number = 0;
  private allCoursesTotalWatchedTime: number = 0;

  public isAllCoursesPage(): boolean {
    return !!document.getElementsByClassName(DOMSelectors.allCoursesList).length;
  }

  public initialize(): void {
    const allCoursesFromStorage: Course[] = StorageService.getAllCoursesProgress();
    this.addProgressToEachCourse(allCoursesFromStorage);
    this.addAllCoursesProgressSummary();
  }

  private addAllCoursesProgressSummary(): void {
    const summaryHtmlElement = UIRendererService.createAllCoursesProgressSummary(
      this.allCoursesTotalWatchedTime,
      this.allCoursesTotalTime,
      this.notAnalyzedCourses
    );

    const allCoursesList = document.getElementsByClassName(DOMSelectors.allCoursesList)[0];
    if (allCoursesList) {
      allCoursesList.prepend(summaryHtmlElement);
    }
  }

  private addProgressToEachCourse(allCoursesFromStorage: Course[]): void {
    const coursesElements: HTMLCollectionOf<Element> = document.getElementsByClassName(DOMSelectors.courseListItems);
    for (const courseElement of coursesElements) {
      const courseLinkElement: HTMLAnchorElement = courseElement.getElementsByTagName(DOMSelectors.courseListLinks)[0] as HTMLAnchorElement;
      const courseId: string | null = Utils.getCurrentCourseId(courseLinkElement.search);
      const courseInStorage: Course | undefined = allCoursesFromStorage.find((course: Course): boolean => course.courseId === courseId);
      const courseVideosWatchedTime: number = courseInStorage?.lectures.reduce((totalTime: number, lecture: Lecture) => totalTime + lecture.videos.reduce((videosTotalTime: number, video: Video) => videosTotalTime + video.timeWatchedInSeconds, 0), 0) ?? 0;
      const courseVideosWatchedPercentage: number = courseInStorage ? (courseVideosWatchedTime / courseInStorage.lecturesTotalTimeInSeconds) * 100 : 0;

      const courseHtmlElement = UIRendererService.createCourseWatchedSummary(
        this.getCourseWatchedTotalTime(courseInStorage, courseVideosWatchedTime),
        courseVideosWatchedPercentage,
        !!courseInStorage
      );

      courseLinkElement.appendChild(courseHtmlElement);
    }
  }

  private getCourseWatchedTotalTime(courseInStorage: Course | undefined, courseVideosWatchedTime: number): string {
    if (!courseInStorage) {
      this.notAnalyzedCourses++;
      return "";
    }

    this.allCoursesTotalTime += courseInStorage.lecturesTotalTimeInSeconds;
    this.allCoursesTotalWatchedTime += courseVideosWatchedTime;

    return `${Utils.formatTime(courseVideosWatchedTime)} / ${Utils.formatTime(courseInStorage.lecturesTotalTimeInSeconds)}`;
  }
}
