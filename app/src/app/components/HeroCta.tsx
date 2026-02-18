import styles from "./HeroCta.module.css";

export function HeroCta() {
  return (
    <h1 className={styles.cta}>
      <span className={styles.ctaMain}>
        Turn your words into a <span className={styles.ctaGradient}>fully featured WordPress site</span>.
      </span>
      <span className={styles.ctaSubline}>Describe your site to get started.</span>
    </h1>
  );
}
