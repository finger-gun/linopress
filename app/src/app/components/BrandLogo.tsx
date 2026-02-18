import Image from "next/image";
import styles from "./BrandLogo.module.css";

type BrandLogoProps = {
  width?: number;
  height?: number;
};

const DEFAULT_WIDTH = 220;
const DEFAULT_HEIGHT = 40;
const DEFAULT_RATIO = DEFAULT_WIDTH / DEFAULT_HEIGHT;

export function BrandLogo({ width, height }: BrandLogoProps) {
  const resolvedWidth =
    width ??
    (height ? Math.round(height * DEFAULT_RATIO) : DEFAULT_WIDTH);

  const resolvedHeight =
    height ??
    (width ? Math.round(width / DEFAULT_RATIO) : DEFAULT_HEIGHT);

  return (
    <Image
      className={styles.brand}
      src="/linopress-logotype-white.svg"
      alt="Linopress"
      width={resolvedWidth}
      height={resolvedHeight}
      priority
    />
  );
}
