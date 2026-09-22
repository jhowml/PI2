export type DatabaseConnectionParts = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function buildDatabaseUrl(parts: DatabaseConnectionParts): string {
  const u = encodeURIComponent(parts.user);
  const p = encodeURIComponent(parts.password);
  return `postgresql://${u}:${p}@${parts.host}:${parts.port}/${parts.database}`;
}
