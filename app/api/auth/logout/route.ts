import { getAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";

export async function POST() {
  try {
    const session = await getAdminSession();
    session.destroy();
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
