"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-8 left-8 z-50"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className={cn(
              "h-12 w-12 rounded-full bg-accent border-primary/10 text-primary shadow-2xl hover:bg-accent/90 hover:scale-110 active:scale-95 transition-all duration-300"
            )}
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6 stroke-[3px]" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
