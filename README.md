# 🦊 FennecKit: Lab-Based Testing & Development Utility

![logo](./fenneckit.png)

```bash 
npm install fenneckit@latest --save-dev
npx fenneckit --help
```

**English**: A Complete Storage + Security + API Testing System for Practical and Seamless Data Analysis

**Zero Config** • Sequential Labs • Inter-Lab Data Sharing (within the same file) • Store Management • Encrypted Secrets • Namespaces • Audit Log • HTTP Testing Kit

**🦊Example** : soon

---

## 🎯 What is FennecKit?

FennecKit is a lightweight, **zero-config** testing & development utility built around the concept of **Labs**.

### What is a "Lab"?

A **Lab** is a collection of sequential tasks (a workflow) that together accomplish one objective.

**Examples**:
- User Registration Lab → create user → validate → save to DB → send email
- Payment Processing Lab → validate → charge → generate invoice
- API Testing Lab → hit endpoints → verify responses → check side effects

```typescript
// Lab = Collection of sequential tasks
await newLabs("User Registration Lab", async (kit) => {
  await kit.test("Validate Email", async () => {
    kit.done("Email validated");
  });

  await kit.test("Save to Database", async () => {
    kit.done("User saved");
  });

  await kit.test("Send Verification Email", async () => {
    kit.done("Email sent");
  });
});
```

---

## ⚡ Zero Config & Runner

FennecKit requires **no configuration files**.

### How to run

```bash
# Run a specific lab file
npx fenneckit lab.js

# Or just
npx fenneckit

# The runner automatically finds all *.labs.js / *.labs.ts files
# and executes them one after another (sequentially)
```

**What the runner does**:
1. Discovers lab files in the current directory (and subdirectories if configured)
2. Runs each file **one by one**
3. Inside each file, Labs run in the order they are written
4. Generates a report (`fenneckit.md`) after execution

> **Important limitation**  
> Data sharing (`setStore` / `getStore` / secrets / namespaces) only works **inside the same file**.  
> Different lab files **cannot** share STORE, TEMP, Secrets or Namespaces with each other.

---

## 🌳 Data Sharing Hierarchy (Tree Structure)

```
📁 FennecKit Execution
│
├─ 📄 file1.labs.js (STORE Instance #1 + SecretVault + Namespaces)
│  │
│  ├─ 🔬 Lab 1 (User Registration)
│  │  ├─ 📝 Test 1: Create User
│  │  │  ├─ STORE: {"userId": "123"} ✅ Shared with Lab 2
│  │  │  ├─ SECRET: encrypted token ✅ Shared with Lab 2
│  │  │  ├─ NAMESPACE "user": {...} ✅ Shared with Lab 2
│  │  │  └─ TEMP: {"token": "abc"} ❌ Only here
│  │  │
│  │  └─ 📝 Test 2: Send Email
│  │     └─ Can access STORE / SECRET / Namespaces from Test 1
│  │
│  ├─ 🔬 Lab 2 (Authentication)
│  │  ├─ 📝 Test 1: Generate Token
│  │  │  ├─ STORE: {"userId": "123"} ✅ From Lab 1
│  │  │  ├─ SECRET / Namespace ✅ From Lab 1
│  │  │  └─ TEMP: {"token": "new"} ❌ Only here
│  │  │
│  │  └─ 📝 Test 2: Verify Token
│  │     └─ Can access STORE / SECRET / Namespaces from Labs 1 & 2
│  │
│  └─ 🔬 Lab 3 (Cleanup)
│     └─ File STORE + Secrets + Namespaces cleared when execution ends
│
├─ 📄 file2.labs.js (Completely ISOLATED)
│  └─ ❌ CANNOT access anything from file1.labs.js
│
└─ 📄 file3.labs.js (Completely ISOLATED)
   └─ ❌ Isolated from all other files
```

### Understanding the Hierarchy

**🔴 Level 1: Different Files = NO Data Sharing**  
Each file gets its own isolated STORE, SecretVault and Namespaces.

