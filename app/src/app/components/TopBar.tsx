import { useEffect, useId, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import styles from "./TopBar.module.css";

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navMenuId = useId();
  const navLinks = [
    { label: "Home", href: "#", isCurrent: true },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ];

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 861px)");

    const handleDesktopSwitch = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };

    desktopMediaQuery.addEventListener("change", handleDesktopSwitch);

    return () => {
      desktopMediaQuery.removeEventListener("change", handleDesktopSwitch);
    };
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen((current) => !current);
  };

  const handleNavItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <BrandLogo height={40} />

        <button
          type="button"
          className={`${styles.navToggle} ${isMenuOpen ? styles.navToggleOpen : ""}`}
          aria-expanded={isMenuOpen}
          aria-controls={navMenuId}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={handleMenuToggle}
        >
          <span className={styles.navToggleBar} />
          <span className={styles.navToggleBar} />
          <span className={styles.navToggleBar} />
        </button>

        <nav className={styles.desktopNav} aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.label}
              className={styles.topNavItem}
              href={link.href}
              aria-current={link.isCurrent ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <nav
          id={navMenuId}
          className={`${styles.mobileNav} ${isMenuOpen ? styles.mobileNavOpen : ""}`}
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <a
              key={`mobile-${link.label}`}
              className={styles.topNavItem}
              href={link.href}
              aria-current={link.isCurrent ? "page" : undefined}
              onClick={handleNavItemClick}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
