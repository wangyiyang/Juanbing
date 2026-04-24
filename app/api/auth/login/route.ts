import { NextRequest } from "next/server";
import { z } from "zod";

import {
  getAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth/session";
import { ApiError } from "@/lib/http/api-error";
import { fromError, ok } from "@/lib/http/responses";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = loginSchema.parse(await request.json());
    const isValid = await verifyAdminCredentials(
      payload.username,
      payload.password,
    );

    if (!isValid) {
      throw new ApiError(401, "用户名或密码错误");
    }

    const session = await getAdminSession();
    session.isAuthenticated = true;
    session.username = payload.username;
    await session.save();

    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
