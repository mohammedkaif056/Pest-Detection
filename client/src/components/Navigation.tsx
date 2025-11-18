import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    // { href: "/", label: "Home" },
    { href: "/detect", label: "Detect" },
    { href: "/species", label: "Species" },
    { href: "/history", label: "History" },
    { href: "/learn", label: "Learn New" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2 -ml-3 cursor-pointer">
              <Bug className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">PestEdge-FSL</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate cursor-pointer ${
                    location === link.href
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  }`}
                >
                  {link.label}
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/detect">
              <Button className="rounded-full" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-menu-toggle"
              className="rounded-full"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${link.label.toLowerCase().replace(" ", "-")}`}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium hover-elevate cursor-pointer ${
                    location === link.href
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  }`}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            <Link href="/detect">
              <Button className="w-full rounded-full mt-4" data-testid="button-mobile-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
