# Best practices

1. **Use STORE for regular data** (IDs, names).
2. **Use SECRET for sensitive data** (tokens, passwords, refresh tokens). Never put them in STORE.
3. **Use NAMESPACE for organization**: `const user = kit.namespace("user")` instead of `userId`, `userEmail`, ... keys.
4. **Check before using**:
   ```ts
   const token = kit.getSecret("token");
   if (!token) kit.err("Token is missing!");
   ```
5. **Clean up secrets** in a final test:
   ```ts
   kit.clearSecret("accessToken");
   kit.http.clearAuth();
   ```
6. **Check `res.status` yourself.** HTTP error responses are returned, not thrown.
7. **Use `flatErr` for non-blocking checks** (e.g. an optional email step) and `err` when later tests cannot continue.
8. **Use the audit log** for debugging and traceability, and clear HTTP history before exporting it.
9. **One lab, one goal.** Keep labs small and independent, since nothing is shared between labs.

## Good fits

API testing, security checks, migration validation, microservice chains, pre-deployment smoke tests, ETL/data pipeline checks, and multi-step integration tests.
