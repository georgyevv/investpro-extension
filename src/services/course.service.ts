import { Constants } from "../utils/constants";
import { BookmarkService } from "./bookmark.service";
import { Utils } from "../utils/utils";
import { Course } from "../models/course";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";
import { State } from "../models/state";

declare const Swal: any;

export class CourseService {
  private stateService: State = {} as any;

  public initialize(): void {
    const allCourses: Course[] = JSON.parse(localStorage.getItem("allCoursesProgress")!) || [];
    this.stateService.allCourses = allCourses;

    const currentCourseId: string = Utils.getCurrentCourseId(window.location.search)!;
    this.stateService.currentCourse = allCourses.find((course: Course): boolean => course.courseId === currentCourseId)!;

    if (!this.stateService.currentCourse) {
      const currentCourse: Course = this.crawCurrentCourseData(currentCourseId);
      allCourses.push(currentCourse);
      this.stateService.allCourses = allCourses;
      localStorage.setItem("allCoursesProgress", JSON.stringify(allCourses));

      this.stateService.currentCourse = allCourses.find((course: Course): boolean => course.courseId === currentCourseId)!;
    }

    let currentLectureNumber: number = +document.getElementsByClassName("btn_top_dtl_tab active")[0]?.getAttribute("data-panel-id")?.split("panel")[1]!;
    this.stateService.currentCourseLecture = this.stateService.currentCourse?.lectures[currentLectureNumber];

    let currentLectureVideoId: string | null = document.getElementsByClassName("crs_dtl_lct_itm active_video")[0].getAttribute("data-video-id");
    this.stateService.currentCourseLectureVideo = this.stateService.currentCourseLecture?.videos?.find((video: Video): boolean => video.id === currentLectureVideoId)!;

    this.stateService.videoElement = document.getElementById("videoC_html5_api");
    this.stateService.videoElement.addEventListener("timeupdate", () => this.updateCourseProgressOfCurrentLectureAndVideo());

    this.setInitialCourseSelection();
    this.trackLectureOrVideoChange();

    this.createCourseProgressBar();
    this.updateCourseProgressBar();

    BookmarkService.CreateBookmarkService(this.stateService).addBookmarksToDOM();
    this.addProgressElementsToTheDOM();
  }

