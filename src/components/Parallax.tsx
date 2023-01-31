import {
  motion,
  useAnimationControls,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./Parallax.module.css";

export function Parallax() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [fgLoaded, setFgLoaded] = useState(false);

  const controlsFg = useAnimationControls();
  const controlsBg = useAnimationControls();

  useEffect(() => {
    controlsFg.start({
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    });
  }, [fgLoaded]);

  useEffect(() => {
    controlsBg.start({
      opacity: 1,
      transition: { duration: 1, ease: "easeInOut" },
    });
  }, [bgLoaded]);
  return (
    <div className={`${styles.parallax} ${styles.fgLoaded}`}>
      <motion.img
        initial={{ opacity: 0 }}
        animate={controlsFg}
        className={styles.fg}
        alt=""
        src="images/bgfg/fg_466.webp"
        srcSet="images/bgfg/fg_200w.webp 200w, images/bgfg/fg_466w.webp 466w, images/bgfg/fg_932w.webp 932w"
        sizes="(max-width: 400px) 200px, (max-width: 600px) 466px, 932px"
        onLoad={() => setFgLoaded(true)}
      />
      <motion.div
        style={{ y }}
        className={styles.bg}
        animate={controlsBg}
        initial={{ opacity: 0 }}
      >
        <img
          alt=""
          src="images/bgfg/bg_466w.webp"
          srcSet="images/bgfg/bg_200w.webp 200w, images/bgfg/bg_466w.webp 466w, images/bgfg/bg_932w.webp 932w"
          sizes="(max-width: 400px) 200px, (max-width: 600px) 466px, 932px"
          onLoad={() => setBgLoaded(true)}
        />
      </motion.div>
    </div>
  );
}
