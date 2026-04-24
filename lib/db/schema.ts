import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
