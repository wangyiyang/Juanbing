import { stringify } from "csv-stringify/sync";

export function buildCsv(rows: Array<Record<string, unknown>>) {
  return stringify(rows, {
    header: true,
  });
}
