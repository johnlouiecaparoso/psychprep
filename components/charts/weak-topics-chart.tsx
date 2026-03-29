"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#12ad93", "#ff9f43", "#60a5fa", "#f87171"];

export function WeakTopicsChart({
  data
}: {
  data: { topic: string; accuracy: number }[];
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
        <PieChart>
          <Pie
            data={data}
            innerRadius={isMobile ? 48 : 70}
            outerRadius={isMobile ? 82 : 110}
            dataKey="accuracy"
            nameKey="topic"
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.topic} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
