import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: 'teal' | 'navy' | 'amber' | 'red';
}

export function KpiCard({ label, value, sub, icon: Icon, accent = 'teal' }: KpiCardProps) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const accents = {
    teal: 'bg-teal-50 text-teal-600',
    navy: 'bg-white text-navy-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div ref={cardRef} className={`card card-hover p-5 reveal-item${visible ? ' is-visible' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-navy-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div key={value} className="number-settle text-2xl font-bold text-navy-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-navy-400 mt-1">{sub}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return <div ref={cardRef} className={`card p-5 reveal-item${visible ? ' is-visible' : ''} ${className}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-navy-900 text-lg">{title}</h3>
      {subtitle && <p className="text-sm text-navy-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
