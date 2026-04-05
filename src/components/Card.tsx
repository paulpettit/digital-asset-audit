"use client";

import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "blue" | "green" | "amber" | "red" | "purple";
}

export default function Card({ children, className = "", glow }: CardProps) {
  const glowClass = glow ? `glow-${glow}` : "";
  return (
    <div
      className={`surface-elevated rounded-xl border border-card-border p-5 shadow-[0_1px_0_rgba(255,255,255,0.02),0_10px_32px_rgba(2,8,20,0.28)] ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  glow?: "blue" | "green" | "amber" | "red" | "purple";
}

export function MetricCard({ title, value, subtitle, icon, trend, glow }: MetricCardProps) {
  return (
    <Card glow={glow} className="min-h-[148px]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{title}</p>
          <p className="text-3xl font-semibold leading-none text-white">{value}</p>
          {subtitle && <p className="text-xs text-secondary">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-card-border bg-white/5">
          {icon}
        </div>
      </div>
    </Card>
  );
}
