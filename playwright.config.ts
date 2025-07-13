import * as dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config();

export default defineConfig({
  timeout: process.env.CI === "true" ? 300000 : 60000,
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: process.env.CI === "true",
  retries: process.env.CI === "true" ? 1 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "https://interpres.live/src/test_breig/",
    headless: process.env.CI === "true",
    launchOptions: {
      args: [
        "--enable-gpu",
        "--enable-webgl",
        "--enable-webgl2",
        "--enable-unsafe-webgpu",
        "--max_old_space_size=4096",
      ],
    },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    navigationTimeout: 45000,
  },
  metadata: {
    screenshotDefaults: {
      aiThreshold: 75,
      nativeThreshold: 0.9,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
