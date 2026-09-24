import { StudentLoginForm } from "@/components/auth/student-login-form";

export default function LoginPage() {
  const oauthProviders = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
    ),
  };

  return (
    <div className="flex w-full items-center justify-center px-4">
      <StudentLoginForm oauthProviders={oauthProviders} />
    </div>
  );
}
