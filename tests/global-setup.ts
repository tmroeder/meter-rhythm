import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// Always test the current source, never a stale build/.
export default function globalSetup() {
    const root = path.resolve(__dirname, "..");
    execFileSync(path.join(root, "build.sh"), { cwd: root, stdio: "inherit" });
    compileJavaOracle(root);
}

// Compiled once here rather than by each worker: workers compiling into the
// same directory read each other's half-written class files.
function compileJavaOracle(root: string): void {
    if (spawnSync("javac", ["-version"]).status !== 0) return;
    const java = path.join(root, "tests", "java");
    const classes = path.join(root, "build", "java-oracle-classes");
    fs.rmSync(classes, { recursive: true, force: true });
    fs.mkdirSync(classes, { recursive: true });
    const sources = ["original/Rhythm.java", "original/CoordinateArea.java", "Oracle.java"]
        .map((f) => path.join(java, f));
    execFileSync("javac", ["-nowarn", "-d", classes, ...sources], { stdio: "pipe" });
}
