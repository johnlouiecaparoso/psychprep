"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export default function ProfilePage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: ""
  });
  const supabase = useMemo(() => (typeof window === "undefined" ? null : createClient()), []);
  const shellRole: Role = (userRole as Role) || "student";

  useEffect(() => {
    if (!authLoading && user && supabase) {
      void fetchProfile();
    }
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, supabase]);

  const fetchProfile = async () => {
    if (!supabase || !user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        email: data.email || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!supabase || !user) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          email: formData.email
        })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      });

      setEditing(false);
      void fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading || authLoading) {
    return (
      <AppShell role={shellRole} title="Profile" description="Loading your profile...">
        <div className="flex h-64 items-center justify-center">
          <p>Loading...</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell role={shellRole} title="Profile" description="Please sign in to view your profile">
        <div className="flex h-64 items-center justify-center">
          <p>Please sign in to view your profile</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={shellRole} title="Profile" description="Manage your account settings and preferences">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdate}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile?.full_name || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge>{profile?.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}</p>
                </div>
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Portal Access</p>
              <p className="text-2xl font-bold capitalize">{shellRole}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role restriction</p>
              <p className="text-sm">Your dashboard and content management access are limited by your assigned role in Supabase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
