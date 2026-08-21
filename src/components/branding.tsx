import Link from "next/link";
import { ORG_SHORT, ORG_NAME } from "@/lib/constants";

export function Emblem({ className = "h-10 w-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/cpp-emblem.png"
      alt={`${ORG_NAME} emblem — sitting cat seal`}
      className={`rounded-full object-contain ${className}`}
    />
  );
}

/** Horizontal white-and-black flag as specified in the Constitution. */
export function Flag({ className = "h-2 w-16" }: { className?: string }) {
  return (
    <span
      className={`inline-block overflow-hidden rounded-[2px] border border-neutral-300 ${className}`}
      aria-label="CPP flag — horizontal white and black"
      role="img"
    >
      <span className="block h-1/2 w-full bg-white" />
      <span className="block h-1/2 w-full bg-black" />
    </span>
  );
}

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2.5">
      <Emblem className={size === "sm" ? "h-8 w-8" : "h-10 w-10"} />
      <span className="leading-tight">
        <span className="block text-sm font-extrabold tracking-[0.18em] text-neutral-900">
          {ORG_SHORT}
        </span>
        <span
          className={`block font-medium text-neutral-500 ${
            size === "sm" ? "text-[10px]" : "text-[11px]"
          }`}
        >
          Common People&apos;s Party
        </span>
      </span>
    </span>
  );
}
