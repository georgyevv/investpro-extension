import { AllCoursesService } from "./services/all-courses.service";
import { CourseService } from "./services/course.service";

window.addEventListener("load", (): void => {
  addMaterialIconsToPage();

  const allCoursesService: AllCoursesService = new AllCoursesService();
  if (allCoursesService.isAllCoursesPage()) {
    allCoursesService.initialize();

    return;
  }

  const courseService: CourseService = new CourseService();
  if (courseService.isCoursePage()) {
    courseService.initialize();
  }
});

function addMaterialIconsToPage(): void {
  const link: HTMLLinkElement = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0";
  document.head.appendChild(link);
}
