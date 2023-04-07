import { Utils } from "../utils/utils";
import { Bookmark } from "../models/bookmark";
import { State } from "../models/state";
import { Lecture } from "../models/lecture";
import { Video } from "../models/video";

export class BookmarkService {
  constructor(private state: State) {
  }

  public static CreateBookmarkService(state: State): BookmarkService {
    return new BookmarkService(state);
  }

  public addBookmarksToDOM(): void {
    document.getElementById("bookmarks-wrapper")?.remove();

    const bookmarks: Bookmark[] = this.state.currentCourse.lectures.flatMap((lecture: Lecture) => lecture.videos).flatMap((video: Video) => video.bookmarks);

    const bookmarksElsHtml: string[] = [];
    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark: Bookmark = bookmarks[i];
      const bookmarkElHtml: string = `
<div id="${bookmark.id}" class="bookmark" data-timestamp="${bookmark.videoTimestamp}" data-bookmark-index="${i}" data-lecture-index="${bookmark.lectureIndex}" data-video-index="${bookmark.videoIndex}" style="display: flex; gap: 20px; flex-direction: column; border: 1px solid black; padding: 20px;">
    <div title="Стартирай видеото от отметката" class="bookmark-time-wrapper" style="display: flex; justify-content: space-between; align-items: center;">
         <div style="cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 14px;">
            <span class="bookmark-time" style="padding: 10px; border-radius: 9999px; background: black; color: white; font-weight: bold;">${Utils.formatTime(bookmark.videoTimestamp)}</span>    
            <span style="font-weight: bold">${bookmark.lectureName}</span>
            <span>${bookmark.videoName}</span>
         </div>   
            
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
            <span title="Редактирай" style="cursor:pointer;" class="bookmark-edit material-symbols-outlined">edit</span>
            <span title="Изтрий" style="cursor:pointer;" class="bookmark-delete material-symbols-outlined">delete</span>
        </div>
    </div>
    
    <div class="bookmark-content" style="font-size: 16px;">${bookmark.text}</div>
    
    <div class="bookmark-edit-content" style="display: none; flex-direction: column; gap: 20px;">            
        <textarea>${bookmark.text}</textarea>
    
         <div style="display: flex; font-size: 14px; gap: 20px; align-self: flex-end;">
            <button class="bookmark-update-cancel">Откажи</button>
            <button class="bookmark-update-save" style="background: black; color: white; padding: 10px 20px;">Запази</button>
        </div>
    </div>
</div>
`.trim();

      bookmarksElsHtml.push(bookmarkElHtml.trim());
    }

    let html: string = `
<div id="bookmarks-wrapper" style="margin: 20px 0;">
    <header style="margin-bottom: 10px;">
        <h1>Отметки</h1>
    </header>
    
    <div id="show-create-bookmark" style="display: flex; justify-content: space-between; align-items: center; border: 1px solid black; padding: 16px; font-size: 14px; font-weight: bold; cursor: pointer;">
        <div>Създай нова отметка в <span class="new-bookmark-time">${Utils.formatTime(this.state.videoElement.currentTime)}</span></div>
        
        <span class="material-symbols-outlined">add_circle</span>
    </div>
    
    <div id="create-bookmark-wrapper" style="display: none; gap: 20px; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
             <div style="display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 14px;">
                <span class="new-bookmark-time" style="padding: 10px; border-radius: 9999px; background: black; color: white; font-weight: bold;">${Utils.formatTime(this.state.videoElement.currentTime)}</span>    
                <span style="font-weight: bold">Лекция 1. Какво е икономиката и защо се изучава</span>
                <span>Видео 2. Наука ли е икономиката?</span>
             </div>   
        </div>
        
        <textarea></textarea>
        
        <div style="font-size: 14px; display: flex; gap: 20px; align-self: flex-end;">
            <button id="create-bookmark-wrapper-cancel">Откажи</button>
            <button id="create-bookmark-wrapper-save" style="background: black; color: white; padding: 10px 20px;">Запази</button>
        </div>
    </div>
    
    <div style="margin: 20px 0; display: flex; flex-direction: column; gap: 20px;">
        ${bookmarksElsHtml.join("").trim()}
    </div>
</div>
`.trim();

