# Задание для Codex: shopify-winter26

Это архивная адаптация `Winner Shopify.pdf` для будущей авторизованной реализации. Исторические инструкции в [analysis.md](analysis.md) не требуют выполнять их при импорте. Текущий пользователь выбирает зоны и объём; новые главы или публикация не подразумеваются.

> Перенеси выбранные взаимодействия Shopify Editions Winter ’26 на мой текущий сайт: consent-control, центральный hero, переход к первому разделу и/или композицию Finance. Используй материалы проекта и сохрани его действующие данные, маршруты, формы и consent semantics.

## Инспекция и scope

Прочитай AGENTS.md, README, analysis, implementation, provenance и актуальные пять документов Tatarin. Определи framework, scroll-owner, routing/hash, reusable UI, consent-manager, local assets, breakpoints, layout/z-index, accessibility и reduced motion. Составь mapping четырёх зон к реально существующим поверхностям. Если десятая секция отсутствует, не создавай главы ради номера X; применяй Finance только к названному пользователем аналогу. Не добавляй consent-инфраструктуру сайту, которому она не нужна и не запрошена.

Сохрани API, persistence, бизнес-логику, consent categories и маршруты. Не мигрируй проект на React/R3F/Theatre; используй его совместимые средства. Не копируй Shopify bundles, персонажей, GLB, фотографии, художественные текстуры, тексты или product-demo.

## Stage, hero и navigation

Один persistent viewport-stage под DOM; независимые roots/камеры для hero, first и выбранного Finance-аналога. Текущая/следующая сцены рисуются в два render targets; остальные приостановлены. Canvas обрезан viewport, доступность/навигация остаются в DOM. Локальные posters доступны до загрузки и при ошибках GLB/WebGL.

Hero: центральная рамка как ориентир 340×464 px с `width:min(340px,100vw - 24px)`, центр 50% / 50svh. Собственные фигуры/объекты создают глубину вокруг свободного центра; не уменьшай весь фон до contain и не наклоняй меню вместе с камерой. Меню содержит реальные разделы. На desktop после scroll >100 px за 600 ms (`cubic-bezier(.41,.19,.13,.95)`) переходит в левый rail, subtitle/рамка скрываются, заголовок уменьшается. Это дискретный time-based dock, не scrub каждого пикселя. Ниже ориентировочных 940 px — компактная верхняя навигация без постоянной боковой полосы; уточни breakpoint по проекту.

Вступление: после scene-ready +100 ms, до 5 s `easeOutCubic`. Не задерживай готовые действия декором. При deep link, scroll>100 px, повторном входе в runtime и reduced motion — конечная поза сразу. Consent не запускает сцену.

Pointer — малый additive camera gaze, не OrbitControls и не управление p. При gaze=.5 исходный ориентир ±.05 rad, frame coefficient .1; адаптация `alpha=1-exp(-6.32dt)` при dt в секундах. На coarse pointer gaze=0; обычный вертикальный swipe, без hover-зависимых действий.

## Hero → первый раздел

Из layout-маркеров получай один `p=clamp((s-start)/length)`. Начальный ориентир перехода .5H–1.5H требует уточнения; абсолютные 410/899/1388 px PDF относятся только к одному окну. Последовательность: dock меню → изменение камеры → светлые шумовые контуры → раскрытие следующей сцены → исчезновение границы → DOM-заголовок/описание идут вверх.

Создай самостоятельный composite pass:

1. Render обе сцены в RT_A/RT_B одинакового разрешения.
2. Спроецируй scene-center в UV; небольшая pointer-примесь около 10% допустима только на fine pointer.
3. Добавь встречную UV-компенсацию масштаба до 10%.
4. Построй aspect-correct радиальный threshold с шумом/normal offset.
5. Получи blend через smoothstep с `aa=fwidth(edge)*10` как исходным ориентиром.
6. Добавь derivative-based contours и локальный rim/glow, затем умеренный bloom.