**🟡 Level 2: Same File, Different Labs = STORE + Secrets + Namespaces Sharing**  
Data set in Lab 1 is available in Lab 2, Lab 3, etc. (until cleared).

**🟢 Level 3: Same Lab, Different Tests = STORE + TEMP + Secrets + Namespaces Sharing**  
TEMP is automatically cleared when the Lab ends. Everything else remains.

---

## 🔗 Data Communication Between Labs (Inter-Lab Communication)

### The Problem with Jest / Vitest

In Jest and Vitest every test is isolated. You cannot pass data from one test to another.

### FennecKit Solution – Storage Levels (v1.2.0)

```
┌─────────────────────────────────────────────────────────────┐
│         FennecKit Storage System (Per File)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LEVEL 1: FILE SCOPE                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ STORE (Global - Persistent within file)              │  │
│  │ ├─ Shared across ALL Labs in this file               │  │
│  │ ├─ Available until file execution ends               │  │
│  │ ├─ Can be manually cleared with clearStore()         │  │
│  │ └─ Example: userId, orderData, status                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  LEVEL 2: ENCRYPTED SECRETS (AES-256-GCM)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SECRET VAULT                                         │  │
│  │ ├─ Encrypted at rest inside the process              │  │
│  │ ├─ Shared across Labs in the same file               │  │
│  │ ├─ setSecret / getSecret / clearSecret               │  │
│  │ └─ Example: auth tokens, API keys, passwords         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  LEVEL 3: NAMESPACES                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ kit.namespace("user") / kit.namespace("order")       │  │
│  │ ├─ Isolated key-value stores                         │  │
│  │ ├─ Shared across Labs in the same file               │  │
│  │ └─ Perfect for grouping related data                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  LEVEL 4: LAB-LOCAL SCOPE                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ TEMP (Local - Auto-Cleaned)                          │  │
│  │ ├─ Only available inside current Lab                 │  │
│  │ ├─ Automatically cleared when Lab ends               │  │
│  │ └─ Example: timestamps, temp calculations            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 NEW in v1.2.0: Secret Vault (AES-256-GCM)

Sensitive data should never live in plain STORE.

```typescript
await newLabs("Auth Lab", async (kit) => {
  await kit.test("Login", async () => {
    // Encrypted storage
    kit.setSecret("accessToken", "eyJhbGciOiJIUzI1NiIs...");
    kit.setSecret("refreshToken", "rt_abc123");

    kit.done("Tokens stored securely");
  });

  await kit.test("Use Token", async () => {
    const token = kit.getSecret("accessToken"); // decrypted on the fly
    kit.http.setAuth("bearer", token!);
    kit.done("Token retrieved");
  });

  await kit.test("Cleanup", async () => {
    kit.clearSecret("accessToken");     // remove one key
    // kit.clearSecret();               // clear entire vault
    kit.done("Secrets cleared");
  });
});
```

**TTL Support for Secrets**
```typescript
kit.setSecretWithTTL("tempToken", "abc123", 30_000); // auto-delete after 30s
```

---

## 🗂️ NEW in v1.2.0: Namespaced Store

Organize data into logical groups.

```typescript
await newLabs("E-Commerce Flow", async (kit) => {
  const user = kit.namespace("user");
  const order = kit.namespace("order");
  const cart = kit.namespace("cart");

  await kit.test("Register", async () => {
    user.set("id", "usr_123");
    user.set("email", "john@example.com");
    kit.done("User namespace populated");
  });

  await kit.test("Create Order", async () => {
    order.set("id", "ord_456");
    order.set("total", 299.99);
    kit.done("Order namespace populated");
  });

  await kit.test("Read Later", async () => {
    const userId = kit.getNamespace("user")?.get("id"); // "usr_123"
    const total  = order.get("total");                  // 299.99
    kit.done(`User ${userId} ordered ${total}`);
  });
});
```

---

## 📡 NEW in v1.2.0: HTTP Kit (API Testing)

Built-in HTTP client with auth, retries, history and tracing.

```typescript
await newLabs("API Smoke Test", async (kit) => {
  // Set auth once
  kit.http.setAuth("bearer", "your-token");
  // or kit.http.setAuth("basic", "base64creds");
  // or kit.http.setAuth("api-key", "key123");

  await kit.test("GET Users", async () => {
    const res = await kit.http.get("https://api.example.com/users", {
      timeout: 5000,
      retry: { max: 3, delay: 1000 }
    });

    if (res.status !== 200) {
      kit.err(`Expected 200, got ${res.status}`);
    }

    kit.setStore("users", res.data);
    kit.done(`Fetched ${res.data.length} users`);
  });

  await kit.test("POST Order", async () => {
    const res = await kit.http.post("https://api.example.com/orders", {
      productId: "prod_1",
      qty: 2
    });

    kit.done(`Order created: ${res.data.id}`);
  });

  // Inspect request history
  await kit.test("Check History", async () => {
    const last = kit.http.getLastRequest();
    kit.log(`Last request took ${last?.duration}ms`);
  });
});
```

**Available methods**:
- `kit.http.get / post / put / patch / delete`
- `kit.http.setAuth(type, credentials)` / `clearAuth()`
- `kit.http.getRequestHistory()` / `getLastRequest()` / `clearHistory()`

---

## 📋 NEW in v1.2.0: Audit Log

Every STORE / SECRET operation is automatically recorded.

```typescript
await newLabs("Audit Demo", async (kit) => {
  await kit.test("Operations", async () => {
    kit.setStore("userId", "123");
    kit.setSecret("token", "secret");
    kit.getStore("userId");
  });

  await kit.test("Inspect Audit", async () => {
    const last5 = kit.audit.getLast(5);
    const byKey = kit.audit.filterByKey("token");
    const json  = kit.audit.export("json");
    const csv   = kit.audit.export("csv");

    kit.log(`Recorded ${last5.length} operations`);
  });
});
```

---

## 🧹 clearStore() & clearSecret()

```typescript
// Clear specific key
kit.clearStore("authToken");
kit.clearSecret("accessToken");

