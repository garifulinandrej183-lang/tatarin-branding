# Полный разбор Avara: avara-selector

Архив исследования от 2026-10-05. Ниже сохранён полный текст 19 страниц инструкции в моноширинных блоках: геометрия, таблицы, псевдокод и границы точности. Команды внутри отчёта относятся к будущей реализации на выбранном сайте; добавление референса не выполняет это ТЗ.

**Поправка к архивному псевдокоду страницы 16:** в `onPointerUp` нужно сохранить `item = pointer.item` до `pointer=null` и проверить `e.pointerId === pointer.id`. В PDF/TXT оставлен исходный текст; исправленный контракт приведён в [codex-prompt.md](codex-prompt.md).

[PDF](Инструкция%20для%20Codex.pdf) · [TXT](Инструкция%20для%20Codex.txt) · [Источники](provenance.json) · [Галерея](screenshots.md)

## Страница 01 — Инструкция для Codex

```text
Инструкция для Codex
AVARA / техническая декомпозиция эффектов / 05.10.2026

[S01] Desktop: исходная сцена, 1534 × 889
Файл: Скриншоты/S01-01-desktop-idle.jpg

Задача: воспроизвести механику интерактивной сцены avara.xyz на сайте пользователя. Сохранить его контент, бренд, маршруты и рабочую логику. Передать разработчику геометрию, состояния, события, движение и проверяемые критерии результата.

Исследование выполнено в Chrome пользователя: главная, выбор всех четырёх объектов, hover, drag, клавиатура, контекстное меню, мобильная композиция и прокрутка панели. Дополнительно проверены Blog и один шаблон статьи. Careers ведёт на aave.com/careers; эффекты другого сайта в это ТЗ не входят.

Как читать значения

- ИЗМЕРЕНО: значение из DOM/computed CSS или серии кадров. Это данные текущей версии сайта.
- НАБЛЮДЕНО: поведение подтверждено браузерным действием и кадром.
- ГИПОТЕЗА: вероятная технология или механизм; исходный репозиторий Avara не исследован.
- ПАРАМЕТР ТЗ: конкретная настройка для новой реализации. Её нельзя выдавать за найденный параметр оригинала.

Точные CSS-значения и размеры приведены в CSS px при масштабе страницы 100%. Скриншот фиксирует отдельный кадр непрерывной анимации, поэтому bob/rotation могут немного отличаться между иллюстрациями.
```

![S01-01-desktop-idle](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S01-01-desktop-idle.jpg)

## Страница 02 — 01 / Машина состояний

```text
01 / Машина состояний
Главная - интерактивный селектор, а не scroll-story

BOOT → OVERVIEW
OVERVIEW ↔ HOVER(i)
HOVER(i) → PRESS(i) → DRAG(i) → RETURN(i) → OVERVIEW
OVERVIEW/HOVER(i) + click → OPENING(i) → DETAIL(i)
DETAIL(i) + prev/next/Arrow → SWITCHING(i,j) → DETAIL(j)
DETAIL(i) + Escape/outside/close → CLOSING → OVERVIEW

Состояние | Визуальное правило | Доступный ввод
OVERVIEW | 4 объекта; мелкое независимое плавание; футер видим | hover, click, drag, Tab
HOVER | Объект ×1.075; подпись над ним | click / pointerdown
DRAG | Свободный x/y; scale 1.05; наклон; подпись гаснет | pointermove / pointerup
RETURN | x/y возвращаются к 0 с несколькими колебаниями | новый ввод не блокируется
DETAIL desktop | Выбранный ×2 относительно overview; остальные opacity .2 | стрелки, Escape, вне панели
DETAIL mobile | Выбранный .55 вместо .33; остальные скрыты; нижняя панель | scroll панели, close
LOGO MENU | Меню у указателя поверх сцены | Escape, выбор команды

Что происходит при scroll

НАБЛЮДЕНО: главная в overview не прокручивается. На desktop scrollHeight = innerHeight = 889, scrollY = 0 после wheel. В mobile overview: 844 = 844. Не добавлять pin, ScrollTrigger, scrub, смену секций или увеличение персонажей от wheel.

В DETAIL прокручивается отдельный fixed-контейнер информации. На телефоне его верхний пустой участок делает панель похожей на bottom sheet. Сцена остаётся неподвижной, текст закрывает её по мере прокрутки. Это отдельная ось взаимодействия, не прогресс анимации сцены.

ПАРАМЕТР ТЗ: hover, drag и detail не должны одновременно записывать transform одного узла. При начале открытия сбросить drag-смещение, скрыть tooltip и переключить цели scale/position. Быстрый новый выбор ретаргетирует текущие значения без скачка к началу.
```

## Страница 03 — 02 / Геометрия desktop

