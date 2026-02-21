import { Constants } from "../utils/constants";
import { Utils } from "../utils/utils";
import { Lecture } from "../models/lecture";
import { DOMSelectors } from "../utils/dom-selectors";

export class UIRendererService {
    public static createTimeProgressInfo(watchedTimeInSeconds: number, totalTimeInSeconds: number, lectureIndex: number): ChildNode {
        const html: string = `
<span id="lecture-${lectureIndex}-time-progress-info"
      style="font-size: 18px; font-weight: bold; min-width: 180px; text-align: right;"
      >${Utils.formatTime(watchedTimeInSeconds)} / ${Utils.formatTime(totalTimeInSeconds)}
</span>
`.trim();

        return Utils.htmlToElement(html);
    }

    public static updateTimeProgressInfo(lectureIndex: number, watchedTime: number, totalTime: number): void {
        const spanElement = document.getElementById(`lecture-${lectureIndex}-time-progress-info`);
        if (spanElement) {
            spanElement.innerText = `${Utils.formatTime(watchedTime)} / ${Utils.formatTime(totalTime)}`;
        }
    }

    public static createPercentageProgressInfo(percentage: number, id: string, textContext: string, lectureIndex: number, videoIndex?: number): HTMLElement {
        const safePercentage = Math.min(percentage, 100);
        const html: string = `
<div id="${id}" style="display: flex; justify-content: center; align-items: center; gap: 5px; margin-top: 8px;">
    <span id="${id}-restart-progress"
          class="material-symbols-outlined" 
          style="cursor: pointer; user-select: none;" 
          title="Рестартирай прогреса на ${textContext}"
          data-lecture-index="${lectureIndex}"
          data-video-index="${videoIndex ?? ""}">remove_done</span>
          
     <span id="${id}-percentage">(${safePercentage < 10 ? "0" : ""}${safePercentage.toFixed(2)}%)</span>
     
     <span id="${id}-complete-progress"
           class="material-symbols-outlined" 
           style="cursor: pointer; user-select: none;"
           title="Завърши прогреса на ${textContext}"
           data-lecture-index="${lectureIndex}"
           data-video-index="${videoIndex ?? ""}">done_all</span>
</div>
`.trim();

        return Utils.htmlToElement(html) as HTMLElement;
    }

    public static updatePercentageProgressInfo(percentage: number, id: string): void {
        const safePercentage = Math.min(percentage, 100);
        const element = document.getElementById(`${id}-percentage`);
        if (element) {
            element.innerText = `(${safePercentage < 10 ? "0" : ""}${safePercentage.toFixed(2)}%)`;
        }
    }

