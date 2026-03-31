"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, Check } from "lucide-react";

const DEFAULT_TOS = `Terms of Service

By accessing and using this university learning platform, you agree to the following terms:

1. Account Responsibility: You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
2. Acceptable Use: The platform is provided for educational purposes only. You may not use it for any unlawful purpose or to distribute harmful content.
3. Content Ownership: Materials uploaded by lecturers remain the intellectual property of their respective authors. Students may use materials for personal study only.
4. Privacy: Your personal data is collected and processed in accordance with our Privacy Policy.
5. Termination: We reserve the right to suspend or terminate accounts that violate these terms.
6. Modifications: We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.`;

const DEFAULT_PRIVACY = `Privacy Policy

This privacy policy describes how we collect, use, and protect your personal information.

1. Information We Collect: Name, email address, student/staff ID, faculty information, and platform usage data.
2. How We Use Your Data: To provide educational services, personalize your experience, and improve the platform.
3. Data Storage: Your data is stored securely and access is restricted to authorized personnel only.
4. Third-Party Services: We may use third-party services (AI providers, file storage) to deliver platform features. Your data shared with these services is limited to what is necessary.
5. Your Rights: You may request access to, correction of, or deletion of your personal data at any time through your account settings.
6. Data Retention: Account data is retained for the duration of your enrollment. Deleted accounts are purged after 7 days.
7. Contact: For privacy concerns, contact the university administration.`;

const DEFAULT_COC = `Code of Conduct

All users of this platform are expected to maintain a respectful and productive learning environment.

1. Respect: Treat all users with respect. Harassment, discrimination, and abusive language are not tolerated.
2. Academic Integrity: Do not share exam answers, plagiarize content, or misuse AI tools for dishonest purposes.
3. Content Standards: Uploaded materials must be relevant to coursework. Inappropriate, offensive, or copyrighted content (without permission) is prohibited.
4. Forum Etiquette: Keep forum discussions constructive and on-topic. Spam and self-promotion are not allowed.
5. Reporting: Report violations to administrators. False reports are themselves a violation.
6. Consequences: Violations may result in warnings, suspension, or permanent account deactivation.`;

interface Faculty {
  name: string;
  code: string;
  programs: { name: string; code: string }[];
}