```text
02 / Геометрия desktop
ИЗМЕРЕНО / viewport 1534 × 889 / центр сцены (767; 444.5)

Объект | Базовый CSS размер | x / y от центра | Scale / angle / z
Aave | 410 × 502.28 | -246 / -15 | .5 / 0° / 5
Family | 392 × 391.48 | -82 / -36 | .5 / 2.19° / 4
Lens | 512 × 341.16 | 95 / 7 | .5 / 6.19° / 3
GHO | 438 × 438 | 276 / 0 | .5 / 17° / 2

Размеры включают прозрачные поля PNG; видимый контур меньше прямоугольника. Исходные растровые файлы: Aave 773×947, Family 780×779, Lens 1043×695, GHO 916×916. Не вычислять spacing по непрозрачному силуэту без отдельной калибровки.

Привязки

- Сцена: position: fixed; inset: 0; height: 100%; display:flex; align-items:center; justify-content:center.
- В центре - relative UL с нулевой геометрией. Его LI абсолютные и центрируют каждого персонажа. Anchor хранит композиционные x/y; вложенный слой хранит scale.
- Иллюстрации - изображения с сохранённым aspect ratio; transform-origin: 50% 50%. Не растягивать все PNG до одинаковой высоты.
- Footer фиксирован: bottom 44 px. Контейнер логотипа 132 px шириной; видимые белые штрихи занимают около 112×16 px. Ссылки ниже логотипа, одна строка по центру.
- Sound control: top 16 px; left 16 px; SVG 28×28 px. В оригинале фактическая кнопка около 28×31 px.

Масштабирование для сайта пользователя

ПАРАМЕТР ТЗ: нормализовать собственные иллюстрации к указанным базовым размерам или использовать те же пропорции. Для desktop около 1534 px сохранить эти x/y без умножения на ширину окна. На малых desktop ограничивать всю композицию коэффициентом fit; на мобильном breakpoint менять саму композицию.

fit = min(1, (W - 2*safeX) / overviewVisualWidth,
             (H - footerReserve - 2*safeY) / overviewVisualHeight)
// fit применить к общей сцене; x/y и размеры масштабируются вместе.
// detail измеряется отдельно, не наследует overview-fit вслепую.

Этот fit - адаптация ТЗ для новых ассетов и коротких окон, не извлечённая формула Avara. Учитывать safe-area и размер подписи made by tatarin отдельно от масштаба персонажей.
```

## Страница 04 — 03 / Idle и hover

```text
03 / Idle и hover
Независимое плавание + локальная реакция

[S02] Hover Aave: увеличение и подпись
Файл: Скриншоты/S02-03-aave-hover.jpg
[S03] Hover Family: подпись другого объекта
Файл: Скриншоты/S03-04-family-hover.jpg

Постоянное движение

ИЗМЕРЕНО: внутренний bob-слой переводится по Y от примерно 0 до -10 px до общего scale. После .5 это около 5 px на экране; после .33 - 3.3 px. Базовые углы 0 / 2.19 / 6.19 / 17° не зависят от положения указателя.

Серия из 32 DOM-замеров за 3.78 s даёт цикл около 2.5-2.6 s. Минимумы у соседних объектов сдвинуты примерно на .5 s. Для ТЗ принять полный цикл 2.5 s и фазы 0 / .5 / 1 / 1.5 s. Реализовать smooth sine или ease-in-out [0,-10,0], без пауз в крайних положениях.

bobY(i,t) = -5 + 5*cos(2*pi*(t - phase[i])/2.5)
// px в локальном масштабе рисунка; без привязки к scroll или mouse.

Наведение

- НАБЛЮДЕНО: hover над изображением увеличивает draggable-слой до 1.075. Итоговый desktop scale = .5×1.075 = .5375.
- Подпись привязана к anchor, а не к указателю: absolute, bottom:85%, по горизонтали центрирована. На desktop font-size 18 px; pill около 38 px высотой.
- ИЗМЕРЕНО: label opacity 0→1; translateY 32→0 px; transition 200 ms cubic-bezier(.175,.885,.32,1.1). При уходе - обратное движение.
- ПАРАМЕТР ТЗ: hover scale за 180-220 ms той же кривой. На pointer coarse/hover:none не зависеть от hover; tap должен сразу выбирать.

Нет подтверждения глобального cursor-parallax, вращения камеры, магнитной кнопки или изменения перспективы по mousemove. Свечение курсора на захватах не подтверждено как эффект сайта: в изученном DOM нет отдельного cursor-слоя. Не включать его в обязательную реализацию.
```

![S02-03-aave-hover](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S02-03-aave-hover.jpg)

![S03-04-family-hover](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S03-04-family-hover.jpg)

## Страница 05 — 04 / Drag и пружинный возврат

```text
04 / Drag и пружинный возврат
Ключевая интерактивная часть: предмет можно «потрогать»

[S04] Drag Aave: персонаж следует за указателем
Файл: Скриншоты/S04-drag-1.jpg
[S05] Возврат после drag: промежуточная позиция
Файл: Скриншоты/S05-drag-4.jpg

НАБЛЮДЕНО: Aave был перенесён на Δx=659, Δy=-225 px. В активном кадре draggable transform = translateX(659px) translateY(-225px) scale(1.05) rotate(10deg). После отпускания он сам возвращается; drag не открывает detail.

Кадр | Состояние / x | Что воспроизвести
t≈114 ms | dragging=true; x=659 | следование за pointer без инерционной задержки
t≈218 ms | dragging=false; x=-42.75 | первый overshoot за начальную позицию
t≈317 ms | x=-33.14 | отрицательная сторона возврата
t≈418 ms | x=+30.70 | колебание на другой стороне
t≈519 ms | x=-9.46 | затухание
t≈620-726 ms | x≈.14 → 1.22 | приближение к нулю

Время отсчитано от начала серии наблюдений, не от аппаратного pointerup. Замеры не являются точной кривой пружины: DOM и скриншоты захватывались последовательно. Они подтверждают быстрое возвращение с несколькими сменами знака, а не простой ease-out.

ПАРАМЕТРЫ ТЗ

- Drag threshold: 6 CSS px. До порога - press; после порога isDragging=true и подавление последующего click. Pointer capture на интерактивном узле.
- Drag x/y = текущий clientXY - pointerDownXY. Touch-action:none только на draggable; user-select:none; native draggable=false.
- Наклон: clamp(Δx×.015, -10°, 10°). Это предложенная зависимость; в оригинале подтверждён угол 10° на длинном drag, его функция не установлена.
- При drag scale=1.05, tooltip opacity=0. Поднять активный объект выше остальных. На pointerup/cancel/lostcapture вернуть x/y=0, angle=0.
- Возврат: стартовые spring stiffness=900, damping=14, mass=1, initial velocity=0; предел входной скорости при использовании velocity - 1200 px/s. Настроить по серии S04/S05 до settling≈0.6-0.9 s и остатка <1 px.
- При reduced motion: возврат 100 ms без overshoot. Если перетаскивание не поддержано устройством, обычный tap остаётся полностью рабочим.

Ключ: движение, отмена click после drag и snap-back. Декоративно: наклон, звук отпускания и точное число колебаний. Не добавлять физические столкновения персонажей, гравитацию или drag-and-drop сохранение позиций.
```

