import { sqlite } from "@/lib/db/client";

export function resetDatabase() {
  sqlite.exec(`
    DELETE FROM evaluation_assignments;
    DELETE FROM evaluation_subjects;
    DELETE FROM evaluation_cycles;
    DELETE FROM evaluation_templates;
    DELETE FROM employees;
    DELETE FROM survey_options;
    DELETE FROM survey_questions;
    DELETE FROM survey_responses;
    DELETE FROM surveys;
    DELETE FROM sqlite_sequence;
  `);
}
