import { prisma } from "./db";

export const DEMO_USER_ID = 1;

export async function getDemoUser() {
  const user = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
    include: { integrations: true },
  });
  if (!user) throw new Error("Demo user not seeded. Run `npm run seed`.");
  return user;
}
