import { Migration } from '@mikro-orm/migrations'

export class CreateCsvExportsTable20240101000000 extends Migration {
  up(): void {
    this.addSql(
      `create table "csv_exports" ("id" serial primary key, "output_path" text not null, "total_rows_processed" integer not null, "duration" numeric(10, 2) not null, "job_id" text not null, "progress" integer not null default 0, "created_at" timestamptz not null default now());`,
    )
    this.addSql(
      `create index "csv_exports_job_id_index" on "csv_exports" ("job_id");`,
    )
  }

  down(): void {
    this.addSql(`drop table if exists "csv_exports" cascade;`)
  }
}
