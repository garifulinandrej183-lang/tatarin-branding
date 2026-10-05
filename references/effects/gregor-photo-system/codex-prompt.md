# Задание для Codex: gregor-photo-system

Самостоятельная архивная адаптация полного `gregorcollienne.pdf`. Команды в [analysis.md](analysis.md) описывают прежнее ТЗ; чтение архива не поручает создавать сайт. Текущий пользователь выбирает поверхности и объём переноса.

> Воспроизведи выбранные механики Gregor Collienne в моём текущем проекте: Overview, WORK GRID/LIST, viewer/rail, INDEX/INFO и/или меню. Используй мои фотографии, коллекции, тексты и маршруты; сохрани рабочую архитектуру и контекст навигации.

## Перед реализацией

Прочитай AGENTS.md, README, полный analysis, implementation, provenance, актуальные UI_GUIDELINES, UI_PATTERNS, UI_REVIEW_CHECKLIST, SPECIFICATION и USAGE Tatarin. Определи существующие router, scroll, UI/data models, image-loading, темы, responsive и reduced motion. Зафиксируй scope и mapping реальных страниц/коллекций. Не создавай все категории источника, новые формы, видео или 3D ради сходства.

Сохрани API, persistence, routing/history и business logic. Стек источника DOM/CSS/vanilla JS, без Canvas/WebGL; для своей версии используй компоненты текущего framework, CSS и один RAF-controller. GSAP Flip допустим, если уже имеется и помогает INDEX, но не обязателен. Не копируй чужие фото, имя, copyright, proprietary font, bundle или social links.

## Общие данные и состояния

Один стабильный `photoId` синхронизирует Overview, viewer, rail и INDEX. Фото имеют natural width/height, alt, optional caption; коллекция — photos и optional infoText. `rel`/маршрут выбирает фото по логической identity, независимо от клонированных DOM-узлов. Не создавай новый data model, если текущий уже обеспечивает этот контракт.

Gallery state: viewer → indexPreparing → indexOpening → index → returning → viewer; отдельный INFO с сохранённым activeId/scroll. Menu: closed/opening/open/closing. RouteContext хранит fromUrl, scroll, mode и returnFocus средствами текущего router.

## Overview

На первом входе доступные стартовые фото появляются в центральной стопке и расходятся к измеренным slots. Independent z-order и задержки; QA seed фиксирован. Ориентир источника: .80–1.40 s, stagger rank×10 ms, `.77,0,.175,1`. Трансляция начинается от центра viewport, заканчивается в центре slot; crop/scale фото не нужны. Имя раскрывается flip/fade/blur после начала расхождения; reduced motion и возвращение Back допускают конечную композицию сразу.

Desktop-ориентир поля: width110%, left−5%, top−12vh, пять колонок, gap6vw/22vh; колонки 2/4 имеют постоянный вертикальный stagger, а не другую scroll-speed. Фото сохраняют contain и свой aspect; z-order позволяет закрывать фиксированное имя. Не добавляй pointer tilt, magnetic shift, displacement или trail.

На mobile исходный Overview остаётся с пятью колонками: width100%, gap16px/22vh, имя переносится; это отличается от WORK. Сопоставь с реальными данными/окном target. При конце потока исходник повторяет существующие фото, не загружает новые через API. Если повторение входит в scope, используй bounded recycle/virtualisation со стабильными id; без бесконечного роста DOM/listeners. Все ссылки остаются рабочими.

## WORK GRID и LIST

GRID — flex-wrap с двумя смещёнными колонками, не masonry. Desktop-ориентир: container88vw, slot32vw, horizontal gap24vw, vertical gap32vw; чётный slot сдвинут вниз на32vw. Фото max48vw по каждой оси и contain, не crop до квадрата. Учти padding под последним смещённым фото.

Title-layer fixed в центре, pointer-events:none, выше фотографий. Вход `translateY(50%) rotateX(-90deg)`, opacity0/blur12 → конечный; выход `translateY(-50%) rotateX(90deg)`, opacity0/blur12. Perspective1000px; .790s `.77,0,.175,1`. Название не следует за курсором, карточка не масштабируется. Keyboard focus должен иметь доступный аналог действия/идентификации.

LIST — центральные семантические ссылки. Превью фиксировано под текстом; нечётный проект слева, чётный справа по порядку, независимо от координат мыши. Hover/focus: opacity0→1, blur12→0 за .490s ease; внутри той же ссылки новых движений нет. У underline заранее зарезервирована border-width, без layout jump.

В WORK mobile≤768 px — две колонки GRID со сдвигом, hover-title и LIST-preview выключены. Tap сразу открывает destination. Coarse pointer на широком планшете также не требует hover. GRID↔LIST — blur/veil и смена режима через существующий routing/state, без выдуманного photo-FLIP между layout. Готовый локальный layout не ждёт искусственные сетевые задержки.

## Viewer, rail и выбор кадра

Главное фото contain: `k=min(frameWidth/naturalWidth,frameHeight/naturalHeight)`. Desktop-ориентир frame top64px, width W−352px, height H−128px; rail слева, thumb width80px, gap16px. Padding первой/последней миниатюры позволяет центрирование. Главное фото не сдвигается вместе с rail и не получает внутренний parallax.

