"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReviewerUploadPanel() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("Choose a PDF first.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("subject", subject);
      formData.append("topic", topic);
      formData.append("file", file);

      const response = await fetch("/api/review-materials", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to upload PDF reviewer.");
      }

      setStatus("Reviewer uploaded successfully.");
      setTitle("");
      setDescription("");
      setSubject("");
      setTopic("");
      setFile(null);
      const input = document.getElementById("reviewer-file") as HTMLInputElement | null; if (input) { input.value = ""; }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to upload PDF reviewer.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload PDF reviewer</CardTitle>
        <CardDescription>Use this for reading materials, summaries, and reviewer handouts. Flashcards are still generated from question imports.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="reviewer-title">Title</Label>
            <Input id="reviewer-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer-description">Description</Label>
            <Input id="reviewer-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reviewer-subject">Subject</Label>
              <Input id="reviewer-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewer-topic">Topic</Label>
              <Input id="reviewer-topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer-file">PDF file</Label>
            <Input id="reviewer-file" type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          <Button disabled={isUploading} type="submit">
            {isUploading ? "Uploading..." : "Upload reviewer"}
          </Button>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

