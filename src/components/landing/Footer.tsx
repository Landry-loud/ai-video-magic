import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link to="/" className="font-display text-sm font-semibold text-foreground">
          AI Edit <span className="text-muted-foreground">Studio</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AI Edit Studio. Built for creators.
        </p>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
