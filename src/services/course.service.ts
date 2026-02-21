import { Constants } from "../utils/constants";
import { BookmarkService } from "./bookmark.service";
import { Utils } from "../utils/utils";
import { Course } from "../models/course";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";
import { State } from "../models/state";
import { StorageService } from "./storage.service";
import { DOMScraperService } from "./dom-scraper.service";
import { UIRendererService } from "./ui-renderer.service";
import { DOMSelectors } from "../utils/dom-selectors";

declare const Swal: any;

export class CourseService {
  private stateService: State = {} as any;

  public isCoursePage(): boolean {
    return !!Utils.getCurrentCourseId(window.location.search);
  }

  public initialize(): void {
    const allCourses: Course[] = StorageService.getAllCoursesProgress();
    this.stateService.allCourses = allCourses;

    const currentCourseId: string = Utils.getCurrentCourseId(window.location.search)!;
    this.stateService.currentCourse = allCourses.find((course: Course): boolean => course.courseId === currentCourseId)!;

    if (!this.stateService.currentCourse) {
      const currentCourse: Course = DOMScraperService.crawCurrentCourseData(currentCourseId);
      if (currentCourse.lectures.length > 0) {
        allCourses.push(currentCourse);
        this.stateService.allCourses = allCourses;
        StorageService.saveAllCoursesProgress(allCourses);
      }

      this.stateService.currentCourse = allCourses.find((course: Course): boolean => course.courseId === currentCourseId)!;
    }

    if (!this.stateService.currentCourse) {
      return;
    }

    const currentLectureNumber: number = DOMScraperService.getCurrentLectureNumber();
    this.stateService.currentCourseLecture = this.stateService.currentCourse?.lectures[currentLectureNumber];

    const currentLectureVideoId: string | null = DOMScraperService.getCurrentLectureVideoId();
    this.stateService.currentCourseLectureVideo = this.stateService.currentCourseLecture?.videos?.find((video: Video): boolean => video.id === currentLectureVideoId)!;

    this.stateService.videoElement = DOMScraperService.getVideoElement();
    if (this.stateService.videoElement) {
      this.stateService.videoElement.addEventListener("timeupdate", () => this.updateCourseProgressOfCurrentLectureAndVideo());
    }

    this.setInitialCourseSelection();
    this.trackLectureOrVideoChange();

    this.createCourseProgressBar();
    this.updateCourseProgressBar();

    BookmarkService.CreateBookmarkService(this.stateService).addBookmarksToDOM();
    this.addProgressElementsToTheDOM();
  }

