"use client";

import { useEffect, useRef } from "react";

export default function AnimatedWordmark() {
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mark = markRef.current!;
    const prefix = mark.querySelector<HTMLElement>(".wordmark-prefix")!;
    const name = mark.querySelector<HTMLElement>(".wordmark-name")!;
    const dot = mark.querySelector<HTMLElement>(".wordmark-typed-dot")!;
    const measure = mark.querySelector<HTMLElement>(".wordmark-measure")!;
    const actions = mark.closest(".site-nav")!.querySelector<HTMLElement>(".header-actions")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let cycle = 0;
    let steps: number[] = [];
    let disposed = false;

    const fit = () => {
      if (disposed) return;
      const available = actions.getBoundingClientRect().left - mark.getBoundingClientRect().left - 12;
      const fullWidth = measure.getBoundingClientRect().width;
      const prefixWidth = measure.firstElementChild!.getBoundingClientRect().width;
      mark.style.setProperty("--wordmark-scale", String(Math.min(1, Math.max(1, available) / Math.max(1, fullWidth))));
      mark.style.setProperty("--wordmark-shift", `${-prefixWidth}px`);
    };
    const reset = () => {
      steps.forEach(window.clearTimeout);
      steps = [];
      mark.classList.remove("is-typing", "is-settling", "is-point");
      prefix.textContent = "";
      name.textContent = "";
      dot.style.opacity = "0";
    };
    const later = (fn: () => void, delay: number) => steps.push(window.setTimeout(fn, delay));
    const play = () => {
      if (disposed || document.hidden || reduced.matches) return;
      reset();
      fit();
      mark.classList.add("is-typing");
      let time = 0;
      ["made", "by", "tatarin"].forEach((word, index) => {
        const target = index < 2 ? prefix : name;
        if (index) later(() => { prefix.textContent += " "; }, time);
        for (const letter of word) {
          time += 260;
          later(() => { target.textContent += letter; }, time);
        }
        time += 400;
      });
      later(() => { dot.style.opacity = "1"; mark.classList.add("is-point"); }, time);
      later(() => mark.classList.add("is-settling"), time + 900);
      later(reset, time + 1700);
    };
    const schedule = () => {
      window.clearTimeout(cycle);
      reset();
      if (document.hidden || reduced.matches) return;
      const tick = () => { play(); cycle = window.setTimeout(tick, 30000); };
      cycle = window.setTimeout(tick, 30000);
    };
    const resize = new ResizeObserver(fit);
    resize.observe(actions);
    resize.observe(mark.closest(".site-nav")!);
    document.fonts.ready.then(fit);
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", schedule);
    schedule();
    play();
    return () => {
      disposed = true;
      window.clearTimeout(cycle);
      reset();
      resize.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  return <div ref={markRef} className="wordmark" aria-label="made by tatarin">
    <span className="wordmark-rest" aria-hidden="true">tatarin<span className="wordmark-dot">.</span></span>
    <span className="wordmark-track" aria-hidden="true"><span className="wordmark-prefix" /><span className="wordmark-name" /><span className="wordmark-dot wordmark-typed-dot">.</span></span>
    <span className="wordmark-measure" aria-hidden="true"><span>made by </span>tatarin.</span>
  </div>;
}