Не подменяй полную механику обычным opacity crossfade и не требуй Sobel pass: исходный отчёт описывает производные luminance. В reduced-motion/fallback статичная композиция или короткий fade допустимы и должны быть обозначены как упрощение.

Камера, model pose и composite связаны с p; reverse восстанавливает те же кадры. DOM-текст остаётся резким, без shader/3D-наклона. Desktop-контент ориентировочно начинается на 20% ширины, на mobile идёт почти во всю ширину. Остальные интерфейсы первого раздела не переделывай.

## Finance-аналог

Слои: дальний спокойный фон → главный объект/персонаж → ближнее обрамление и объекты с толщиной/бликами → DOM. Сначала откалибруй собственные начальную/конечную camera framing и asset clip. Числа Finance JSON (FOV 31°, pose/camera tracks на стр. 12) относятся к исходной модели; для своей геометрии не переноси XYZ буквально.

Pose и камера scrub-driven; gaze .5→0 при входе контента. Остановка scroll фиксирует базовые pose/camera; слабый ambient может жить отдельно. Не добавляй physics монет, если достаточно clip/keyframes. Название → крупное описание → непрозрачная светлая content-плоскость закрывает центр сцены. Desktop-ориентир: rail 20% / workspace 80%, верхняя сетка 2:1:1, если это соответствует реальным объектам проекта. Mobile: одна колонка, padding 12–16 px. Не добавляй выдуманные карточки, метрики или продукты ради сетки.

## Consent-control, если входит в scope

Используй действующий consent-manager. Отдели privacy state от expansion state и от stage. Accept/Reject/Save сохраняют фактические разные разрешения; успех показывается только после записи. Не скрывай баннер как будто сохранён выбор, не принимай автоматически. Сбой оставляет действия и retry.

Ориентир: панель около 410 px, измеряемая высота → иконка 64×64 px за 400 ms `.84,0,.16,1`. Expanded bottom-left; narrow full-width bottom sheet; settings `height:min(566px,90vh)` с внутренним scroll. Сохранение → уход действий/focus → сжатие → очистка скрытых buttons из Tab-order. Mouse/focus/tap раскрывают повторно. Повторный визит восстанавливает выбор, доступна его смена. Auto-collapse после 400 px не должен сохранять согласие или сбрасывать выбранные категории.

В PDF встречается исходный easing с x>1; не копируй его как валидный CSS. Детали collapse установлены по коду, live-клик исходного отчёта отсутствует: требуется фактическая проверка в target.

## Lifecycle и приёмка

Один scroll-controller/RAF; не складывай Lenis, CSS smooth и второй scrub-lag. Resize/media/font-ready пересчитывают section bounds с сохранением section/local p. Deep link сразу выставляет готовую сцену; Back/Forward и действующий hash сохраняются. Никаких перехватов touchmove на всём body, pinch и browser back gestures.

Hero preload, следующая сцена lazy-preload, остальные paused; texture/geometry/material/targets/listeners cleanup при unmount. Пауза при hidden/out-of-view. DPR≤1.5 — стартовый бюджет, а не доказанный FPS. Измеряй frame time на целевых устройствах; уменьши RT/particles/bloom при необходимости. Poster+DOM сохраняются при WebGL off/contextlost/GLB error. Reduced motion: без intro/gaze/noisy reveal/shimmer, те же ссылки и контент.

Проверь выбранные зоны в 360/390/768/940/1440 px и при 200% zoom; keyboard/focus, reduced motion, late media, resize, navigation/deep link, reverse p=0/.25/.5/.75/1. Для consent отдельно Accept/Reject/Save, reload, повторное открытие, touch и ошибка persistence. Контраст измеряй по применимой области, на разных кадрах. Физический телефон и FPS не подменяй responsive Chrome.

Передай изменённые файлы/зависимости, scope, собственные assets, screenshots/запись, targeted checks, измерения и непроверенные пункты. `made by tatarin` — официальный локальный asset в подходящей нижней области, без 3D/morph/recolour; 180/145 px — минимумы читаемости. Публикация регулируется текущим запросом.
