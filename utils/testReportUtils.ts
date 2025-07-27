import { test, expect } from "@playwright/test";
import { ScreenshotAnalysisResult } from "./aiScreenshotAnalyzer";
import { ScreenshotTester } from "./screenshotTester";
import * as fs from "fs";

function getScreenshotDefaults() {
  const testInfo = test.info();
  const metadata = testInfo.config.metadata as any;
  return {
    aiThreshold: metadata?.screenshotDefaults?.aiThreshold ?? 75,
    nativeThreshold: metadata?.screenshotDefaults?.nativeThreshold ?? 0.8,
  };
}

export function addAIAnalysisToReport(
  analysisResult: ScreenshotAnalysisResult | undefined,
  screenshotPath?: string
): void {
  if (!analysisResult) {
    test.info().annotations.push({
      type: "Comparison Mode",
      description: "Native Playwright Screenshot Comparison",
    });
    if (screenshotPath) {
      try {
        const screenshotBuffer = fs.readFileSync(screenshotPath);
        test.info().attach("Screenshot", {
          body: screenshotBuffer,
          contentType: "image/png",
        });
      } catch (error) {
        console.log(`Screenshot attach failed for: ${screenshotPath}`);
      }
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
  if (analysisResult.severity) {
    test.info().annotations.push({
      type: "Analysis Severity",
      description: analysisResult.severity,
    });
  }
  if (screenshotPath) {
    try {
      const screenshotBuffer = fs.readFileSync(screenshotPath);
      test.info().attach("Screenshot Analysis", {
        body: screenshotBuffer,
        contentType: "image/png",
      });
    } catch (error) {
      console.log(`Screenshot attach failed for: ${screenshotPath}`, error);
    }
  }
}

export function assertAIAnalysisResults(
  analysisResult: ScreenshotAnalysisResult | undefined,
  success: boolean,
  threshold?: number
): void {
  const effectiveThreshold = threshold ?? getScreenshotDefaults().aiThreshold;
  if (!analysisResult) {
    expect(success, `Native screenshot comparison failed`).toBe(true);
    return;
  }

  const hasCriticalIssues = analysisResult.severity === "critical";

  expect(
    success,
    `AI Analysis Result - Score: ${
      analysisResult.score
    }/100, Issues: ${analysisResult.issues.join(", ")}`
  ).toBe(true);
  expect(
    analysisResult.score,
    `AI Score: ${analysisResult.score}/100 (threshold: ${effectiveThreshold})`
  ).toBeGreaterThan(effectiveThreshold);
  expect(
    hasCriticalIssues,
    `Critical issue check - Issues detected: ${analysisResult.issues.join(
      ", "
    )}`
  ).toBe(false);
  if (analysisResult.severity) {
    expect(["low", "medium", "high"]).toContain(analysisResult.severity);
  }
}

export async function runScreenshotTestWithReport(
  screenshotTester: ScreenshotTester,
  testName: string,
  options: { threshold?: number; element?: any } = {}
) {
  const isAIMode = process.env.ENABLE_AI_ANALYSIS === "true";
  const defaults = getScreenshotDefaults();
  const testOptions = {
    testName,
    threshold:
      options.threshold ??
      (isAIMode ? defaults.aiThreshold : defaults.nativeThreshold),
    element: options.element,
  };

  const result = await screenshotTester.runScreenshotTest(testOptions);

  if (isAIMode) {
    const { analysisResult } = result;
    addAIAnalysisToReport(analysisResult, result.screenshotPath);
    assertAIAnalysisResults(
      analysisResult,
      result.success,
      testOptions.threshold
    );
  }
  return result;
}
