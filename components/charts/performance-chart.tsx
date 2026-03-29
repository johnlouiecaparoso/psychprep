"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PerformanceChart({
  data
}: {
  data: { subject: string; score: number }[];
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

  return (
    <div className="h-[260px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: isMobile ? -24 : 0, bottom: isMobile ? 48 : 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="subject"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            interval={0}
            angle={isMobile ? -20 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 52 : 30}
          />
          <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="score" fill="#12ad93" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