  private addProgressElementsToTheDOM(): void {
    for (let lectureIndex = 0; lectureIndex < this.stateService.currentCourse.lectures.length; lectureIndex++) {
      const currentPanel: Element = document.getElementsByClassName("crs_dtl_lct_pnl_bl")[lectureIndex];
      const lecture: Lecture = this.stateService.currentCourse.lectures[lectureIndex];
      const watchedLectureTimeInSeconds: number = lecture.videos.reduce((totalTime: number, video: Video) => totalTime + video.timeWatchedInSeconds, 0);
      const percentageLecture: number = (watchedLectureTimeInSeconds / lecture.videosTotalTimeInSeconds) * 100;

      // Show progress to current lecture button
      const additionalInfoWrapperLectureId: string = `lecture-${lectureIndex}-progress-button-info`;
      const additionalInfoWrapperLecture: ChildNode = this.createPercentageProgressInfo(percentageLecture, additionalInfoWrapperLectureId, lectureIndex);
      const lectureButtonEl = document.querySelector(`[data-panel-id="panel${lectureIndex}"]`);
      const lectureButtonElSpan: HTMLSpanElement = lectureButtonEl!.getElementsByTagName("span")[0];
      lectureButtonElSpan.parentNode!.insertBefore(additionalInfoWrapperLecture, lectureButtonElSpan.nextSibling);
      document.getElementById(`${additionalInfoWrapperLectureId}-restart-progress`)!.addEventListener("click", (event: MouseEvent) => this.onClickResetLecture(event));
      document.getElementById(`${additionalInfoWrapperLectureId}-complete-progress`)!.addEventListener("click", (event: MouseEvent) => this.onClickCompleteLecture(event));

      // Show progress to current lecture title
      const lectureTitleElement: Element = currentPanel.getElementsByClassName("crs_dtl_lct_ls_name")[0];
      const lectureTitlePEl: HTMLParagraphElement = lectureTitleElement.getElementsByTagName("p")[0];
      lectureTitlePEl.parentElement!.style.cssText += "display: flex; justify-content: space-between; align-items: center;";
      const spanElement: ChildNode = this.createTimeProgressInfo(watchedLectureTimeInSeconds, lecture);
      lectureTitlePEl.parentNode!.insertBefore(spanElement, lectureTitlePEl.nextSibling);

      // Show progress to current lecture video
      const lectureVideosEls: HTMLCollection = currentPanel.getElementsByClassName("crs_dtl_lct_ls")[0].children;
      for (let videoIndex = 0; videoIndex < lectureVideosEls.length; videoIndex++) {
        const lectureVideoElement: HTMLElement = lectureVideosEls[videoIndex] as HTMLElement;
        lectureVideoElement.style.position = "relative";
        (lectureVideoElement.getElementsByClassName("crs_dtl_lct_itm_link")[0] as HTMLElement).style.marginLeft = "-100px";

        const watchedLectureVideoTimeInSeconds = lecture.videos[videoIndex].timeWatchedInSeconds;
        const percentageVideo: number = (watchedLectureVideoTimeInSeconds / lecture.videos[videoIndex].totalTimeInSeconds) * 100;

        const existingTimeEl: Element = lectureVideoElement.getElementsByClassName("crs_dtl_lct_itm_dur")[0];
        const existingTimeElSpan: HTMLSpanElement = existingTimeEl.getElementsByTagName("span")[0];
        existingTimeElSpan.parentElement!.style.cssText += "position: relative;";

        const additionalInfoWrapperVideoId: string = `lecture-${lectureIndex}-video-${videoIndex}-progress-info`;
        const additionalInfoWrapperVideo: HTMLElement = this.createPercentageProgressInfo(percentageVideo, additionalInfoWrapperVideoId, lectureIndex, videoIndex);
        additionalInfoWrapperVideo.style.cssText += "position: absolute; left: -100px; top: -9px;";
        existingTimeElSpan.parentNode!.insertBefore(additionalInfoWrapperVideo, existingTimeElSpan);
        document.getElementById(`${additionalInfoWrapperVideoId}-restart-progress`)!.addEventListener("click", (event) => this.onClickResetVideo(event));
        document.getElementById(`${additionalInfoWrapperVideoId}-complete-progress`)!.addEventListener("click", (event) => this.onClickCompleteVideo(event));

        const backgroundProgressEl: HTMLDivElement = document.createElement("div");
        backgroundProgressEl.classList.add("background-progress-el");
        backgroundProgressEl.classList.add("with-opacity");
        backgroundProgressEl.classList.add(percentageVideo >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? "completed-progress-bar" : "not-completed-progress-bar");
        backgroundProgressEl.style.cssText = "height: 100%; position: absolute; top: 0px; z-index: -1;";
        lectureVideoElement.appendChild(backgroundProgressEl);

        this.updateLectureVideoBackgroundProgressInfo(percentageVideo, lectureVideoElement);
      }
    }
  }

  private trackLectureOrVideoChange(): void {
    const observer: MutationObserver = new MutationObserver(() => {
      const newLectureNumber: number = +document.getElementsByClassName("btn_top_dtl_tab active")[0].getAttribute("data-panel-id")?.split("panel")[1]!;
      const newLectureVideoId: string = document.getElementsByClassName("crs_dtl_lct_itm active_video")[0].getAttribute("data-video-id")!;
      const newVideo: HTMLElement = document.getElementById("videoC_html5_api")!;
      if (newLectureVideoId === this.stateService.currentCourseLectureVideo?.id || !newVideo) {
        return;
      }

      this.stateService.currentCourseLecture = this.stateService.currentCourse?.lectures[newLectureNumber];
      this.stateService.currentCourseLectureVideo = this.stateService.currentCourseLecture?.videos?.find((video: Video): boolean => video.id === newLectureVideoId)!;

      this.stateService.videoElement.removeEventListener("timeupdate", () => this.updateCourseProgressOfCurrentLectureAndVideo());
      this.stateService.videoElement = newVideo ? newVideo : this.stateService.videoElement;
      this.stateService.videoElement.currentTime = this.stateService.currentCourseLectureVideo?.timeWatchedInSeconds || 0;
      this.stateService.videoElement.addEventListener("timeupdate", () => this.updateCourseProgressOfCurrentLectureAndVideo());
    });

    observer.observe(document, { attributes: true, childList: true, subtree: true });
  }

