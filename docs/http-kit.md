# HTTP Kit

`kit.http` is a built-in client (based on `fetch`) with auth, timeout, retry and request history.

## Methods

```ts
kit.http.get(url, options?)
kit.http.post(url, body, options?)
kit.http.put(url, body, options?)
kit.http.patch(url, body, options?)
kit.http.delete(url, options?)
```

Bodies that are not strings are sent as JSON. Default headers: `Content-Type: application/json` and `User-Agent: FennecKit/1.2.0`.

## Response

```ts
{
  status: number,
  statusText: string,
  headers: Record<string, string>,
  data: any,        // parsed JSON if content-type is application/json, otherwise text
  raw: Response
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `headers` | none | Extra headers, override defaults |
| `timeout` | `30000` | Timeout in ms (uses `AbortController`) |
| `retry.max` | `1` | Total number of **attempts** |
| `retry.delay` | `1000` | Wait in ms between attempts |
| `followRedirects` | `true` | Set `false` for manual redirects |

```ts
const res = await kit.http.get("https://api.example.com/users", {
  timeout: 5000,
  retry: { max: 3, delay: 1000 },
});
```

Retries happen only on network errors (thrown by `fetch`). An HTTP 4xx/5xx response is returned normally, so check `res.status` yourself.

## Authentication

```ts
kit.http.setAuth("bearer", token);      // Authorization: Bearer <token>
kit.http.setAuth("basic", base64Creds); // Authorization: Basic <base64Creds>
kit.http.setAuth("api-key", key);       // X-API-Key: <key>
kit.http.clearAuth();
```

For `basic`, pass the credentials already base64-encoded.

## Request history

```ts
kit.http.getRequestHistory(); // TracedRequest[]
kit.http.getLastRequest();    // TracedRequest | undefined
kit.http.clearHistory();
```

Each entry contains: `id`, `timestamp`, `method`, `url`, `status` (0 on failure), `duration`, `headers`, `requestBody`, `responseBody`, and `error` when the request failed.

> History stores request headers (including auth headers) and bodies as-is. Call `kit.http.clearHistory()` before exporting or printing it if it may contain credentials.

When all attempts fail, the last error is thrown.
