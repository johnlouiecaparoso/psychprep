"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatSubjectTick(subject: string, maxLength: number) {
  if (subject.length <= maxLength) {
    return subject;
  }

  return `${subject.slice(0, Math.max(1, maxLength - 1)).trimEnd()}...`;
}

export function SubjectProgressChart({
  data
}: {
  data: { subject: string; chaptersTaken: number; chaptersLeft: number }[];
}) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const yAxisWidth = isMobile ? 120 : 180;
  const tickMaxLength = isMobile ? 14 : 26;

  return (
    <div className="h-[320px] w-full sm:h-[380px] lg:h-[460px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="subject"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={yAxisWidth}
            tickFormatter={(value: string) => formatSubjectTick(value, tickMaxLength)}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="chaptersTaken" name="Taken" stackId="chapters" fill="#12ad93" radius={[0, 8, 8, 0]} />
          <Bar dataKey="chaptersLeft" name="Left" stackId="chapters" fill="#f59e0b" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