Активный id — ближайший центр миниатюры к центру оси. Используй стабильные pseudo-rects или geometry cache, пока реальные thumbs мигрируют в INDEX. Выпуклость: `u=A*max(0,1-d/R)^2`, desktop A64/R280 и translateX(+u), mobile A24/R220 и translateY(−u). `shift+=(u-shift)*alpha`; для dt в ms `alpha=1-pow(.92,dt/16.667)`. Не считай geometry отдельно несколькими loop.

Click thumb центрирует его через общий controller; scroll и click используют один алгоритм. Ориентир оригинала — мгновенная смена opacity большого фото без длинной crossfade. Размеры и загрузка изображения не меняют identity.

## INDEX и INFO

INDEX сохраняет activeId и rail-scroll, закрывает INFO, измеряет реальные first/last rects. Те же thumbs переходят к grid; не заменяй их несвязанным набором. Перед freeze исключи уже применённый translate, чтобы не удвоить смещение. Ориентир .790s, delay `abs(i-activeIndex)*15ms`; selection sampling заморожен до settle. Большое фото скрывается, transient blur помогает переходу. Число колонок grid определяется доступной шириной.

Click grid-thumb выбирает id → центрирует его target-rail → анимирует обратно → восстанавливает sampling и focus-image. Desktop thumb80px, mobile thumb height64px. Быстрые input/resize должны приводить к согласованному конечному state без stale timers. При INDEX-close без выбора исходник возвращается к первому фото; для новой версии сохраняй прежний контракт target, а при отсутствии такого контракта возвращай savedActiveId и явно отметь отличие.

INFO доступен только при infoText. Он заменяет область фото текстом, rail остаётся; сохраняет activeId/scroll. Построчный flip `rotateX(-40deg)+translateY(50%)`, .790s и line-stagger15ms; выход вверх без stagger. Строки пересчитываются после font-ready/resize. Длинный текст имеет внутренний scroll и не меняет кадр. Back сначала закрывает INFO/INDEX, затем покидает viewer; возврат к исходной странице восстанавливает контекст/focus.

## Mobile и ввод

Viewer mobile≤768: frame left16/top96, widthW−32/heightH−224, rail снизу горизонтальный, thumbs height64/gap12; title/controls сверху. INDEX — relative vertical grid, без viewer-height и stale horizontal offset. INFO: отдельная текстовая область; rail/controls не перекрыты, safe-area учитывается.

Исходник использует vertical scrollY как координату mobile rail (`railLeft=-smoothedY`, virtualHeight=H+max(0,railWidth-W)) и horizontal swipe переводит в scrollY. Если этот механизм выбран, один gesture-controller различает axis после порога, новый touchstart отменяет inertia; friction `.95` при60Hz переводится в `pow(.95,dt/16.667)`. Не смешивай с вторым native horizontal scroller. Если выбираешь нативный rail, обозначь это упрощение и сохрани identity/center-selection.

Не перехватывай pinch/multitouch/browser back или scroll INFO/menu. Arrow navigation — один handler на lifecycle, одна клавиша даёт один шаг. Modifiers/new-tab/external links и browser History работают штатно. Click не должен срабатывать после drag/cancel.

## Общий clock, menu и устойчивость

В PDF общий lag уточнён: два source RAF коэффициента .08 и .03 дают `alpha60=1-.92*.97=.1076`. Для собственной версии один clock: `alpha(dt)=1-pow(.8924,dt/16.667)`. Не переноси два loop и накопление keydown-listeners. Расчёт не доказывает FPS.

Menu — overlay над текущей страницей, flip/blur/stagger с фазами opening/open/closing; body scroll-lock, Escape, focus trap/inert и возврат focus. Не блокируй навигацию ради декора. Last-intent token отменяет stale fetch/tweens; pending timers, listeners, RAF, observers и ресурсы очищаются при route change. Смена ширины сохраняет выбранное фото и переводит gallery в корректную композицию.

Reduced motion: конечные layouts и те же ссылки, без flip/blur/lag. Loading/image-error/empty/long title показывают доступный UI. `made by tatarin` — официальный локальный asset в подходящей нижней области без перекрытия rail/controls, с актуальными правилами вариантов/минимумов 180/145px.

## Приёмка

Проверь все выбранные сцены: intro и z-order; правильный rel; bounded repeat; nearest-center и выпуклость; INDEX open/select/close; INFO/Back; быстрый hover; menu; Back/Forward и сохранённый scroll. Проверь 1534×889, 390×844, границу768/769, orientation и resize после scroll. Keyboard/focus, один arrow=один кадр, reduced motion, image-error, пустая коллекция и длинный текст — отдельные сценарии. Touch swipe/tap/pinch на физическом телефоне и FPS/frame-time отдельно измеряй; не выдавай responsive Chrome за телефон.

Передай scoped diff, dependencies/assets/licenses, выбранные механики/отличия, targeted checks, screenshots и запись intro/INDEX при возможности. Раздели build, визуальный прогон, physical touch, performance и неподтверждённые пункты. Реализация/публикация выполняются только в объёме текущего запроса.
