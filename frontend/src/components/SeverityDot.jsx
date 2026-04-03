export function GetSeverityColors(score) {
  if (score >= 70) return { dot: "bg-red-500", border: "border-red-200", text: "text-red-600" };
  if (score >= 45) return { dot: "bg-amber-400", border: "border-amber-200", text: "text-amber-600" };
  return { dot: "bg-green-500", border: "border-green-200", text: "text-green-600" };
}

export function SeverityDot({ score, size = "sm" }) {
  const { dot } = GetSeverityColors(score);
  const sizeClass = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  return <span className={`${sizeClass} rounded-full shrink-0 ${dot}`} />;
}