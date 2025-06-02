import * as fs from "fs";
import * as path from "path";

export interface BaselineMetadata {
  testName: string;
  createdAt: string;
  browserName: string;
  viewportSize: { width: number; height: number };
  url: string;
}

function getSnapshotDir(): string {
  return path.join(process.cwd(), "tests");
}

export class BaselineScreenshotManager {
  static async initializeBaselines() {}

  static getBaselinePath(testName: string, browserName: string) {
    const platform = process.platform === "win32" ? "win32" : "linux";

    const testDirs = fs
      .readdirSync(getSnapshotDir())
      .filter((dir) => dir.endsWith(".spec.ts-snapshots"))
      .map((dir) => path.join(getSnapshotDir(), dir));

    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        const snapshotFile = path.join(
          dir,
          `${testName}-${browserName}-${platform}.png`
        );
        if (fs.existsSync(snapshotFile)) {
          return snapshotFile;
        }
      }
    }

    const defaultDir =
      testDirs[0] || path.join(getSnapshotDir(), "home.spec.ts-snapshots");
    return path.join(defaultDir, `${testName}-${browserName}-${platform}.png`);
  }

  static hasBaseline(testName: string, browserName: string) {
    return fs.existsSync(this.getBaselinePath(testName, browserName));
  }

  static async saveBaseline(
    testName: string,
    screenshot: Buffer,
    metadata: BaselineMetadata
  ) {
    const baselinePath = this.getBaselinePath(testName, metadata.browserName);
    const dir = path.dirname(baselinePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(baselinePath, screenshot);
    return baselinePath;
  }

  static loadBaseline(testName: string, browserName: string) {
    const baselinePath = this.getBaselinePath(testName, browserName);
    if (fs.existsSync(baselinePath)) {
      return fs.readFileSync(baselinePath);
    }
    return null;
  }

  static deleteBaseline(testName: string, browserName: string) {
    const baselinePath = this.getBaselinePath(testName, browserName);
    if (fs.existsSync(baselinePath)) {
      fs.unlinkSync(baselinePath);
    }
  }
}
