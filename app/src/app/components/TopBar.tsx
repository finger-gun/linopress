import { BrandLogo } from "./BrandLogo";
import styles from "./TopBar.module.css";

export function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <BrandLogo height={40} />

        <nav className={styles.topNav} aria-label="Primary">
          <a className={styles.topNavItem} href="#" aria-current="page">
            Home
          </a>
          <a className={styles.topNavItem} href="/features">
            Features
          </a>
          <a className={styles.topNavItem} href="/pricing">
            Pricing
          </a>
          <a className={styles.topNavItem} href="/about">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
