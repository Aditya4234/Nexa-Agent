"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/stores/auth";
import { ApiKeysSettings } from "@/components/settings/ApiKeysSettings";
import { LLMProviderSettings } from "@/components/settings/LLMProviderSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [memory, setMemory] = useState(true);
  const [notifyRun, setNotifyRun] = useState(true);
  const [notifyFail, setNotifyFail] = useState(true);
  const [notifyApproval, setNotifyApproval] = useState(true);
  const [saved, setSaved] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const themeOptions = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, appearance, and workspace preferences.</p>
      </div>

      {saved && <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">Settings saved.</div>}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["account", "llm", "appearance", "api-keys", "memory", "notifications", "security", "profile"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t === "llm" ? "LLM Provider" : t === "api-keys" ? "API Keys" : t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Your sign-in details and role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex h-9 items-center">
                    <Badge variant="secondary" className="capitalize">
                      {user?.role || "user"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={flashSaved}>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm">
          <LLMProviderSettings />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Choose how NexaAgent looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                      theme === id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Memory</CardTitle>
              <CardDescription>Control how agents remember context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Conversation memory</p>
                  <p className="text-xs text-muted-foreground">Keep context within each conversation</p>
                </div>
                <Switch checked={memory} onCheckedChange={setMemory} />
              </div>
              <Button variant="outline" onClick={flashSaved}>
                Clear all memory
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Choose what you get notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Agent completed", desc: "When an agent finishes a task", value: notifyRun, set: setNotifyRun },
                { label: "Agent failed", desc: "When an agent run errors", value: notifyFail, set: setNotifyFail },
                { label: "Approval required", desc: "When a sensitive action needs your approval", value: notifyApproval, set: setNotifyApproval },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch checked={n.value} onCheckedChange={n.set} />
                </div>
              ))}
              <Button onClick={flashSaved}>Save preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Password and session management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" placeholder="At least 8 characters" />
              </div>
              <Button onClick={flashSaved}>Update password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue={user?.full_name || ""} />
              </div>
              <Button onClick={flashSaved}>Save profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}