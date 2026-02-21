import { Utils } from "../utils/utils";
import { Bookmark } from "../models/bookmark";
import { State } from "../models/state";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";
import { DOMSelectors } from "../utils/dom-selectors";
import { StorageService } from "./storage.service";
import { UIRendererService } from "./ui-renderer.service";

export class BookmarkService {
  constructor(private state: State) { }

  public static CreateBookmarkService(state: State): BookmarkService {
    return new BookmarkService(state);
  }

  public addBookmarksToDOM(): void {
    document.getElementById(DOMSelectors.bookmarksWrapper)?.remove();

    const bookmarks: Bookmark[] = this.state.currentCourse.lectures.flatMap((lecture: Lecture) => lecture.videos).flatMap((video: Video) => video.bookmarks);

    const bookmarksElsHtml: string[] = [];
    for (let i = 0; i < bookmarks.length; i++) {
      const bookmarkElement = UIRendererService.createBookmarkElement(bookmarks[i], i);
      bookmarksElsHtml.push(bookmarkElement.outerHTML);
    }

    const bookmarksWrapper = UIRendererService.createBookmarksWrapper(
      this.state.videoElement ? this.state.videoElement.currentTime : 0,
      bookmarksElsHtml.join("").trim()
    );

    const lecturesElements: Element = document.getElementsByClassName(DOMSelectors.lecturesNavigation)[0];
    if (lecturesElements && lecturesElements.parentNode) {
      lecturesElements.parentNode.insertBefore(bookmarksWrapper, lecturesElements.previousSibling);
    }

    document.getElementById(DOMSelectors.showCreateBookmark)?.addEventListener("click", (event: Event) => this.toggleCreateBookmark(event));
    document.getElementById(DOMSelectors.createBookmarkCancel)?.addEventListener("click", (event: Event) => this.toggleCreateBookmark(event));
    document.getElementById(DOMSelectors.createBookmarkSave)?.addEventListener("click", (event: Event) => this.createBookmarkSave(event));

    const allBookmarksElements = document.getElementsByClassName(DOMSelectors.bookmarkClass);
    for (const bookmarkElement of Array.from(allBookmarksElements)) {
      const editButton: Element = bookmarkElement.getElementsByClassName(DOMSelectors.bookmarkEditBtn)[0];
      if (editButton) editButton.addEventListener("click", (event: Event) => this.editBookmark(event));

      const deleteButton: Element = bookmarkElement.getElementsByClassName(DOMSelectors.bookmarkDeleteBtn)[0];
      if (deleteButton) deleteButton.addEventListener("click", (event: Event) => this.deleteBookmark(event));

      const saveBookmarkUpdateButton: Element = bookmarkElement.getElementsByClassName(DOMSelectors.bookmarkSaveBtn)[0];
      if (saveBookmarkUpdateButton) saveBookmarkUpdateButton.addEventListener("click", (event: Event) => this.saveBookmarkUpdate(event));

      const cancelBookmarkUpdateButton: Element = bookmarkElement.getElementsByClassName(DOMSelectors.bookmarkCancelBtn)[0];
      if (cancelBookmarkUpdateButton) cancelBookmarkUpdateButton.addEventListener("click", (event: Event) => this.cancelBookmarkUpdate(event));

      const applyBookmarkTimestampButton: Element = bookmarkElement.getElementsByClassName(DOMSelectors.bookmarkTimeWrapper)[0];
      if (applyBookmarkTimestampButton) applyBookmarkTimestampButton.addEventListener("click", (event: Event) => this.applyBookmarkTimestamp(event));
    }
  }

  private saveBookmarkUpdate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const bookmarkEl: HTMLElement = target.closest(`.${DOMSelectors.bookmarkClass}`) as HTMLElement;
    if (!bookmarkEl) return;

    const bookmarkTextEl = bookmarkEl.getElementsByClassName(DOMSelectors.bookmarkContent)[0] as HTMLElement;
    bookmarkTextEl.style.display = "flex";

    const bookmarkEditContentEl = bookmarkEl.getElementsByClassName(DOMSelectors.bookmarkEditContent)[0] as HTMLElement;
    bookmarkEditContentEl.style.display = "none";

    const textarea: HTMLTextAreaElement = bookmarkEditContentEl.getElementsByTagName("textarea")[0];
    bookmarkTextEl.innerText = textarea.value;

    const lectureIndex = +bookmarkEl.getAttribute("data-lecture-index")!;
    const videoIndex = +bookmarkEl.getAttribute("data-video-index")!;