  private setInitialCourseSelection(): void {
    // TODO: should add everything here not just video
    this.stateService.videoElement.currentTime = this.stateService.currentCourseLectureVideo?.timeWatchedInSeconds || 0;
  }

  private crawCurrentCourseData(currentCourseId: string): Course {
    const lectures: Lecture[] = [];
    const panelsElements: HTMLCollectionOf<Element> = document.getElementsByClassName("crs_dtl_lct_pnl_bl");
    for (let j = 0; j < panelsElements.length; j++) {
      const panelElement: Element = panelsElements[j];
      const lectureName: string = (panelElement.getElementsByClassName("crs_dtl_lct_ls_name")[0] as HTMLElement).innerText;
      const lecturesVideosElements: HTMLCollection = panelElement.getElementsByClassName("crs_dtl_lct_ls")[0].children;

      const videos: Video[] = [];
      for (let i = 0; i < lecturesVideosElements.length; i++) {
        const currentLectureVideoElement: Element = lecturesVideosElements[i];
        const currentVideoElement: Element = currentLectureVideoElement.getElementsByClassName("crs_dtl_lct_itm")[0];
        const totalTimeParts: string[] = (currentVideoElement.querySelector(".crs_dtl_lct_itm_dur") as HTMLElement).innerText.split(":");
        let totalTimeInSeconds = 0;
        if (totalTimeParts.length === 3) {
          totalTimeInSeconds = (parseInt(totalTimeParts[0]) * 60 * 60) + (parseInt(totalTimeParts[1]) * 60) + parseInt(totalTimeParts[2]);
        } else {
          totalTimeInSeconds = (parseInt(totalTimeParts[0]) * 60) + parseInt(totalTimeParts[1]);
        }

        videos.push({
          id: currentVideoElement.getAttribute("data-video-id")!,
          index: i,
          name: (currentVideoElement.querySelector(".crs_dtl_lct_itm_cap") as HTMLElement).innerText.split("\n")[1],
          timeWatchedInSeconds: 0,
          totalTimeInSeconds: totalTimeInSeconds,
          bookmarks: []
        });
      }

      lectures.push({
        name: lectureName,
        index: j,
        videos: videos,
        videosTotalTimeInSeconds: videos.reduce((totalTime: number, video: Video) => totalTime + video.totalTimeInSeconds, 0)
      });
    }

    return {
      courseId: currentCourseId,
      lectures: lectures,
      lecturesTotalTimeInSeconds: lectures.reduce((totalTime: number, lecture: Lecture) => totalTime + lecture.videosTotalTimeInSeconds, 0)
    };
  }

  private updateCourseProgressBar(): void {
    const courseVideosWatchedTime: number = this.stateService.currentCourse.lectures
      .reduce((totalTime: number, lecture: Lecture) => totalTime + lecture.videos.reduce((videosTotalTime: number, curr: Video) => videosTotalTime + curr.timeWatchedInSeconds, 0), 0);

    const courseWatchedTotalTimeElement: HTMLElement = document.getElementById("course-watched-total-time")!;
    courseWatchedTotalTimeElement.innerText = `${this.formatTime(courseVideosWatchedTime)} / ${this.formatTime(this.stateService.currentCourse.lecturesTotalTimeInSeconds)}`;

    const percentage: number = (courseVideosWatchedTime / this.stateService.currentCourse.lecturesTotalTimeInSeconds) * 100;
    const courseProgressBar: HTMLElement = document.getElementById("course-progress-bar-text")!;
    courseProgressBar.parentElement!.className = percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? "completed-progress-bar" : "not-completed-progress-bar";
    courseProgressBar.parentElement!.style.width = `${(percentage < 7 ? 7 : percentage).toFixed(2)}%`;
    courseProgressBar.innerHTML = `${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%`;

    const existingInfoWrapper: Element = courseProgressBar.parentElement!.getElementsByClassName("material-symbols-outlined")[0];
    if (percentage > Constants.COMPLETED_PERCENTAGE_THRESHOLD) {
      if (!existingInfoWrapper) {
        const additionalInfoWrapperCheck: HTMLSpanElement = document.createElement("span");
        additionalInfoWrapperCheck.className = "material-symbols-outlined";
        additionalInfoWrapperCheck.textContent = "task_alt";
        courseProgressBar.parentElement!.appendChild(additionalInfoWrapperCheck);
      }
    } else {
      if (existingInfoWrapper) {
        existingInfoWrapper.remove();
      }
    }
  }

