"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, FileText, HeartPulse, Mail, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

const slideshowAssets = [
  {
    src: "/marketing/ChatGPT%20Image%20Jun%2012%2C%202026%2C%2010_23_49%20AM.png",
    alt: "MedMatch Profil und Bewerbungsschritte"
  },
  {
    src: "/marketing/ChatGPT%20Image%20Jun%2012%2C%202026%2C%2010_23_33%20AM%20(1).png",
    alt: "MedMatch Bewerbungsuebersicht"
  },
  {
    src: "/marketing/ChatGPT%20Image%20Jun%2012%2C%202026%2C%2010_23_33%20AM%20(2).png",
    alt: "MedMatch Stellenuebersicht"
  },
  {
    src: "/marketing/ChatGPT%20Image%20Jun%2012%2C%202026%2C%2010_23_33%20AM%20(3).png",
    alt: "MedMatch Postfach"
  }
];

const launchFeatures = [
  {
    icon: FileText,
    title: "Lebenslauf",
    description: "Automatisch aus dem Profil erstellen"
  },
  {
    icon: PenLine,
    title: "Motivationsschreiben",
    description: "Mit KI vorbereiten"
  },
  {
    icon: Mail,
    title: "Bewerbungs-E-Mail",
    description: "Direkt generieren"
  }
];

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slideshowAssets.length;
  const nextIndex = (activeIndex + 1) % slideCount;
  const previousIndex = (activeIndex - 1 + slideCount) % slideCount;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slideCount]);

  const showPreviousSlide = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + slideCount) % slideCount);
  };

  const showNextSlide = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount);
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,#ffffff_0%,rgba(255,255,255,0.94)_34%,rgba(226,241,255,0.84)_100%)]" />
      <div className="pointer-events-none absolute -left-[18rem] top-[-12rem] -z-10 h-[40rem] w-[40rem] rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute right-[-14rem] top-[3rem] -z-10 h-[46rem] w-[46rem] rounded-full bg-sky-200/50 blur-3xl" />

      <div className="container py-6 md:py-8 lg:min-h-[calc(100svh-5rem)] lg:py-6">
        <div className="mb-5 rounded-[2rem] border border-white/85 bg-white/72 p-4 shadow-[0_24px_70px_rgba(15,64,130,0.11)] backdrop-blur-xl md:p-5 lg:mb-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-4xl">
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[clamp(2.2rem,3vw,3.5rem)]">
                Medizinische Karriereschritte an einem Ort
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Profile, Lebenslauf, Motivationsschreiben und Bewerbungs-E-Mail übersichtlich in einer Oberfläche.
              </p>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap lg:justify-end">
              <Button asChild size="lg" className="min-h-12 rounded-2xl px-7 shadow-[0_18px_34px_rgba(0,96,210,0.24)]">
                <Link href="/register">
                  Konto erstellen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-12 rounded-2xl border-primary bg-white/90 px-7 text-primary hover:bg-primary/5">
                <Link href="/opportunities">Stellen entdecken</Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {launchFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="flex min-h-[5.25rem] items-center gap-3 rounded-2xl border border-blue-100/80 bg-white/82 p-3.5 shadow-[0_14px_34px_rgba(15,64,130,0.08)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight text-slate-950">{feature.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative h-[min(620px,calc(100svh-18rem))] min-h-[430px] overflow-hidden rounded-[2rem] border border-white/85 bg-white/80 shadow-[0_30px_90px_rgba(15,64,130,0.16)] md:rounded-[2.75rem] max-md:h-[420px] max-md:min-h-0">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.96)_0%,rgba(245,250,255,0.92)_36%,rgba(232,243,255,0.72)_100%)]" />

          <div className="pointer-events-none absolute inset-y-[14%] left-[-34%] z-0 hidden w-[70%] opacity-35 blur-[1px] saturate-75 transition-all duration-700 md:block lg:left-[-24%]">
            <Image
              src={slideshowAssets[nextIndex].src}
              alt=""
              fill
              sizes="60vw"
              className="object-contain"
            />
          </div>

          <div className="pointer-events-none absolute inset-y-[14%] right-[-34%] z-0 hidden w-[70%] opacity-35 blur-[1px] saturate-75 transition-all duration-700 md:block lg:right-[-24%]">
            <Image
              src={slideshowAssets[previousIndex].src}
              alt=""
              fill
              sizes="60vw"
              className="object-contain"
            />
          </div>

          <div className="absolute inset-x-2 inset-y-5 z-10 sm:inset-x-4 md:inset-x-[8%] md:inset-y-[7%] lg:inset-x-[10%]">
            <Image
              key={slideshowAssets[activeIndex].src}
              src={slideshowAssets[activeIndex].src}
              alt={slideshowAssets[activeIndex].alt}
              fill
              priority={activeIndex === 0}
              sizes="(min-width: 1024px) 82vw, 100vw"
              className="object-contain drop-shadow-[0_26px_60px_rgba(15,64,130,0.22)] transition-all duration-700"
            />
          </div>

          <button
            type="button"
            aria-label="Vorherige Hero-Folie anzeigen"
            onClick={showPreviousSlide}
            className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/88 text-primary shadow-[0_14px_32px_rgba(15,64,130,0.18)] backdrop-blur-md transition hover:-translate-x-0.5 hover:bg-white md:left-5 md:h-12 md:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Naechste Hero-Folie anzeigen"
            onClick={showNextSlide}
            className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/88 text-primary shadow-[0_14px_32px_rgba(15,64,130,0.18)] backdrop-blur-md transition hover:translate-x-0.5 hover:bg-white md:right-5 md:h-12 md:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 right-5 z-30 hidden items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 shadow-[0_14px_38px_rgba(15,64,130,0.16)] backdrop-blur-md md:flex">
            <HeartPulse className="h-4 w-4 text-primary" />
            {slideshowAssets.map((slide, index) => (
              <span
                key={slide.src}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-7 bg-primary" : "w-2.5 bg-primary/25"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
