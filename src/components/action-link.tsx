import Link from "next/link";
import type { LinkProps } from "next/link";
import { cn } from "@/lib/utils";

type ActionLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-red-600 text-white shadow-lg shadow-red-950/25 hover:bg-red-500",
  secondary: "bg-cyan-300 text-black shadow-lg shadow-cyan-950/20 hover:bg-cyan-200",
  ghost: "border border-white/10 bg-white/5 text-white hover:border-cyan-400/40 hover:bg-cyan-400/10",
};

export function ActionLink({ children, className, variant = "ghost", ...props }: ActionLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] transition duration-200 sm:tracking-[0.16em]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function ExternalAction({
  children,
  className,
  href,
  variant = "ghost",
}: Readonly<{ children: React.ReactNode; className?: string; href: string; variant?: "primary" | "secondary" | "ghost" }>) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] transition duration-200 sm:tracking-[0.16em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}
