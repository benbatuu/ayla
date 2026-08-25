import { redirect } from "next/navigation";
import { getSessionUser } from "../../lib/auth";

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}