![S04-drag-1](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S04-drag-1.jpg)

![S05-drag-4](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S05-drag-4.jpg)

## Страница 06 — 05 / Открытие detail на desktop

```text
05 / Открытие detail на desktop
Один объект становится главным, информация приходит справа

[S06] Desktop: выбран Aave, открыта правая панель
Файл: Скриншоты/S06-02-aave-open.jpg

Целевая геометрия

- Выбранный объект: scale .5→1; opacity=1; y-композиции→0. Это двукратное увеличение, не увеличение всего ряда.
- Остальные: scale=.5, opacity=.2. Их x перестраиваются в линейный carousel с шагом 500 px; прежние y-смещения исчезают.
- ИЗМЕРЕНО при 1534×889: selected anchor x=-232.558 от центра окна. Центр выбранного PNG около (534.44;444.5). Соседи находятся на ±500 px.
- Правая карточка: x=1070.61, y=8, width=455.39, height=873 px. CSS: max-width:30%; min-width:448px; padding:44px 64px; border-radius:12px.
- Фон rgba(15,15,15,.89), backdrop-filter:blur(32px) на desktop. Контейнер section - fixed inset:0; padding:8px; overflow-x:hidden; overflow-y:scroll.
- Внутри - заголовок, описание, характеристики, нижние ссылки. Минимальная высота карточки 100% контейнера; длинный текст увеличивает её высоту и прокручивается.

Последовательность перехода

ПАРАМЕТР ТЗ: в один тик после click задать selectedId. Одновременно за 550-700 ms перестроить anchor x/y и scale; за 220 ms приглушить соседей; за 200 ms спрятать footer через opacity 0 и translateY 32 px. Панель входит справа с translateX(panelWidth+16)→0 за 500 ms; её контент opacity 0→1 за 220 ms, delay 80 ms. Последние времена - параметры новой реализации, не извлечённый timeline оригинала.

Пустая область слева закрывает detail. Клик внутри панели её не закрывает. Escape закрывает и возвращает композицию. В оригинале desktop-крестик скрыт. На сайте пользователя предусмотреть доступное закрытие с клавиатуры и восстановление focus на выбранный объект.
```

![S06-02-aave-open](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S06-02-aave-open.jpg)

## Страница 07 — 06 / Carousel и переключение

```text
06 / Carousel и переключение
Идентичность объекта должна сохраняться в движении

[S07] Desktop: выбран Family
Файл: Скриншоты/S07-19-family-open.jpg
[S08] Desktop: выбран Lens
Файл: Скриншоты/S08-07-lens-open.jpg
[S09] Desktop: выбран GHO
Файл: Скриншоты/S09-08-gho-open.jpg

i = selectedIndex; n = items.length
prev = (i - 1 + n) % n; next = (i + 1) % n
// ТЗ: центр свободной области слева от панели; расчёт на resize.
selectedOffsetX = panelRect.left/2 - W/2
anchorX[j] = selectedOffsetX + 500 * (j - i)
anchorY[j] = 0
scale[j] = j===i ? 1 : .5
opacity[j] = j===i ? 1 : .2

НАБЛЮДЕНО: порядок Aave → Family → Lens → GHO; prev от Aave выбирает GHO, то есть выбор циклический. Работают две нижние стрелки и клавиша ArrowRight. Отдельный drag-свайп переключения carousel не подтверждён; не считать его существующим.

При 1534 px выбранный Lens имеет x=-232.558; Aave -1232.56, Family -732.558, GHO 267.442. Дальние объекты естественно выходят за viewport. Для wrap выбор индекса циклический; сама observed-линейка не обязана кратчайшим образом переставлять крайние объекты.

ПАРАМЕТР ТЗ: выбранный новый объект увеличивается в движении, предыдущий уменьшается; все x вычисляются по новой цели без размонтирования PNG. Панель меняет содержание fade-out 120 ms → fade-in 220 ms. Старый текст не должен оставаться активным и доступным скринридеру после смены selectedId.

Стрелки - общая pill-группа под левой сценой: fixed bottom:48px; высота около 38px; desktop backdrop blur32px. Кнопки opacity .33→1 при hover/focus; active scale .8; transition 200 ms snappy. На ширине ≤920px группа скрыта.

НАБЛЮДЕНО: при смене в DOM кратко сосуществуют старый и новый заголовки. Вероятен механизм enter/exit presence. Для реализации достаточно одного активного semantic content и декоративного выходящего слоя с aria-hidden=true.
```

![S07-19-family-open](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S07-19-family-open.jpg)

![S08-07-lens-open](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S08-07-lens-open.jpg)

![S09-08-gho-open](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S09-08-gho-open.jpg)

## Страница 08 — 07 / Мобильная композиция

