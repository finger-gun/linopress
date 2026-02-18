"use client";

import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "./components/BrandLogo";
import { HeroCta } from "./components/HeroCta";
import { PromptComposer } from "./components/PromptComposer";
import styles from "./page.module.css";

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSubmitting(false);
    }, 1100);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSubmitting]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.glowOne} aria-hidden="true" />
      <div className={styles.glowTwo} aria-hidden="true" />

      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <BrandLogo height={40} />

          <nav className={styles.topNav} aria-label="Primary">
            <a className={styles.topNavItem} href="#" aria-current="page">
              Home
            </a>
          </nav>
        </div>
      </header>

      <section className={styles.mainContent}>
        <div className={styles.hero}>
          <HeroCta />
          <PromptComposer isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </div>
      </section>
    </main>
  );
}