// Clear everything
kit.clearStore();
kit.clearSecret();
```

---

## ⏰ TTL Support (Time-To-Live)

```typescript
// Auto-expire after 10 seconds
kit.setStoreWithTTL("sessionId", "sess_abc", 10_000);
kit.setSecretWithTTL("tempKey", "value", 30_000);
```

---

## 🛠️ LabContext Methods (v1.2.0)

```typescript
interface LabContext {
  // Testing & Flow
  test(name: string, fn: () => Promise<any>): Promise<any>
  done(msg: string): void
  err(msg: string): void          // stops the Lab
  flatErr(msg: string): void      // continues
  log(msg: string): void
  warning(msg: string): void

  // Flow control
  out(): void                     // exit Lab immediately
  ret(): void                     // restart Lab (max 3 times)

  // Persistent STORE
  setStore(key: string, value: any): void
  getStore(key: string): any
  clearStore(key?: string): void
  setStoreWithTTL(key: string, value: any, ttlMs: number): void

  // Encrypted Secrets (AES-256-GCM)
  setSecret(key: string, value: string): void
  getSecret(key: string): string | undefined
  clearSecret(key?: string): void
  setSecretWithTTL(key: string, value: string, ttlMs: number): void

  // Namespaces
  namespace(name: string): NamespacedStore
  getNamespace(name: string): NamespacedStore | undefined

  // Temporary (Lab-local only)
  setTemp(key: string, value: any): void
  getTemp(key: string): any

  // HTTP Kit
  http: HttpKit

  // Audit Log
  audit: AuditLog
}
```

---

## 💡 Real-World Example (v1.2.0)

```typescript
import { newLabs } from "fenneckit";

