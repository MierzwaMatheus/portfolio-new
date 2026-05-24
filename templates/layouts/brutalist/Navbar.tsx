import { Link, useRoute } from "wouter";

const NAV_ITEMS = [
  { href: "/", label: "início" },
  { href: "/curriculo", label: "currículo" },
  { href: "/portfolio", label: "portfólio" },
  { href: "/sobre", label: "sobre-mim" },
  { href: "/blog", label: "blog" },
] as const;

export function Navbar() {
  return (
    <nav
      style={{ fontFamily: "var(--font-mono, monospace)" }}
      className="border-b-2 border-foreground bg-background text-foreground"
    >
      <div className="flex items-center px-4 py-2 border-b border-foreground text-xs gap-4">
        <span className="opacity-70">[●][○][○]</span>
        <span className="flex-1 text-xs">rubrica:~/portfolio</span>
        <span className="opacity-50">tty1 · 80x40</span>
      </div>
      <div className="flex text-xs overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <NavTab key={item.href} href={item.href} label={item.label} />
        ))}
        <div className="flex-1" />
      </div>
    </nav>
  );
}

function NavTab({ href, label }: { href: string; label: string }) {
  const [active] = useRoute(href === "/" ? "/" : `${href}*`);
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-5 py-2.5 border-r border-foreground no-underline transition-colors"
      style={{
        background: active ? "var(--foreground)" : "transparent",
        color: active ? "var(--background)" : "var(--foreground)",
        fontWeight: active ? 700 : 400,
      }}
    >
      <span className="opacity-60">{active ? "▶" : " "}</span>
      {label}.sh
    </Link>
  );
}
