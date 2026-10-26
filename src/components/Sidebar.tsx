import { useNav, PAGE_TITLES, type PageKey } from '@/context/NavContext';
import {
  LayoutDashboard,
  GitCompareArrows,
  LineChart,
  Table2,
  Lightbulb,
  FlaskConical,
  Info,
  Home,
  Search,
  Menu,
  X,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS: { key: PageKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'comparison', label: 'Product Comparison', icon: GitCompareArrows },
  { key: 'analysis', label: 'Price Analysis', icon: LineChart },
  { key: 'dataset', label: 'Dataset Explorer', icon: Table2 },
  { key: 'insights', label: 'Smart Shopping', icon: Lightbulb },
  { key: 'predict', label: 'Predict New Product', icon: Sparkles },
  { key: 'methodology', label: 'Methodology', icon: FlaskConical },
  { key: 'about', label: 'About Project', icon: Info },
];

interface SidebarProps {
  search: string;
  onSearch: (v: string) => void;
}

export function Sidebar({ search, onSearch }: SidebarProps) {
  const { page, navigate } = useNav();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (key: PageKey) => {
    navigate(key);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#090e0b]/90 text-white px-4 h-16 flex items-center justify-between shadow-lg backdrop-blur-xl">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-white/65 hover:bg-white/[0.07] hover:text-white transition-colors"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-300 text-[#07130b]">
            <TrendingDown size={18} />
          </span>
          <span className="font-bold text-base tracking-tight">PriceScope</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-full lg:h-screen w-[272px] shrink-0 border-r border-white/[0.07] bg-[#090e0b] text-white flex-col z-50 lg:z-30 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0 flex' : '-translate-x-full hidden lg:flex lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 lg:h-[76px] border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingDown size={20} className="text-[#07130b]" />
            </div>
            <div>
              <div className="font-bold text-[16px] leading-tight tracking-tight">PriceScope</div>
              <div className="mt-1 text-[9px] text-white/35 uppercase tracking-[0.19em]">Price intelligence</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/55 hover:bg-white/[0.07] hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-5 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.035] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10 transition-all"
              aria-label="Search products"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Workspace
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = page === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-emerald-300/[0.11] text-emerald-200 shadow-inner'
                      : 'text-white/55 hover:bg-white/[0.045] hover:text-white/90'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-r-full bg-emerald-300" />}
                  <Icon size={17} className={active ? 'text-emerald-300' : 'text-white/35 group-hover:text-emerald-200'} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.07] shrink-0">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-[11px] leading-relaxed text-white/40">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(117,237,170,.6)]" />
              <span className="font-semibold text-white/70">Dataset records</span>
            </div>
            <p>Historical observations, not live retailer prices.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/75">
        <span className="h-px w-5 bg-emerald-300/50" />
        PriceScope workspace
      </div>
      <h1 className="text-[26px] font-semibold text-navy-900 tracking-tight sm:text-3xl lg:text-[34px]">{title}</h1>
      {subtitle && <p className="text-navy-500 mt-2 max-w-3xl text-sm lg:text-[15px] leading-6">{subtitle}</p>}
    </div>
  );
}

export function PageKeyLabel() {
  const { page } = useNav();
  return <>{PAGE_TITLES[page]}</>;
}
