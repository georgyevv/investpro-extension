import { Course } from "../models/course";

export class StorageService {
    private static readonly ALL_COURSES_PROGRESS_KEY = "allCoursesProgress";

    public static getAllCoursesProgress(): Course[] {
        const data = localStorage.getItem(this.ALL_COURSES_PROGRESS_KEY);
        return data ? JSON.parse(data) : [];
    }

    public static saveAllCoursesProgress(courses: Course[]): void {
        localStorage.setItem(this.ALL_COURSES_PROGRESS_KEY, JSON.stringify(courses));
    }
}
