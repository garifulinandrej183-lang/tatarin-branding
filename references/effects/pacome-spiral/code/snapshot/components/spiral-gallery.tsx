"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Plus, SkipBack, SkipForward, Mouse, MoveHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteNavigation from "./site-navigation";
import { artworks, type SceneApi } from "@/lib/spiral-art";

function openProject(index: number) {
  const href = artworks[index].href;
  if (href) window.open(href, "_blank", "noopener,noreferrer");
}

export default function SpiralGallery() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneApi | null>(null);
  const pausedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [coarse, setCoarse] = useState(false);
  const displayIndex = hovered ?? selected;
  const current = artworks[displayIndex];
  const total = String(artworks.length).padStart(2, "0");

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: none), (pointer: coarse)");
    const updateMotion = () => setReduced(motion.matches);
    const updatePointer = () => setCoarse(pointer.matches);
    updateMotion(); updatePointer();
    motion.addEventListener("change", updateMotion);
    pointer.addEventListener("change", updatePointer);
    return () => {
      motion.removeEventListener("change", updateMotion);
      pointer.removeEventListener("change", updatePointer);
    };
  }, []);

  useEffect(() => {
    if (reduced || !canvasRef.current || !stageRef.current) return;
    let canceled = false;
    let instance: SceneApi | null = null;
    import("@/lib/spiral-scene").then(async ({ createSpiral }) => {
      if (canceled || !canvasRef.current || !stageRef.current) return;
      instance = await createSpiral({
        canvas: canvasRef.current,
        container: stageRef.current,
        onReady: () => { if (!canceled) setReady(true); },
        onFallback: () => { if (!canceled) { setReady(false); setHovered(null); } },
        onSelected: index => { if (!canceled) setSelected(index); },
        onHover: index => { if (!canceled) setHovered(index); },
        onActivate: index => { if (!canceled) openProject(index); },
      });
      if (canceled) { instance?.dispose(); return; }
      sceneRef.current = instance;
      instance?.setPaused(pausedRef.current);
    }).catch(() => { if (!canceled) setReady(false); });
    return () => { canceled = true; instance?.dispose(); sceneRef.current = null; setReady(false); };
  }, [reduced]);

  useEffect(() => {
    pausedRef.current = paused;
    sceneRef.current?.setPaused(paused);
  }, [paused]);

  const step = (direction: number) => {
    setHovered(null);
    if (ready) sceneRef.current?.step(direction);
    else setSelected(index => (index + direction + artworks.length) % artworks.length);
  };
  const caption = <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={current.image} alt="" width={48} height={48} />
    {current.title && <span className="caption-text"><strong>{current.title}</strong>{current.subtitle && <small>{current.subtitle}</small>}</span>}
    <span className="caption-count" aria-hidden="true">{current.number}<span> / {total}</span></span>
  </>;

  return (
    <main className={`spiral-page ${ready && !reduced ? "scene-ready" : "scene-static"}`}>
      <header className="scene-header">
        <h1 className="scene-title">Спираль<span>{total} карточки</span></h1>
        <SiteNavigation>
          <Button variant="ghost" className="pause-button" disabled={!ready || reduced}
            aria-pressed={paused} aria-label={paused ? "Продолжить движение спирали" : "Приостановить движение спирали"}
            title={paused ? "Продолжить" : "Пауза"}
            onClick={() => setPaused(value => !value)}>
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </Button>
        </SiteNavigation>
      </header>
      <div ref={stageRef} className="scene-stage" role="region" aria-label="Галерея проектов" tabIndex={0}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); step(1); }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); step(-1); }
          if (event.key === "Enter" && current.href) { event.preventDefault(); openProject(displayIndex); }
          if (event.key === " ") { event.preventDefault(); setPaused(value => !value); }
        }}>
        <canvas ref={canvasRef} aria-hidden="true" className="spiral-canvas" />
        <ul className="fallback-gallery" aria-label="Карточки проектов" aria-hidden={ready && !reduced}>
          {artworks.map(art => {
            const content = <>
              <div className="art-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art.image} alt={art.description} width={1280} height={753} decoding="async" />
                {art.pulse && <span className="project-plus" aria-hidden="true"><Plus strokeWidth={1.2} /></span>}
              </div>
              {art.title && <span><strong>{art.title}</strong>{art.subtitle && <small>{art.subtitle}</small>}</span>}
            </>;
            return <li key={art.id}>{art.href
              ? <a href={art.href} target="_blank" rel="noopener noreferrer" tabIndex={ready && !reduced ? -1 : 0} aria-label={art.linkLabel}>{content}</a>
              : <div className="fallback-card">{content}</div>}
            </li>;
          })}
        </ul>
      </div>
      <div className="gallery-control" role="group" aria-label="Выбор карточки">
        <Button variant="ghost" className="step-button" aria-label="Предыдущая карточка" onClick={() => step(-1)}><SkipBack aria-hidden="true" /></Button>
        {current.href
          ? <Button asChild variant="ghost" className="art-caption"><a href={current.href} target="_blank" rel="noopener noreferrer" aria-label={current.linkLabel}>{caption}</a></Button>
          : <div className={`art-caption art-caption-static ${!current.title ? "art-caption-empty" : ""}`} aria-label={`Карточка ${current.number} из ${total}${current.title ? `: ${current.title}` : ""}`}>{caption}</div>}
        <Button variant="ghost" className="step-button" aria-label="Следующая карточка" onClick={() => step(1)}><SkipForward aria-hidden="true" /></Button>
      </div>
      <footer className="scene-footer">
        <p className="interaction-hint">{coarse ? <MoveHorizontal aria-hidden="true" /> : <Mouse aria-hidden="true" />}<span className="hint-desktop">{reduced || !ready ? "Карточки проектов" : coarse ? "Свайп или прокрутка" : "Прокрутите, чтобы вращать"}</span><span className="hint-mobile">{reduced || !ready ? "Карточки проектов" : "Свайп в сторону или прокрутка"}</span></p>
        <div className="signature-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/signature.png" width={1600} height={400} alt="made by tatarin" />
        </div>
      </footer>
    </main>
  );
}