  private onClickCompleteCourse(): void {
    for (const lecture of this.stateService.currentCourse.lectures) {
      for (const lectureVideo of lecture.videos) {
        lectureVideo.timeWatchedInSeconds = lectureVideo.totalTimeInSeconds;
      }
    }

    this.updateCourseProgressAllLecturesAndVideos();
  }

  private onClickResetCourse(): void {
    for (const lecture of this.stateService.currentCourse.lectures) {
      for (const lectureVideo of lecture.videos) {
        lectureVideo.timeWatchedInSeconds = 0;
      }
    }

    this.updateCourseProgressAllLecturesAndVideos();
  }

  private onClickCompleteLecture(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    let lecture = this.stateService.currentCourse?.lectures[+(event.target as HTMLElement).getAttribute("data-lecture-index")!];
    for (const lectureVideo of lecture.videos) {
      lectureVideo.timeWatchedInSeconds = lectureVideo.totalTimeInSeconds;
    }

    this.updateCourseProgressAllLecturesAndVideos();
  }

  private onClickResetLecture(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    let lecture: Lecture = this.stateService.currentCourse?.lectures[+(event.target as HTMLElement).getAttribute("data-lecture-index")!];
    for (const lectureVideo of lecture.videos) {
      lectureVideo.timeWatchedInSeconds = 0;
    }

    this.updateCourseProgressAllLecturesAndVideos();
  }

  private onClickCompleteVideo(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    let lecture = this.stateService.currentCourse?.lectures[+(event.target as HTMLElement).getAttribute("data-lecture-index")!];
    let lectureVideo = lecture?.videos[+(event.target as HTMLElement).getAttribute("data-video-index")!];

    lectureVideo.timeWatchedInSeconds = lectureVideo.totalTimeInSeconds;

    this.updateCourseProgressAllLecturesAndVideos();
  }

  private onClickResetVideo(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    let lecture: Lecture | undefined = this.stateService.currentCourse?.lectures[+(event.target as HTMLElement).getAttribute("data-lecture-index")!];
    let lectureVideo: Video | undefined = lecture?.videos[+(event.target as HTMLElement).getAttribute("data-video-index")!];

    lectureVideo.timeWatchedInSeconds = 0;

    this.updateCourseProgressAllLecturesAndVideos();
  }

  private getNextLectureVideo(): { lecture: Lecture, video: Video } | undefined {
    let lecture = null;
    let video = null;

    const nextVideoIndex = this.stateService.currentCourseLectureVideo.index + 1;
    if (nextVideoIndex > this.stateService.currentCourseLecture.videos.length - 1) {
      const nextLectureIndex = this.stateService.currentCourseLecture.index + 1;
      if (nextLectureIndex > this.stateService.currentCourse.lectures.length - 1) {
        return;
      } else {
        lecture = this.stateService.currentCourse.lectures[nextLectureIndex];
        video = lecture.videos[0];
      }
    } else {
      lecture = this.stateService.currentCourseLecture;
      video = this.stateService.currentCourseLecture.videos[nextVideoIndex];
    }

    return { lecture, video };
  }

  private updateNewBookmarkTime(): void {
    const newBookmarkTimeEls: NodeListOf<HTMLElement> = document.querySelectorAll(".new-bookmark-time");
    for (const newBookmarkTimeEl of newBookmarkTimeEls) {
      newBookmarkTimeEl.innerText = this.formatTime(this.stateService.videoElement.currentTime);
    }
  }

