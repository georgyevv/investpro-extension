export class Utils {
  public static formatTime(timeInSeconds: any): string {
    const hours: number = Math.floor(timeInSeconds / 3600);
    const minutes: number = Math.floor((timeInSeconds - (hours * 3600)) / 60);
    const seconds: number = timeInSeconds - (hours * 3600) - (minutes * 60);

    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds.toFixed(0)}`;
  }

  public static getCurrentCourseId(url: any): string | null {
    url = url ?? window.location.search;
    const urlParams: URLSearchParams = new URLSearchParams(url);

    return urlParams.get("courseId");
  }

  public static createGuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }

  public static selectLectureAndVideo(lectureIndex: any, videoId: any, video: any): void {
    (document.querySelector(`[data-panel-id="panel${lectureIndex}"]`) as HTMLButtonElement)!.click();
    (document.querySelector(`.btn_load_video[data-video-id="${videoId}"]`) as HTMLButtonElement)!.click();

    video.scrollIntoView();
  }

  public static htmlToElement(html: string): ChildNode {
    const template: HTMLTemplateElement = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.firstChild!;
  }
}
