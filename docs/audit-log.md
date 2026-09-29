# Audit log

`kit.audit` records access to STORE and SECRET values so you can trace a workflow.

## What is recorded

| Call | Operation |
| --- | --- |
| `setStore` | `set` |
| `getStore` | `get` |
| `setSecret` | `setSecret` |
| `getSecret` | `getSecret` |

Namespaces, TEMP, and `clear*` calls are not recorded. TTL setters are recorded through their underlying set call.

## Entry fields

`timestamp`, `lab`, `test`, `operation`, `key`, `dataType`, `success`, and optionally `namespace`. Secret values are never stored.

## Querying

```ts
kit.audit.getLog();                    // all entries (copy)
kit.audit.getLast(5);                  // last 5 entries
kit.audit.filterByKey("token");
kit.audit.filterByOperation("setSecret");
kit.audit.filterByNamespace("user");
kit.audit.clear();
```

## Export

```ts
const json = kit.audit.export("json"); // pretty-printed JSON
const csv  = kit.audit.export("csv");  // header: timestamp,lab,test,operation,namespace,key,dataType,success
```

## Example

```ts
await kit.test("Review Audit", async () => {
  const last = kit.audit.getLast(5);
  const tokenOps = kit.audit.filterByKey("token");
  kit.log(`${last.length} recent, ${tokenOps.length} on "token"`);
  kit.done("Audit reviewed");
});
```
