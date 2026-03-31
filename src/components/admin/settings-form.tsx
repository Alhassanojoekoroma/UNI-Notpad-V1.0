"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  programs: { id: string; name: string; code: string; isActive: boolean }[];
}

export function SettingsForm() {
  const queryClient = useQueryClient();

  // Settings data
  const { data: settingsRes, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return res.json();
    },
  });

  // Faculties data
  const { data: facultiesRes, isLoading: facultiesLoading } = useQuery({
    queryKey: ["admin-faculties"],
    queryFn: async () => {
      const res = await fetch("/api/admin/faculties");
      return res.json();
    },
  });

  const settings = settingsRes?.data;
  const faculties: Faculty[] = facultiesRes?.data ?? [];

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="academic">Academic Structure</TabsTrigger>
        <TabsTrigger value="apikeys">API Keys</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="tokens">Token Pricing</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        {settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <GeneralSettings settings={settings} queryClient={queryClient} />
        )}
      </TabsContent>

      <TabsContent value="academic">
        {facultiesLoading ? (
          <SettingsSkeleton />
        ) : (
          <AcademicStructure
            faculties={faculties}
            queryClient={queryClient}
          />
        )}
      </TabsContent>

      <TabsContent value="apikeys">
        {settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <ApiKeysSettings settings={settings} queryClient={queryClient} />
        )}
      </TabsContent>

      <TabsContent value="policies">
        {settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <PoliciesSettings settings={settings} queryClient={queryClient} />
        )}
      </TabsContent>

      <TabsContent value="tokens">
        {settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <TokenSettings settings={settings} queryClient={queryClient} />
        )}
      </TabsContent>
    </Tabs>
  );
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GeneralSettings({ settings, queryClient }: { settings: any; queryClient: any }) {
  const [universityName, setUniversityName] = useState(settings?.universityName ?? "");
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor ?? "#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondaryColor ?? "#1e1e1e");
  const [domain, setDomain] = useState(settings?.domain ?? "");
  const [studentIdPattern, setStudentIdPattern] = useState(settings?.studentIdPattern ?? "");
  const [maxSemesters, setMaxSemesters] = useState(settings?.maxSemesters ?? 8);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>University branding and basic configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>University Name</Label>
          <Input value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-12 h-10 p-1" />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domain</Label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="uninotepad.example.com" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Student ID Pattern</Label>
            <Input value={studentIdPattern} onChange={(e) => setStudentIdPattern(e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Max Semesters</Label>
            <Input type="number" min={1} value={maxSemesters} onChange={(e) => setMaxSemesters(Number(e.target.value))} />
          </div>
        </div>
        <Button
          onClick={() => mutation.mutate({ universityName, primaryColor, secondaryColor, domain, studentIdPattern, maxSemesters })}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Spinner className="mr-2 size-4" />}
          Save Changes
        </Button>
        {mutation.isSuccess && <p className="text-sm text-green-600">Settings saved successfully</p>}
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AcademicStructure({ faculties, queryClient }: { faculties: Faculty[]; queryClient: any }) {
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyCode, setNewFacultyCode] = useState("");
  const [newProgramDialog, setNewProgramDialog] = useState<string | null>(null);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramCode, setNewProgramCode] = useState("");

  const createFaculty = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFacultyName, code: newFacultyCode }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faculties"] });
      setNewFacultyName("");
      setNewFacultyCode("");
    },
  });

  const deactivateFaculty = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/faculties/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-faculties"] }),
  });

  const createProgram = useMutation({
    mutationFn: async (facultyId: string) => {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProgramName, code: newProgramCode, facultyId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faculties"] });
      setNewProgramName("");
      setNewProgramCode("");
      setNewProgramDialog(null);
    },
  });

  const deactivateProgram = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-faculties"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Structure</CardTitle>
        <CardDescription>Manage faculties and programs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add faculty */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>New Faculty Name</Label>
            <Input value={newFacultyName} onChange={(e) => setNewFacultyName(e.target.value)} placeholder="Faculty of Engineering" />
          </div>
          <div className="w-32 space-y-1">
            <Label>Code</Label>
            <Input value={newFacultyCode} onChange={(e) => setNewFacultyCode(e.target.value)} placeholder="ENG" />
          </div>
          <Button onClick={() => createFaculty.mutate()} disabled={!newFacultyName.trim() || !newFacultyCode.trim() || createFaculty.isPending}>
            <Plus className="size-4 mr-1" /> Add
          </Button>
        </div>

        {/* Faculty list */}
        {faculties.map((faculty) => (
          <Card key={faculty.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{faculty.name}</h4>
                <Badge variant="outline">{faculty.code}</Badge>
                {!faculty.isActive && <Badge variant="destructive">Inactive</Badge>}
              </div>
              <div className="flex gap-1">
                <Dialog open={newProgramDialog === faculty.id} onOpenChange={(open) => setNewProgramDialog(open ? faculty.id : null)}>
                  <DialogTrigger render={<Button variant="ghost" size="sm" />}>
                    <Plus className="size-3 mr-1" /> Program
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Program to {faculty.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Program Name</Label>
                        <Input value={newProgramName} onChange={(e) => setNewProgramName(e.target.value)} placeholder="Computer Science" />
                      </div>
                      <div className="space-y-2">
                        <Label>Program Code</Label>
                        <Input value={newProgramCode} onChange={(e) => setNewProgramCode(e.target.value)} placeholder="CS" />
                      </div>
                      <Button onClick={() => createProgram.mutate(faculty.id)} disabled={!newProgramName.trim() || !newProgramCode.trim()}>
                        Add Program
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {faculty.isActive && (
                  <Button variant="ghost" size="sm" onClick={() => deactivateFaculty.mutate(faculty.id)}>
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            {faculty.programs.length > 0 && (
              <div className="ml-4 space-y-1">
                {faculty.programs.map((program) => (
                  <div key={program.id} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span>{program.name}</span>
                      <Badge variant="outline" className="text-xs">{program.code}</Badge>
                      {!program.isActive && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                    </div>
                    {program.isActive && (
                      <Button variant="ghost" size="sm" onClick={() => deactivateProgram.mutate(program.id)}>
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ApiKeysSettings({ settings, queryClient }: { settings: any; queryClient: any }) {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(settings?.cloudinaryCloudName ?? "");
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState(settings?.geminiModel ?? "gemini-2.0-flash");

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // Only send non-empty values
      const filtered: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== "") {
          filtered[key] = value;
        }
      }
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtered),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Update API keys. Leave blank to keep existing values.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Gemini Model</Label>
          <Input value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Gemini API Key {settings?.geminiApiKey && <span className="text-muted-foreground">({settings.geminiApiKey})</span>}</Label>
          <Input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="Enter new key to update" />
        </div>
        <div className="space-y-2">
          <Label>Resend API Key {settings?.resendApiKey && <span className="text-muted-foreground">({settings.resendApiKey})</span>}</Label>
          <Input type="password" value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} placeholder="Enter new key to update" />
        </div>
        <div className="space-y-2">
          <Label>Cloudinary Cloud Name</Label>
          <Input value={cloudinaryCloudName} onChange={(e) => setCloudinaryCloudName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cloudinary API Key {settings?.cloudinaryApiKey && <span className="text-muted-foreground">({settings.cloudinaryApiKey})</span>}</Label>
            <Input type="password" value={cloudinaryApiKey} onChange={(e) => setCloudinaryApiKey(e.target.value)} placeholder="Enter new key" />
          </div>
          <div className="space-y-2">
            <Label>Cloudinary API Secret {settings?.cloudinaryApiSecret && <span className="text-muted-foreground">({settings.cloudinaryApiSecret})</span>}</Label>
            <Input type="password" value={cloudinaryApiSecret} onChange={(e) => setCloudinaryApiSecret(e.target.value)} placeholder="Enter new secret" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>ElevenLabs API Key {settings?.elevenlabsApiKey && <span className="text-muted-foreground">({settings.elevenlabsApiKey})</span>}</Label>
          <Input type="password" value={elevenlabsApiKey} onChange={(e) => setElevenlabsApiKey(e.target.value)} placeholder="Enter new key" />
        </div>
        <Button
          onClick={() =>
            mutation.mutate({
              geminiModel,
              geminiApiKey: geminiApiKey || undefined,
              resendApiKey: resendApiKey || undefined,
              cloudinaryCloudName,
              cloudinaryApiKey: cloudinaryApiKey || undefined,
              cloudinaryApiSecret: cloudinaryApiSecret || undefined,
              elevenlabsApiKey: elevenlabsApiKey || undefined,
            })
          }
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Spinner className="mr-2 size-4" />}
          Update API Keys
        </Button>
        {mutation.isSuccess && <p className="text-sm text-green-600">API keys updated</p>}
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PoliciesSettings({ settings, queryClient }: { settings: any; queryClient: any }) {
  const [termsOfService, setTermsOfService] = useState(settings?.termsOfService ?? "");
  const [privacyPolicy, setPrivacyPolicy] = useState(settings?.privacyPolicy ?? "");
  const [codeOfConduct, setCodeOfConduct] = useState(settings?.codeOfConduct ?? "");
  const [contentPolicy, setContentPolicy] = useState(settings?.contentPolicy ?? "");

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policies</CardTitle>
        <CardDescription>University policies and guidelines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Terms of Service</Label>
          <Textarea value={termsOfService} onChange={(e) => setTermsOfService(e.target.value)} rows={6} />
        </div>
        <div className="space-y-2">
          <Label>Privacy Policy</Label>
          <Textarea value={privacyPolicy} onChange={(e) => setPrivacyPolicy(e.target.value)} rows={6} />
        </div>
        <div className="space-y-2">
          <Label>Code of Conduct</Label>
          <Textarea value={codeOfConduct} onChange={(e) => setCodeOfConduct(e.target.value)} rows={6} />
        </div>
        <div className="space-y-2">
          <Label>Content Policy</Label>
          <Textarea value={contentPolicy} onChange={(e) => setContentPolicy(e.target.value)} rows={6} />
        </div>
        <Button
          onClick={() => mutation.mutate({ termsOfService, privacyPolicy, codeOfConduct, contentPolicy })}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Spinner className="mr-2 size-4" />}
          Save Policies
        </Button>
        {mutation.isSuccess && <p className="text-sm text-green-600">Policies saved</p>}
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TokenSettings({ settings, queryClient }: { settings: any; queryClient: any }) {
  const [freeQueriesPerDay, setFreeQueriesPerDay] = useState(settings?.freeQueriesPerDay ?? 20);
  const [freeSuspensionHours, setFreeSuspensionHours] = useState(settings?.freeSuspensionHours ?? 7);
  const [referralBonusTokens, setReferralBonusTokens] = useState(settings?.referralBonusTokens ?? 5);
  const [tokenPackages, setTokenPackages] = useState(
    settings?.tokenPackages ? JSON.stringify(settings.tokenPackages, null, 2) : "[]"
  );

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Pricing</CardTitle>
        <CardDescription>AI token system configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Free Queries/Day</Label>
            <Input type="number" min={0} value={freeQueriesPerDay} onChange={(e) => setFreeQueriesPerDay(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Suspension Hours</Label>
            <Input type="number" min={0} value={freeSuspensionHours} onChange={(e) => setFreeSuspensionHours(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Referral Bonus Tokens</Label>
            <Input type="number" min={0} value={referralBonusTokens} onChange={(e) => setReferralBonusTokens(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Token Packages (JSON)</Label>
          <Textarea value={tokenPackages} onChange={(e) => setTokenPackages(e.target.value)} rows={6} className="font-mono text-sm" placeholder='[{"amount": 10, "priceSLE": 50, "priceUSD": 2}]' />
        </div>
        <Button
          onClick={() => {
            let parsedPackages;
            try {
              parsedPackages = JSON.parse(tokenPackages);
            } catch {
              return;
            }
            mutation.mutate({
              freeQueriesPerDay,
              freeSuspensionHours,
              referralBonusTokens,
              tokenPackages: JSON.stringify(parsedPackages),
            });
          }}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Spinner className="mr-2 size-4" />}
          Save Token Settings
        </Button>
        {mutation.isSuccess && <p className="text-sm text-green-600">Token settings saved</p>}
      </CardContent>
    </Card>
  );
}