    const template: HTMLTemplateElement = document.createElement("template");
    template.innerHTML = html;

    const lecturesElements: Element = document.getElementsByClassName("crs_dtl_lct_nav_bl crs_dtl_bl")[0];
    lecturesElements.parentNode!.insertBefore(template.content.firstChild!, lecturesElements.previousSibling);
    document.getElementById("show-create-bookmark")!.addEventListener("click", (event: Event) => this.toggleCreateBookmark(event));
    document.getElementById("create-bookmark-wrapper-cancel")!.addEventListener("click", (event: Event) => this.toggleCreateBookmark(event));
    document.getElementById("create-bookmark-wrapper-save")!.addEventListener("click", (event: Event) => this.createBookmarkSave(event));

    const allBookmarksElements = document.getElementsByClassName("bookmark");
    for (const bookmarkElement of allBookmarksElements) {
      const editButton: Element = bookmarkElement.getElementsByClassName("bookmark-edit")[0];
      editButton.addEventListener("click", (event: Event) => this.editBookmark(event));

      const deleteButton: Element = bookmarkElement.getElementsByClassName("bookmark-delete")[0];
      deleteButton.addEventListener("click", (event: Event) => this.deleteBookmark(event));

      const saveBookmarkUpdateButton: Element = bookmarkElement.getElementsByClassName("bookmark-update-save")[0];
      saveBookmarkUpdateButton.addEventListener("click", (event: Event) => this.saveBookmarkUpdate(event));

      const cancelBookmarkUpdateButton: Element = bookmarkElement.getElementsByClassName("bookmark-update-cancel")[0];
      cancelBookmarkUpdateButton.addEventListener("click", (event: Event) => this.cancelBookmarkUpdate(event));

      const applyBookmarkTimestampButton: Element = bookmarkElement.getElementsByClassName("bookmark-time-wrapper")[0];
      applyBookmarkTimestampButton.addEventListener("click", (event: Event) => this.applyBookmarkTimestamp(event));
    }
  }

  private saveBookmarkUpdate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const bookmarkEl: HTMLElement = (event.currentTarget as HTMLElement)!.parentElement!.parentElement!.parentElement!;
    const bookmarkTextEl: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-content")[0] as HTMLElement;
    bookmarkTextEl.style.display = "flex";

    const bookmarkEditContentEl: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-edit-content")[0] as HTMLElement;
    bookmarkEditContentEl.style.display = "none";

    const textarea: HTMLTextAreaElement = bookmarkEditContentEl.getElementsByTagName("textarea")[0];
    const content: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-content")[0] as HTMLElement;
    content.innerText = textarea.value;

    const lecture: Lecture = this.state.currentCourse?.lectures[+bookmarkEl.getAttribute("data-lecture-index")!];
    const lectureVideo: Video = lecture?.videos[+bookmarkEl.getAttribute("data-video-index")!];

    const currentBookmark: Bookmark = lectureVideo.bookmarks.find((x: Bookmark): boolean => x.id === bookmarkEl.id)!;
    currentBookmark.text = textarea.value;

    localStorage.setItem("allCoursesProgress", JSON.stringify(this.state.allCourses));
  }

  private createBookmarkSave(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const createBookmarkWrapper = document.getElementById("create-bookmark-wrapper");
    createBookmarkWrapper!.style.display = createBookmarkWrapper!.style.display === "none" ? "flex" : "none";
    if (createBookmarkWrapper!.style.display === "flex") {
      createBookmarkWrapper!.getElementsByTagName("textarea")[0].focus();
      this.state.videoElement.pause();
    }

    const showCreateBookmark = document.getElementById("show-create-bookmark");
    showCreateBookmark!.style.display = showCreateBookmark!.style.display === "none" ? "flex" : "none";

    const textarea = createBookmarkWrapper!.getElementsByTagName("textarea")[0];

    this.state.currentCourseLectureVideo.bookmarks.push({
      id: Utils.createGuid(),
      lectureIndex: this.state.currentCourseLecture.index,
      lectureName: this.state.currentCourseLecture.name,
      videoIndex: this.state.currentCourseLectureVideo.index,
      videoName: this.state.currentCourseLectureVideo.name,
      videoTimestamp: this.state.videoElement.currentTime,
      text: textarea.value
    });

    localStorage.setItem("allCoursesProgress", JSON.stringify(this.state.allCourses));

    this.addBookmarksToDOM();
  }

  private editBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const bookmarkEl: HTMLElement = (event.currentTarget as HTMLElement).parentElement!.parentElement!.parentElement!;
    const bookmarkTextEl: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-content")[0] as HTMLElement;
    bookmarkTextEl.style.display = "none";

    const bookmarkEditContentEl: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-edit-content")[0] as HTMLElement;
    bookmarkEditContentEl.style.display = "flex";

    const textarea: HTMLTextAreaElement = bookmarkEditContentEl.getElementsByTagName("textarea")[0];
    const textareaValue: string = textarea.value;
    textarea.focus();
    textarea.value = "";
    textarea.value = textareaValue;
  }

  private deleteBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const bookmarkEl: HTMLElement = (event.currentTarget as HTMLElement)!.parentElement!.parentElement!.parentElement!;
    bookmarkEl.remove();

    const lecture: Lecture = this.state.currentCourse?.lectures[+bookmarkEl.getAttribute("data-lecture-index")!];
    const lectureVideo: Video = lecture?.videos[+bookmarkEl.getAttribute("data-video-index")!];
    lectureVideo.bookmarks.splice(+bookmarkEl.getAttribute("data-bookmark-index")!, 1);

    localStorage.setItem("allCoursesProgress", JSON.stringify(this.state.allCourses));
  }

  private cancelBookmarkUpdate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const bookmarkEl: HTMLElement = (event.currentTarget as HTMLElement)!.parentElement!.parentElement!.parentElement!;
    const bookmarkTextEl: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-content")[0] as HTMLElement;
    bookmarkTextEl.style.display = "flex";

    const bookmarkEditContentEl: HTMLElement = bookmarkEl.getElementsByClassName("bookmark-edit-content")[0] as HTMLElement;
    bookmarkEditContentEl.style.display = "none";
  }

  private toggleCreateBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const createBookmarkWrapper = document.getElementById("create-bookmark-wrapper");
    createBookmarkWrapper!.style.display = createBookmarkWrapper!.style.display === "none" ? "flex" : "none";
    if (createBookmarkWrapper!.style.display === "flex") {
      createBookmarkWrapper!.getElementsByTagName("textarea")[0].focus();
      this.state.videoElement.pause();
    }

    const showCreateBookmark = document.getElementById("show-create-bookmark");
    showCreateBookmark!.style.display = showCreateBookmark!.style.display === "none" ? "flex" : "none";
  }

  private applyBookmarkTimestamp(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.state.videoElement.pause();

    const bookmarkElement: HTMLElement = (event.currentTarget as HTMLElement)!.parentElement!;
    const lecture: Lecture = this.state.currentCourse?.lectures[+bookmarkElement.getAttribute("data-lecture-index")!];
    const lectureVideo: Video = lecture?.videos[+bookmarkElement.getAttribute("data-video-index")!];

    Utils.selectLectureAndVideo(bookmarkElement.getAttribute("data-lecture-index"), lectureVideo.id, this.state.videoElement);

    setTimeout(() => {
      this.state.videoElement.currentTime = +bookmarkElement.getAttribute("data-timestamp")!;
      this.state.videoElement.play();
    }, 500);
  }
}
