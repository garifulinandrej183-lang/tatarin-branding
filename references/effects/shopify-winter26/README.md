# Shopify Winter ’26: consent, hero и переходы сцен

- ID: shopify-winter26
- Референс: <https://www.shopify.com/editions/winter2026>
- Дата отчёта / импорта: 2026-10-05
- Статус: **analysis-only**; собственного применения пока нет

[Полный разбор, 19 страниц](analysis.md) · [Задание для Codex](codex-prompt.md) · [Применение и ограничения](implementation.md) · [Источники и SHA-256](provenance.json)

## Четыре зоны

Cookies: компактный DOM-блок → сохранённый выбор → постоянная иконка → повторное раскрытие. Hero: художественный объёмный фон вокруг центральной рамки навигации. Переход к I: меню переезжает в rail, Hero растворяется в Sidekick через шумовую маску, контуры и glow. Finance X: scroll управляет камерой/позой монет и объектов; DOM-заголовок, описание и светлая плоскость контента идут поверх сцены.

Другие главы Editions, поиск, оплаты, полный контент Sidekick и product-demo не входят в разбор. Принятие cookies не запускает hero и не управляет переходом сцен.

| Страницы PDF / analysis | Содержание |
| --- | --- |
| 1–2 | Границы и архитектура одного canvas / двух render targets |
| 3–4 | Consent state, геометрия и сворачивание DOM |
| 5–9 | Hero, pointer, dock меню, шумовой shader и Sidekick DOM |
| 10–12 | Finance storyboard, слои, камера, GLB tracks |
| 13–14 | Responsive, единый scroll-progress, navigation и deep link |
| 15–19 | ТЗ, assets/lifecycle, параметры, приёмка и ссылки |

## Параметры и перенос

| Параметр | Ориентир исходного отчёта |
| --- | --- |
| Cookies | Панель около 410 px → 64×64 px, 400 ms, `.84,0,.16,1` |
| Hero frame | 340×464 px; центр 50% / 50svh; адаптивное ограничение ширины |
| Dock меню | После scroll >100 px, 600 ms; desktop rail; breakpoint около 940 px |
| Hero intro | Scene-ready +100 ms, 5000 ms easeOutCubic; skip по deep link/scroll |
| Shader | Два RT, aspect-correct noise threshold, derivative contours и локальный glow |
| Finance | Camera FOV 31° в snapshot; scroll-pose, gaze .5→0 |

По PDF источник использует Three.js r181, React, Theatre.js и Lenis 1.3.23; GSAP для этой механики не подтверждён. Новый проект сохраняет свой стек и consent-manager. Порог/геометрию сверять с реальным layout, не копировать scrollY конкретного скриншота или чужие GLB/текстуры. При отсутствии десятой секции использовать только явно выбранный текущим пользователем аналог; число X не требует создавать десять глав.

## Границы доказательств

Cookies не появились в исходной live-сессии; collapse/persistence разобраны по публичному компоненту, а не по записи клика Accept. Изменение ширины Chrome до 390×844 — responsive-проверка, без физического touch. FPS, iOS/Safari и аппаратная производительность не измерены. При импорте просмотрены все страницы PDF; новый live/WebGL/consent-прогон и собственная адаптация не выполнялись.
