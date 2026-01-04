import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export default function AnimatedCounter({ value, duration = 1.5 }: { value: number, duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest))
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{display}</span>;
}