'use client'

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const PARTICLES_SEED = Math.random().toString(36).slice(2);

function ParticlesBackgroundComponent() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    console.log(container);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "#04070f",
        },
      },
      seed: PARTICLES_SEED,
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: false,
            mode: "push",
          },
          onHover: {
            enable: false,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 3,
          },
          repulse: {
            distance: 160,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: ["#7dd3fc", "#22c55e", "#eef2ff"],
        },
        links: {
          color: "#94a3b8",
          distance: 120,
          enable: true,
          opacity: 0.18,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: 0.8,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 900,
          },
          value: 70,
        },
        opacity: {
          value: 0.35,
          animation: {
            enable: true,
            speed: 0.8,
            minimumValue: 0.15,
          },
        },
        shape: {
          type: ["circle", "square", "triangle"],
        },
        size: {
          value: { min: 1, max: 4 },
          random: true,
        },
        stroke: {
          width: 0.5,
          color: "#0f172a",
        },
      },
      detectRetina: true,
      emitters: {
        direction: "none",
        rate: {
          quantity: 0,
          delay: 0,
        },
      },
    }),
    [],
  );

  const particlesElement = useMemo(
    () => (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute inset-0 z-0"
      />
    ),
    [options, particlesLoaded],
  );

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden bg-[#04070f] transition-opacity duration-1000 ease-out ${
      init ? "opacity-100" : "opacity-0"
    }`}>
      {particlesElement}
    </div>
  );
}

export const ParticlesBackground = memo(ParticlesBackgroundComponent);
ParticlesBackground.displayName = "ParticlesBackground";
