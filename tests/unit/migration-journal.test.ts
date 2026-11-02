import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const journal = JSON.parse(fs.readFileSync(path.join(root, "drizzle/meta/_journal.json"), "utf8"));

describe("Drizzle migration journal", () => {
  it("includes every migration file in sequential order", () => {
    const tags = journal.entries.map((entry: { tag: string }) => entry.tag);
    const files = fs
      .readdirSync(path.join(root, "drizzle"))
      .filter((file) => /^\d{4}_.*\.sql$/.test(file))
      .map((file) => file.replace(/\.sql$/, ""))
      .sort();

    expect(tags).toEqual(files);
    expect(journal.entries.map((entry: { idx: number }) => entry.idx)).toEqual(
      journal.entries.map((_: unknown, index: number) => index),
    );
  });

  it("keeps the invitation migration before exam attempt starts", () => {
    const idx = (tag: string) => journal.entries.find((entry: { tag: string }) => entry.tag === tag)?.idx;
    expect(idx("0002_student_invitations")).toBeLessThan(idx("0003_exam_attempt_starts"));
    expect(idx("0005_session_token_hash")).toBeGreaterThan(idx("0004_exam_schema_reconciliation"));
  });
});
