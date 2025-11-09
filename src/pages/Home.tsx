import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Home = () => {
  const navigate = useNavigate();
  const [shimmer, setShimmer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4 animate-slide-up">
        {/* 3D Title */}
        <div className="relative">
          <h1 
            className="text-8xl md:text-9xl font-black tracking-wider"
            style={{
              background: `linear-gradient(${shimmer}deg, hsl(180 100% 50%), hsl(320 100% 50%), hsl(45 100% 55%))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px hsla(180, 100%, 50%, 0.3))",
            }}
          >
            LIFEQUEST
          </h1>
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-xl -z-10 animate-pulse-glow" />
        </div>

        {/* Slogan */}
        <p className="text-2xl md:text-3xl font-light tracking-wide text-foreground/90 animate-float">
          Define It. Pursue It. Achieve It.
        </p>

        {/* CTA Button */}
        <div className="pt-8">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="text-xl px-12 py-8 rounded-2xl font-bold neon-glow hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-secondary border-0"
          >
            Get Started
          </Button>
        </div>

        {/* Floating orbs decoration */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/30 blur-xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-secondary/30 blur-xl animate-float" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 right-20 w-16 h-16 rounded-full bg-accent/30 blur-xl animate-float" style={{ animationDelay: "1s" }} />
      </div>
    </div>
  );
};

export default Home;
