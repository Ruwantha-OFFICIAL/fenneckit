export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  raw: Response;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retry?: { max: number; delay: number };
  followRedirects?: boolean;
}

export interface TracedRequest {
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

export interface AuditEntry {
  timestamp: string;
  lab: string;
  test: string;
  operation: "set" | "get" | "delete" | "clear" | "setSecret" | "getSecret";
  namespace?: string;
  key: string;
  dataType: string;
  success: boolean;
}
export interface LabContext {
  out: () => void;
  ret: () => void;
  flatErr: (msg: string) => void;
  err: (msg: string) => void;
  done: (msg: string) => void;
  log: (msg: string) => void;
  warning: (msg: string) => void;

  setStore: (key: string, value: any) => void;
  getStore: (key: string) => any;
  clearStore: (key?: string) => void;

  setSecret: (key: string, value: string) => void;
  getSecret: (key: string) => string | undefined;
  clearSecret: (key?: string) => void;

  namespace: (name: string) => NamespacedStore;
  getNamespace: (name: string) => NamespacedStore | undefined;

  setTemp: (key: string, value: any) => void;
  getTemp: (key: string) => any;

  http: HttpKit;
  audit: AuditLog;

  setStoreWithTTL: (key: string, value: any, ttlMs: number) => void;
  setSecretWithTTL: (key: string, value: string, ttlMs: number) => void;

  test: <T>(testName: string, testFn: () => T | Promise<T>) => Promise<T>;
}