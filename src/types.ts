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