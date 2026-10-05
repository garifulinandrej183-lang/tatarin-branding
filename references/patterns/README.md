# Применённые вторичные паттерны

Это собственные UI-паттерны Tatarin/Bloom, а не обязательные части чужих референсов.

| Паттерн | Код | Поведение |
| --- | --- | --- |
| Печатающееся имя Tatarin | code/tatarin-spiral-lab/animated-wordmark.tsx | Цикл made by tatarin → tatarin.; пауза таймеров/visibility/reduced motion |
| Wordmark Bloom | code/bloom-boutique-concept/wordmark.js | Нужны цветы? → bloom boutique → bloom.; цикл 20 s; mobile detach/rejoin |
| Раскрывающееся меню | code/bloom-boutique-concept/menu.js | Native dialog, анимация раскрытия, Escape/backdrop, возврат фокуса |

DOM/CSS-контракт меню и Bloom wordmark находится в ../effects/podium-scroll/code/snapshot/dist/index.html и style.css. Эти скрипты не независимы от разметки. Строки и тайминги менять под текущий проект; мобильное отделение плашки не переносить без запроса.

Также в ../effects/alphabet-symbols/code/portable/src/motion/motion-signature.js сохранена подпись из частиц: это часть particle scene, не обычная typing анимация.
