import bcrypt from "bcryptjs";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import { env } from "@/lib/config/env";
import { ApiError } from "@/lib/http/api-error";

export type AdminSession = {
  isAuthenticated?: boolean;
  username?: string;
};

function getSessionOptions(): SessionOptions {
  return {
    cookieName: "juanbing_admin_session",
    password: env.SESSION_SECRET,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.COOKIE_SECURE !== undefined
          ? process.env.COOKIE_SECURE === "true"
          : env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), getSessionOptions());
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
) {
  if (username !== env.ADMIN_USERNAME) {
    return false;
  }

  return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session.isAuthenticated) {
    throw new ApiError(401, "请先登录管理端");
  }

  return session;
}
