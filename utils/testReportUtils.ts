import { test, expect } from "@playwright/test";
import {
  ScreenshotAnalysisResult,
  ComparisonAnalysisResult,
} from "./aiScreenshotAnalyzer";
import { ScreenshotTester } from "./screenshotTester";

export function addAIAnalysisToReport(
  analysisResult:
    | ScreenshotAnalysisResult
    | ComparisonAnalysisResult
    | undefined,
  screenshotPath?: string
): void {
  if (!analysisResult) {
    test.info().annotations.push({
      type: "Comparison Mode",
      description: "Native Playwright Screenshot Comparison",
    });
    if (screenshotPath) {
      test.info().attach("Screenshot", {
        path: screenshotPath,
        contentType: "image/png",
      });
    }
    return;
  }
  test.info().annotations.push({
    type: "AI Analysis",
    description: analysisResult.analysis,
  });
  test.info().annotations.push({
    type: "Score",
    description: `${analysisResult.score}/100 (Valid: ${analysisResult.isValid})`,
  });
  if (analysisResult.issues.length > 0) {
    test.info().annotations.push({
      type: "Issues Detected",
      description: analysisResult.issues.join(", "),
    });
  }
  if ("comparisonType" in analysisResult) {
    test.info().annotations.push({
      type: "Comparison Type",
      description: analysisResult.comparisonType,
    });
    test.info().annotations.push({
      type: "Regression Severity",
      description: analysisResult.regressionSeverity,
    });
    if (analysisResult.visualDifferences.length > 0) {
      test.info().annotations.push({
        type: "Visual Differences",
        description: analysisResult.visualDifferences.join(", "),
      });
    }
  }
  if (screenshotPath) {
    test.info().attach("Screenshot Analysis", {
      path: screenshotPath,
      contentType: "image/png",
    });
  }
}

export function assertAIAnalysisResults(
  analysisResult:
    | ScreenshotAnalysisResult
    | ComparisonAnalysisResult
    | undefined,
  success: boolean,
  threshold: number = 75
): void {
  if (!analysisResult) {
    expect(success, `Native screenshot comparison failed`).toBe(true);
    return;
  }
  const criticalKeywords = ["critical", "broken", "not loading", "major"];
  const hasCriticalIssues = analysisResult.issues.some((issue) =>
    criticalKeywords.some((keyword) => issue.toLowerCase().includes(keyword))
  );
  expect(
    success,
    `Test failed - Score: ${
      analysisResult.score
    }/100, Issues: ${analysisResult.issues.join(", ")}`
  ).toBe(true);
  expect(
    analysisResult.score,
    `Score too low: ${analysisResult.score}/100`
  ).toBeGreaterThan(threshold);
  expect(
    hasCriticalIssues,
    `Critical issues found: ${analysisResult.issues.join(", ")}`
  ).toBe(false);
  if ("regressionSeverity" in analysisResult) {
    expect(["low", "medium"]).toContain(analysisResult.regressionSeverity);
  }
}

export async function runScreenshotTestWithReport(
  screenshotTester: ScreenshotTester,
  testName: string,
  threshold: number = 75
) {
  const result = await screenshotTester.runScreenshotTest({
    testName,
    threshold,
  });
  const { analysisResult, comparisonMode } = result;
  if (comparisonMode === "ai" && analysisResult) {
    await test.step(`AI Analysis Results - Score: ${analysisResult.score}/100`, async () => {
      addAIAnalysisToReport(analysisResult, result.screenshotPath);
    });
  } else {
    await test.step(`Native Playwright Screenshot Comparison`, async () => {
      addAIAnalysisToReport(undefined, result.screenshotPath);
    });
  }
  assertAIAnalysisResults(analysisResult, result.success, threshold);
  return result;
}
