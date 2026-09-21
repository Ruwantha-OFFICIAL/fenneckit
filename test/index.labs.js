import { newLabs } from "../dist/index.js";
import { shuffle } from "./libs/arry.js";

// ============================================
// Lab 1: Basic Shuffle Validation
// ============================================
await newLabs("Array Shuffle - Core Validation", async (kit) => {
  const original = [0, 5, 7, 8, 9, 0, 6, 3, 5];
  const stats = kit.namespace("stats");

  await kit.test("Prepare original array", async () => {
    kit.setStore("originalArray", [...original]);
    kit.setTemp("startTime", Date.now());

    stats.set("originalLength", original.length);
    stats.set("originalSum", original.reduce((a, b) => a + b, 0));

    kit.done(`Original array prepared (${original.length} items)`);
  });

  await kit.test("Run shuffle multiple times", async () => {
    const results = [];
    let sameAsOriginalCount = 0;

    for (let i = 0; i < 10; i++) {
      const shuffled = shuffle([...original]);
      const asString = JSON.stringify(shuffled);
      results.push(asString);

      if (asString === JSON.stringify(original)) {
        sameAsOriginalCount++;
      }
    }

    kit.setStore("shuffleResults", results);
    kit.setTemp("sameAsOriginalCount", sameAsOriginalCount);

    stats.set("runs", 10);
    stats.set("identicalToOriginal", sameAsOriginalCount);

    kit.done(`Completed 10 shuffle runs`);
  });

  await kit.test("Validate shuffle quality", async () => {
    const results = kit.getStore("shuffleResults");
    const sameCount = kit.getTemp("sameAsOriginalCount");

    const uniqueResults = new Set(results).size;

    if (uniqueResults < 3) {
      kit.err(`Shuffle looks broken – only ${uniqueResults} unique results out of 10`);
    }

    if (sameCount > 7) {
      kit.warning(`Too many identical results (${sameCount}/10). Possible weak shuffle.`);
    }

    const first = JSON.parse(results[0]);
    const expectedSum = kit.namespace("stats").get("originalSum");

    if (first.length !== original.length) {
      kit.err("Shuffled array length changed!");
    }

    const actualSum = first.reduce((a, b) => a + b, 0);
    if (actualSum !== expectedSum) {
      kit.err("Shuffled array elements were modified (sum mismatch)");
    }

    kit.done(`Shuffle quality OK – ${uniqueResults} unique permutations`);
  });
});

// ============================================
// Lab 2: Performance + Security
// ============================================
await newLabs("Array Shuffle - Performance & Security", async (kit) => {
  const perf = kit.namespace("performance");
  const security = kit.namespace("security");

  await kit.test("Measure shuffle performance", async () => {
    const largeArray = Array.from({ length: 5000 }, (_, i) => i);

    const start = Date.now();
    const shuffled = shuffle(largeArray);
    const duration = Date.now() - start;

    perf.set("durationMs", duration);
    perf.set("arraySize", largeArray.length);

    // Temporary secret with TTL
    kit.setSecretWithTTL("tempSession", `session_${Date.now()}`, 15_000);

    if (duration > 100) {
      kit.warning(`Shuffle took ${duration}ms – consider optimizing for large arrays`);
    } else {
      kit.done(`Shuffle of 5000 items completed in ${duration}ms`);
    }
  });

  await kit.test("Simulate sensitive data handling", async () => {
    const fakeApiKey = "sk_live_51H8xYz...example";
    kit.setSecret("apiKey", fakeApiKey);

    const key = kit.getSecret("apiKey");
    if (!key) {
      kit.err("Failed to retrieve secret");
    }

    security.set("keyLength", key.length);
    security.set("keyPrefix", key.substring(0, 8));

    kit.done("Sensitive data stored & retrieved securely");
  });

  await kit.test("Cleanup secrets", async () => {
    kit.clearSecret("apiKey");
    const stillThere = kit.getSecret("apiKey");

    if (stillThere) {
      kit.err("Secret was not cleared!");
    } else {
      kit.done("Secrets successfully cleared");
    }
  });
});

// ============================================
// Lab 3: Final Verification & Audit
// ============================================
await newLabs("Array Shuffle - Final Verification & Audit", async (kit) => {
  await kit.test("Read data from previous labs", async () => {
    const original = kit.getStore("originalArray");
    const results = kit.getStore("shuffleResults");
    const stats = kit.getNamespace("stats");
    const perf = kit.getNamespace("performance");

    if (!original || !results) {
      kit.err("Missing data from previous labs – STORE sharing failed");
    }

    kit.log(`Original length: ${original?.length}`);
    kit.log(`Shuffle runs: ${stats?.get("runs")}`);
    kit.log(`Performance: ${perf?.get("durationMs")}ms for ${perf?.get("arraySize")} items`);

    kit.done("Successfully read cross-lab data");
  });

  await kit.test("Inspect Audit Log", async () => {
    const lastOps = kit.audit.getLast(12);
    const storeOps = kit.audit.filterByOperation("set");
    const secretOps = kit.audit.filterByOperation("setSecret");

    kit.log(`Total recent operations: ${lastOps.length}`);
    kit.log(`Store SET operations: ${storeOps.length}`);
    kit.log(`Secret operations: ${secretOps.length}`);

    if (lastOps.length === 0) {
      kit.warning("Audit log is empty – something may be wrong");
    } else {
      kit.done("Audit log looks healthy");
    }
  });

  await kit.test("Final cleanup", async () => {
    kit.clearStore("shuffleResults");
    kit.clearSecret(); // clear all secrets

    kit.done("Final cleanup completed");
  });
});