  private addProgressElementsToTheDOM(): void {
    if (!this.stateService.currentCourse?.lectures) {
      return;
    }

    for (let lectureIndex = 0; lectureIndex < this.stateService.currentCourse.lectures.length; lectureIndex++) {
      const currentPanel: Element = document.getElementsByClassName(DOMSelectors.lecturePanel)[lectureIndex];
      if (!currentPanel) {
        continue;
      }

      const lecture: Lecture = this.stateService.currentCourse.lectures[lectureIndex];
      const watchedLectureTimeInSeconds: number = lecture.videos.reduce((totalTime: number, video: Video) => totalTime + video.timeWatchedInSeconds, 0);
      const percentageLecture: number = (watchedLectureTimeInSeconds / lecture.videosTotalTimeInSeconds) * 100;

      // Show progress to current lecture button
      const additionalInfoWrapperLectureId: string = `lecture-${lectureIndex}-progress-button-info`;
      const additionalInfoWrapperLecture: HTMLElement = UIRendererService.createPercentageProgressInfo(percentageLecture, additionalInfoWrapperLectureId, "лекцията", lectureIndex);
      const lectureButtonEl = document.querySelector(`[data-panel-id="panel${lectureIndex}"]`);
      if (lectureButtonEl) {
        const lectureButtonElSpan: HTMLSpanElement = lectureButtonEl.getElementsByTagName("span")[0];
        if (lectureButtonElSpan && lectureButtonElSpan.parentNode) {
          lectureButtonElSpan.parentNode.insertBefore(additionalInfoWrapperLecture, lectureButtonElSpan.nextSibling);
        }
      }

      const restartBtn = document.getElementById(`${additionalInfoWrapperLectureId}-restart-progress`);
      if (restartBtn) restartBtn.addEventListener("click", (event: MouseEvent) => this.onClickResetLecture(event));

      const completeBtn = document.getElementById(`${additionalInfoWrapperLectureId}-complete-progress`);
      if (completeBtn) completeBtn.addEventListener("click", (event: MouseEvent) => this.onClickCompleteLecture(event));

      // Show progress to current lecture title
      const lectureTitleElement: Element = currentPanel.getElementsByClassName(DOMSelectors.lectureName)[0];
      if (lectureTitleElement) {
        const lectureTitlePEl: HTMLParagraphElement = lectureTitleElement.getElementsByTagName("p")[0];
        if (lectureTitlePEl && lectureTitlePEl.parentElement && lectureTitlePEl.parentNode) {
          lectureTitlePEl.parentElement.style.cssText += "display: flex; justify-content: space-between; align-items: center;";
          const spanElement: ChildNode = UIRendererService.createTimeProgressInfo(watchedLectureTimeInSeconds, lecture.videosTotalTimeInSeconds, lectureIndex);
          lectureTitlePEl.parentNode.insertBefore(spanElement, lectureTitlePEl.nextSibling);
        }
      }

      // Show progress to current lecture video
      const lectureVideosEls: HTMLCollection = currentPanel.getElementsByClassName(DOMSelectors.lectureVideosList)[0].children;
      for (let videoIndex = 0; videoIndex < lectureVideosEls.length; videoIndex++) {
        const lectureVideoElement: HTMLElement = lectureVideosEls[videoIndex] as HTMLElement;
        lectureVideoElement.style.position = "relative";
        (lectureVideoElement.getElementsByClassName(DOMSelectors.videoItemLink)[0] as HTMLElement).style.marginLeft = "-100px";

        const watchedLectureVideoTimeInSeconds = lecture.videos[videoIndex].timeWatchedInSeconds;
        const percentageVideo: number = (watchedLectureVideoTimeInSeconds / lecture.videos[videoIndex].totalTimeInSeconds) * 100;

        const existingTimeEl: Element = lectureVideoElement.getElementsByClassName(DOMSelectors.videoDuration)[0];
        const existingTimeElSpan: HTMLSpanElement = existingTimeEl.getElementsByTagName("span")[0];
        existingTimeElSpan.parentElement!.style.cssText += "position: relative;";

        const additionalInfoWrapperVideoId: string = `lecture-${lectureIndex}-video-${videoIndex}-progress-info`;
        const additionalInfoWrapperVideo: HTMLElement = UIRendererService.createPercentageProgressInfo(percentageVideo, additionalInfoWrapperVideoId, "видеото", lectureIndex, videoIndex);
        additionalInfoWrapperVideo.style.cssText += "position: absolute; left: -100px; top: -9px;";
        existingTimeElSpan.parentNode!.insertBefore(additionalInfoWrapperVideo, existingTimeElSpan);
        document.getElementById(`${additionalInfoWrapperVideoId}-restart-progress`)!.addEventListener("click", (event) => this.onClickResetVideo(event));
        document.getElementById(`${additionalInfoWrapperVideoId}-complete-progress`)!.addEventListener("click", (event) => this.onClickCompleteVideo(event));

        const backgroundProgressEl: HTMLDivElement = UIRendererService.createBackgroundProgressElement(percentageVideo);
        lectureVideoElement.appendChild(backgroundProgressEl);
        UIRendererService.updateLectureVideoBackgroundProgressInfo(percentageVideo, lectureVideoElement);
      }
    }
  }

  private trackLectureOrVideoChange(): void {
    const observer: MutationObserver = new MutationObserver(() => {
      const newLectureNumber: number = DOMScraperService.getCurrentLectureNumber();
      const newLectureVideoId: string | null = DOMScraperService.getCurrentLectureVideoId();
      const newVideo: HTMLVideoElement | null = DOMScraperService.getVideoElement();
      if (!newLectureVideoId || newLectureVideoId === this.stateService.currentCourseLectureVideo?.id || !newVideo) {
        return;
      }

      this.stateService.currentCourseLecture = this.stateService.currentCourse?.lectures[newLectureNumber];
      this.stateService.currentCourseLectureVideo = this.stateService.currentCourseLecture?.videos?.find((video: Video): boolean => video.id === newLectureVideoId)!;

      if (this.stateService.videoElement) {
        this.stateService.videoElement.removeEventListener("timeupdate", () => this.updateCourseProgressOfCurrentLectureAndVideo());
      }
      this.stateService.videoElement = newVideo;
      this.stateService.videoElement.currentTime = this.stateService.currentCourseLectureVideo?.timeWatchedInSeconds || 0;
      this.stateService.videoElement.addEventListener("timeupdate", () => this.updateCourseProgressOfCurrentLectureAndVideo());
    });

    observer.observe(document, { attributes: true, childList: true, subtree: true });
  }

  private setInitialCourseSelection(): void {
    if (this.stateService.videoElement) {
      this.stateService.videoElement.currentTime = this.stateService.currentCourseLectureVideo?.timeWatchedInSeconds || 0;
    }
  }

