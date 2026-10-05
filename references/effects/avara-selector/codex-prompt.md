# Задание для Codex: avara-selector

Самостоятельное ТЗ для будущего переноса выбранных механик Avara. Чтение каталога не является командой создавать новый сайт. Полные измерения, отдельные эффекты Blog и ограничения — в [analysis.md](analysis.md); исходная инструкция с иллюстрациями — в [PDF](Инструкция%20для%20Codex.pdf).

> Воспроизведи интерактивный селектор Avara в указанном разделе моего текущего сайта: overview, hover, drag с возвратом, выбранный объект с информацией и адаптивная мобильная панель. Используй мои реальные материалы, контент, маршруты и существующий стек. Сохрани работающие разделы и бизнес-логику.

## Перед реализацией

Прочитай AGENTS.md, README, analysis, implementation и provenance этой записи. В целевом проекте изучи текущие компоненты, router, scroll, data model, image-loading и анимационные зависимости. Применяй актуальные UI_GUIDELINES, UI_PATTERNS, UI_REVIEW_CHECKLIST, SPECIFICATION и USAGE Tatarin в рамках выбранного раздела. Составь mapping: реальные item-id/картинки/тексты → существующий контейнер → overview/detail → ввод → responsive → lifecycle.

Существующий стек имеет приоритет. Используй DOM/CSS и независимые вложенные transform-слои. Если Motion/Framer уже установлен, используй его springs и presence; иначе CSS/WAAPI плюс один общий RAF для численного spring/bob. GSAP допустим при существующей зависимости, не обязателен. Не добавляй Canvas, Three.js, WebGL, ScrollTrigger или smooth-scroll для этого селектора. Не копируй чужие bundles, персонажей, логотипы, шрифты, тексты или WAV. Звуки и brand-menu добавляй только если их требует текущий продукт.

## Данные, DOM и состояния

Объект имеет стабильный `id`, название, разрешённую иллюстрацию с natural aspect ratio, информацию и действующие ссылки. Используй существующую модель данных; четыре объекта и приведённые размеры — эталон калибровки, не требование создать четыре вымышленных продукта.

```text
scene
  anchor[itemId]             // композиционные x/y, z-index
    layoutScale             // .5 overview → 1 desktop detail
      dragButton            // pointer x/y, hover/drag scale и angle
        bobLayer            // независимый малый translateY
          img               // aspect ratio, прозрачность изображения
        label               // DOM подпись
  detailOverlay             // отдельная прокрутка и панель
```

Не разрешай разным эффектам одновременно записывать transform одного узла. Состояния: boot → overview; hover; press → dragging → returning; opening → detail → switching → detail; closing → overview. Храни selectedId, pointer gesture и return-focus отдельно. Новый выбор ретаргетирует текущую геометрию без скачка, устаревшие callbacks не меняют последнее намерение. Старый заголовок при exit скрыт от accessibility tree.

## Геометрия эталона

Измерено на desktop 1534×889, центр (767,444.5); значения в CSS px, zoom 100%:

| Объект | Базовый размер | x/y от центра | Scale | Angle | z |
| --- | --- | --- | --- | --- | --- |
| Aave | 410×502.28 | −246/−15 | .5 | 0° | 5 |
| Family | 392×391.48 | −82/−36 | .5 | 2.19° | 4 |
| Lens | 512×341.16 | 95/7 | .5 | 6.19° | 3 |
| GHO | 438×438 | 276/0 | .5 | 17° | 2 |

Центрирование абсолютных anchors, transform-origin 50% 50%, contain/aspect ratio. Прозрачные поля картинки входят в базовый размер. Под свои assets откалибруй visual bounds. На коротком/узком desktop предложенная адаптация `fit=min(1, availableWidth/visualWidth, availableHeight/visualHeight)` масштабирует overview целиком; detail рассчитывается отдельно. Это новая адаптация, не извлечённая формула Avara.

Overview не прокручивает сцену и не меняет её scale от wheel. Если селектор встроен в длинный сайт, оставь нормальную прокрутку остальных разделов; не блокируй document глобально ради сходства.

## Плавание, hover и drag

Измеренный bob: внутренние y около 0…−10 px, на экране при scale .5 амплитуда около 5 px; ориентировочный период 2.5–2.6 s. Предлагаемая модель `y=-5+5*cos(2π*(t-phase)/2.5)`, phases 0/.5/1/1.5 s. Базовые углы постоянны. Не добавляй camera-parallax или движение всех объектов за курсором.

Hover: множитель 1.075; desktop label opacity 0→1 и translateY 32→0, 200 ms, CSS `cubic-bezier(.175,.885,.32,1.1)`, pill над объектом, около 18 px текст. Label скрыт на mobile; keyboard focus имеет видимый индикатор и доступное название.

Drag следует clientX/Y в screen px, с pointer capture; активный множитель 1.05 и небольшой наклон. Измерен пример dx659/dy−225/angle10°. Предложенные, не исходные параметры: threshold 6 px; `angle=clamp(dx*.015,-10,10)`; spring stiffness900/damping14/mass1, стартовая velocity0 или ограниченная до1200 px/s. Настрой по визуальному возврату с несколькими затухающими колебаниями и settling около .6–.9 s. Touch-action none применяется только к draggable control, нативный image drag выключен; текст панели прокручивается нормально.

Исправленный алгоритм окончания жеста:

