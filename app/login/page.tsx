import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/current";
import { safeNext } from "@/lib/http";

export const dynamic = "force-dynamic";

export const metadata = { title: "دخول" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentUser()) redirect("/studio");
  const params = await searchParams;
  return (
    <div className="min-h-full">
      <SiteHeader loggedIn={false} />
      <main className="mx-auto max-w-md px-5 py-12">
        <AuthForm mode="login" nextPath={safeNext(params.next)} />
      </main>
    </div>
  );
}
