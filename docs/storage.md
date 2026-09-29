# Storage

Every lab has five kinds of in-memory storage.

| Level | Use for | Encrypted | Audited | Lifetime |
| --- | --- | --- | --- | --- |
| STORE | IDs, names, plain values | No | Yes (set/get) | Until lab ends |
| SECRET | Tokens, passwords | Yes | Yes (set/get) | Until lab ends |
| NAMESPACE | Grouped entity data | No | No | Until lab ends |
| TEMP | Scratch values | No | No | Until lab ends |
| TTL variants | Auto-expiring STORE/SECRET | Same as base | Same as base | Until TTL or lab end |

Storage is per lab: nothing is shared across labs or files.

## STORE

```ts
await kit.test("Create User", async () => {
  const res = await kit.http.post("/users", { name: "Alice" });
  kit.setStore("userId", res.data.id);
  kit.done("User created");
});

await kit.test("Get User", async () => {
  const userId = kit.getStore("userId");
  // ...
});
```

- `kit.setStore(key, value)`
- `kit.getStore(key)`
- `kit.clearStore(key)` removes one key; `kit.clearStore()` removes everything.

## SECRET

Use SECRET for anything sensitive. Values are encrypted in memory with AES-256-GCM (random 16-byte IV and auth tag per value, key derived with scrypt) and decrypted on read.

```ts
kit.setSecret("accessToken", res.data.accessToken);
const token = kit.getSecret("accessToken"); // string | undefined
kit.http.setAuth("bearer", token!);
kit.clearSecret("accessToken");
```

- `kit.setSecret(key, value)`, `kit.getSecret(key)`
- `kit.clearSecret(key)` or `kit.clearSecret()` for all
- Secret **values** are never written to the lab log or audit log. Only the key name is.
- If decryption fails, `getSecret` logs an error and returns `undefined`.

> Note: the vault protects values held in memory. It uses a built-in default password, so treat it as protection against accidental exposure (logs, dumps), not as a security boundary.

## NAMESPACE

Group related values instead of using prefixed keys.

```ts
const user = kit.namespace("user");   // create or get
const order = kit.namespace("order");

user.set("id", "usr_123");
order.set("total", 299.99);

user.get("id");
kit.getNamespace("user"); // existing namespace, or undefined
```

Namespace methods: `set`, `get`, `delete`, `clear(key?)`, `keys`, `entries`, `has`, `toJSON`.

## TEMP

Scratch values for short-lived data such as timers.

```ts
kit.setTemp("startTime", Date.now());
await kit.http.get("/api/heavy-endpoint");
const elapsed = Date.now() - kit.getTemp("startTime");
```

TEMP is cleared when the lab finishes. Do not rely on it as per-test storage; use unique keys or STORE for anything you want to control.

## TTL

Values that expire automatically.

```ts
kit.setStoreWithTTL("sessionId", "sess_123", 30_000);  // 30 s
kit.setSecretWithTTL("tempToken", "token", 60_000);    // 60 s
```

Setting the same key again resets its timer. Expiry is written to the lab log. Pending timers are cleared when the lab ends.