await newLabs("E-Commerce API Test", async (kit) => {
  const user  = kit.namespace("user");
  const order = kit.namespace("order");

  await kit.test("Register User", async () => {
    const res = await kit.http.post("https://api.shop.com/auth/register", {
      email: "test@example.com",
      password: "secure123"
    });

    user.set("id", res.data.id);
    kit.setSecret("token", res.data.token);          // encrypted
    kit.http.setAuth("bearer", res.data.token);

    kit.done("User registered");
  });

  await kit.test("Create Order", async () => {
    const res = await kit.http.post("https://api.shop.com/orders", {
      items: [{ id: "prod_1", qty: 2 }]
    });

    order.set("id", res.data.orderId);
    order.set("total", res.data.total);
    kit.done(`Order created: ${res.data.orderId}`);
  });

  await kit.test("Security Cleanup", async () => {
    kit.clearSecret("token");                        // remove sensitive data
    kit.done("Secrets cleared");
  });

  await kit.test("Audit Check", async () => {
    const log = kit.audit.getLast(10);
    kit.log(`Audit entries: ${log.length}`);
  });
});
```

---

## 📊 Storage Lifecycle (per file)

```
FILE EXECUTION START
│
├─ Lab 1
│  ├─ setStore / setSecret / namespace.set → kept across Labs
│  ├─ setTemp → kept only for this Lab
│  ├─ clearStore / clearSecret → optional cleanup
│  └─ Lab ends → TEMP cleared, everything else remains
│
├─ Lab 2
│  ├─ getStore / getSecret / namespace.get → works
│  └─ Lab ends → TEMP cleared
│
└─ FILE END → STORE + Secrets + Namespaces completely cleared
```

---

## 🎯 Best Practices (v1.2.0)

1. **Secrets always go into the Vault**
   ```typescript
   kit.setSecret("token", token);   // ✅
   kit.setStore("token", token);    // ❌ avoid
   ```

2. **Use namespaces for related data**
   ```typescript
   const user = kit.namespace("user");
   user.set("id", id);
   user.set("email", email);
   ```

3. **Clear sensitive data when no longer needed**
   ```typescript
   kit.clearSecret("accessToken");
   kit.clearStore("creditCard");
   ```

4. **Check before use**
   ```typescript
   const token = kit.getSecret("token");
   if (!token) kit.err("Token missing!");
   ```

5. **Never rely on cross-file sharing** – write to disk/DB if needed.

---

## 🎨 Color / Status Legend

- `✅` / `🟢` Success  
- `❌` / `🔴` Failed (Lab continues)  
- `🛑` Error (Lab stops)  
- `⚠️` / `🟡` Warning  
- `📝` / `⚪` Info  
- `⚙️` Store operation  
- `🔐` Secret operation  
- `⏱️` Temp operation  
- `🧹` Clear operation  
- `⏰` TTL expiration  

---

## 💪 Perfect For

- Backend API testing (Express, Fastify, NestJS, etc.)
- Security-conscious test flows (tokens, keys)
- Database migration validation
- Microservice chaining
- Pre-deployment smoke checks
- State management + audit trails
- Data pipeline validation

---

## 📝 Version History

### v1.2.0 (Current)
- 🔐 **Secret Vault** – AES-256-GCM encryption
- 🗂️ **Namespaced Store**
- 📋 **Audit Log** (JSON / CSV export)
- 📡 **HTTP Kit** with auth, retry, history
- ⏰ **TTL support** for STORE & Secrets
- Improved LabContext API

### v1.1.0
- ✨ Added `clearStore()` for store management
- 🌳 Improved data sharing hierarchy documentation

### v1.0.0
- Core Lab functionality
- STORE & TEMP storage
- Zero config runner
- Report generation

---

## 📝 License

**Copyright © 2026 Lasith Ruwantha Amrwansha**  
Written: 2026/09/17  
Updated: 2026/09/21  
Author: Ruwantha Amrwansha  
Library: FennecKit 🦊

---

**Happy Testing! 🦊⚡**
