import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.glowOne} aria-hidden="true" />
      <div className={styles.glowTwo} aria-hidden="true" />

      <section className={styles.hero}>
        <Image
          className={styles.brand}
          src="/linopress-logotype-white.svg"
          alt="Linopress"
          width={220}
          height={40}
          priority
        />

        <h1 className={styles.cta}>
          <span className={styles.ctaMain}>
            Turn your words into a{" "}
            <span className={styles.ctaGradient}>fully featured WordPress site</span>.
          </span>
          <span className={styles.ctaSubline}>Describe your site to get started.</span>
        </h1>

        <form className={styles.promptPanel}>
          <div className={styles.promptBar} aria-hidden="true">
            <span className={styles.promptUrl}>linopress / site brief</span>
          </div>

          <div className={styles.promptBody}>
            <textarea
              id="site-brief"
              className={styles.promptInput}
              name="site-brief"
              placeholder="Build a premium yoga studio site with classes, memberships, and instructor bios."
            />

            <div className={styles.promptActions}>
              <button type="submit" className={styles.submitButton}>
                Submit prompt
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
