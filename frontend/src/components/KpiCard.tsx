import type { ElementType } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  trend?: number;
  overdue?: boolean;
}

export default function KpiCard({ icon: Icon, label, value, trend, overdue }: KpiCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 flex flex-col gap-2 transition-colors duration-150 hover:border-[#FF5F03]/30">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#8a8f98] font-[510]">{label}</span>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${overdue ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#FF5F03]-bg text-[#FF5F03]'}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-[24px] font-[590] tracking-tight ${overdue ? 'text-[#DC2626]' : 'text-[#f7f8f8]'}`}>
          {value}
        </span>
        {trend !== undefined && (
          <span
            className={`text-[12px] font-[510] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
              trend >= 0
                ? 'text-[#16A34A] bg-[#16A34A]/10'
                : 'text-[#DC2626] bg-[#DC2626]/10'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
