interface Props {
  label: string
  value: string | number
  sub?: string
  color?: "green" | "yellow" | "red" | "blue"
}

const colors = {
  green:  "border-green-500 text-green-400",
  yellow: "border-yellow-500 text-yellow-400",
  red:    "border-red-500 text-red-400",
  blue:   "border-blue-500 text-blue-400",
}

export default function StatCard({ label, value, sub, color = "blue" }: Props) {
  return (
    <div className={`bg-gray-900 border-l-4 ${colors[color]} rounded-lg p-4`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color].split(" ")[1]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
