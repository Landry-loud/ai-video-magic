import { Link } from "@tanstack/react-router";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle/60 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary-gradient shadow-glow" />
          <span className="font-display text-sm font-semibold text-foreground">AI Edit Studio</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-primary-gradient px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:-translate-y-px"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
