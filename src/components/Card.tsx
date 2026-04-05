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
      className={`rounded-xl border border-card-border bg-card p-6 ${glowClass} ${className}`}
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
    <Card glow={glow}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
          {icon}
        </div>
      </div>
    </Card>
  );
}
