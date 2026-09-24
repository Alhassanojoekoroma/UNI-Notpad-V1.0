import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const oauthProviders = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
    ),
  };

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <RegisterForm oauthProviders={oauthProviders} />
      </div>
    </div>
  );
}
