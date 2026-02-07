interface Headers {
  id: number;
  key: string;
  value: string;
}

export type MonitorForm = {
  id?: number;
  enabled: boolean;
  name: string;
  connection: string;
  connectionType: "http" | "ping" | "container" | "tcp";
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  timeout: number;
  body: string;
  interval: number;
  alwaysSave: boolean;
  headers: Headers[];
  notification?: Notification | null;
};

export const DefaultMonitorForm: MonitorForm = {
  enabled: true,
  name: "",
  connection: "",
  connectionType: "http",
  httpMethod: "GET",
  timeout: 5,
  body: "",
  interval: 60,
  alwaysSave: false,
  headers: [],
  notification: null
};

interface Notification {
  id: number;
  monitorID: number;
  enabled: boolean;
  type: "webhook" | "email";
  webhook: string;
  email: string;
  template: Template;
}

export const DefaultErrorHeaderTemplate = "{{.Name}} is down";
export const DefaultErrorBodyTemplate =
  "The goose encountered an issue while contacting {{.Name}} at {{.Timestamp}}";
export const DefaultSuccessTemplate = "{{.Name}} is back online";
export const DefaultWarningTemplate =
  "Good news! {{.Name}} has recovered and is responding normally.";
interface Template {
  errorTitle: string;
  errorBody: string;
  successTitle: string;
  successBody: string;
}

export interface Check {
  created: string;
  success: boolean;
  result: string;
  responseTimeMs: number;
  notificationSent: boolean;
}

export interface Monitor {
  id: number;
  enabled: boolean;
  name: string;
  connection: string;
  connectionType: "http" | "ping" | "container" | "tcp";
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  timeout: number;
  interval: number;
  body: string;
  healthy: boolean | null;
  alwaysSave: boolean;
  checked: string;
  checks: Check[];
  result: string;
  notification: Notification | null;
  totalChecks: number;
  successfulChecks: number;
  headers: Headers[];
}
