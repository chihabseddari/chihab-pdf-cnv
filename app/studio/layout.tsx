import { redirect } from "next/navigation";
import { StudioShell } from "@/components/studio-shell";
import { getCurrentUser } from "@/lib/current";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <StudioShell name={user.name}>{children}</StudioShell>;
}
