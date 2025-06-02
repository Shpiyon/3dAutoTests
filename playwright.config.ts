import * as dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config();

export default defineConfig({
  timeout: 180000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: { threshold: 0.3 },
  },
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  use: {
    headless: !!process.env.CI,
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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
