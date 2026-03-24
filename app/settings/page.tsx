"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email_notifications: true,
    push_notifications: false,
    email_reminders: true,
    study_reminders: true,
    theme: "light"
  });
  const supabase = createClient();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSave = async () => {
    try {
      // Save settings to user metadata
      await supabase.auth.updateUser({
        data: { 
          preferences: formData 
        }
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
  };

  if (loading) {
    return (
      <AppShell role="student" title="Settings" description="Loading your settings...">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell role="student" title="Settings" description="Please sign in to access your settings">
        <div className="flex items-center justify-center h-64">
          <p>Please sign in to access your settings</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="student" title="Settings" description="Manage your account preferences and notifications">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive exam reminders and updates via email
                </p>
              </div>
              <Switch
                id="email_notifications"
                checked={formData.email_notifications}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, email_notifications: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push_notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications for urgent updates
                </p>
              </div>
              <Switch
                id="push_notifications"
                checked={formData.push_notifications}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, push_notifications: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_reminders">Email Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Daily study reminders and progress updates
                </p>
              </div>
              <Switch
                id="email_reminders"
                checked={formData.email_reminders}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, email_reminders: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="study_reminders">Study Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Remind me to study and practice regularly
                </p>
              </div>
              <Switch
                id="study_reminders"
                checked={formData.study_reminders}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, study_reminders: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={formData.theme}
                onChange={(e) => 
                  setFormData({ ...formData, theme: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Account Actions</Label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Export My Data
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </AppShell>
  );
}
