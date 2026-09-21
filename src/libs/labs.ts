/*==================================
* FennecKit v1.2.0 - Implementation
* Security & API Testing Features
* ===================================*/

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { access, writeFile } from "fs/promises";
import path from "path";

// ============================================
// 1. SECRET VAULT (AES-256 Encryption)
// ============================================

class SecretVault {
  private vault = new Map<string, Buffer>();
  private masterKey: Buffer;
  private cipher = "aes-256-gcm";
  private keyLength = 32;
  private ivLength = 16;

  constructor(password: string = "fenneckit-default") {
    // Derive encryption key from password
    this.masterKey = scryptSync(password, "salt", this.keyLength);
  }

  private encrypt(data: string): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.cipher, this.masterKey, iv);

    let encrypted = cipher.update(data, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    return { encrypted, iv, tag };
  }

  private decrypt(data: Buffer, iv: Buffer, tag: Buffer): string {
    const decipher = createDecipheriv(this.cipher, this.masterKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }

  set(key: string, value: string): void {
    const { encrypted, iv, tag } = this.encrypt(value);
    // Store as: iv + tag + encrypted (concatenated)
    const stored = Buffer.concat([iv, tag, encrypted]);
    this.vault.set(key, stored);
  }

  get(key: string): string | undefined {
    const stored = this.vault.get(key);
    if (!stored) return undefined;

    try {
      const iv = stored.slice(0, this.ivLength);
      const tag = stored.slice(this.ivLength, this.ivLength + 16);
      const encrypted = stored.slice(this.ivLength + 16);

      return this.decrypt(encrypted, iv, tag);
    } catch {
      console.error(`Failed to decrypt secret: ${key}`);
      return undefined;
    }
  }

  delete(key: string): void {
    this.vault.delete(key);
  }

  clear(): void {
    this.vault.clear();
  }

  keys(): string[] {
    return Array.from(this.vault.keys());
  }
}

// ============================================
// 2. NAMESPACED STORE
// ============================================

class NamespacedStore {
  private data = new Map<string, any>();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  get(key: string): any {
    return this.data.get(key);
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  clear(key?: string): void {
    if (key) {
      this.data.delete(key);
    } else {
      this.data.clear();
    }
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }

  entries(): [string, any][] {
    return Array.from(this.data.entries());
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  toJSON(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of this.data) {
      obj[key] = value;
    }
    return obj;
  }
}

// ============================================
// 3. AUDIT LOG
// ============================================

interface AuditEntry {
  timestamp: string;
  lab: string;
  test: string;
  operation: "set" | "get" | "delete" | "clear" | "setSecret" | "getSecret";
  namespace?: string;
  key: string;
  dataType: string;
  success: boolean;
}

class AuditLog {
  private entries: AuditEntry[] = [];

  record(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  getLog(): AuditEntry[] {
    return [...this.entries];
  }

  getLast(n: number): AuditEntry[] {
    return this.entries.slice(-n);
  }

  filterByKey(key: string): AuditEntry[] {
    return this.entries.filter(e => e.key === key);
  }

  filterByOperation(op: AuditEntry["operation"]): AuditEntry[] {
    return this.entries.filter(e => e.operation === op);
  }

  filterByNamespace(ns: string): AuditEntry[] {
    return this.entries.filter(e => e.namespace === ns);
  }

  export(format: "json" | "csv"): string {
    if (format === "json") {
      return JSON.stringify(this.entries, null, 2);
    }

    if (format === "csv") {
      const headers = [
        "timestamp",
        "lab",
        "test",
        "operation",
        "namespace",
        "key",
        "dataType",
        "success",
      ].join(",");

      const rows = this.entries.map(e =>
        [
          e.timestamp,
          e.lab,
          e.test,
          e.operation,
          e.namespace || "",
          e.key,
          e.dataType,
          e.success ? "true" : "false",
        ].join(",")
      );

      return [headers, ...rows].join("\n");
    }

    return "";
  }

  clear(): void {
    this.entries = [];
  }
}

// ============================================
// 4. HTTP KIT (API Testing)
// ============================================

interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  raw: Response;
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retry?: { max: number; delay: number };
  followRedirects?: boolean;
}

interface TracedRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  headers: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

class HttpKit {
  private authHeader: { type: string; value: string } | null = null;
  private requestHistory: TracedRequest[] = [];
  private baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "FennecKit/1.2.0",
  };

