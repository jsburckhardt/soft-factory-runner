import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AgentResultV1 } from "./domain";
import { publishAgentResult } from "./integration";
import {
  NodeFilePort,
  type PublicationOperation,
  type PublicationStep,
} from "./live";

const steps: readonly PublicationStep[] = [
  "temporary-created",
  "temporary-synced",
  "before-publish",
  "published",
  "directory-synced",
];
const sha = "a".repeat(40);
const binding = {
  issueNumber: 19,
  branch: "feat/19-contract",
  headSha: sha,
  prNumber: 119,
  requiredAcceptanceCriteria: [{ id: "AC-1", text: "proof" }],
  requiredFinalValidation: { command: "just verify" },
};
function result(completedAt: string): AgentResultV1 {
  return {
    schemaVersion: 1,
    issueNumber: 19,
    outcome: "succeeded",
    branch: binding.branch,
    headSha: sha,
    prNumber: 119,
    acceptanceCriteria: [
      { id: "AC-1", status: "verified", evidence: ["fixture:AC-1"] },
    ],
    validations: [],
    requiredFinalValidation: {
      command: "just verify",
      status: "passed",
      evidence: ["fixture:verify"],
    },
    completedAt,
  };
}
async function temporary(
  run: (directory: string) => Promise<void>,
): Promise<void> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sf-publication-"));
  try {
    await run(directory);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
async function sampleWhile(
  destination: string,
  operation: Promise<unknown>,
): Promise<readonly string[]> {
  const samples: string[] = [];
  let settled = false;
  void operation.finally(() => {
    settled = true;
  });
  while (!settled) {
    try {
      samples.push(await fs.readFile(destination, "utf8"));
    } catch (cause: unknown) {
      if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  try {
    samples.push(await fs.readFile(destination, "utf8"));
  } catch (cause: unknown) {
    if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
  }
  await operation.catch(() => undefined);
  return samples;
}
function faulting(
  operation: PublicationOperation,
  failedStep: PublicationStep,
): NodeFilePort {
  return new NodeFilePort({
    step: async (observedOperation, observedStep) => {
      if (observedOperation === operation && observedStep === failedStep)
        throw new Error("fault:" + operation + ":" + failedStep);
    },
  });
}
function temporaries(entries: readonly string[]): readonly string[] {
  return entries.filter((name) => name.includes(".tmp-"));
}

describe("V-7 real filesystem publication concurrency and faults", () => {
  it("shows concurrent mutable readers only complete old or new identity documents", async () => {
    await temporary(async (directory) => {
      const files = new NodeFilePort();
      const destination = path.join(directory, "rpiv-status.json");
      const oldDocument =
        JSON.stringify({ runId: "run-old", payload: "o".repeat(4096) }) + "\n";
      const newDocument =
        JSON.stringify({ runId: "run-new", payload: "n".repeat(4096) }) + "\n";
      await files.atomicWrite(destination, oldDocument);
      const writes = Promise.all(
        Array.from({ length: 24 }, (_, index) =>
          files.atomicWrite(
            destination,
            index % 2 === 0 ? newDocument : oldDocument,
          ),
        ),
      );
      const samples = await sampleWhile(destination, writes);
      await writes;
      expect(samples.length).toBeGreaterThan(1);
      for (const sample of samples) {
        expect([oldDocument, newDocument]).toContain(sample);
        const parsed = JSON.parse(sample) as { runId: string; payload: string };
        expect(
          (parsed.runId === "run-old" && parsed.payload.startsWith("o")) ||
            (parsed.runId === "run-new" && parsed.payload.startsWith("n")),
        ).toBe(true);
      }
      expect(temporaries(await fs.readdir(directory))).toEqual([]);
    });
  });

  it("gives immutable AgentResultV1 publication one winner without clobber", async () => {
    await temporary(async (directory) => {
      const files = new NodeFilePort();
      const destination = path.join(directory, "agent-result.json");
      const candidates = Array.from({ length: 12 }, (_, index) =>
        JSON.stringify(
          result(
            "2026-08-12T08:00:" + String(index).padStart(2, "0") + ".000Z",
          ),
        ),
      );
      const publications = Promise.allSettled(
        candidates.map((candidate) =>
          publishAgentResult(files, destination, candidate, binding),
        ),
      );
      const samples = await sampleWhile(destination, publications);
      const settled = await publications;
      expect(
        settled.filter((entry) => entry.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        settled.filter((entry) => entry.status === "rejected"),
      ).toHaveLength(11);
      const installed = await fs.readFile(destination, "utf8");
      expect(
        candidates.map(
          (entry) => JSON.stringify(JSON.parse(entry), null, 2) + "\n",
        ),
      ).toContain(installed);
      for (const sample of samples) expect(sample).toBe(installed);
      expect(temporaries(await fs.readdir(directory))).toEqual([]);
    });
  });

  it.each(steps)(
    "keeps mutable destination complete when %s faults",
    async (step) => {
      await temporary(async (directory) => {
        const destination = path.join(directory, "rpiv-status.json");
        const oldDocument =
          JSON.stringify({ runId: "old", complete: true }) + "\n";
        const newDocument =
          JSON.stringify({ runId: "new", complete: true }) + "\n";
        await new NodeFilePort().atomicWrite(destination, oldDocument);
        await expect(
          faulting("mutable", step).atomicWrite(destination, newDocument),
        ).rejects.toThrow("atomically write");
        const installed = await fs.readFile(destination, "utf8");
        expect([oldDocument, newDocument]).toContain(installed);
        expect(JSON.parse(installed)).toMatchObject({ complete: true });
        expect(temporaries(await fs.readdir(directory))).toEqual([]);
      });
    },
  );

  it.each(steps)(
    "never leaves a partial immutable result when %s faults",
    async (step) => {
      await temporary(async (directory) => {
        const destination = path.join(directory, "agent-result.json");
        const document =
          JSON.stringify(result("2026-08-12T08:00:00.000Z"), null, 2) + "\n";
        await expect(
          faulting("immutable", step).immutableWrite(destination, document),
        ).rejects.toThrow("immutably publish");
        let installed: string | null = null;
        try {
          installed = await fs.readFile(destination, "utf8");
        } catch (cause: unknown) {
          if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
        }
        expect(installed === null || installed === document).toBe(true);
        expect(temporaries(await fs.readdir(directory))).toEqual([]);
      });
    },
  );

  it("preserves an existing immutable destination under every competing write", async () => {
    await temporary(async (directory) => {
      const destination = path.join(directory, "agent-result.json");
      const existing =
        JSON.stringify(result("2026-08-12T08:00:00.000Z"), null, 2) + "\n";
      await fs.writeFile(destination, existing);
      for (const step of steps) {
        const outcome = await faulting("immutable", step)
          .immutableWrite(destination, existing + " ")
          .catch(() => false);
        expect(outcome).toBe(false);
        expect(await fs.readFile(destination, "utf8")).toBe(existing);
      }
      expect(await fs.readFile(destination, "utf8")).toBe(existing);
    });
  });
});
