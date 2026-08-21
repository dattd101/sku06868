declare module 'sql.js/dist/sql-asm.js' {
  type SqlValue = string | number | null | Uint8Array;

  interface Statement {
    bind(values?: SqlValue[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, SqlValue>;
    free(): boolean;
  }

  interface Database {
    exec(sql: string): Array<{ columns: string[]; values: SqlValue[][] }>;
    prepare(sql: string): Statement;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export default function initSqlJs(): Promise<SqlJsStatic>;
}