```text
07 / Мобильная композиция
ИЗМЕРЕНО / 390 × 844 / CSS breakpoint 920 px

[S11] Mobile viewport 390 × 844: сетка 2×2
Файл: Скриншоты/S11-10-mobile-idle.jpg
[S15] Mobile: выбран Lens
Файл: Скриншоты/S15-14-mobile-lens-peek.jpg

Правило | OVERVIEW | DETAIL
Центр сцены | (W/2; (H-96)/2) = (195;374) | тот же fixed-контейнер
Позиции 4 объектов | (-90,-40);(90,-40);(-90,120);(90,120) | выбранный x=0; y=-111.125
Scale | .33 для всех | .55 выбранный; .33 остальных
Видимость | все opacity=1 | selected=1; прочие anchor opacity=0
Hover подписи | обычные labels display:none | название содержится в sheet
Z-порядок | 3;2;1;1 | selected выше скрытых соседей

Размеры базовых PNG остаются теми же. При .33 экранный Aave около 135×166 px, Family 129×129, Lens 169×113, GHO 145×145 до rotation. Scene bottom reserve=96 px даёт место нижнему логотипу.

ПАРАМЕТР ТЗ: breakpoint ≤920px выбрать mobile-композицию; >920px - desktop. На 320-389 px ужимать расстояние колонок: colX=min(90,(W-2×safeX-largestItemWidth)/2). Не уменьшать touch targets вместе с рисунком. Проверить высоту 568 px и горизонтальный телефон отдельно.

Оригинальные CSS min-width:920 и max-width:920 пересекаются ровно в 920. В новой реализации использовать один источник breakpoint; не оставлять противоречивые правила. Настоящие mobile Safari/Android и multi-touch в данном исследовании не тестировались.
```

![S11-10-mobile-idle](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S11-10-mobile-idle.jpg)

![S15-14-mobile-lens-peek](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S15-14-mobile-lens-peek.jpg)

## Страница 09 — 08 / Mobile: scroll нижней панели

```text
08 / Mobile: scroll нижней панели
Иллюзия sheet построена на обычном overflow-scroll

[S12] Mobile: Aave и начальная позиция панели
Файл: Скриншоты/S12-11-mobile-aave-peek.jpg
[S13] Mobile: панель после scroll примерно 422 px
Файл: Скриншоты/S13-12-mobile-sheet-scroll.jpg
[S14] Mobile: конец scroll, scrollTop = 572 px
Файл: Скриншоты/S14-13-mobile-sheet-end.jpg

Измеренная структура

Обёртка detail fixed inset:0, width390, height844, scrollHeight1416. Padding:0 4px 4px. Её ::before занимает calc(100% - 17rem) = 568 px. Карточка начинается на y=568, имеет width382 и height100svh=844. Поэтому видимая начальная часть - 276 px.

sheetTop = H - 272 - panelScrollTop
// H=844: 568 → 146 после scrollTop≈422 → -4 при scrollTop=572
// maxScroll=1416-844=572. body.scrollY остаётся 0.

ИЗМЕРЕНО: anchor выбранного Aave сохраняет translateY(-111.125px) во время всей прокрутки. Нет scroll-driven scale, поворота или глубинного движения персонажа. Персонаж скрывается потому, что непрозрачная карточка проходит поверх него.

- Карточка mobile: background #1a1a1a, radius20px, padding28px 32px 32px; shadow 0 0 64px 32px rgba(0,0,0,.8). Desktop blur здесь не требуется.
- Крестик внутри карточки absolute top24/right24 px, target44×44 px. Он едет вместе с карточкой; на первом экране доступен в её верхней части.
- Футер главной скрыт; footer detail находится внизу карточки, достижим прокруткой. Не делать два конкурирующих body/sheet scroll.
- ПАРАМЕТР ТЗ: каждый новый detail открывается при panelScrollTop=0. Wheel/touch в карточке прокручивает её нативно. Не превращать scroll в drag snap-points.
- Touch-action:pan-y на scroll-контейнере; none только на доступных для drag картинках. Не перехватывать все touchmove на window.

При очень коротком viewport ПАРАМЕТР ТЗ: peekHeight=min(272,H×.55); selected hero ограничить свободной областью. Это защитная адаптация, не измеренная особенность оригинала. Контент и закрытие должны быть доступны даже когда иллюстрация скрыта.
```

![S12-11-mobile-aave-peek](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S12-11-mobile-aave-peek.jpg)

![S13-12-mobile-sheet-scroll](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S13-12-mobile-sheet-scroll.jpg)

![S14-13-mobile-sheet-end](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S14-13-mobile-sheet-end.jpg)

## Страница 10 — 09 / Слои, depth, clipping

```text
09 / Слои, depth, clipping
Псевдоглубина без 3D-камеры

Scene [fixed, центрирование, pointer-events:none]
  Anchor [layout x/y; z-index; mobile visibility]
    Draggable button [pointer-events:auto; drag x/y; hover scale; drag angle]
      Selection [scale .5/.33/1/.55; opacity]
        Artwork [постоянный rotation]
          Bob [translateY от 0 до -10]
            Wobble [временный rotate после взаимодействия]
              PNG [alpha; pointer-events:none]
    Label [anchor-relative, не mouse-relative]
  DetailOverlay [fixed z=2; overflow-y:auto]
    Spacer [mobile only]
    DetailCard [surface + content]
  CarouselControls [z≈999, desktop only]
  Footer / Sound / LogoMenu

Что создаёт глубину

- Передний персонаж перекрывает соседний: отдельный z-index. У Aave большой силуэт и самый высокий z в обзорном desktop-состоянии.
- Выбранный объект крупнее и непрозрачен, фоновые маленькие и с opacity .2. Это иерархия, а не расстояние по Z.
- Несовпадающие bob-фазы создают небольшое независимое движение слоёв.
- Полупрозрачная панель с blur32px закрывает часть фонового ряда; mobile sheet непрозрачен и отбрасывает широкий мягкий shadow.

Clipping / masking

ИЗМЕРЕНО: силуэты - PNG с alpha, не CSS clip-path персонажей. Отрезание дальних объектов происходит краем окна; scroll-overlay скрывает горизонтальное переполнение. SVG логотипа содержит clipPath на viewBox и alpha masks с id __lottie_element_*. Они относятся к анимации штрихов логотипа, не к wipe-переходу всей сцены.

ПАРАМЕТР ТЗ: не обрезать hover label overflow:hidden на anchor. Ограничивать сцену на уровне viewport; overlay и focus-ring держать вне обрезаемых внутренних узлов. Каждый источник движения должен иметь отдельный transform wrapper, иначе drag перезапишет scale/rotation.

Не подтверждены: perspective, translateZ, WebGL-shaders, shader displacement, Canvas particles, mouse-depth параллакс, shader-based mask. Они не нужны для совпадения изученных эффектов.
```

