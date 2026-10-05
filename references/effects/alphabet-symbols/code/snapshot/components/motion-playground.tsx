"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleHelp, Hand, Maximize2, MousePointer2, Pause, Play, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MotionScene } from "@/lib/motion-scene";
import { chooseFieldGlyph, GLYPHS } from "@/lib/motion-math";

const STATIC_GLYPHS=Array.from({length:28},(_,index)=>GLYPHS[chooseFieldGlyph(((index*11)%28+.5)/28)]);

type ModelContext = {
  registerTool: (tool: {name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown|Promise<unknown>}, options:{signal:AbortSignal})=>void|Promise<void>;
};

function StaticComposition({svgRef}:{svgRef:React.RefObject<SVGSVGElement|null>}) {
  return (
    <svg ref={svgRef} className="static-composition" aria-hidden="true">
      <defs>
        <pattern id="glyph-field" x="0" y="0" width="154" height="88" patternUnits="userSpaceOnUse">
          {STATIC_GLYPHS.map((glyph,index)=><text key={index} x={(index%7)*22+11} y={Math.floor(index/7)*22+16} textAnchor="middle" fontSize="12" fontFamily="monospace" fill="#b1bca9" opacity=".42">{glyph}</text>)}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#glyph-field)"/>
      <svg data-shapes className="static-shapes" viewBox="0 0 1396 1460">
        <g fill="none" strokeWidth="70">
          <circle data-ring="0" cx="660" cy="745" r="475" stroke="#d0ef63"/>
          <circle data-ring="1" cx="825" cy="580" r="365" stroke="#a4d3ac"/>
          <circle data-ring="2" cx="820" cy="840" r="520" stroke="#a5d3e3"/>
        </g>
        <circle data-disc cx="750" cy="670" r="104" fill="#e5e9d6"/>
      </svg>
    </svg>
  );
}
export default function MotionPlayground() {
  const canvasRef=useRef<HTMLCanvasElement>(null),svgRef=useRef<SVGSVGElement>(null);
  const engineRef=useRef<MotionScene|null>(null);
  const [paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(false);
  const [helpOpen,setHelpOpen]=useState(false);
  const [touchMode,setTouchMode]=useState(true);
  const [generation,setGeneration]=useState(1);
  const [announcement,setAnnouncement]=useState("");
  const refresh=useCallback(()=>{ engineRef.current?.regenerate(); },[]);

  useEffect(()=>{
    if(!canvasRef.current||!svgRef.current)return;
    const engine=new MotionScene(canvasRef.current,svgRef.current,{
      ready:()=>{},
      reduced:setReduced,
      changed:()=>{setGeneration(v=>v+1);setAnnouncement("Композиция обновлена.");},
    });
    engineRef.current=engine;
    return()=>{engineRef.current=null;engine.dispose();};
  },[]);
  useEffect(()=>{engineRef.current?.setPaused(paused||helpOpen);},[paused,helpOpen]);
  useEffect(()=>{engineRef.current?.setTouchMode(touchMode);},[touchMode]);

  useEffect(()=>{
    const context=(document as unknown as {modelContext?:ModelContext}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const empty={type:"object",properties:{},additionalProperties:false};
    const checkEmpty=(input:unknown)=>{
      if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length)throw new Error("Expected an empty object.");
    };
    const afterPaint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    const register=(tool:Parameters<ModelContext["registerTool"]>[0])=>{
      try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
    };
    register({
      name:"read_composition_state",title:"Текущее состояние композиции",
      description:"Read the current composition, motion preference, and pause state without changing anything.",
      inputSchema:empty,annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute(input){checkEmpty(input);return engineRef.current?.getState()??{status:"not_ready"};},
    });
    register({
      name:"regenerate_composition",title:"Обновить композицию",
      description:"Immediately generate a new valid arrangement of the three rings and disc, using the visible New composition action.",
      inputSchema:empty,annotations:{readOnlyHint:false,untrustedContentHint:false},
      async execute(input){checkEmpty(input);if(!engineRef.current)throw new Error("Scene unavailable.");refresh();await afterPaint();return engineRef.current.getState();},
    });
    register({
      name:"set_motion_paused",title:"Пауза движения",
      description:"Set the same animation pause state as the visible Pause button. Reduced motion remains respected.",
      inputSchema:{type:"object",properties:{paused:{type:"boolean"}},required:["paused"],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      async execute(input){
        if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).some(k=>k!=="paused")||typeof (input as {paused?:unknown}).paused!=="boolean")throw new Error("Expected {paused: boolean}.");
        const value=(input as {paused:boolean}).paused;setPaused(value);await afterPaint();return engineRef.current?.getState()??{status:"not_ready"};
      },
    });
    return()=>lifecycle.abort();
  },[refresh]);

  return (
    <main className="playground">
      <header className="topbar">
        <div className="wordmark" aria-label="tatarin">tatarin<span>.</span></div>
        <div className="topbar-controls">
          <span className="edition">Motion study / 01</span>
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="help-trigger" aria-label="Как взаимодействовать с композицией"><CircleHelp size={20}/></Button>
            </DialogTrigger>
            <DialogContent className="help-dialog" showCloseButton={false}>
              <DialogClose asChild><Button variant="ghost" className="help-close" aria-label="Закрыть подсказку"><X size={18}/></Button></DialogClose>
              <DialogHeader>
                <DialogTitle>Попробуй менять форму.</DialogTitle>
                <DialogDescription>Композиция реагирует на твои движения.</DialogDescription>
              </DialogHeader>
              <div className="help-actions">
                <div className="help-row"><MousePointer2/><div><strong>Двигай курсор или палец</strong><p>Символы расходятся, захватывают цвет и возвращаются на место.</p></div></div>
                <div className="help-row"><Maximize2/><div><strong>Потяни за обод</strong><p>Кольцо изменит размер и положение. На телефоне просто тяни его пальцем.</p></div></div>
                <div className="help-row"><RefreshCw/><div><strong>Нажми на свободную область</strong><p>Появится новая композиция. Кнопка «Обновить» делает то же самое.</p></div></div>
                <div className="help-row"><Pause/><div><strong>Остановись на понравившемся</strong><p>Пауза сохраняет текущий кадр. При уменьшении движения в настройках устройства сцена остаётся статичной.</p></div></div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <section className="stage" aria-label="Интерактивная композиция из колец и символов">
        <div className="scene-surface">
          <StaticComposition svgRef={svgRef}/>
          <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true"/>
        </div>
        <div className="scene-caption">Композиция / {String(generation).padStart(2,"0")}</div>
        {(paused||reduced)&&<span className="pause-label">{reduced?"Без анимации":"Пауза"}</span>}
        <div className="editorial">
          <h1>Форма<em>.</em><br/>В движении.</h1>
          <p>Каждое движение<br/>меняет композицию.</p>
        </div>
        <noscript><p className="noscript-info">Для взаимодействия включи JavaScript.</p></noscript>
      </section>
      <footer className="bottom-bar">
        <div className="hint hint-desktop">Двигай курсор. Потяни за кольцо.<span>Нажми на поле — начни заново.</span></div>
        <div className="hint hint-touch">{touchMode?"Проводи пальцем. Потяни за кольцо.":"Нажми на поле — новая композиция."}<span>{touchMode?"Выключи ладонь, чтобы прокручивать.":"Кнопка с ладонью включает перетягивание."}</span></div>
        <div className="scene-controls" aria-label="Управление композицией">
          <Button variant="ghost" className="control control-pause" aria-pressed={paused} disabled={reduced} onClick={()=>setPaused(v=>!v)}>
            {paused?<Play/>:<Pause/>}{reduced?"Статично":paused?"Продолжить":"Пауза"}
          </Button>
          <Button variant="ghost" className="control touch-control" aria-label={touchMode?"Выключить перетягивание":"Включить перетягивание"} aria-pressed={touchMode} onClick={()=>setTouchMode(v=>!v)}><Hand/></Button>
          <Button className="control control-primary" onClick={refresh}><RefreshCw/>Обновить</Button>
        </div>
        <div className="signature-wrap"><img className="signature" src="/branding/made-by-tatarin-light.svg" alt="made by tatarin" width={200} height={50}/></div>
      </footer>
      <output className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</output>
    </main>
  );
}