```text
onPointerUp(e):
  if !pointer || e.pointerId != pointer.id: return
  item = pointer.item         // сохранить ДО очистки pointer
  didDrag = moved
  pointer = null             // lostpointercapture уже не отменит completed gesture
  releaseCaptureIfHeld(e.pointerId)
  springToOrigin(); restoreScaleAndAngle()
  if !didDrag: openDetail(item)
  else: suppressOnlyThisGestureClick()

onPointerCancel/lostpointercapture:
  if no active gesture: return
  clear gesture; return to origin; never open detail
```

Не открывай detail второй раз обработчиком click после pointerup. Обеспечь отдельную стандартную Enter/Space activation кнопки. Drag suppression не подавляет следующий независимый tap/click или клавиатуру. Pointercancel и resize отменяют drag без открытия; второй pointer не заменяет активный жест.

## Выбор и desktop-панель

Измерено: выбранный scale .5→1; остальные .5 и opacity .2. Все anchor-y переходят к0. Циклические соседи стоят через500 px; выбранный anchor-x около−232.558 от центра viewport. При Lens: x остальных −1232.56/−732.558/267.442. На эталоне выбранный центр около534.44/444.5.

Панель fixed справа: overlay inset0/padding8/overflow-y auto; card width100%, max-width30%, min-width448, padding44px 64px, radius12, background rgba(15,15,15,.89), backdrop blur32; min-height100%, height fit-content. На эталоне rect x1070.609/y8/w455.391/h873. Footer bottom44 скрывается opacity0/y32, CSS200 ms ease-in-out. Предлагаемый центр выбранного объекта `panelRect.left/2`, адаптируй под контент целевого проекта.

Большие JS-переходы точно не измерены. Стартовые параметры новой версии: geometry650 ms, `cubic-bezier(.19,1,.22,1)`; panel enter500/exit350 ms; текст exit120/enter220 ms с delay80 ms. Не обозначай их как параметры оригинала.

Prev/next циклические, порядок Aave→Family→Lens→GHO в эталоне; в target — порядок реальных item-id. Проверить wrap на обоих концах. ArrowLeft/Right переключают, Escape закрывает. Клик вне панели закрывает, внутри сохраняет состояние. При смене выбранного reset scroll панели; фокус остаётся предсказуемым. На закрытии вернуть focus к выбранной кнопке. Не добавляй swipe carousel без отдельного требования.

## Mobile и scroll панели

Один breakpoint: width≤920 px. Эталон390×844: сцена bottom96, центр195/374; позиции −90/−40,90/−40,−90/120,90/120; scale.33; z3/2/1/1. Подписи и desktop-стрелки скрыты. Измерено detail: выбранный x0/y−111.125/scale.55; остальные скрыты.

Отдельный fixed overlay inset0/overflow-y auto. Перед карточкой пустой spacer `H−272`; card widthcalc(100%−8px), x4, min-height100svh, padding28px 32px 32px, radius20, background#1a1a1a. Close внутри карточки top/right24, target44×44. Эталон sheet starts at568; scrollTop422 даёт sheetTop146; max572 даёт top−4. Формула `sheetTop=H−272−overlayScrollTop`. Hero остаётся неподвижным и закрывается карточкой; не связывай его с scroll progress, zoom или parallax.

Учитывай safe-area, короткое окно, orientation и browser chrome. Предложенная адаптация для короткого viewport: `peek=min(272,H*.55)` и fit иллюстрации — отличие от эталона, фиксируй его. Scroll должен работать нативными touch-жестами на панели, без перехвата draggable-объектом за пределами его control.

## Декор и дополнительные поверхности

Логотип источника — Lottie SVG с mask/clipPath; точный intro/trigger неизвестен. Для target использовать свою доступную графику; анимация необязательна. Right-click на логотипе открывает custom brand-menu, не на персонажах; это отдельный optional механизм. Не внедряй его без product need. Audio event mappings и persistence не подтверждены; звук необязателен, включается осознанно пользователем.

Blog/статья имеют обычный document scroll без обнаруженного pin/parallax: filters, underline/arrow micro-hover и статическая обложка. Loading shimmer найден в CSS, не проверен принудительным loading. Переносить эти поверхности только по текущему запросу, см. полный разбор.

## Lifecycle, доступность и приёмка

Один motion clock; cleanup listeners/observers/RAF/audio на unmount/route change; pause при hidden tab. Resize сохраняет selectedId и пересчитывает geometry. Reduced motion: без bob/overshoot/tilt/stagger, тот же выбор и контент, instant/fade≤100 ms, нативный scroll. Проверить role/modal semantics существующего UI, фокус, Tab, Enter/Space, Escape, названия кнопок и контраст. Официальная подпись — локальный неизменённый asset по правилам Tatarin; минимальные размеры не являются обязательным target-size.

Проверить в работающем браузере overview, hover всех объектов, drag/click/cancel, opening/switch/closing, wrap, outside/inside, long text/missing image, rapid switch, resize во время ввода, скрытую вкладку, keyboard и reduced motion. Размеры1534×889,1024×768,390×844,360×800,320px,920/921 и200%zoom. Реальный touch/iOS и FPS помечать пройденными только после фактического теста.

На эталонных assets/viewport: geometry±3px, scale±.01, opacity±.02; новые assets допускают документированную калибровку. Сравнить кадры [галереи](screenshots.md), steady states и запись движения; скриншот не доказывает траекторию. Performance target16.7ms на60Hz — цель собственной реализации, не измерение исходного сайта. Сохранить результаты и ограничения в docs/effect-implementation.md целевого проекта с ID и commit этого архива. P0 — layout/input/detail/mobile sheet; P1 — bob/углы/spring; P2 — звук/logo/menu. Сборка не заменяет визуальную приёмку.