## Страница 11 — 10 / Motion tokens и timing

```text
10 / Motion tokens и timing
Отдельно: параметры оригинала и параметры новой реализации

Эффект | Данные оригинала | Зафиксировать в ТЗ
Hover label | CSS 200 ms; snappy | 200 ms; y32→0; opacity0→1
Hover scale | точная цель1.075 | 200 ms; snappy
Idle bob | 0..-10 локальных px; цикл≈2.5s | 2.5s; sine; phase шаг .5s
Drag scale / angle | 1.05 / 10° в длинном drag | 1.05; clamp ±10°
Snap-back | несколько колебаний; <1s | spring900/14/1; настройка по кадрам
Layout selection | точные конечные позиции | 650 ms; spatial ease
Panel open/close | финальное положение подтверждено | 500 / 350 ms; spatial ease
Detail text смена | старый/новый DOM при переходе | 120 ms out / 220 ms in
Footer hide | CSS 200 ms ease-in-out; y32 | те же значения
Footer initial fade | CSS .8s snappy both | 800 ms; opacity0→1
Sound hover / press | CSS400ms; press.85,200ms | 400 / 200 ms; snappy
Arrow hover / press | CSS200ms; press.8 | 200 ms; snappy
Logo menu | CSS100ms; opacity+scale .96 | 100 ms ease; scale.96→1
Metadata tooltip | CSS y8→0; opacity0→1 | 200 ms; snappy

snappy = cubic-bezier(.175,.885,.32,1.1)  // найдено в CSS
spatial = cubic-bezier(.19,1,.22,1)         // найден token ease-swift
// Наличие token не доказывает его применение к layout.
// В ТЗ spatial применяется к большим перемещениям сознательно.

Первичная загрузка

Обзорное конечное состояние подтверждено; начальная покадровая последовательность персонажей не была надёжно захвачена из-за краткого сбоя доступа при reload. Не выдавать порядок их появления, stagger или продолжительность intro за измеренные.

ПАРАМЕТР ТЗ для воспроизводимого intro: после decode() доступных ассетов opacity0→1 и selectionScale(0.9×target)→target за450ms; stagger40ms по индексу. Footer fade800ms. Это выбранная мягкая адаптация, а не реконструированный оригинальный timeline. При reduced motion - сразу финальное состояние, без искусственного loader.

Все длительности считаются от события после готовности ассета. Анимации transform/opacity не должны тормозить основной ввод; предыдущие tweens отменяются или продолжаются к новой цели от текущего значения.
```

## Страница 12 — 11 / Микроэффекты и логотип

```text
11 / Микроэффекты и логотип
Декоративный слой и опциональные возможности

[S10] Контекстное меню логотипа Avara
Файл: Скриншоты/S10-09-logo-menu.jpg

- Логотип Avara: SVG-анимация с Lottie-масками; renderer SVG подтверждён по DOM. Точный frame-rate, длительность и триггер повторного проигрывания не установлены. Подпись made by tatarin не заменять этой анимацией.
- По правому клику именно на логотипе открывается меню Copy Logo as SVG / Brand Assets. Правый клик на персонаже такого меню не показал.
- Меню: portal поверх сцены, фон #1a1a1a, radius8px, backdrop blur10px, padding5px, минимальная ширина184px. Enter:100ms ease, scale .96→1 и opacity0→1; exit:100ms opacity1→0.
- Metadata: цепочки круговых иконок 20×20px частично перекрываются. На hover label выше иконки: font13px, pill, translateY8→0, opacity0→1; icon wrapper overflow:hidden. CSS подтверждён; отдельный hover-кадр метаданных не получен.
- Footer links: opacity.35→1 при hover, transition200ms; текст≈13px. Стрелки и звук: active-scale описаны на странице10.
- Sound: в ресурсах загружены click/release/open/close/tap/back/forward/error.wav. Названия указывают на короткую событийную обратную связь. Прослушивание и точное сопоставление событий не проверены.

Перенос на сайт пользователя

Ключевое: hover-подпись и ясные контролы выбранного объекта. Декоративное: анимация wordmark, inset-shadow pills, звуки. Меню бренд-ассетов переносить только если на целевом сайте уже есть такая задача; оно не является обязательным условием эффекта селектора.

ПАРАМЕТР ТЗ для звука, если он нужен: opt-in mute по умолчанию; запуск AudioContext только после пользовательского жеста; громкость .15-.25; без фоновой музыки. Кнопка с aria-label и aria-pressed. Отсутствующий WAV не останавливает визуальную анимацию.

ПАРАМЕТР ТЗ для авторства: использовать официальный локальный made-by-tatarin-light.svg на тёмном фоне. Размещать в нижней области собственного сайта без перекрытия управления. Минимумы читабельности:180px desktop /145px mobile; это нижняя граница, не заданный размер. Не перерисовывать и не перекрашивать asset.
```

![S10-09-logo-menu](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S10-09-logo-menu.jpg)

## Страница 13 — 12 / Blog и шаблон статьи

