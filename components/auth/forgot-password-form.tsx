"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address.")
});

type ForgotInput = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema)
  });

  async function onSubmit(values: ForgotInput) {
    try {
      setSubmitError("");
      setSubmitSuccess("");
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined
      });

      if (error) {
        throw error;
      }

      setSubmitSuccess("Reset email sent. Check your inbox for the secure link.");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to send reset email.");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll send a secure password reset link to your email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" type="email" {...register("email")} />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            Send reset link
          </Button>
          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          {submitSuccess ? <p className="text-sm text-emerald-600">{submitSuccess}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
