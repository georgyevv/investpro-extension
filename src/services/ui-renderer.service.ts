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
<div style="background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span id="${id}-reset-course-progress"
              class="material-symbols-outlined"
              title="Рестартирай прогреса на ${text}"
              style="cursor: pointer; user-select: none; color: #888; font-size: 24px; transition: color 0.2s;"
              onmouseover="this.style.color='#d32f2f'" onmouseout="this.style.color='#888'">remove_done</span>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Общ Прогрес</span>
            <div id="${id}-watched-total-time" style="font-size: 22px; font-weight: 700; color: #222; line-height: 1.2;">
                0 <span style="color: #aaa; font-size: 18px; font-weight: 500;">/</span> 0
            </div>
        </div>

        <span id="${id}-complete-course-progress"
              class="material-symbols-outlined"
              title="Завърши прогреса на ${text}"
              style="cursor: pointer; user-select: none; color: #888; font-size: 24px; transition: color 0.2s;"
              onmouseover="this.style.color='#8cc63f'" onmouseout="this.style.color='#888'">done_all</span>
    </div>

    <div style="width: 100%; height: 12px; background-color: #f0f0f0; border-radius: 8px; overflow: hidden; position: relative;">
        <div id="${id}-progress-bar"
             class="${DOMSelectors.notCompletedProgressBar}"
             style="width: 12.11%; height: 100%; background-color: #8cc63f; border-radius: 8px; transition: width 0.3s ease;">
        </div>
    </div>
    <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
        <div id="${DOMSelectors.courseProgressBarText}" style="font-weight: 700; font-size: 15px; color: #8cc63f; line-height: 1.2;">0%</div>
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

    public static updateCourseProgressBar(courseId: string, percentage: number, watchedTime: number, totalTime: number): void {
        const timeEl = document.getElementById(`${courseId}-watched-total-time`);
        if (timeEl) {
            timeEl.innerHTML = `${Utils.formatTime(watchedTime)} <span style="color: #aaa; font-size: 18px; font-weight: 500;">/</span> ${Utils.formatTime(totalTime)}`;
        }

        const progressBar = document.getElementById(`${courseId}-progress-bar`);
        if (progressBar) {
            progressBar.style.width = `${Math.max(percentage, 5).toFixed(2)}%`;
            progressBar.className = percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? "" : "";
        }

        const progressBarText = document.getElementById(DOMSelectors.courseProgressBarText);
        if (progressBarText) {
            progressBarText.innerHTML = `${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%`;
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
<div style="margin: 24px 0; background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Генерален Прогрес</span>
          <span style="font-size: 24px; font-weight: 700; color: #222; line-height: 1.2;">
            ${Utils.formatTime(totalWatchedTime)} <span style="color: #aaa; font-size: 20px; font-weight: 500;">/</span> ${Utils.formatTime(totalTime)}
          </span>
      </div>
      <div id="${DOMSelectors.courseProgressBarText}" style="font-size: 24px; font-weight: 800; color: #0c4d3b; line-height: 1.2;">
          ${percentage < 10 ? "0" : ""}${percentage.toFixed(2)}%
      </div>
  </div>
  
  <div style="width: 100%; height: 12px; background-color: #f0f0f0; border-radius: 8px; overflow: hidden; margin-bottom: ${notAnalyzedCourses > 0 ? '16px' : '0'};">
    <div id="${DOMSelectors.courseProgressBar}"
         style="width: ${(percentage < 12 ? 12 : percentage).toFixed(2)}%; height: 100%; background-color: #0c4d3b; border-radius: 8px; transition: width 0.3s ease;"
         class="${percentage >= Constants.COMPLETED_PERCENTAGE_THRESHOLD ? DOMSelectors.completedProgressBar : DOMSelectors.notCompletedProgressBar}">
    </div>
  </div>

  ${notAnalyzedCourses === 0 ? "" : `
       <div style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; background-color: #fff9e6; border-left: 4px solid #f2c94c; border-radius: 6px;">
        <span class="material-symbols-outlined" style="color: #f2c94c; font-size: 20px;">info</span>
        <span style="font-size: 13px; color: #555; font-weight: 500;">
            <b>${notAnalyzedCourses} курса</b> все още не са анализирани. Отворете ги, за да се допълни общото време.
        </span>
       </div>`
            }
</div>`.trim();

        return Utils.htmlToElement(html);
    }

    public static createBookmarkElement(bookmark: any, index: number): HTMLElement {
        const html: string = `
<div id="${bookmark.id}" class="${DOMSelectors.bookmarkClass}" data-timestamp="${bookmark.videoTimestamp}" data-bookmark-index="${index}" data-lecture-index="${bookmark.lectureIndex}" data-video-index="${bookmark.videoIndex}" style="display: flex; gap: 16px; flex-direction: column; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: box-shadow 0.2s ease;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
         <div title="Стартирай видеото от отметката" class="${DOMSelectors.bookmarkTimeWrapper}" style="cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 14px; padding-right: 20px;">
            <span class="bookmark-time" style="padding: 6px 14px; border-radius: 20px; background: #0c4d3b; color: white; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">
                ${Utils.formatTime(bookmark.videoTimestamp)}
            </span>    
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-weight: 600; color: #333;">${bookmark.lectureName}</span>
                <span style="color: #666; font-size: 13px;">${bookmark.videoName}</span>
            </div>
         </div>   
            
        <div style="display: flex; justify-content: center; align-items: center; gap: 16px; color: #888;">
            <span title="Редактирай" style="cursor:pointer; font-size: 20px; transition: color 0.2s ease;" class="${DOMSelectors.bookmarkEditBtn} material-symbols-outlined hover-icon-edit">edit</span>
            <span title="Изтрий" style="cursor:pointer; font-size: 20px; transition: color 0.2s ease;" class="${DOMSelectors.bookmarkDeleteBtn} material-symbols-outlined hover-icon-delete">delete</span>
        </div>
    </div>
    
    <div class="${DOMSelectors.bookmarkContent}" style="font-size: 15px; color: #444; line-height: 1.5; padding: 12px 16px; background-color: #f9f9f9; border-radius: 6px; border-left: 3px solid #0c4d3b;">${bookmark.text}</div>
    
    <div class="${DOMSelectors.bookmarkEditContent}" style="display: none; flex-direction: column; gap: 16px; margin-top: 8px;">            
        <textarea class="investpro-bookmark-textarea" style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 14px; color: #333; background: #fff; resize: vertical; outline: none; transition: border-color 0.2s;">${bookmark.text}</textarea>
    
         <div style="display: flex; font-size: 14px; gap: 12px; align-self: flex-end;">
            <button class="${DOMSelectors.bookmarkCancelBtn}" style="padding: 8px 16px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; color: #555; font-weight: 500; transition: background 0.2s;">Откажи</button>
            <button class="${DOMSelectors.bookmarkSaveBtn}" style="background: #0c4d3b; border: none; color: white; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: opacity 0.2s;">Запази</button>
        </div>
    </div>
</div>
<style>
  .hover-icon-edit:hover { color: #0c4d3b; }
  .hover-icon-delete:hover { color: #d32f2f; }
</style>
`.trim();

        return Utils.htmlToElement(html) as HTMLElement;
    }

    public static createBookmarksWrapper(currentTime: number, bookmarksHtml: string): HTMLElement {
        const html: string = `
<div id="${DOMSelectors.bookmarksWrapper}" style="margin: 30px 0; font-family: inherit;">
    <header style="margin-bottom: 20px; border-bottom: 2px solid #eaeaea; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <h1 style="margin: 0; font-size: 24px; color: #222;">Отметки</h1>
    </header>
    
    <div id="${DOMSelectors.showCreateBookmark}" style="display: flex; justify-content: space-between; align-items: center; border: 1px dashed #bbb; border-radius: 8px; padding: 16px 20px; font-size: 15px; font-weight: 500; cursor: pointer; color: #555; background-color: #fafafa; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#0c4d3b'; this.style.color='#0c4d3b'; this.style.backgroundColor='#f0f9f6';" onmouseout="this.style.borderColor='#bbb'; this.style.color='#555'; this.style.backgroundColor='#fafafa';">
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>Създай нова отметка в</span>
            <span class="${DOMSelectors.newBookmarkTime}" style="padding: 4px 10px; border-radius: 12px; background: #e6e6e6; color: #333; font-weight: 600; font-size: 13px;">${Utils.formatTime(currentTime)}</span>
        </div>
        
        <span class="material-symbols-outlined" style="font-size: 24px;">add_circle</span>
    </div>
    
    <div id="${DOMSelectors.createBookmarkWrapper}" style="display: none; gap: 20px; flex-direction: column; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eaeaea; padding-bottom: 16px; margin-bottom: 8px;">
             <div style="display: flex; align-items: center; gap: 12px; font-size: 14px;">
                <span class="${DOMSelectors.newBookmarkTime}" style="padding: 6px 14px; border-radius: 20px; background: #0c4d3b; color: white; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">
                    ${Utils.formatTime(currentTime)}
                </span>    
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight: 600; color: #333;">Нова отметка за текущото видео</span>
                </div>
             </div>   
        </div>
        
        <textarea class="investpro-bookmark-textarea" placeholder="Въведете вашата бележка тук..." style="width: 100%; min-height: 120px; padding: 16px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 15px; color: #333; background: #fff; resize: vertical; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#0c4d3b'; this.style.boxShadow='0 0 0 2px rgba(12, 77, 59, 0.1)';" onblur="this.style.borderColor='#ccc'; this.style.boxShadow='none';"></textarea>
        
        <div style="font-size: 14px; display: flex; gap: 12px; align-self: flex-end;">
            <button id="${DOMSelectors.createBookmarkCancel}" style="padding: 10px 20px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; color: #555; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='#fff'">Откажи</button>
            <button id="${DOMSelectors.createBookmarkSave}" style="background: #0c4d3b; border: none; color: white; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Запази</button>
        </div>
    </div>
    
    <div style="margin: 24px 0; display: flex; flex-direction: column; gap: 16px;">
        ${bookmarksHtml}
    </div>
</div>
<style>
    .investpro-bookmark-textarea { color: #222 !important; font-weight: 500 !important; }
    .investpro-bookmark-textarea::placeholder { color: #888 !important; opacity: 1 !important; font-weight: 400 !important; }
</style>
`.trim();

        return Utils.htmlToElement(html) as HTMLElement;
    }
}
