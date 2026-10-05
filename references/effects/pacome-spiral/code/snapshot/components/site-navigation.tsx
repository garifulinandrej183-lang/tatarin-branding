import type { ReactNode } from "react";
import AnimatedWordmark from "./animated-wordmark";

export default function SiteNavigation({ children }: { children: ReactNode }) {
  return <nav className="site-nav" aria-label="Основная навигация">
    <AnimatedWordmark />
    <div className="header-actions">
      <a className="nav-button expand-button home-link" href="https://tatarin-portfolio.garifulinandrej183.chatgpt.site/" aria-label="На главную">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nav/home.png" width={64} height={64} alt="" />
        <span className="button-label" aria-hidden="true">На главную</span>
      </a>
      <a className="nav-button expand-button telegram-link" href="https://t.me/tatarin_web" target="_blank" rel="noopener noreferrer" aria-label="Telegram @tatarin_web">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nav/telegram.png" width={64} height={64} alt="" />
        <span className="button-label" aria-hidden="true">Telegram</span>
      </a>
      {children}
    </div>
  </nav>;
}