  private async updateCourseProgressOfCurrentLectureAndVideo(): Promise<void> {
    this.stateService.currentCourseLectureVideo.timeWatchedInSeconds = this.stateService.videoElement.currentTime;

    const percentageVideo: number = (this.stateService.currentCourseLectureVideo.timeWatchedInSeconds / this.stateService.currentCourseLectureVideo.totalTimeInSeconds) * 100;
    this.updatePercentageProgressInfo(percentageVideo, `lecture-${this.stateService.currentCourseLecture.index}-video-${this.stateService.currentCourseLectureVideo.index}-progress-info`);

    const watchedLectureTimeInSeconds: number = this.stateService.currentCourseLecture.videos.reduce((totalTime: number, video: Video) => totalTime + video.timeWatchedInSeconds, 0);
    this.updateTimeProgressInfo(watchedLectureTimeInSeconds, this.stateService.currentCourseLecture);

    const percentageLecture: number = (watchedLectureTimeInSeconds / this.stateService.currentCourseLecture.videosTotalTimeInSeconds) * 100;
    this.updatePercentageProgressInfo(percentageLecture, `lecture-${this.stateService.currentCourseLecture.index}-progress-button-info`);

    const lectureVideoElement: HTMLElement = document.querySelector(`div.crs_dtl_lct_itm.active_video`)!.parentElement!;
    this.updateLectureVideoBackgroundProgressInfo(percentageVideo, lectureVideoElement);

    this.updateCourseProgressBar();
    this.updateNewBookmarkTime();

    localStorage.setItem("allCoursesProgress", JSON.stringify(this.stateService.allCourses));

    if (this.stateService.videoElement.currentTime === this.stateService.videoElement.duration) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      const nextLectureVideo: { lecture: Lecture; video: Video } | undefined = this.getNextLectureVideo();
      if (!nextLectureVideo) {
        return;
      }

      let timerInterval: NodeJS.Timeout;
      const result = await Swal.fire({
        title: "Искате ли да гледате следващото видео?",
        html: `Видео ${nextLectureVideo.video.index + 1} – <b>${nextLectureVideo.video.name}</b></br>Лекция – ${nextLectureVideo.lecture.index + 1} <b>${nextLectureVideo.lecture.name}</b>`,
        width: "800px",
        timer: 6000,
        timerProgressBar: true,
        confirmButtonText: "Да",
        cancelButtonText: "Откажи",
        showConfirmButton: true,
        showCancelButton: true,
        willClose: () => {
          clearInterval(timerInterval);
        }
      });

      if (result.dismiss === Swal.DismissReason.timer || result.isConfirmed) {
        Utils.selectLectureAndVideo(nextLectureVideo.lecture.index, nextLectureVideo.video.id, this.stateService.videoElement);
      }
    }
  }

  private updateCourseProgressAllLecturesAndVideos(): void {
    for (const lecture of this.stateService.currentCourse.lectures) {
      for (const video of lecture.videos) {
        const percentageVideo: number = (video.timeWatchedInSeconds / video.totalTimeInSeconds) * 100;
        this.updatePercentageProgressInfo(percentageVideo, `lecture-${lecture.index}-video-${video.index}-progress-info`);

        const lectureVideoEl: HTMLElement = document.querySelector(`.crs_dtl_lct_itm[data-video-id="${video.id}"]`)!.parentElement!;
        this.updateLectureVideoBackgroundProgressInfo(percentageVideo, lectureVideoEl);
      }

      const watchedLectureTimeInSeconds: number = lecture.videos.reduce((totalTime: number, video: Video) => totalTime + video.timeWatchedInSeconds, 0);
      this.updateTimeProgressInfo(watchedLectureTimeInSeconds, lecture);

      const percentageLecture: number = (watchedLectureTimeInSeconds / lecture.videosTotalTimeInSeconds) * 100;
      this.updatePercentageProgressInfo(percentageLecture, `lecture-${lecture.index}-progress-button-info`);
    }

    this.updateCourseProgressBar();

    localStorage.setItem("allCoursesProgress", JSON.stringify(this.stateService.allCourses));
  }

  private updatePercentageProgressInfo(percentage: number, id: string): void {
    percentage = percentage > 100 ? 100 : percentage;

    const additionalInfoWrapper: HTMLElement = document.getElementById(`${id}-percentage`)!;
    additionalInfoWrapper.innerText = `(${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%)`;
  }

  private createTimeProgressInfo(watchedLectureTimeInSeconds: number, lecture: Lecture): ChildNode {
    let html: string = `
<span id="lecture-${lecture.index}-time-progress-info"
      style="font-size: 18px; font-weight: bold; min-width: 180px; text-align: right;"
      >${this.formatTime(watchedLectureTimeInSeconds)} / ${this.formatTime(lecture.videosTotalTimeInSeconds)}
</span>
`.trim();

    const template: HTMLTemplateElement = document.createElement("template");
    template.innerHTML = html;

    return template.content.firstChild!;
  }

  private formatTime(timeInSeconds: number): string {
    const hours: number = Math.floor(timeInSeconds / 3600);
    const minutes: number = Math.floor((timeInSeconds - (hours * 3600)) / 60);
    const seconds: number = timeInSeconds - (hours * 3600) - (minutes * 60);

    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds.toFixed(0)}`;
  }

  private updateLectureVideoBackgroundProgressInfo(percentage: number, lectureVideoEl: HTMLElement): void {
    percentage = percentage > 100 ? 100 : percentage;

    const backgroundProgressEl: HTMLElement = lectureVideoEl.getElementsByClassName("background-progress-el")[0] as HTMLElement;
    backgroundProgressEl.style.width = `${percentage}%`;

    backgroundProgressEl.classList.remove("completed-progress-bar", "not-completed-progress-bar");
    backgroundProgressEl.classList.add(percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? "completed-progress-bar" : "not-completed-progress-bar");
  }

  private updateTimeProgressInfo(watchedLectureTimeInSeconds: number, lecture: Lecture): void {
    const spanElement: HTMLElement = document.getElementById(`lecture-${lecture.index}-time-progress-info`)!;
    spanElement.innerText = `${this.formatTime(watchedLectureTimeInSeconds)} / ${this.formatTime(lecture.videosTotalTimeInSeconds)}`;
  }

  private createCourseProgressBar(): void {
    const id: string = "course";
    const courseProgressWrapper: ChildNode = this.createProgressElement(id, "курса");

    const courseHeaderEl: Element = document.getElementsByClassName("crs_dtl_hdr_bl")[0];
    courseHeaderEl.parentNode!.insertBefore(courseProgressWrapper, courseHeaderEl.nextSibling);

    document.getElementById(`${id}-reset-course-progress`)!.addEventListener("click", () => this.onClickResetCourse());
    document.getElementById(`${id}-complete-course-progress`)!.addEventListener("click", () => this.onClickCompleteCourse());
  }

  private createProgressElement(id: string, text: string): ChildNode {
    const html: string = `