    const lecture: Lecture = this.state.currentCourse?.lectures[lectureIndex];
    if (lecture && lecture.videos[videoIndex]) {
      const lectureVideo: Video = lecture.videos[videoIndex];
      const currentBookmark: Bookmark | undefined = lectureVideo.bookmarks.find((x: Bookmark): boolean => x.id === bookmarkEl.id);
      if (currentBookmark) {
        currentBookmark.text = textarea.value;
        StorageService.saveAllCoursesProgress(this.state.allCourses);
      }
    }
  }

  private createBookmarkSave(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const createBookmarkWrapper = document.getElementById(DOMSelectors.createBookmarkWrapper);
    if (createBookmarkWrapper) {
      const textarea = createBookmarkWrapper.getElementsByTagName("textarea")[0];

      this.state.currentCourseLectureVideo.bookmarks.push({
        id: Utils.createGuid(),
        lectureIndex: this.state.currentCourseLecture.index,
        lectureName: this.state.currentCourseLecture.name,
        videoIndex: this.state.currentCourseLectureVideo.index,
        videoName: this.state.currentCourseLectureVideo.name,
        videoTimestamp: this.state.videoElement ? this.state.videoElement.currentTime : 0,
        text: textarea.value
      });

      StorageService.saveAllCoursesProgress(this.state.allCourses);
      this.addBookmarksToDOM();
    }
  }

  private editBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const bookmarkEl: HTMLElement = target.closest(`.${DOMSelectors.bookmarkClass}`) as HTMLElement;

    if (bookmarkEl) {
      const bookmarkTextEl = bookmarkEl.getElementsByClassName(DOMSelectors.bookmarkContent)[0] as HTMLElement;
      bookmarkTextEl.style.display = "none";

      const bookmarkEditContentEl = bookmarkEl.getElementsByClassName(DOMSelectors.bookmarkEditContent)[0] as HTMLElement;
      bookmarkEditContentEl.style.display = "flex";

      const textarea: HTMLTextAreaElement = bookmarkEditContentEl.getElementsByTagName("textarea")[0];
      const textareaValue: string = textarea.value;
      textarea.focus();
      textarea.value = "";
      textarea.value = textareaValue;
    }
  }

  private deleteBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const bookmarkEl: HTMLElement = target.closest(`.${DOMSelectors.bookmarkClass}`) as HTMLElement;

    if (bookmarkEl) {
      bookmarkEl.remove();

      const lectureIndex = +bookmarkEl.getAttribute("data-lecture-index")!;
      const videoIndex = +bookmarkEl.getAttribute("data-video-index")!;
      const bookmarkIndex = +bookmarkEl.getAttribute("data-bookmark-index")!;

      const lecture: Lecture = this.state.currentCourse?.lectures[lectureIndex];
      if (lecture && lecture.videos[videoIndex]) {
        const lectureVideo: Video = lecture.videos[videoIndex];
        lectureVideo.bookmarks.splice(bookmarkIndex, 1);
        StorageService.saveAllCoursesProgress(this.state.allCourses);
      }
    }
  }

  private cancelBookmarkUpdate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const bookmarkEl: HTMLElement = target.closest(`.${DOMSelectors.bookmarkClass}`) as HTMLElement;

    if (bookmarkEl) {
      const bookmarkTextEl = bookmarkEl.getElementsByClassName(DOMSelectors.bookmarkContent)[0] as HTMLElement;
      bookmarkTextEl.style.display = "flex";

      const bookmarkEditContentEl = bookmarkEl.getElementsByClassName(DOMSelectors.bookmarkEditContent)[0] as HTMLElement;
      bookmarkEditContentEl.style.display = "none";
    }
  }

  private toggleCreateBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const createBookmarkWrapper = document.getElementById(DOMSelectors.createBookmarkWrapper);
    if (createBookmarkWrapper) {
      createBookmarkWrapper.style.display = createBookmarkWrapper.style.display === "none" ? "flex" : "none";
      if (createBookmarkWrapper.style.display === "flex") {
        createBookmarkWrapper.getElementsByTagName("textarea")[0].focus();
        if (this.state.videoElement) this.state.videoElement.pause();
      }
    }

    const showCreateBookmark = document.getElementById(DOMSelectors.showCreateBookmark);
    if (showCreateBookmark) {
      showCreateBookmark.style.display = showCreateBookmark.style.display === "none" ? "flex" : "none";
    }
  }

  private applyBookmarkTimestamp(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.videoElement) this.state.videoElement.pause();

    const target = event.currentTarget as HTMLElement;
    const bookmarkElement: HTMLElement = target.closest(`.${DOMSelectors.bookmarkClass}`) as HTMLElement;

    if (bookmarkElement) {
      const lectureIndex = +bookmarkElement.getAttribute("data-lecture-index")!;
      const videoIndex = +bookmarkElement.getAttribute("data-video-index")!;

      const lecture: Lecture = this.state.currentCourse?.lectures[lectureIndex];
      if (lecture && lecture.videos[videoIndex]) {
        const lectureVideo: Video = lecture.videos[videoIndex];
        Utils.selectLectureAndVideo(lectureIndex.toString(), lectureVideo.id, this.state.videoElement);

        setTimeout(() => {
          const timestampStr = bookmarkElement.getAttribute("data-timestamp");
          if (timestampStr && this.state.videoElement) {
            this.state.videoElement.currentTime = +timestampStr;
            this.state.videoElement.play();
          }
        }, 500);
      }
    }
  }
}
