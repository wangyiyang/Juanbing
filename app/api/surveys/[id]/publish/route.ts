import { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import { setSurveyStatus } from "@/lib/surveys/service";

const publishSchema = z.object({
  status: z.enum(["draft", "published", "closed"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const payload = publishSchema.parse(await request.json());

    return ok(await setSurveyStatus(Number(id), payload.status));
  } catch (error) {
    return fromError(error);
  }
}
