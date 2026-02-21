import { Utils } from "./utils";

describe("Utils", () => {
    describe("formatTime", () => {
        it("should format less than a minute correctly", () => {
            expect(Utils.formatTime(45)).toBe("00:00:45");
        });

        it("should format minutes and seconds correctly", () => {
            expect(Utils.formatTime(125)).toBe("00:02:05");
        });

        it("should format hours, minutes, and seconds correctly", () => {
            expect(Utils.formatTime(3665)).toBe("01:01:05");
        });

        it("should pad zero to hours less than 10", () => {
            expect(Utils.formatTime(35999)).toBe("09:59:59");
        });
    });

    describe("getCurrentCourseId", () => {
        it("should extract courseId from query string", () => {
            expect(Utils.getCurrentCourseId("?courseId=12345")).toBe("12345");
        });

        it("should return null if courseId is not present", () => {
            expect(Utils.getCurrentCourseId("?other_param=true")).toBeNull();
        });
    });
});
