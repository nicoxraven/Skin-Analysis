import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { scoreLabel } from "../lib/helpers";

export function ScoreRing({ score }) {
  const { label, color } = scoreLabel(score);
  const data = [{ value: score, fill: "#6B3A52" }];
  return (
    <div className="relative flex items-center justify-center">
      <RadialBarChart width={180} height={180} cx={90} cy={90} innerRadius={65} outerRadius={82} startAngle={225} endAngle={-45} data={data} barSize={13}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: "#EDE3DE" }} dataKey="value" cornerRadius={8} />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold text-primary leading-none">{score}</span>
        <span className={`text-xs font-semibold mt-1 ${color}`}>{label}</span>
      </div>
    </div>
  );
}