  setAuth(type: "bearer" | "basic" | "api-key", credentials: string): void {
    this.authHeader = { type, value: credentials };
  }

  clearAuth(): void {
    this.authHeader = null;
  }

  private getAuthHeader(): Record<string, string> {
    if (!this.authHeader) return {};

    if (this.authHeader.type === "bearer") {
      return { Authorization: `Bearer ${this.authHeader.value}` };
    } else if (this.authHeader.type === "api-key") {
      return { "X-API-Key": this.authHeader.value };
    } else if (this.authHeader.type === "basic") {
      return { Authorization: `Basic ${this.authHeader.value}` };
    }

    return {};
  }

  private async makeRequest(
    method: string,
    url: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<HttpResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const headers = {
      ...this.baseHeaders,
      ...this.getAuthHeader(),
      ...(options.headers || {}),
    };

    const reqConfig: RequestInit = {
      method,
      headers,
      timeout: options.timeout || 30000,
      redirect: options.followRedirects !== false ? "follow" : "manual",
    };

    if (body) {
      reqConfig.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    let lastError: Error | null = null;
    const maxRetries = options.retry?.max || 1;
    const retryDelay = options.retry?.delay || 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, reqConfig);
        const duration = Date.now() - startTime;

        let data: any = null;
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        const httpResponse: HttpResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data,
          raw: response,
        };

        // Record in history
        this.recordRequest({
          id: requestId,
          timestamp: new Date().toISOString(),
          method,
          url,
          status: response.status,
          duration,
          headers,
          requestBody: body,
          responseBody: data,
        });

        return httpResponse;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    const duration = Date.now() - startTime;
    this.recordRequest({
      id: requestId,
      timestamp: new Date().toISOString(),
      method,
      url,
      status: 0,
      duration,
      headers,
      requestBody: body,
      error: lastError?.message,
    });

    throw lastError || new Error(`HTTP request failed: ${method} ${url}`);
  }

  private recordRequest(req: TracedRequest): void {
    this.requestHistory.push(req);
  }

  async get(url: string, options?: RequestOptions): Promise<HttpResponse> {
    return this.makeRequest("GET", url, undefined, options);
  }

  async post(url: string, body: any, options?: RequestOptions): Promise<HttpResponse> {
    return this.makeRequest("POST", url, body, options);
  }

  async put(url: string, body: any, options?: RequestOptions): Promise<HttpResponse> {
    return this.makeRequest("PUT", url, body, options);
  }

  async patch(url: string, body: any, options?: RequestOptions): Promise<HttpResponse> {
    return this.makeRequest("PATCH", url, body, options);
  }

  async delete(url: string, options?: RequestOptions): Promise<HttpResponse> {
    return this.makeRequest("DELETE", url, undefined, options);
  }

  getRequestHistory(): TracedRequest[] {
    return [...this.requestHistory];
  }

  clearHistory(): void {
    this.requestHistory = [];
  }

  getLastRequest(): TracedRequest | undefined {
    return this.requestHistory[this.requestHistory.length - 1];
  }
}

// ============================================
// 5. UPDATED LAB CONTEXT
// ============================================

interface LabContext {
  // Existing methods
  out: () => void;
  ret: () => void;
  flatErr: (msg: string) => void;
  err: (msg: string) => void;
  done: (msg: string) => void;
  log: (msg: string) => void;
  warning: (msg: string) => void;

  // Store (unchanged)
  setStore: (key: string, value: any) => void;
  getStore: (key: string) => any;
  clearStore: (key?: string) => void;

  // NEW: Secret Vault
  setSecret: (key: string, value: string) => void;
  getSecret: (key: string) => string | undefined;
  clearSecret: (key?: string) => void;

