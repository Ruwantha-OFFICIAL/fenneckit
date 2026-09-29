# 🦊 FennecKit

![logo](./fenneckit.png)

<div align="center">
  
[![npm version](https://img.shields.io/npm/v/fenneckit?style=flat-square&color=3178c6&logo=npm)](https://www.npmjs.com/package/fenneckit)
[![npm downloads](https://img.shields.io/npm/dm/fenneckit?style=flat-square&logo=npm)](https://www.npmjs.com/package/fenneckit)

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](LICENSE)

</div>
**Lab-based testing utility.** Sequential tests that share data, zero config, encrypted secrets, and a built-in HTTP client.

## Why FennecKit?

In Jest/Vitest every test starts fresh, so multi-step workflows (create user → read user → delete user) need mocks or duplicated setup. In FennecKit, tests inside one **Lab** run in order and share data.

```ts
import { newLabs } from "fenneckit";

await newLabs("User API", async (kit) => {
  await kit.test("Create User", async () => {
    const res = await kit.http.post("https://api.example.com/users", {
      name: "John",
    });
    kit.setStore("userId", res.data.id);
    kit.done("User created");
  });

  await kit.test("Get User", async () => {
    const res = await kit.http.get(
      `https://api.example.com/users/${kit.getStore("userId")}`,
    );
    kit.done(`Status ${res.status}`);
  });
});
```

## Install

```bash
npm install fenneckit@latest --save-dev
```

Requires Node.js >= 20.

## Run

```bash
npx fenneckit              # auto-discover and run all *.labs.js files
npx fenneckit user.labs.js # run one file
```

## Concepts

- **Lab**: a group of sequential tests working toward one goal.
- **Test**: one step inside a lab, run with `kit.test(name, fn)`.
- **Storage**: data shared between tests of the same lab (see below).

## Features

| Feature      | What it does                               | Docs                                       |
| ------------ | ------------------------------------------ | ------------------------------------------ |
| 🔬 Labs      | Group tests into workflows                 | [Getting started](docs/getting-started.md) |
| 📦 STORE     | Plain shared data                          | [Storage](docs/storage.md)                 |
| 🔐 SECRET    | AES-256-GCM encrypted data                 | [Storage](docs/storage.md#secret)          |
| 🗂️ NAMESPACE | Grouped data per entity                    | [Storage](docs/storage.md#namespace)       |
| ⏱️ TEMP      | Lab-local scratch data                     | [Storage](docs/storage.md#temp)            |
| ⏰ TTL       | Auto-expiring STORE/SECRET values          | [Storage](docs/storage.md#ttl)             |
| 📡 HTTP Kit  | Client with auth, retry, history           | [HTTP Kit](docs/http-kit.md)               |
| 📋 Audit Log | Trace store/secret access, export JSON/CSV | [Audit log](docs/audit-log.md)             |

## Documentation

- [Getting started](docs/getting-started.md)
- [Storage (STORE, SECRET, NAMESPACE, TEMP, TTL)](docs/storage.md)
- [HTTP Kit](docs/http-kit.md)
- [Audit log](docs/audit-log.md)
- [API reference](docs/api-reference.md)
- [Best practices](docs/best-practices.md)
- [Changelog](docs/changelog.md)

## License

MIT. Copyright © 2026 Lasith Ruwantha Amrwansha.
