import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.REPORT_TOKEN_SECRET ?? "default-report-token-secret-change-me",
);

export async function createReportToken(
  subjectId: number,
  employeeNo: string,
): Promise<string> {
  return new SignJWT({ subjectId, employeeNo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyReportToken(
  token: string,
): Promise<{ subjectId: number; employeeNo: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      clockTolerance: 60,
    });
    const subjectId = payload.subjectId as number;
    const employeeNo = payload.employeeNo as string;
    if (typeof subjectId !== "number" || typeof employeeNo !== "string") {
      return null;
    }
    return { subjectId, employeeNo };
  } catch {
    return null;
  }
}
