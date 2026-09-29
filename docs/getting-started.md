# Getting started

## Install

```bash
npm install fenneckit@latest --save-dev
```

Node.js >= 20 is required. FennecKit is an ES module package (`"type": "module"`).

## Your first lab

Create `user.labs.js`:

```ts
import { newLabs } from "fenneckit";

await newLabs("User API Test", async (kit) => {
  await kit.test("Step 1: Create User", async () => {
    kit.setStore("userId", "usr_123");
    kit.done("Stored user ID");
  });

  await kit.test("Step 2: Read User", async () => {
    const userId = kit.getStore("userId");
    kit.log(`Using user: ${userId}`);
    kit.done("Retrieved user");
  });
});
```

## Run

```bash
npx fenneckit              # run every *.labs.js file
npx fenneckit user.labs.js # run a single file
```

## Core ideas

| Term | Meaning |
| --- | --- |
| Lab | A collection of sequential tests toward one goal |
| Test | One step, run with `kit.test(name, fn)` |
| Storage | Data shared by all tests in the same lab |

Example lab layout:

```
🔬 Lab: Payment Processing
├─ Test 1: Validate Card
├─ Test 2: Charge Card
├─ Test 3: Generate Invoice
└─ Test 4: Send Receipt Email
```

## Reporting results

Inside a test, report status with:

| Method | Effect |
| --- | --- |
| `kit.done(msg)` | Test passed (🟢) |
| `kit.log(msg)` | Info message (⚪) |
| `kit.warning(msg)` | Warning (🟡) |
| `kit.flatErr(msg)` | Failure, lab **continues** (🔴) |
| `kit.err(msg)` | Failure, lab **stops** (🔴) |

## Flow control

- `kit.out()` exits the lab immediately.
- `kit.ret()` restarts the whole lab, up to 3 times. After that it calls `kit.err("Restart limit exceeded (max 3 attempts)")`.

## Isolation

Each `newLabs(...)` call has its own isolated STORE, SECRET, NAMESPACE, TEMP, HTTP client and audit log. Nothing is shared between labs or files.

## Next

- [Storage](storage.md)
- [HTTP Kit](http-kit.md)
- [API reference](api-reference.md)
