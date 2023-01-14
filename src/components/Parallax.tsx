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
  const y = useTransform(scrollYProgress, [0, 1], [0, 50]);
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
        alt="martin on vacation"
        src="images/fg.png"
        onLoad={() => setFgLoaded(true)}
      />
      <motion.div
        style={{ y }}
        className={styles.bg}
        animate={controlsBg}
        initial={{ opacity: 0 }}
      >
        <img
          alt="martin on vacation"
          src="images/bg.jpg"
          onLoad={() => setBgLoaded(true)}
        />
      </motion.div>
    </div>
  );
}