  // NEW: Namespaces
  namespace: (name: string) => NamespacedStore;
  getNamespace: (name: string) => NamespacedStore | undefined;

  // Temp (unchanged)
  setTemp: (key: string, value: any) => void;
  getTemp: (key: string) => any;

  // NEW: HTTP Kit
  http: HttpKit;

  // NEW: Audit Log
  audit: AuditLog;

  // NEW: TTL Support
  setStoreWithTTL: (key: string, value: any, ttlMs: number) => void;
  setSecretWithTTL: (key: string, value: string, ttlMs: number) => void;

  // Testing
  test: <T>(testName: string, testFn: () => T | Promise<T>) => Promise<T>;
}

// ============================================
// 6. IMPLEMENTATION EXAMPLE
// ============================================

export async function newLabsV12(
  name: string,
  fn: (kit: LabContext) => void | Promise<void>,
  retCount = 0
): Promise<void> {
  let logs = `## ${name} 🌏\n\n\`\`\`\n`;
  let currentTest = "";

  const Store = new Map<string, any>();
  const secretVault = new SecretVault();
  const namespaces = new Map<string, NamespacedStore>();
  const temp = new Map<string, any>();
  const http = new HttpKit();
  const audit = new AuditLog();
  const ttlMap = new Map<string, NodeJS.Timeout>();

  const Context: LabContext = {
    out: () => {
      throw new Error("__Lab_Out__");
    },

    ret: () => {
      if (retCount < 3) {
        throw new Error("__Restart__");
      } else {
        Context.err("Restart limit exceeded (max 3 attempts)");
      }
    },

    flatErr: (msg) => {
      logs += `[🔴] ${currentTest}: ${msg}\n`;
      console.log(`  ❌ [Failed] ${currentTest} -> ${msg}`);
    },

    err: (msg) => {
      logs += `[🔴] ${currentTest}: ${msg}\n`;
      console.log(`  🛑 [Error] ${currentTest} -> ${msg}`);
      Context.out();
    },

    done: (msg) => {
      logs += `[🟢] ${currentTest}: ${msg}\n`;
      console.log(`  ✅ [Done] ${currentTest} -> ${msg}`);
    },

    log: (msg) => {
      logs += `[⚪] ${currentTest}: ${msg}\n`;
      console.log(`  📝 [Info] ${currentTest} -> ${msg}`);
    },

    warning: (msg) => {
      logs += `[🟡] ${currentTest}: ${msg}\n`;
      console.log(`  ⚠️ [Warning] ${currentTest} -> ${msg}`);
    },

    // Store
    setStore: (key, value) => {
      logs += `[⚙️] [STORE] set "${key}"\n`;
      Store.set(key, value);
      audit.record({
        timestamp: new Date().toISOString(),
        lab: name,
        test: currentTest,
        operation: "set",
        key,
        dataType: typeof value,
        success: true,
      });
    },

    getStore: (key) => {
      logs += `[⚙️] [STORE] get "${key}"\n`;
      audit.record({
        timestamp: new Date().toISOString(),
        lab: name,
        test: currentTest,
        operation: "get",
        key,
        dataType: "unknown",
        success: true,
      });
      return Store.get(key);
    },

    clearStore: (key?: string) => {
      if (key) {
        logs += `[⚙️] [STORE] cleared key "${key}"\n`;
        Store.delete(key);
      } else {
        logs += `[⚙️] [STORE] cleared all data\n`;
        Store.clear();
      }
    },

    // NEW: Secrets
    setSecret: (key, value) => {
      logs += `[🔐] [SECRET] set "${key}"\n`;
      secretVault.set(key, value);
      audit.record({
        timestamp: new Date().toISOString(),
        lab: name,
        test: currentTest,
        operation: "setSecret",
        key,
        dataType: "secret",
        success: true,
      });
    },

    getSecret: (key) => {
      logs += `[🔐] [SECRET] get "${key}"\n`;
      audit.record({
        timestamp: new Date().toISOString(),
        lab: name,
        test: currentTest,
        operation: "getSecret",
        key,
        dataType: "secret",
        success: true,
      });
      return secretVault.get(key);
    },

    clearSecret: (key?: string) => {
      if (key) {
        logs += `[🔐] [SECRET] cleared key "${key}"\n`;
        secretVault.delete(key);
      } else {
        logs += `[🔐] [SECRET] cleared all data\n`;
        secretVault.clear();
      }
    },

    // NEW: Namespaces
    namespace: (ns) => {
      if (!namespaces.has(ns)) {
        namespaces.set(ns, new NamespacedStore(ns));
      }
      return namespaces.get(ns)!;
    },

    getNamespace: (ns) => {
      return namespaces.get(ns);
    },

    // Temp
    setTemp: (key, value) => {
      logs += `[⏱️] [TEMP] set "${key}"\n`;
      temp.set(key, value);
    },

    getTemp: (key) => {
      logs += `[⏱️] [TEMP] get "${key}"\n`;
      return temp.get(key);
    },

    // NEW: HTTP Kit
    http,

    // NEW: Audit Log
    audit,

    // NEW: TTL Support
    setStoreWithTTL: (key, value, ttlMs) => {
      Context.setStore(key, value);
      
      // Clear existing TTL if any
      const existingTimer = ttlMap.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      // Set new TTL
      const timer = setTimeout(() => {
        Store.delete(key);
        ttlMap.delete(key);
        logs += `[⏰] [TTL] expired key "${key}"\n`;
      }, ttlMs);

      ttlMap.set(key, timer);
    },

    setSecretWithTTL: (key, value, ttlMs) => {
      Context.setSecret(key, value);

      const existingTimer = ttlMap.get(`secret:${key}`);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        secretVault.delete(key);
        ttlMap.delete(`secret:${key}`);
        logs += `[⏰] [TTL] expired secret "${key}"\n`;
      }, ttlMs);

      ttlMap.set(`secret:${key}`, timer);
    },

    // Testing
    test: async (testName, testFn) => {
      currentTest = testName;
      try {
        return await testFn();
      } catch (e: any) {
        console.log(`  🐛 [Bug Exception] in "${testName}":`, e.message || e);
        throw e;
      }
    },
  };

  console.log(`\n🔬 [Lab Initiated]: ${name}`);

  try {
    await fn(Context);
  } catch (err: any) {
    if (err.message === "__Lab_Out__") {
      logs += "```\n";
      temp.clear();
      ttlMap.forEach(timer => clearTimeout(timer));
      // Write report here
      return;
    } else if (err.message === "__Restart__") {
      return newLabsV12(name, fn, retCount + 1);
    }
    console.log(`❌ [Lab Failed]: ${name}\n`);
    temp.clear();
    ttlMap.forEach(timer => clearTimeout(timer));
    return;
  }

  logs += "```\n";
  console.log(`✅ [Lab Success]: ${name} completed successfully.\n`);
  temp.clear();
  ttlMap.forEach(timer => clearTimeout(timer));
}

// ============================================
// 7. USAGE EXAMPLE
// ============================================

/*
import { newLabsV12 } from "./fenneckit-v1.2.0-implementation";

await newLabsV12("E-Commerce API Test", async (kit) => {
  const user = kit.namespace("user");
  const order = kit.namespace("order");

  await kit.test("Register User", async () => {
    const res = await kit.http.post("https://api.shop.com/auth/register", {
      email: "test@example.com",
      password: "secure123"
    });

    user.set("id", res.data.id);
    user.setSecret("token", res.data.token);
    kit.http.setAuth("bearer", res.data.token);

    kit.done("User registered");
  });

  await kit.test("Create Order", async () => {
    const res = await kit.http.post("https://api.shop.com/orders", {
      items: [{ id: "prod_1", qty: 2 }]
    });

    order.set("id", res.data.orderId);
    kit.done(`Order created: ${res.data.orderId}`);
  });

  await kit.test("Verify Audit Log", async () => {
    const log = kit.audit.getLast(5);
    kit.log(`Last 5 operations: ${log.length}`);
  });
});
*/
