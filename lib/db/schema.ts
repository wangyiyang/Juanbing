import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "published", "closed"] })
    .notNull()
    .default("draft"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  expiresAt: integer("expires_at"),
});

export const surveyQuestions = sqliteTable("survey_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "single_choice",
      "multiple_choice",
      "text",
      "rating",
      "dropdown",
      "date",
      "matrix",
    ],
  }).notNull(),
  title: text("title").notNull(),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull(),
  config: text("config"),
});

export const surveyOptions = sqliteTable("survey_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id")
    .notNull()
    .references(() => surveyQuestions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const surveyResponses = sqliteTable("survey_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(),
  respondentId: text("respondent_id").notNull(),
  durationSeconds: integer("duration_seconds"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const surveyRelations = relations(surveys, ({ many }) => ({
  questions: many(surveyQuestions),
  responses: many(surveyResponses),
}));

export const surveyQuestionRelations = relations(
  surveyQuestions,
  ({ one, many }) => ({
    survey: one(surveys, {
      fields: [surveyQuestions.surveyId],
      references: [surveys.id],
    }),
    options: many(surveyOptions),
  }),
);

export const surveyOptionRelations = relations(surveyOptions, ({ one }) => ({
  question: one(surveyQuestions, {
    fields: [surveyOptions.questionId],
    references: [surveyQuestions.id],
  }),
}));

export const surveyResponseRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
}));

export const employees = sqliteTable(
  "employees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeNo: text("employee_no"),
    name: text("name").notNull(),
    email: text("email"),
    department: text("department"),
    title: text("title"),
    managerId: integer("manager_id").references(
      (): AnySQLiteColumn => employees.id,
      {
        onDelete: "set null",
      },
    ),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("employees_employee_no_unique").on(table.employeeNo),
    uniqueIndex("employees_email_unique").on(table.email),
    index("employees_name_idx").on(table.name),
  ],
);

export const evaluationCycles = sqliteTable("evaluation_cycles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "active", "closed"] })
    .notNull()
    .default("draft"),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "restrict" }),
  startsAt: integer("starts_at"),
  endsAt: integer("ends_at"),
  anonymityThreshold: integer("anonymity_threshold").notNull().default(3),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const evaluationSubjects = sqliteTable(
  "evaluation_subjects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => evaluationCycles.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["active", "removed"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("evaluation_subjects_cycle_employee_unique").on(
      table.cycleId,
      table.employeeId,
    ),
  ],
);

export const evaluationAssignments = sqliteTable(
  "evaluation_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => evaluationCycles.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => evaluationSubjects.id, { onDelete: "cascade" }),
    raterEmployeeId: integer("rater_employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    relationship: text("relationship", {
      enum: ["self", "manager", "peer", "direct_report", "other"],
    }).notNull(),
    token: text("token").notNull().unique(),
    status: text("status", { enum: ["pending", "submitted", "expired"] })
      .notNull()
      .default("pending"),
    responseId: integer("response_id").references(() => surveyResponses.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    submittedAt: integer("submitted_at"),
  },
  (table) => [
    index("evaluation_assignments_token_idx").on(table.token),
    index("evaluation_assignments_subject_idx").on(table.subjectId),
  ],
);
