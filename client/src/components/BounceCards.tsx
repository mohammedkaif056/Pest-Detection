import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface BounceCardsProps {
  className?: string;
  images: string[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
}

export default function BounceCards({
  className = "",
  images,
  containerWidth = 500,
  containerHeight = 250,
  animationDelay = 1,
  animationStagger = 0.08,
  transformStyles = [],
  enableHover = false,
}: BounceCardsProps) {
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    controls.start((i) => ({
      opacity: 1,
      transform: transformStyles[i] || "rotate(0deg) translate(0px)",
      transition: {
        delay: animationDelay + i * animationStagger,
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }));
  }, [controls, animationDelay, animationStagger, transformStyles]);

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
      onMouseEnter={() => enableHover && setIsHovered(true)}
      onMouseLeave={() => enableHover && setIsHovered(false)}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {images.map((image, index) => (
          <motion.div
            key={index}
            custom={index}
            initial={{ opacity: 0, transform: "scale(0.8)" }}
            animate={controls}
            whileHover={
              enableHover
                ? {
                    scale: 1.1,
                    zIndex: 10,
                    rotate: 0,
                    transition: { duration: 0.2 },
                  }
                : {}
            }
            className="absolute rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-card"
            style={{
              width: containerWidth / 3,
              height: containerHeight,
            }}
          >
            <img
              src={image}
              alt={`Pest specimen ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
