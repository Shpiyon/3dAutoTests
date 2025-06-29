import { test } from "@playwright/test";

export function getScreenshotDefaults() {
  const testInfo = test.info();
  const metadata = testInfo.config.metadata as any;

  return {
    aiThreshold: metadata?.screenshotDefaults?.aiThreshold ?? 75,
    nativeThreshold: metadata?.screenshotDefaults?.nativeThreshold ?? 0.9,
  };
}
