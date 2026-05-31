import Link from "next/link";
import AuthCard from "@/app/components/AuthCard";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in with your NUS email to find or offer tutoring."
      next={first(params.next)}
      errorCode={first(params.error)}
      footer={
        <>
          New to TutorLah?{" "}
          <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </>
      }
    />
  );
}
