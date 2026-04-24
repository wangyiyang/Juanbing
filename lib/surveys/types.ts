export type SurveyStatus = "draft" | "published" | "closed";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "rating"
  | "dropdown"
  | "date"
  | "matrix";

export type SurveyQuestionConfig = Record<string, unknown> | null;

export type SurveyOptionInput = {
  id?: number;
  label: string;
  value: string;
  orderIndex: number;
};

export type SurveyQuestionInput = {
  id?: number;
  type: QuestionType;
  title: string;
  required: boolean;
  orderIndex: number;
  config?: SurveyQuestionConfig;
  options?: SurveyOptionInput[];
};

export type SurveyInput = {
  title: string;
  description?: string | null;
  expiresAt?: number | null;
  questions: SurveyQuestionInput[];
};

export type SurveyQuestionDetail = Omit<SurveyQuestionInput, "id"> & {
  id: number;
  config: SurveyQuestionConfig;
  options: SurveyOptionInput[];
};

export type SurveyDetail = {
  id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  questions: SurveyQuestionDetail[];
};

export type SurveyAnswerValue =
  | string
  | string[]
  | number
  | Record<string, string>
  | null;
