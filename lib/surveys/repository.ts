import { and, asc, eq, like, or } from "drizzle-orm";

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
  try {
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
  } catch (error) {
    console.error("[repository] mapQuestionOptions failed:", error);
    throw new Error("数据库查询失败：无法加载选项");
  }
}

function mapSurveyDetail(id: number): SurveyDetail | null {
  try {
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
  } catch (error) {
    console.error("[repository] mapSurveyDetail failed:", error);
    throw new Error("数据库查询失败：无法加载问卷详情");
  }
}

export async function insertSurvey(input: SurveyInput) {
  const now = Math.floor(Date.now() / 1000);

  try {
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
  } catch (error) {
    console.error("[repository] insertSurvey failed:", error);
    throw new Error("数据库写入失败：无法创建问卷");
  }
}

export async function replaceSurvey(id: number, input: SurveyInput) {
  const now = Math.floor(Date.now() / 1000);

  try {
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
  } catch (error) {
    console.error("[repository] replaceSurvey failed:", error);
    throw new Error("数据库写入失败：无法更新问卷");
  }
}

export async function findSurveyById(id: number) {
  try {
    return mapSurveyDetail(id);
  } catch (error) {
    console.error("[repository] findSurveyById failed:", error);
    throw error;
  }
}

export async function listSurveySummaries() {
  try {
    return db.select().from(surveys).orderBy(asc(surveys.createdAt)).all();
  } catch (error) {
    console.error("[repository] listSurveySummaries failed:", error);
    throw new Error("数据库查询失败：无法加载问卷列表");
  }
}

export async function searchSurveySummaries(query?: string, status?: string) {
  try {
    let conditions = undefined;

    if (query) {
      conditions = or(
        like(surveys.title, `%${query}%`),
        like(surveys.description, `%${query}%`),
      );
    }

    if (status) {
      const statusCondition = eq(surveys.status, status as "draft" | "published" | "closed");
      conditions = conditions ? and(conditions, statusCondition) : statusCondition;
    }

    if (conditions) {
      return db
        .select()
        .from(surveys)
        .where(conditions)
        .orderBy(asc(surveys.createdAt))
        .all();
    }

    return db.select().from(surveys).orderBy(asc(surveys.createdAt)).all();
  } catch (error) {
    console.error("[repository] searchSurveySummaries failed:", error);
    throw new Error("数据库查询失败：无法搜索问卷");
  }
}

export async function removeSurvey(id: number) {
  try {
    db.delete(surveys).where(eq(surveys.id, id)).run();
  } catch (error) {
    console.error("[repository] removeSurvey failed:", error);
    throw new Error("数据库写入失败：无法删除问卷");
  }
}
