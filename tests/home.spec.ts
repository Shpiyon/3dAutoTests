import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { AIScreenshotAnalyzer } from "../utils/aiScreenshotAnalyzer";

test.describe("Home Page Functionality", () => {
  let homePage: HomePage;

  test.beforeAll(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.startPage();
  });

  test("Should have working navigation menu", async () => {
    homePage.navigationComponent.verifyNavigationIsVisible();
  });

  test("Screenshot comparing", async ({ page }) => {
    // Take a screenshot of the entire page
    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    // Convert screenshot to base64 for AI analysis
    const base64Screenshot = screenshot.toString("base64");

    // Save screenshot for reference
    await page.screenshot({
      path: "test-results/home-page-ai-analysis.png",
      fullPage: true,
    });

    // Analyze the screenshot with AI
    const analysisResult =
      await AIScreenshotAnalyzer.analyze3DVisualizationPage(base64Screenshot);

    console.log("=== AI Screenshot Analysis Results ===");
    console.log(`Quality Score: ${analysisResult.score}/100`);
    console.log(`Status: ${analysisResult.isValid ? "PASS" : "FAIL"}`);
    console.log(`Analysis: ${analysisResult.analysis}`);

    if (analysisResult.issues.length > 0) {
      console.log("Issues found:");
      analysisResult.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    // Assert based on AI analysis results
    expect(analysisResult.score).toBeGreaterThan(70); // Minimum quality score
    expect(analysisResult.isValid).toBe(true); // Should pass AI validation

    // Optional: Fail test if critical issues are found
    const criticalIssues = analysisResult.issues.filter(
      (issue) =>
        issue.toLowerCase().includes("critical") ||
        issue.toLowerCase().includes("broken") ||
        issue.toLowerCase().includes("not loading")
    );

    if (criticalIssues.length > 0) {
      throw new Error(
        `Critical issues found in screenshot: ${criticalIssues.join(", ")}`
      );
    }
  });
});
