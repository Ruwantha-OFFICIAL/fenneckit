# API reference

```ts
import { newLabs } from "fenneckit";

await newLabs(name: string, fn: (kit: LabContext) => void | Promise<void>);
```

`fn` receives `kit` (the `LabContext`).

## Testing and flow

| Method | Description |
| --- | --- |
| `kit.test(name, fn)` | Run a named test; returns the test function's result |
| `kit.done(msg)` | Mark passed |
| `kit.log(msg)` | Info message |
| `kit.warning(msg)` | Warning |
| `kit.flatErr(msg)` | Failure, continue the lab |
| `kit.err(msg)` | Failure, stop the lab |
| `kit.out()` | Exit the lab immediately |
| `kit.ret()` | Restart the lab (max 3 times) |

If a test throws an unexpected error it is printed as a bug exception and the lab is marked failed.

## STORE

| Method | Description |
| --- | --- |
| `setStore(key, value)` | Save |
| `getStore(key)` | Read |
| `clearStore(key?)` | Clear one key or all |
| `setStoreWithTTL(key, value, ms)` | Save with expiry |

## SECRET

| Method | Description |
| --- | --- |
| `setSecret(key, value)` | Save encrypted |
| `getSecret(key)` | Read decrypted (`string | undefined`) |
| `clearSecret(key?)` | Clear one key or all |
| `setSecretWithTTL(key, value, ms)` | Save with expiry |

## NAMESPACE

| Method | Description |
| --- | --- |
| `namespace(name)` | Create or get a namespace |
| `getNamespace(name)` | Get an existing namespace |
| `ns.set / get / delete / clear / keys / entries / has / toJSON` | Namespace operations |

## TEMP

| Method | Description |
| --- | --- |
| `setTemp(key, value)` | Save temp value |
| `getTemp(key)` | Read temp value |

## HTTP

See [HTTP Kit](http-kit.md): `get`, `post`, `put`, `patch`, `delete`, `setAuth`, `clearAuth`, `getRequestHistory`, `getLastRequest`, `clearHistory`.

## Audit

See [Audit log](audit-log.md): `getLog`, `getLast`, `filterByKey`, `filterByOperation`, `filterByNamespace`, `export`, `clear`.

## CLI

```bash
npx fenneckit              # run all *.labs.js
npx fenneckit <file>       # run one file
```