```text
12 / Blog и шаблон статьи
Вторичные страницы: обычный DOM-flow

[S16] Blog: обычный список и фильтры
Файл: Скриншоты/S16-15-blog-desktop.jpg
[S17] Статья: статическая обложка и текст
Файл: Скриншоты/S17-17-article.jpg

НАБЛЮДЕНО: Blog имеет центральную колонку около664px при ширине1534px. Фильтры All/Aave/Lens/Family/Avara меняют набор статей; Lens оставляет2 записи. При scroll заголовок и фильтры уходят вверх вместе с документом. Pin, parallax, scroll-mask или масштабирование обложек не обнаружены.

ИЗМЕРЕНО CSS: цвет фильтров rgba(255,255,255,.4), hover .6, active white; transition color100ms. Read more имеет underline с opacity.3→1. Ссылка назад на hover двигает стрелку по X на -2.4px и меняет opacity до.8; общий transition200ms.

Статья Lens использует тот же центрированный поток и статическую PNG-обложку с округлением. При scroll889px image transform=none; обложка просто уходит за верхнюю границу. Изучена одна статья; это проверка шаблона, не покадровый аудит всех материалов.

CSS шаблона содержит shimmer для ещё не загруженной картинки: диагональный gradient слой inset:-100%, rotate(-45deg), translateX100%→-100%, linear2s infinite. Изображение проявляется opacity за600ms; shimmer гаснет за1s. Принудительное loading-состояние не воспроизводилось; это данные CSS.

ПАРАМЕТР ТЗ: при переносе основной сцены вторичные страницы не менять. Если в отдельной задаче нужен аналог Blog: нативный flow, semantic filters, max-width664px, responsive padding; фильтрация не должна требовать ScrollTrigger. Careers фактически перенаправляет на внешний Aave-сайт и не задаёт механику этой сцены.
```

![S16-15-blog-desktop](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S16-15-blog-desktop.jpg)

![S17-17-article](%D0%A1%D0%BA%D1%80%D0%B8%D0%BD%D1%88%D0%BE%D1%82%D1%8B/S17-17-article.jpg)

## Страница 14 — 13 / Вероятная реализация

```text
13 / Вероятная реализация
Что известно о технологии, а что является выбором разработчика

Технология | Степень уверенности | Основание
Next.js + React | подтверждён Next.js build | /_next/static/chunks/pages; root __next
DOM / CSS transforms | подтверждено | IMG+DIV+BUTTON; меняющиеся inline matrices
CSS Modules | высокая | styles_* классы с hash
Lottie SVG | подтверждено для logo | __lottie_element_*; masks/clipPath
Framer Motion / Motion | гипотеза высокой вероятности | transform wrappers, drag, will-change, enter/exit
Radix Context Menu | высокая | data-radix-collection-item и transform-origin
GSAP | не подтверждено | не найден DOM-признак, который доказывал бы библиотеку
Canvas / WebGL / Three.js | не требуются; не обнаружены | 0 canvas и0 video в просмотренной сцене

Отсутствие canvas не доказывает отсутствие неиспользуемого кода в бандле. Но видимый эффект полностью объясняется DOM, alpha-изображениями, transforms и SVG. Исходный код, source maps и package.json оригинала не получены; библиотечные версии и точные spring settings неизвестны.

Рекомендуемая архитектура для Codex

- Использовать существующий framework проекта. Если Motion уже установлен - применять motion values + animate/drag. Если проект использует GSAP - timeline/tweens + собственный Pointer Events drag. Не подключать обе библиотеки.
- Если animation library нет: Web Animations API/CSS для fade/scale и один requestAnimationFrame для spring/bob. Состояние выбора - обычная UI-модель, не DOM-query как источник истины.
- Компоненты: InteractiveScene, SceneItem, SceneItemLabel, DetailPanel, CarouselControls, BrandingFooter; SoundControl и BrandContextMenu опциональны.
- ResizeObserver + единая viewport-модель. Расчёт geometry после resize, а не чтение getBoundingClientRect в каждом кадре.
- decode/preload собственных изображений; pause bob при hidden document и вне видимой сцены. Не вызывать React setState на каждом animation-frame.

Ключ: корректный visual state переход и пространственная непрерывность. Декоративно: выбранный пакет анимации. Замена DOM-иллюстраций на 3D-модели изменила бы характер эффекта и усложнила проект без основания.
```

## Страница 15 — 14 / ТЗ для Codex: вход и границы

```text
14 / ТЗ для Codex: вход и границы
Этот и следующие разделы можно передать агенту как рабочее задание

ЦЕЛЬ
Внедри на существующем сайте интерактивный селектор с механикой
Avara из этой инструкции. Сохрани пользовательский бренд и данные.
Не делай произвольный редизайн остальных страниц.

ДО НАЧАЛА ПРАВОК
1. Прочитай AGENTS.md проекта и актуальный Tatarin UI Standard.
2. Найди текущий hero/selector, layout, routing, motion tokens.
3. Определи существующую библиотеку анимации и asset pipeline.
4. Сопоставь собственные реальные объекты с SceneItem.
5. Зафиксируй страницу, область изменений и существующие функции.
6. Если нет исходников/ассетов пользователя, не подставляй Avara PNG
   в production. Подготовь компонент и явный mapping для интеграции.

Контракт данных

type SceneItem = {
  id: string; title: string; imageSrc: string; alt: string;
  width: number; aspect: number; baseAngle: number;
  desktop: {x:number; y:number; z:number};
  mobile: {x:number; y:number; z:number};
  description: string;
  facts: {label:string; value:string}[];
  links: {label:string; href:string; icon?:string}[];
};
// Контент поступает из существующей модели проекта.
// Demo fixtures - явно отдельные синтетические данные.

- Настройки reference geometry задать в одном sceneConfig, используя таблицы страниц2 и7. Не размазывать magic numbers по event handlers.
- Черный negative space и слой собственной иллюстрации - композиционная основа. Не копировать название Avara, чужие персонажи, описание проектов, фирменные шрифты и внешние ссылки как контент пользователя.
- Если новые assets имеют другие пропорции, нормализовать базовый размер без растягивания; скорректировать overlap и fit, сохраняя отношения overview/detail и state machine.
- При сохранении существующей hero-секции не ломать обычный scroll остального сайта. Блокировать overflow только внутри сцены или при открытом modal detail; после закрытия восстанавливать предыдущий scroll.

На момент создания этого ТЗ исходники целевого сайта не предоставлены. Конкретные пути компонентов и набор объектов должен определить Codex при интеграции; это не повод выдумывать новые бизнес-данные.
```

