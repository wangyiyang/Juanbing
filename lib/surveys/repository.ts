import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  surveyOptions,
  surveyQuestions,
  surveys,
} from "@/lib/db/schema";
import type {
  SurveyDetail,
  SurveyInput,
  SurveyOptionInput,
  SurveyQuestionDetail,
} from "@/lib/surveys/types";

function serializeConfig(config: Record<string, unknown> | null | undefined) {
  return config ? JSON.stringify(config) : null;
}

function parseConfig(raw: string | null) {
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

function mapQuestionOptions(questionId: number): SurveyOptionInput[] {
  return db
    .select()
    .from(surveyOptions)
    .where(eq(surveyOptions.questionId, questionId))
    .orderBy(asc(surveyOptions.orderIndex))
    .all()
    .map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
      orderIndex: option.orderIndex,
    }));
}

function mapSurveyDetail(id: number): SurveyDetail | null {
  const survey = db.select().from(surveys).where(eq(surveys.id, id)).get();

  if (!survey) {
    return null;
  }

  const questions: SurveyQuestionDetail[] = db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, id))
    .orderBy(asc(surveyQuestions.orderIndex))
    .all()
    .map((question) => ({
      id: question.id,
      type: question.type,
      title: question.title,
      required: question.required,
      orderIndex: question.orderIndex,
      config: parseConfig(question.config),
      options: mapQuestionOptions(question.id),
    }));

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    expiresAt: survey.expiresAt,
    createdAt: survey.createdAt,
    updatedAt: survey.updatedAt,
    questions,
  };
}

export async function insertSurvey(input: SurveyInput) {
  const now = Math.floor(Date.now() / 1000);

  return db.transaction((tx) => {
    const result = tx
      .insert(surveys)
      .values({
        title: input.title,
        description: input.description ?? null,
        status: "draft",
        expiresAt: input.expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const surveyId = Number(result.lastInsertRowid);

    for (const question of input.questions) {
      const questionResult = tx
        .insert(surveyQuestions)
        .values({
          surveyId,
          type: question.type,
          title: question.title,
          required: question.required,
          orderIndex: question.orderIndex,
          config: serializeConfig(question.config ?? null),
        })
        .run();

      const questionId = Number(questionResult.lastInsertRowid);

      for (const option of question.options ?? []) {
        tx.insert(surveyOptions)
          .values({
            questionId,
            label: option.label,
            value: option.value,
            orderIndex: option.orderIndex,
          })
          .run();
      }
    }

    return surveyId;
  });
}

export async function replaceSurvey(id: number, input: SurveyInput) {
  const now = Math.floor(Date.now() / 1000);

  db.transaction((tx) => {
    tx.update(surveys)
      .set({
        title: input.title,
        description: input.description ?? null,
        expiresAt: input.expiresAt ?? null,
        updatedAt: now,
      })
      .where(eq(surveys.id, id))
      .run();

    tx.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id)).run();

    for (const question of input.questions) {
      const questionResult = tx
        .insert(surveyQuestions)
        .values({
          surveyId: id,
          type: question.type,
          title: question.title,
          required: question.required,
          orderIndex: question.orderIndex,
          config: serializeConfig(question.config ?? null),
        })
        .run();

      const questionId = Number(questionResult.lastInsertRowid);

      for (const option of question.options ?? []) {
        tx.insert(surveyOptions)
          .values({
            questionId,
            label: option.label,
            value: option.value,
            orderIndex: option.orderIndex,
          })
          .run();
      }
    }
  });
}

export async function findSurveyById(id: number) {
  return mapSurveyDetail(id);
}

export async function listSurveySummaries() {
  return db.select().from(surveys).orderBy(asc(surveys.createdAt)).all();
}

export async function removeSurvey(id: number) {
  db.delete(surveys).where(eq(surveys.id, id)).run();
}