<div>
    <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
        <span id="${id}-reset-course-progress"
              class="material-symbols-outlined"
              title="Рестартирай прогреса на ${text}"
              style="cursor: pointer; user-select: none;">remove_done</span>

        <div id="${id}-watched-total-time"
             style="margin-top: 20px; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
            0 / 0
        </div>

        <span id="${id}-complete-course-progress"
              class="material-symbols-outlined"
              title="Завърши прогреса на ${text}"
              style="cursor: pointer; user-select: none;"">done_all</span>
    </div>

    <div style="width: 100%; background-color: rgb(221, 221, 221);">
        <div id="${id}-progress-bar"
             class="not-completed-progress-bar"
             style="width: 12.11%; height: 30px; background-color: rgb(67, 183, 86); text-align: center; line-height: 30px; color: white; font-weight: bold; font-size: 18px; justify-content: center; align-items: center; display: flex; gap: 5px;">
            <div id="${id}-progress-bar-text">0%</div>
        </div>
    </div>
</div>
`.trim();

    const template: HTMLTemplateElement = document.createElement("template");
    template.innerHTML = html;

    return template.content.firstChild!;
  }

  private createPercentageProgressInfo(percentage: number, id: string, lectureIndex: number, videoIndex?: number): HTMLElement {
    percentage = percentage > 100 ? 100 : percentage;

    const text: string = (videoIndex === null || videoIndex === undefined) ? "лекцията" : "видеото";

    const html: string = `
<div id="${id}" style="display: flex; justify-content: center; align-items: center; gap: 5px; margin-top: 8px;">
    <span id="${id}-restart-progress"
          class="material-symbols-outlined" 
          style="cursor: pointer; user-select: none;" 
          title="Рестартирай прогреса на ${text}"
          data-lecture-index="${lectureIndex}"
          data-video-index="${videoIndex}">remove_done</span>
          
     <span id="${id}-percentage">(${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%)</span>
     
     <span id="${id}-complete-progress"
           class="material-symbols-outlined" 
           style="cursor: pointer; user-select: none;"
           title="Завърши прогреса на ${text}"
           data-lecture-index="${lectureIndex}"
           data-video-index="${videoIndex}">done_all</span>
</div>
`.trim();

    const template: HTMLTemplateElement = document.createElement("template");
    template.innerHTML = html;

    return template.content.firstChild! as HTMLElement;
  }
}