## Страница 16 — 15 / ТЗ для Codex: алгоритм ввода

```text
15 / ТЗ для Codex: алгоритм ввода
Реализовать независимые источники transform и явный click/drag contract

onPointerDown(e, id):
  if detailOpen: return
  pointer = {id:e.pointerId, item:id, start:[e.clientX,e.clientY]}
  moved = false
  currentTarget.setPointerCapture(e.pointerId)

onPointerMove(e):
  if !pointer || e.pointerId !== pointer.id: return
  dx = e.clientX-pointer.start[0]; dy = e.clientY-pointer.start[1]
  if hypot(dx,dy)>6: moved=true
  if moved:
    dragX.set(dx); dragY.set(dy)
    dragScale.set(1.05); dragAngle.set(clamp(dx*.015,-10,10))
    hideLabel(); elevateActiveItem()

onPointerUp(e):
  if !pointer: return
  didDrag = moved
  releaseCapture(); pointer=null
  springToOrigin(); dragAngle→0; dragScale→(hover ? 1.075 : 1)
  if !didDrag: openDetail(item)
  else: suppressOnlyThisGestureClick()

onPointerCancel/lostpointercapture:
  pointer=null; moved=false; springToOrigin(); neverOpenDetail()

Не открывать detail повторно из обработчика click после pointerup: выбрать один согласованный механизм. Для keyboard Enter/Space использовать стандартное button activation. Подавление mouse click после drag не должно подавлять keyboard input или следующий независимый tap.

Выбор и выход

openDetail(id):
  cancel active drag; selectedId=id; detailScroll=0
  targetOverviewFooterVisible=false
  apply detail geometry; show panel; focus panel heading/close

selectNext(direction):
  selectedIndex=(selectedIndex+direction+count)%count
  retarget geometry from current values; detailScroll=0

closeDetail():
  selectedId=null; restore overview geometry and footer
  restore scroll lock and focus to opener

ArrowLeft/Right работают только когда detail открыт и focus не в редактируемом поле. Escape закрывает menu прежде detail. Click-outside проверяет composedPath относительно panel и controls; клики по ссылкам/стрелкам не закрывают панель случайно.

Mobile: первое нажатие сразу выбирает; hover preview не становится обязательным этапом. Нативную вертикальную прокрутку sheet сохранить. Swipe-to-change или drag-to-dismiss не добавлять без отдельного требования.
```

## Страница 17 — 16 / ТЗ для Codex: адаптация и качество

```text
16 / ТЗ для Codex: адаптация и качество
Tatarin Product UI Standard - применимые требования

Обязательная доступность и устойчивость

- Все SceneItem - семантические кнопки с доступным именем. Видимый focus, Enter/Space выбора; последовательность Tab не должна проходить по скрытым объектам или exiting-панели.
- Icon-only controls: aria-label, sound aria-pressed; close target минимум44×44px. На мобильном важная функция не доступна только hover или right-click.
- Сначала определить modal/nonmodal семантику существующего UI. Для блокирующей панели role=dialog, aria-modal и корректный focus management; скрываемая сцена inert. Не менять роутинг только ради визуального эффекта.
- prefers-reduced-motion: отключить bob, tilt, stagger, overshoot и декоративное logo-play. Выбор по-прежнему открывает ту же информацию; fade/instant≤100ms; scroll панели нативный.
- Текст и значимые controls проверять измерением контраста. Normal text≥4.5:1, large text≥3:1; необходимые non-text indicators≥3:1. Низкую opacity оригинального footer не копировать как обязательное требование.
- Официальная подпись хранится локально, без runtime GitHub. Собственные шрифты/иконки переиспользуются из проекта; не добавлять внешние зависимости для украшения.
- Изображение missing/error: доступная текстовая кнопка с тем же названием; выбор и информация рабочие. Длинное title/description/facts не прячут close и основные действия.
- Resize во время detail или drag: отменить pointer gesture безопасно, пересчитать target geometry; selectedId сохраняется. Orientation change не сбрасывает выбранный объект произвольно.

Приоритет эффектов

Уровень | Состав | Признак завершения
P0 / ключ | layout, hover, drag/snap, выбор, carousel, mobile sheet | полный open→switch→close сценарий
P1 / характер | bob phases, углы, fade соседей, лёгкий spring | визуальное сравнение одинаковых состояний
P2 / декор | logo animation, WAV, context brand menu | только при наличии product need

Перенос эффекта не требует полного тематического движка, новой базы данных, регистрации или изменения API. Если проект уже поддерживает light/dark, проверить затронутые темы; если только dark, light=N/A. Новые бизнес-функции из этой инструкции не следуют.

Ожидаемый результат - самостоятельная сцена с корректным поведением, вписанная в существующий сайт. Production-публикация не входит в текущую задачу подготовки инструкции.
```

## Страница 18 — 17 / Приёмка реализации

