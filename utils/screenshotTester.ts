import { Page, Browser, expect } from "@playwright/test";
import { BaselineScreenshotManager } from "./baselineScreenshotManager";
import {
  AIScreenshotAnalyzer,
  ComparisonAnalysisResult,
} from "./aiScreenshotAnalyzer";

export interface ScreenshotTestOptions {
  testName: string;
  threshold?: number;
}

export interface ScreenshotTestResult {
  success: boolean;
  isBaseline: boolean;
  analysisResult?: ComparisonAnalysisResult;
  nativeResult?: { passed: boolean; diffPath?: string };
  screenshotPath?: string;
  baselinePath?: string;
  comparisonMode: "ai" | "native";
}

export class ScreenshotTester {
  constructor(private page: Page, private browser: Browser) {}

  async runScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    await this.page.waitForLoadState("networkidle");
    return process.env.ENABLE_AI_ANALYSIS === "true"
      ? this.runAIScreenshotTest(options)
      : this.runNativeScreenshotTest(options);
  }

  private async runNativeScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    try {
      await expect(this.page).toHaveScreenshot(`${options.testName}.png`, {
        fullPage: true,
        threshold: 0.3,
      });
      return {
        success: true,
        isBaseline: false,
        nativeResult: { passed: true },
        comparisonMode: "native",
      };
    } catch {
      const testInfo = require("@playwright/test").test.info();
      return {
        success: false,
        isBaseline: false,
        nativeResult: {
          passed: false,
          diffPath: `${testInfo.outputDir}/${options.testName}-diff.png`,
        },
        screenshotPath: `${testInfo.outputDir}/${options.testName}-actual.png`,
        comparisonMode: "native",
      };
    }
  }

  private async runAIScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    const { testName, threshold = 75 } = options;
    const browserName = this.browser.browserType().name();
    const screenshot = await this.takeScreenshot();
    const screenshotPath = await this.saveScreenshot(testName, screenshot);

    if (!BaselineScreenshotManager.hasBaseline(testName, browserName)) {
      await BaselineScreenshotManager.saveBaseline(testName, screenshot, {
        testName,
        createdAt: new Date().toISOString(),
        browserName,
        viewportSize: this.page.viewportSize() || { width: 1280, height: 720 },
        url: this.page.url(),
      });
      return {
        success: true,
        isBaseline: true,
        screenshotPath,
        comparisonMode: "ai",
      };
    }

    const baseline = BaselineScreenshotManager.loadBaseline(
      testName,
      browserName
    );
    if (!baseline) throw new Error("Baseline image could not be loaded.");

    const comparisonResult = await AIScreenshotAnalyzer.compareWithBaseline(
      baseline.toString("base64"),
      screenshot.toString("base64"),
      { testName, url: this.page.url(), browserName }
    );

    return {
      success:
        comparisonResult.score >= threshold &&
        comparisonResult.regressionSeverity !== "critical",
      isBaseline: false,
      analysisResult: comparisonResult,
      screenshotPath,
      baselinePath: BaselineScreenshotManager.getBaselinePath(
        testName,
        browserName
      ),
      comparisonMode: "ai",
    };
  }

  private async takeScreenshot(): Promise<Buffer> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.page.screenshot({ fullPage: true, type: "png" });
      } catch (err) {
        if (attempt === 3)
          throw err instanceof Error ? err : new Error(String(err));
        await this.page.waitForTimeout(1000);
      }
    }
    throw new Error("Screenshot failed");
  }

  private async saveScreenshot(
    testName: string,
    screenshot: Buffer
  ): Promise<string> {
    const fs = require("fs"),
      path = require("path");
    const resultsDir = "test-results";
    if (!fs.existsSync(resultsDir))
      fs.mkdirSync(resultsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const screenshotPath = path.join(
      resultsDir,
      `${testName}_${timestamp}.png`
    );
    fs.writeFileSync(screenshotPath, screenshot);
    return screenshotPath;
  }
}
