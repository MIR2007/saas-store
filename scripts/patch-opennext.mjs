/**
 * Windows-only compatibility patch for @opennextjs/aws.
 *
 * Next.js creates directory junctions inside `.next/standalone` for traced
 * external packages (e.g. @prisma/client). OpenNext copies the traced files
 * and recreates them as symbolic links, which fails with EPERM on Windows
 * unless Developer Mode / admin privileges are enabled. Junctions do not need
 * those privileges, so we fall back to them.
 *
 * This script is idempotent and runs from `postinstall`.
 */
import fs from "node:fs";
import path from "node:path";

const target = path.join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "aws",
  "dist",
  "build",
  "copyTracedFiles.js"
);

if (process.platform !== "win32" || !fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, "utf8");
if (source.includes('symlinkSync(symlink, to, "junction")')) {
  process.exit(0);
}

const oldBlock = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;

const newBlock = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code === "EEXIST") {
                    // already linked
                }
                else if (process.platform === "win32" && (e.code === "EPERM" || e.code === "EACCES")) {
                    // Windows needs Developer Mode/admin for symbolic links, but
                    // junctions work for directories without extra privileges.
                    try {
                        symlinkSync(symlink, to, "junction");
                    }
                    catch (e2) {
                        if (e2.code !== "EEXIST") {
                            throw e2;
                        }
                    }
                }
                else {
                    throw e;
                }
            }
        }`;

if (!source.includes(oldBlock)) {
  console.warn("[patch-opennext] copyTracedFiles.js layout changed; skipping patch.");
  process.exit(0);
}

fs.writeFileSync(target, source.replace(oldBlock, newBlock));
console.log("[patch-opennext] Applied Windows junction fallback.");
