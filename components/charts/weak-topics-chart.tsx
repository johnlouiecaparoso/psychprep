"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#12ad93", "#ff9f43", "#60a5fa", "#f87171"];

export function WeakTopicsChart({
  data
}: {
  data: { topic: string; accuracy: number }[];
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={110}
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