    public static createCourseProgressElement(id: string, text: string): ChildNode {
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
              style="cursor: pointer; user-select: none;">done_all</span>
    </div>

    <div style="width: 100%; background-color: rgb(221, 221, 221);">
        <div id="${id}-progress-bar"
             class="${DOMSelectors.notCompletedProgressBar}"
             style="width: 12.11%; height: 30px; background-color: rgb(67, 183, 86); text-align: center; line-height: 30px; color: white; font-weight: bold; font-size: 18px; justify-content: center; align-items: center; display: flex; gap: 5px;">
            <div id="${DOMSelectors.courseProgressBarText}">0%</div>
        </div>
    </div>
</div>
`.trim();

        return Utils.htmlToElement(html);
    }

    public static createBackgroundProgressElement(percentage: number): HTMLDivElement {
        const safePercentage = Math.min(percentage, 100);
        const div = document.createElement("div");
        div.classList.add(DOMSelectors.backgroundProgressElement, DOMSelectors.withOpacity);
        div.classList.add(safePercentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? DOMSelectors.completedProgressBar : DOMSelectors.notCompletedProgressBar);
        div.style.cssText = "height: 100%; position: absolute; top: 0px; z-index: -1;";
        return div;
    }

    public static updateLectureVideoBackgroundProgressInfo(percentage: number, lectureVideoEl: HTMLElement): void {
        const safePercentage = Math.min(percentage, 100);
        const backgroundProgressEl = lectureVideoEl.querySelector(`.${DOMSelectors.backgroundProgressElement}`) as HTMLElement;
        if (backgroundProgressEl) {
            backgroundProgressEl.style.width = `${safePercentage}%`;
            backgroundProgressEl.classList.remove(DOMSelectors.completedProgressBar, DOMSelectors.notCompletedProgressBar);
            backgroundProgressEl.classList.add(safePercentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? DOMSelectors.completedProgressBar : DOMSelectors.notCompletedProgressBar);
        }
    }

    public static updateCourseProgressBar(percentage: number, watchedTime: number, totalTime: number): void {
        const timeEl = document.getElementById(DOMSelectors.courseWatchedTotalTime);
        if (timeEl) {
            timeEl.innerText = `${Utils.formatTime(watchedTime)} / ${Utils.formatTime(totalTime)}`;
        }

        const progressBarText = document.getElementById(DOMSelectors.courseProgressBarText);
        if (progressBarText && progressBarText.parentElement) {
            const parent = progressBarText.parentElement;
            parent.className = percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? DOMSelectors.completedProgressBar : DOMSelectors.notCompletedProgressBar;
            parent.style.width = `${Math.max(percentage, 7).toFixed(2)}%`;
            progressBarText.innerHTML = `${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%`;

            const existingIcon = parent.querySelector(".material-symbols-outlined");
            if (percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD) {
                if (!existingIcon) {
                    const icon = document.createElement("span");
                    icon.className = "material-symbols-outlined";
                    icon.textContent = "task_alt";
                    parent.appendChild(icon);
                }
            } else if (existingIcon) {
                existingIcon.remove();
            }
        }
    }

    public static createCourseWatchedSummary(watchedTime: string, percentage: number, isAnalyzed: boolean = true): ChildNode {
        if (!isAnalyzed) {
            const unanalyzedHtml: string = `
<div style="padding: 15px 20px; border-top: 1px solid #eaeaea; margin-top: auto; display: flex; justify-content: center; align-items: center; background-color: #fafafa;">
  <span style="font-size: 13px; font-weight: 500; color: #888; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-align: center;">
    <span class="material-symbols-outlined" style="font-size: 18px;">info</span>
    Отворете курса за анализ
  </span>
</div>`.trim();
            return Utils.htmlToElement(unanalyzedHtml);
        }

        const html: string = `
<div style="padding: 15px 20px; border-top: 1px solid #eaeaea; margin-top: auto;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #444;">
    <span>Прогрес</span>
    <span>${watchedTime}</span>
  </div>
  
  <div style="width: 100%; height: 6px; background-color: #e0e0e0; border-radius: 4px; overflow: hidden;">
    <div style="width: ${percentage.toFixed(2)}%; height: 100%; background-color: #43b756;"
         class="${percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? DOMSelectors.completedProgressBar : DOMSelectors.notCompletedProgressBar}">
    </div>
  </div>
  
  <div style="text-align: right; font-size: 13px; margin-top: 6px; color: #666; font-weight: bold;">
    ${percentage.toFixed(2)}%
  </div>
</div>`.trim();

        return Utils.htmlToElement(html);
    }

    public static createAllCoursesProgressSummary(totalWatchedTime: number, totalTime: number, notAnalyzedCourses: number): ChildNode {
        const percentage: number = totalTime ? (totalWatchedTime / totalTime) * 100 : 0;

        const html: string = `
<div style="margin-top: 20px; margin-bottom: 20px;">
  <div style="margin-bottom: 20px; display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
    ${Utils.formatTime(totalWatchedTime)} / ${Utils.formatTime(totalTime)}
  </div>
  
  ${notAnalyzedCourses === 0 ?
                "" : `
       <div style="margin-bottom: 20px; display: flex; justify-content: center; align-items: center; font-size: 16px; font-weight: bold;">
        (${notAnalyzedCourses} курса все още не са анализирани. Отворете всички курсове, за да се допълни общото време.)
       </div>`
            }
  
  <div style="width: 100%; background-color: #ddd;">
    <div id="${DOMSelectors.courseProgressBar}"
         style="width: ${(percentage < 12 ? 12 : percentage).toFixed(2)}%; height: 30px; background-color: #43b756; text-align: center; line-height: 30px; color: white; font-weight: bold; font-size: 18px;justify-content: center; align-items: center; display: flex; gap: 5px;"
         class="${percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? DOMSelectors.completedProgressBar : DOMSelectors.notCompletedProgressBar}">
      <div id="${DOMSelectors.courseProgressBarText}">
        ${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%
      </div>
    </div>
  </div>
</div>`.trim();

        return Utils.htmlToElement(html);
    }

    public static createBookmarkElement(bookmark: any, index: number): HTMLElement {
        const html: string = `
<div id="${bookmark.id}" class="${DOMSelectors.bookmarkClass}" data-timestamp="${bookmark.videoTimestamp}" data-bookmark-index="${index}" data-lecture-index="${bookmark.lectureIndex}" data-video-index="${bookmark.videoIndex}" style="display: flex; gap: 20px; flex-direction: column; border: 1px solid black; padding: 20px;">
    <div title="Стартирай видеото от отметката" class="${DOMSelectors.bookmarkTimeWrapper}" style="display: flex; justify-content: space-between; align-items: center;">
         <div style="cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 14px;">
            <span class="bookmark-time" style="padding: 10px; border-radius: 9999px; background: black; color: white; font-weight: bold;">${Utils.formatTime(bookmark.videoTimestamp)}</span>    
            <span style="font-weight: bold">${bookmark.lectureName}</span>
            <span>${bookmark.videoName}</span>
         </div>   
            
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
            <span title="Редактирай" style="cursor:pointer;" class="${DOMSelectors.bookmarkEditBtn} material-symbols-outlined">edit</span>
            <span title="Изтрий" style="cursor:pointer;" class="${DOMSelectors.bookmarkDeleteBtn} material-symbols-outlined">delete</span>
        </div>
    </div>
    
    <div class="${DOMSelectors.bookmarkContent}" style="font-size: 16px;">${bookmark.text}</div>
    
    <div class="${DOMSelectors.bookmarkEditContent}" style="display: none; flex-direction: column; gap: 20px;">            
        <textarea>${bookmark.text}</textarea>
    
         <div style="display: flex; font-size: 14px; gap: 20px; align-self: flex-end;">
            <button class="${DOMSelectors.bookmarkCancelBtn}">Откажи</button>
            <button class="${DOMSelectors.bookmarkSaveBtn}" style="background: black; color: white; padding: 10px 20px;">Запази</button>
        </div>
    </div>
</div>
`.trim();

        return Utils.htmlToElement(html) as HTMLElement;
    }

    public static createBookmarksWrapper(currentTime: number, bookmarksHtml: string): HTMLElement {
        const html: string = `
<div id="${DOMSelectors.bookmarksWrapper}" style="margin: 20px 0;">
    <header style="margin-bottom: 10px;">
        <h1>Отметки</h1>
    </header>
    
    <div id="${DOMSelectors.showCreateBookmark}" style="display: flex; justify-content: space-between; align-items: center; border: 1px solid black; padding: 16px; font-size: 14px; font-weight: bold; cursor: pointer;">
        <div>Създай нова отметка в <span class="${DOMSelectors.newBookmarkTime}">${Utils.formatTime(currentTime)}</span></div>
        
        <span class="material-symbols-outlined">add_circle</span>
    </div>
    
    <div id="${DOMSelectors.createBookmarkWrapper}" style="display: none; gap: 20px; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
             <div style="display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 14px;">
                <span class="${DOMSelectors.newBookmarkTime}" style="padding: 10px; border-radius: 9999px; background: black; color: white; font-weight: bold;">${Utils.formatTime(currentTime)}</span>    
                <span style="font-weight: bold">Лекция 1. Какво е икономиката и защо се изучава</span>
                <span>Видео 2. Наука ли е икономиката?</span>
             </div>   
        </div>
        
        <textarea></textarea>
        
        <div style="font-size: 14px; display: flex; gap: 20px; align-self: flex-end;">
            <button id="${DOMSelectors.createBookmarkCancel}">Откажи</button>
            <button id="${DOMSelectors.createBookmarkSave}" style="background: black; color: white; padding: 10px 20px;">Запази</button>
        </div>
    </div>
    
    <div style="margin: 20px 0; display: flex; flex-direction: column; gap: 20px;">
        ${bookmarksHtml}
    </div>
</div>
`.trim();

        return Utils.htmlToElement(html) as HTMLElement;
    }
}