```text
17 / Приёмка реализации
Codex должен проверить в работающем браузере

Проверка | Ожидаемый результат
Desktop1534×889 | центры/scale совпадают с таблицей; геометрия ±3px
Hover каждого объекта | scale1.075; label y32→0; без layout jump
Drag вправо/влево/за край | следование pointer; возврат<1s; click не открывает
Pointercancel / новый ввод | нет зависшего drag; ввод не заблокирован
Выбрать все4 объекта | selected×2; прочие opacity.2; правильный текст
Aave prev / GHO next | wrap к последнему / первому; без потери focus
Escape / outside / inside | закрывается / закрывается / сохраняется
390×844 /320 /768 /920 /921 | 2×2 ниже breakpoint; ни один control не пропал
Mobile scroll0 /422 /max | sheet top568 /146 /около0; hero неподвижен
Короткое окно и200%zoom | текст иclose доступны, без horizontal scroll
Keyboard / reduced motion | тот же контент, без обязательного движения
Missing PNG / long text | fallback доступен; card прокручивается
Resize open / rapid switch | selected сохранён; нет дублирующего active DOM
Performance | transform/opacity; без layout read/write в кадре

ПАРАМЕТР ТЗ: на reference viewport steady-state scale допускает отклонение≤.01; opacity≤.02; выбранный центр desktop калибровать до≈534.4/444.5 px. Mobile sheet start=H-272; при новых ассетах допустима осознанная коррекция hero, документированная скриншотом.

Проверять timing по screen recording 60fps или DevTools на целевой реализации: durations±15%, drag settling0.6-0.9s, несколько затухающих колебаний без заметного дрожания после settling. Приведённые spring constants - стартовая настройка, визуальный результат важнее буквального числа.

Performance target для новой реализации: frame budget≤16.7ms на60Hz в основной анимации; измерить на целевых устройствах. Это цель, не утверждение о замеренном FPS оригинала. Сохранить видео/кадры overview, hover, drag, detail, mobile scroll и reduced-motion.

Финальный отчёт разработчика: изменённые файлы, сценарии и размеры проверки, фактические результаты, скриншоты, известные ограничения. Успешная сборка отдельно от визуальной приёмки; не объявлять непроверенные touch/FPS/assistive-tech сценарии пройденными.
```

## Страница 19 — 18 / Источники и границы точности

```text
18 / Источники и границы точности
Данные текущего просмотра, а не предположение по одному скриншоту

- https://avara.xyz/ - источник механики и снимков S01-S15. Chrome пользователя, default1534×889; временный viewport390×844, затем сброшен.
- https://avara.xyz/blog - фильтры и обычная прокрутка, S16.
- https://avara.xyz/blog/lens-chain-mainnet-launch - проверка шаблона статьи, S17.
- https://github.com/garifulinandrej183-lang/tatarin-branding - канонические UI_GUIDELINES.md, UI_PATTERNS.md, UI_REVIEW_CHECKLIST.md, SPECIFICATION.md, USAGE.md прочитаны05.10.2026.

Достоверность

Подтверждены: desktop click/hover/drag/snap, выбор всех4 элементов, цикличность prev, ArrowRight, Escape, click-outside, контекстное меню логотипа; mobile resize, выбор Aave/Lens, close и wheel-scroll sheet. Серии DOM-кадров дают амплитуду bob и примерный цикл, точные конечные scales и положения.

Не проверены: нативный touch/multi-touch на телефоне, mobile Safari, hover tooltip метаданных отдельным кадром, слышимое аудио, изменение sound preference после reload, точный intro персонажей, реальный FPS, исходный package.json, точный исходный spring/easing больших JS-переходов. CSS loading shimmer прочитан, принудительно не показан.

Скриншоты - реальные захваты вкладки, без дорисовки или реконструкции. Они показывают момент времени, а не полную траекторию. Некоторые кадры carousel могут быть сняты в конце перехода. Нормативными для новой реализации являются явно указанные ПАРАМЕТРЫ ТЗ и таблицы конечной геометрии.

Комплект

Инструкция для Codex.pdf - декомпозиция, ТЗ и встроенные иллюстрации. Инструкция для Codex.txt - тот же текст в UTF-8 с именами иллюстраций. Папка Скриншоты -17 оригинальных JPEG; ZIP содержит PDF, TXT и эту папку.

Главная творческая идея: один ряд/сетка материальных 2D-предметов переходит в состояние выбранного предмета и контекста. Именно пространственная непрерывность, упругое перетаскивание и адаптивная композиция создают эффект. Звуки, фирменные персонажи и бренд-меню можно заменить или опустить, не теряя механику.

КАТАЛОГ СКРИНШОТОВ

S01: Desktop: исходная сцена, 1534 × 889
Скриншоты/S01-01-desktop-idle.jpg
S02: Hover Aave: увеличение и подпись
Скриншоты/S02-03-aave-hover.jpg
S03: Hover Family: подпись другого объекта
Скриншоты/S03-04-family-hover.jpg
S04: Drag Aave: персонаж следует за указателем
Скриншоты/S04-drag-1.jpg
S05: Возврат после drag: промежуточная позиция
Скриншоты/S05-drag-4.jpg
S06: Desktop: выбран Aave, открыта правая панель
Скриншоты/S06-02-aave-open.jpg
S07: Desktop: выбран Family
Скриншоты/S07-19-family-open.jpg
S08: Desktop: выбран Lens
Скриншоты/S08-07-lens-open.jpg
S09: Desktop: выбран GHO
Скриншоты/S09-08-gho-open.jpg
S10: Контекстное меню логотипа Avara
Скриншоты/S10-09-logo-menu.jpg
S11: Mobile viewport 390 × 844: сетка 2×2
Скриншоты/S11-10-mobile-idle.jpg
S12: Mobile: Aave и начальная позиция панели
Скриншоты/S12-11-mobile-aave-peek.jpg
S13: Mobile: панель после scroll примерно 422 px
Скриншоты/S13-12-mobile-sheet-scroll.jpg
S14: Mobile: конец scroll, scrollTop = 572 px
Скриншоты/S14-13-mobile-sheet-end.jpg
S15: Mobile: выбран Lens
Скриншоты/S15-14-mobile-lens-peek.jpg
S16: Blog: обычный список и фильтры
Скриншоты/S16-15-blog-desktop.jpg
S17: Статья: статическая обложка и текст
Скриншоты/S17-17-article.jpg
```
