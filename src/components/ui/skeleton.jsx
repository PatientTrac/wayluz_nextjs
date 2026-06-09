'use client';

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted bg-gray-800", className)}
      {...props}
    />
  )
}

export { Skeleton }