import Link from "next/link";
import AuthCard from "@/app/components/AuthCard";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const asTutor = first(params.role) === "tutor";

  return (
    <AuthCard
      title={asTutor ? "Start tutoring on TutorLah" : "Join TutorLah"}
      subtitle={
        asTutor
          ? "Sign up with your NUS email to verify modules and take students."
          : "Sign up with your NUS email. The same link signs you in next time."
      }
      asTutor={asTutor}
      errorCode={first(params.error)}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </>
      }
    />
  );
}
