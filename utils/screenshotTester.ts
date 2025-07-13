import { Page, Browser, expect, Locator } from "@playwright/test";
import { BaselineScreenshotManager } from "./baselineScreenshotManager";
import {
  AIScreenshotAnalyzer,
  ComparisonAnalysisResult,
} from "./aiScreenshotAnalyzer";
import { getScreenshotDefaults } from "./configUtils";
import * as fs from "fs";
import * as path from "path";

export interface ScreenshotTestOptions {
  testName: string;
  threshold?: number;
  element?: any;
}

export interface ScreenshotTestResult {
  success: boolean;
  isBaseline: boolean;
  analysisResult?: ComparisonAnalysisResult;
  nativeResult?: { passed: boolean; diffPath?: string };
  screenshotPath?: string;
  baselinePath?: string;
}

export class ScreenshotTester {
  constructor(private page: Page, private browser: Browser) {}

  async runScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    return process.env.ENABLE_AI_ANALYSIS === "true"
      ? this.runAIScreenshotTest(options)
      : this.runNativeScreenshotTest(options);
  }

  private async runNativeScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    const defaults = getScreenshotDefaults();
    const { testName, threshold = defaults.nativeThreshold, element } = options;

    try {
      if (element) {
        await expect(element).toHaveScreenshot(`${testName}.png`, {
          threshold,
        });
      } else {
        await expect(this.page).toHaveScreenshot(`${testName}.png`, {
          fullPage: true,
          threshold,
        });
      }
      return {
        success: true,
        isBaseline: false,
        nativeResult: { passed: true },
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
      };
    }
  }

  private async runAIScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    const defaults = getScreenshotDefaults();
    const { testName, threshold = defaults.aiThreshold, element } = options;
    const browserName = this.browser.browserType().name();

    const screenshot = await this.takeScreenshot({ element });
    const screenshotPath = await this.saveScreenshot(testName, screenshot);

    const testInfo = require("@playwright/test").test.info();
    const testFilePath = testInfo?.file;

    const baseline = BaselineScreenshotManager.loadBaseline(
      testName,
      browserName,
      testFilePath
    );

    if (!baseline) {
      throw new Error(
        `No baseline found for ${testName}. Ensure snapshots are generated first.`
      );
    }

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
        browserName,
        testFilePath
      ),
    };
  }

  async takeScreenshot(options?: { element?: Locator }): Promise<Buffer> {
    return options?.element
      ? await this.takeElementScreenshot(options.element)
      : await this.takeFullPageScreenshot();
  }

  private async takeElementScreenshot(element: Locator): Promise<Buffer> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await element.screenshot();
      } catch (error) {
        if (attempt === 3) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
    throw new Error("Element screenshot failed");
  }

  private async takeFullPageScreenshot(): Promise<Buffer> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.page.screenshot();
      } catch (error) {
        if (attempt === 3) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
    throw new Error("Full page screenshot failed");
  }

  async saveScreenshot(testName: string, screenshot: Buffer): Promise<string> {
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
