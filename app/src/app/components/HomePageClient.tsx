"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "../page.module.css";
import { HeroCta } from "./HeroCta";
import { PromptComposer } from "./PromptComposer";
import { TopBar } from "./TopBar";

export function HomePageClient() {
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

      <TopBar />

      <section className={styles.mainContent}>
        <div className={styles.hero}>
          <HeroCta />
          <PromptComposer isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </div>
      </section>
    </main>
  );
}
