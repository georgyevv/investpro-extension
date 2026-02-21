import { Course } from "../models/course";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";
import { DOMSelectors } from "../utils/dom-selectors";

export class DOMScraperService {
    public static crawCurrentCourseData(currentCourseId: string): Course {
        const lectures: Lecture[] = [];
        const panelsElements: HTMLCollectionOf<Element> = document.getElementsByClassName(DOMSelectors.lecturePanel);

        for (let j = 0; j < panelsElements.length; j++) {
            const panelElement: Element = panelsElements[j];
            const lectureName: string = (panelElement.getElementsByClassName(DOMSelectors.lectureName)[0] as HTMLElement).innerText;
            const lecturesVideosElements: HTMLCollection = panelElement.getElementsByClassName(DOMSelectors.lectureVideosList)[0].children;

            const videos: Video[] = [];
            for (let i = 0; i < lecturesVideosElements.length; i++) {
                const currentLectureVideoElement: Element = lecturesVideosElements[i];
                const currentVideoElement: Element = currentLectureVideoElement.getElementsByClassName(DOMSelectors.videoItem)[0];
                const totalTimeParts: string[] = (currentVideoElement.querySelector(`.${DOMSelectors.videoDuration}`) as HTMLElement).innerText.split(":");

                let totalTimeInSeconds = 0;
                if (totalTimeParts.length === 3) {
                    totalTimeInSeconds = (parseInt(totalTimeParts[0]) * 60 * 60) + (parseInt(totalTimeParts[1]) * 60) + parseInt(totalTimeParts[2]);
                } else {
                    totalTimeInSeconds = (parseInt(totalTimeParts[0]) * 60) + parseInt(totalTimeParts[1]);
                }

                videos.push({
                    id: currentVideoElement.getAttribute("data-video-id")!,
                    index: i,
                    name: (currentVideoElement.querySelector(`.${DOMSelectors.videoCaption}`) as HTMLElement).innerText.split("\n")[1],
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

    public static getCurrentLectureNumber(): number {
        const activeTab = document.getElementsByClassName(DOMSelectors.activeLectureTab)[0];
        return activeTab ? +(activeTab.getAttribute("data-panel-id")?.split("panel")[1] ?? 0) : 0;
    }

    public static getCurrentLectureVideoId(): string | null {
        const activeVideo = document.getElementsByClassName(DOMSelectors.activeVideoItem)[0];
        return activeVideo ? activeVideo.getAttribute("data-video-id") : null;
    }

    public static getVideoElement(): HTMLVideoElement | null {
        return document.getElementById(DOMSelectors.videoPlayer) as HTMLVideoElement | null;
    }
}
