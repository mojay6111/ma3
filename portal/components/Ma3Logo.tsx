export default function Ma3Logo({ size = "md" }: { size?: "sm"|"md"|"lg" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" }
  return (
    <div className={`${sizes[size]} ma3-logo flex-shrink-0`}>M3</div>
  )
}