  private updateCourseProgressBar(): void {
    const courseVideosWatchedTime: number = this.stateService.currentCourse.lectures
      .reduce((totalTime: number, lecture: Lecture) => totalTime + lecture.videos.reduce((videosTotalTime: number, curr: Video) => videosTotalTime + curr.timeWatchedInSeconds, 0), 0);
    const percentage: number = (courseVideosWatchedTime / this.stateService.currentCourse.lecturesTotalTimeInSeconds) * 100;

    UIRendererService.updateCourseProgressBar(percentage, courseVideosWatchedTime, this.stateService.currentCourse.lecturesTotalTimeInSeconds);
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
    if (!this.stateService.videoElement) return;
    const newBookmarkTimeEls: NodeListOf<HTMLElement> = document.querySelectorAll(`.${DOMSelectors.newBookmarkTime}`);
    for (const newBookmarkTimeEl of newBookmarkTimeEls) {
      newBookmarkTimeEl.innerText = Utils.formatTime(this.stateService.videoElement.currentTime);
    }
  }

  private async updateCourseProgressOfCurrentLectureAndVideo(): Promise<void> {
    if (!this.stateService.videoElement) return;

    this.stateService.currentCourseLectureVideo.timeWatchedInSeconds = this.stateService.videoElement.currentTime;

    const percentageVideo: number = (this.stateService.currentCourseLectureVideo.timeWatchedInSeconds / this.stateService.currentCourseLectureVideo.totalTimeInSeconds) * 100;
    UIRendererService.updatePercentageProgressInfo(percentageVideo, `lecture-${this.stateService.currentCourseLecture.index}-video-${this.stateService.currentCourseLectureVideo.index}-progress-info`);

    const watchedLectureTimeInSeconds: number = this.stateService.currentCourseLecture.videos.reduce((totalTime: number, video: Video) => totalTime + video.timeWatchedInSeconds, 0);
    UIRendererService.updateTimeProgressInfo(this.stateService.currentCourseLecture.index, watchedLectureTimeInSeconds, this.stateService.currentCourseLecture.videosTotalTimeInSeconds);

    const percentageLecture: number = (watchedLectureTimeInSeconds / this.stateService.currentCourseLecture.videosTotalTimeInSeconds) * 100;
    UIRendererService.updatePercentageProgressInfo(percentageLecture, `lecture-${this.stateService.currentCourseLecture.index}-progress-button-info`);

    const lectureVideoElement: HTMLElement = document.getElementsByClassName(DOMSelectors.activeVideoItem)[0]!.parentElement!;
    UIRendererService.updateLectureVideoBackgroundProgressInfo(percentageVideo, lectureVideoElement);

    this.updateCourseProgressBar();
    this.updateNewBookmarkTime();

    StorageService.saveAllCoursesProgress(this.stateService.allCourses);

    if (this.stateService.videoElement.currentTime === this.stateService.videoElement.duration) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      const nextLectureVideo: { lecture: Lecture; video: Video } | undefined = this.getNextLectureVideo();
      if (!nextLectureVideo) {
        return;
      }

      let timerInterval: number | undefined;
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
        Utils.selectLectureAndVideo(nextLectureVideo.lecture.index.toString(), nextLectureVideo.video.id, this.stateService.videoElement);
      }
    }
  }

  private updateCourseProgressAllLecturesAndVideos(): void {
    for (const lecture of this.stateService.currentCourse.lectures) {
      for (const video of lecture.videos) {
        const percentageVideo: number = (video.timeWatchedInSeconds / video.totalTimeInSeconds) * 100;
        UIRendererService.updatePercentageProgressInfo(percentageVideo, `lecture-${lecture.index}-video-${video.index}-progress-info`);

        const lectureVideoEl: HTMLElement = document.querySelector(`.${DOMSelectors.videoItem}[data-video-id="${video.id}"]`)!.parentElement!;
        UIRendererService.updateLectureVideoBackgroundProgressInfo(percentageVideo, lectureVideoEl);
      }

      const watchedLectureTimeInSeconds: number = lecture.videos.reduce((totalTime: number, video: Video) => totalTime + video.timeWatchedInSeconds, 0);
      UIRendererService.updateTimeProgressInfo(lecture.index, watchedLectureTimeInSeconds, lecture.videosTotalTimeInSeconds);

      const percentageLecture: number = (watchedLectureTimeInSeconds / lecture.videosTotalTimeInSeconds) * 100;
      UIRendererService.updatePercentageProgressInfo(percentageLecture, `lecture-${lecture.index}-progress-button-info`);
    }

    this.updateCourseProgressBar();
    StorageService.saveAllCoursesProgress(this.stateService.allCourses);
  }

  private createCourseProgressBar(): void {
    const id: string = "course";
    const courseProgressWrapper: ChildNode = UIRendererService.createCourseProgressElement(id, "курса");

    const courseHeaderEl: Element = document.getElementsByClassName(DOMSelectors.courseHeader)[0];
    if (courseHeaderEl && courseHeaderEl.parentNode) {
      courseHeaderEl.parentNode.insertBefore(courseProgressWrapper, courseHeaderEl.nextSibling);
    }

    document.getElementById(`${id}-reset-course-progress`)!.addEventListener("click", () => this.onClickResetCourse());
    document.getElementById(`${id}-complete-course-progress`)!.addEventListener("click", () => this.onClickCompleteCourse());
  }
}