const STEPS = [
  "University Info",
  "Admin Account",
  "Academic Structure",
  "Student ID Format",
  "API Keys",
  "Policies",
  "Review & Finish",
];

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: University info
  const [universityName, setUniversityName] = useState("");
  const [universityLogo, setUniversityLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState("#1e1e1e");

  // Step 2: Admin account
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Step 3: Academic structure
  const [faculties, setFaculties] = useState<Faculty[]>([
    { name: "", code: "", programs: [] },
  ]);

  // Step 4: Student ID format
  const [studentIdPattern, setStudentIdPattern] = useState("^90500\\d{4,}$");

  // Step 5: API keys
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");
  const [monimeApiKey, setMonimeApiKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");

  // Step 6: Policies
  const [termsOfService, setTermsOfService] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [codeOfConduct, setCodeOfConduct] = useState("");

  const addFaculty = () => {
    setFaculties([...faculties, { name: "", code: "", programs: [] }]);
  };

  const removeFaculty = (index: number) => {
    setFaculties(faculties.filter((_, i) => i !== index));
  };

  const updateFaculty = (index: number, field: "name" | "code", value: string) => {
    const updated = [...faculties];
    updated[index][field] = value;
    setFaculties(updated);
  };

  const addProgram = (facultyIndex: number) => {
    const updated = [...faculties];
    updated[facultyIndex].programs.push({ name: "", code: "" });
    setFaculties(updated);
  };

  const removeProgram = (facultyIndex: number, programIndex: number) => {
    const updated = [...faculties];
    updated[facultyIndex].programs = updated[facultyIndex].programs.filter(
      (_, i) => i !== programIndex
    );
    setFaculties(updated);
  };

  const updateProgram = (
    facultyIndex: number,
    programIndex: number,
    field: "name" | "code",
    value: string
  ) => {
    const updated = [...faculties];
    updated[facultyIndex].programs[programIndex][field] = value;
    setFaculties(updated);
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return universityName.trim().length > 0;
      case 1:
        return (
          adminName.trim().length > 0 &&
          adminEmail.trim().length > 0 &&
          adminPassword.length >= 8
        );
      case 2:
        return faculties.some((f) => f.name.trim() && f.code.trim());
      case 3:
        return true;
      case 4:
        return (
          geminiApiKey.trim().length > 0 &&
          resendApiKey.trim().length > 0 &&
          cloudinaryCloudName.trim().length > 0 &&
          cloudinaryApiKey.trim().length > 0 &&
          cloudinaryApiSecret.trim().length > 0
        );
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName,
          universityLogo: universityLogo || undefined,
          primaryColor,
          secondaryColor,
          adminName,
          adminEmail,
          adminPassword,
          faculties: faculties.filter((f) => f.name.trim() && f.code.trim()),
          studentIdPattern,
          geminiApiKey,
          resendApiKey,
          cloudinaryCloudName,
          cloudinaryApiKey,
          cloudinaryApiSecret,
          elevenlabsApiKey: elevenlabsApiKey || undefined,
          monimeApiKey: monimeApiKey || undefined,
          stripeSecretKey: stripeSecretKey || undefined,
          termsOfService: termsOfService || undefined,
          privacyPolicy: privacyPolicy || undefined,
          codeOfConduct: codeOfConduct || undefined,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Setup failed");
        return;
      }

      router.push("/login");
    } catch {
      setError("An error occurred during setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 ${i < step ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: University Info */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="universityName">University Name *</Label>
                <Input
                  id="universityName"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="e.g., University of Sierra Leone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="universityLogo">University Logo URL (optional)</Label>
                <Input
                  id="universityLogo"
                  value={universityLogo}
                  onChange={(e) => setUniversityLogo(e.target.value)}
                  placeholder="https://cloudinary.com/.../logo.png (upload via Cloudinary first)"
                />
                <p className="text-xs text-muted-foreground">
                  Upload your logo to Cloudinary and paste the URL here. You can also set this later in admin settings.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Admin Account */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="adminName">Full Name *</Label>
                <Input
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Admin full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password * (min 8 characters)</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Secure password"
                />
              </div>
            </>
          )}

          {/* Step 3: Academic Structure */}
          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Add your faculties and their programs.
              </p>
              {faculties.map((faculty, fi) => (
                <Card key={fi} className="p-4 space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label>Faculty Name *</Label>
                      <Input
                        value={faculty.name}
                        onChange={(e) => updateFaculty(fi, "name", e.target.value)}
                        placeholder="e.g., Faculty of Engineering"
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label>Code *</Label>
                      <Input
                        value={faculty.code}
                        onChange={(e) => updateFaculty(fi, "code", e.target.value)}
                        placeholder="e.g., ENG"
                      />
                    </div>
                    {faculties.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFaculty(fi)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Programs under this faculty */}
                  {faculty.programs.map((program, pi) => (
                    <div key={pi} className="flex items-end gap-2 ml-4">
                      <div className="flex-1 space-y-1">
                        <Label>Program Name</Label>
                        <Input
                          value={program.name}
                          onChange={(e) =>
                            updateProgram(fi, pi, "name", e.target.value)
                          }
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <Label>Code</Label>
                        <Input
                          value={program.code}
                          onChange={(e) =>
                            updateProgram(fi, pi, "code", e.target.value)
                          }
                          placeholder="e.g., CS"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProgram(fi, pi)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addProgram(fi)}
                    className="ml-4"
                  >
                    <Plus className="size-3 mr-1" /> Add Program
                  </Button>
                </Card>
              ))}
              <Button variant="outline" onClick={addFaculty}>
                <Plus className="size-4 mr-1" /> Add Faculty
              </Button>
            </>
          )}

          {/* Step 4: Student ID Format */}
          {step === 3 && (
            <div className="space-y-2">
              <Label htmlFor="studentIdPattern">Student ID Regex Pattern</Label>
              <Input
                id="studentIdPattern"
                value={studentIdPattern}
                onChange={(e) => setStudentIdPattern(e.target.value)}
                placeholder="^90500\d{4,}$"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                This regular expression validates student IDs during registration.
                The default matches IDs starting with 90500 followed by 4+ digits.
              </p>
            </div>
          )}

          {/* Step 5: API Keys */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">Google Gemini API Key *</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Required for AI study assistant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resendApiKey">Resend API Key *</Label>
                <Input
                  id="resendApiKey"
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="Required for transactional email"
                />
              </div>
              <div className="space-y-2">
                <Label>Cloudinary Credentials *</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    value={cloudinaryCloudName}
                    onChange={(e) => setCloudinaryCloudName(e.target.value)}
                    placeholder="Cloud name"
                  />
                  <Input
                    type="password"
                    value={cloudinaryApiKey}
                    onChange={(e) => setCloudinaryApiKey(e.target.value)}
                    placeholder="API key"
                  />
                  <Input
                    type="password"
                    value={cloudinaryApiSecret}
                    onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                    placeholder="API secret"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="elevenlabsApiKey">ElevenLabs API Key (optional)</Label>
                <Input
                  id="elevenlabsApiKey"
                  type="password"
                  value={elevenlabsApiKey}
                  onChange={(e) => setElevenlabsApiKey(e.target.value)}
                  placeholder="For premium text-to-speech"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monime API Key (optional)</Label>
                  <Input
                    type="password"
                    value={monimeApiKey}
                    onChange={(e) => setMonimeApiKey(e.target.value)}
                    placeholder="Mobile money payments"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stripe Secret Key (optional)</Label>
                  <Input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="Card payments"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 6: Policies */}
          {step === 5 && (
            <>
              <p className="text-sm text-muted-foreground">
                These can be updated later in admin settings. Click &quot;Use Template&quot; to auto-fill a default policy.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="termsOfService">Terms of Service</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTermsOfService(DEFAULT_TOS)}
                  >
                    Use Template
                  </Button>
                </div>
                <Textarea
                  id="termsOfService"
                  value={termsOfService}
                  onChange={(e) => setTermsOfService(e.target.value)}
                  placeholder="Paste or write your terms of service..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrivacyPolicy(DEFAULT_PRIVACY)}
                  >
                    Use Template
                  </Button>
                </div>
                <Textarea
                  id="privacyPolicy"
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="Paste or write your privacy policy..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="codeOfConduct">Code of Conduct</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCodeOfConduct(DEFAULT_COC)}
                  >
                    Use Template
                  </Button>
                </div>
                <Textarea
                  id="codeOfConduct"
                  value={codeOfConduct}
                  onChange={(e) => setCodeOfConduct(e.target.value)}
                  placeholder="Paste or write your code of conduct..."
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Step 7: Review */}
          {step === 6 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">University:</span>{" "}
                  {universityName}
                </div>
                <div>
                  <span className="font-medium">Admin:</span> {adminName} (
                  {adminEmail})
                </div>
                <div>
                  <span className="font-medium">Faculties:</span>{" "}
                  {faculties.filter((f) => f.name.trim()).length}
                </div>
                <div>
                  <span className="font-medium">Programs:</span>{" "}
                  {faculties.reduce(
                    (sum, f) =>
                      sum + f.programs.filter((p) => p.name.trim()).length,
                    0
                  )}
                </div>
                <div>
                  <span className="font-medium">Student ID Pattern:</span>{" "}
                  <code className="text-xs">{studentIdPattern}</code>
                </div>
                <div>
                  <span className="font-medium">Gemini API:</span>{" "}
                  {geminiApiKey ? "Configured" : "Missing"}
                </div>
                <div>
                  <span className="font-medium">Resend API:</span>{" "}
                  {resendApiKey ? "Configured" : "Missing"}
                </div>
                <div>
                  <span className="font-medium">Cloudinary:</span>{" "}
                  {cloudinaryCloudName ? "Configured" : "Missing"}
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Spinner className="mr-2 size-4" />}
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
