import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type FadeInProps = { children: React.ReactNode; delay?: number; className?: string };

/** Fait apparaître son contenu en fondu lorsqu'il entre à l'écran. */
const FadeIn = ({ children, delay = 0, className = "" }: FadeInProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
