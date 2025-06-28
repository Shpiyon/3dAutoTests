import * as fs from "fs";
import * as path from "path";

export interface BaselineMetadata {
  testName: string;
  browserName: string;
}

function getSnapshotDir(): string {
  return path.join(process.cwd(), "tests");
}

export class BaselineScreenshotManager {
  static async initializeBaselines() {}

  static getBaselinePath(
    testName: string,
    browserName: string,
    testFilePath?: string
  ) {
    const platform = process.platform === "win32" ? "win32" : "linux";

    // If testFilePath is provided, use it to determine the correct snapshot directory
    if (testFilePath) {
      const testFileName = path.basename(testFilePath, ".ts");
      const snapshotDir = path.join(
        getSnapshotDir(),
        `${testFileName}-snapshots`
      );
      return path.join(
        snapshotDir,
        `${testName}-${browserName}-${platform}.png`
      );
    }

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

  static hasBaseline(
    testName: string,
    browserName: string,
    testFilePath?: string
  ) {
    return fs.existsSync(
      this.getBaselinePath(testName, browserName, testFilePath)
    );
  }

  static async saveBaseline(
    testName: string,
    screenshot: Buffer,
    metadata: BaselineMetadata,
    testFilePath?: string
  ) {
    const baselinePath = this.getBaselinePath(
      testName,
      metadata.browserName,
      testFilePath
    );
    const dir = path.dirname(baselinePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(baselinePath, screenshot);
    return baselinePath;
  }

  static loadBaseline(
    testName: string,
    browserName: string,
    testFilePath?: string
  ) {
    const baselinePath = this.getBaselinePath(
      testName,
      browserName,
      testFilePath
    );
    if (fs.existsSync(baselinePath)) {
      return fs.readFileSync(baselinePath);
    }
    return null;
  }

  static deleteBaseline(
    testName: string,
    browserName: string,
    testFilePath?: string
  ) {
    const baselinePath = this.getBaselinePath(
      testName,
      browserName,
      testFilePath
    );
    if (fs.existsSync(baselinePath)) {
      fs.unlinkSync(baselinePath);
    }
  }
}
