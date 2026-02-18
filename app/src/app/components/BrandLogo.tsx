import Image from "next/image";
import styles from "../page.module.css";

export function BrandLogo() {
  return (
    <Image
      className={styles.brand}
      src="/linopress-logotype-white.svg"
      alt="Linopress"
      width={220}
      height={40}
      priority
    />
  );
}
