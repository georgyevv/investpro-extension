import { Utils } from "../utils/utils";
import { Constants } from "../utils/constants";
import { Course } from "../models/course";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";

export class AllCoursesService {
  private notAnalyzedCourses: number = 0;
  private allCoursesTotalTime: number = 0;
  private allCoursesTotalWatchedTime: number = 0;

  public isAllCoursesPage(): boolean {
    return !!document.getElementsByClassName("frs_crr_crcs_ls").length;
  }

  public initialize(): void {
    const allCoursesFromStorage: Course[] = JSON.parse(localStorage.getItem("allCoursesProgress")!) || [];
    this.addProgressToEachCourse(allCoursesFromStorage);
    this.addAllCoursesProgressSummary();
  }

  private addProgressToEachCourse(allCoursesFromStorage: Course[]): void {
    const coursesElements: HTMLCollectionOf<Element> = document.getElementsByClassName("frs_crr_crcs_ls_itm");
    for (const courseElement of coursesElements) {
      const courseLinkElement: HTMLAnchorElement = courseElement.getElementsByTagName("a")[0];
      const courseId: string | null = Utils.getCurrentCourseId(courseLinkElement.search);
      const courseInStorage: Course | undefined = allCoursesFromStorage.find((course: Course): boolean => course.courseId === courseId);
      const courseVideosWatchedTime: number = courseInStorage?.lectures.reduce((totalTime: number, lecture: Lecture) => totalTime + lecture.videos.reduce((videosTotalTime: number, video: Video) => videosTotalTime + video.timeWatchedInSeconds, 0), 0) ?? 0;
      const courseVideosWatchedPercentage: number = courseInStorage ? (courseVideosWatchedTime / courseInStorage.lecturesTotalTimeInSeconds) * 100 : 0;

      const courseHtml: string = `
<span style="display: block; width: 100%;">
  <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
    <div style="margin-top: 20px; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
        ${this.getCourseWatchedTotalTime(courseInStorage, courseVideosWatchedTime)}
    </div>
  </div>
  
  <div style="width: 100%; background-color: #ddd;">
    <div style="width: ${(courseVideosWatchedPercentage < 12 ? 12 : courseVideosWatchedPercentage).toFixed(2)}%; height: 30px; background-color: #43b756; text-align: center; line-height: 30px; color: white; font-weight: bold; font-size: 18px;justify-content: center; align-items: center; display: flex; gap: 5px;"
         class="${courseVideosWatchedPercentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? "completed-progress-bar" : "not-completed-progress-bar"}">
        <div>${courseVideosWatchedPercentage < 10 ? "0" : ""}${courseVideosWatchedPercentage.toFixed(2)}%</div>
    </div>
  </div>
</span>`.trim();

      courseElement.getElementsByClassName("frs_crr_crcs_body")[0].appendChild(Utils.htmlToElement(courseHtml));
    }
  }

  private addAllCoursesProgressSummary(): void {
    const allCoursesWatchedPercentage: number = this.allCoursesTotalTime ? (this.allCoursesTotalWatchedTime / this.allCoursesTotalTime) * 100 : 0;
    const allCoursesWatchedHtml: string = `
<div style="margin-top: 20px; margin-bottom: 20px;">
  <div style="margin-bottom: 20px; display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
    ${Utils.formatTime(this.allCoursesTotalWatchedTime)} / ${Utils.formatTime(this.allCoursesTotalTime)}
  </div>
  
  ${
      this.notAnalyzedCourses === 0 ?
        "" : `
       <div style="margin-bottom: 20px; display: flex; justify-content: center; align-items: center; font-size: 16px; font-weight: bold;">
        (${this.notAnalyzedCourses} курса все още не са анализирани. Отворете всички курсове, за да се допълни общото време.)
       </div>`
    }
  
  <div style="width: 100%; background-color: #ddd;">
    <div id="course-progress-bar"
         style="width: ${(allCoursesWatchedPercentage < 12 ? 12 : allCoursesWatchedPercentage).toFixed(2)}%; height: 30px; background-color: #43b756; text-align: center; line-height: 30px; color: white; font-weight: bold; font-size: 18px;justify-content: center; align-items: center; display: flex; gap: 5px;"
         class="${allCoursesWatchedPercentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? "completed-progress-bar" : "not-completed-progress-bar"}">
      <div id="course-progress-bar-text">
        ${allCoursesWatchedPercentage < 10 ? "0" : ""}${allCoursesWatchedPercentage.toFixed(2)}%
      </div>
    </div>
  </div>
</div>`.trim();

    document.getElementsByClassName("sec_hdr")[0].parentNode?.insertBefore(Utils.htmlToElement(allCoursesWatchedHtml), document.getElementsByClassName("sec_hdr")[0].previousSibling);
  }

  private getCourseWatchedTotalTime(courseInStorage: Course | undefined, courseVideosWatchedTime: number): string {
    if (!courseInStorage) {
      this.notAnalyzedCourses++;

      return "Oтворете курса, за да се анализира прогреса";
    }

    this.allCoursesTotalTime += courseInStorage.lecturesTotalTimeInSeconds;
    this.allCoursesTotalWatchedTime += courseVideosWatchedTime;

    return `${Utils.formatTime(courseVideosWatchedTime)} / ${Utils.formatTime(courseInStorage.lecturesTotalTimeInSeconds)}`;
  }
}
