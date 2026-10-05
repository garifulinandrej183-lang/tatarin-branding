# Полный разбор: Gregor Collienne: Overview, GRID/LIST и фотогалереи

Источник: `gregorcollienne.pdf`; 25 страниц; дата отчёта и импорта: 2026-10-05. Референс: <https://gregorcollienne.com/>.

## Как читать архивную копию

Вся исследованная система: вступление Overview и повторение потока; WORK GRID/LIST; FOCUS и четыре коллекции; ближайший к центру thumb; rail ↔ INDEX; INFO, меню и Back.

Ниже сохранён полный текст по страницам исходного PDF, включая историческое ТЗ, формулы, численные ориентиры, подписи к рисункам и ограничения. Моноширинные блоки сохраняют колонки таблиц и отступы псевдокода; удалены только повторяющиеся колонтитулы. Это текстовая копия: сами рисунки, диаграммы и исходная типографика не включены. Ссылки из PDF восстановлены в конце и в [provenance.json](provenance.json).

Команды «реализуй», «проверь», «предоставь» внутри отчёта являются содержимым прежнего задания, а не поручением выполнить их при чтении или добавлении в каталог. Объём будущего переноса задаёт текущий пользователь; самостоятельное задание находится в [codex-prompt.md](codex-prompt.md). Предложенные параметры не являются измерением оригинала.

PDF является полным разбором и уточняет общий scroll lag двух RAF-loop. Физический touch, многократный конец infinite-feed, FPS и полный accessibility audit в исходнике не проверены. Новый live-прогон при импорте не выполнялся.

Статус архива: **analysis-only**. [Собственное применение](implementation.md) отсутствует. Достоверность исторических наблюдений и чтения JS/CSS относится к автору исходного PDF, а не к новой проверке при импорте.

## Текст исходного отчёта

### Страница 1

```text
Инструкция                 для      Codex

Весь              сайт            Gregor                  Collienne

Техническое задание на воспроизведение системы эффектов • 05.10.2026

OVERVIEW: смещённое поле фотографий вокруг фиксированного имени. Рассмотрены все собственные разделы, галереи и
состояния интерфейса.
Объём.  Главная и её вступление; WORK   GRID/LIST; FOCUS;   четыре галереи категорий; INDEX; INFO;
полноэкранное  меню; загрузка, смена страниц и Back; desktop/mobile, scroll, pointer и touch-контракт.

Главная  техническая  идея: контент движется  между устойчивыми   пространственными   якорями, а
названия и панели раскрываются   через CSS perspective, rotateX, blur и opacity. Фотографии сохраняют
собственные  пропорции. У сайта несколько разных  механизмов, которые  нельзя заменить  одним

универсальным  parallax.
Статус: исследование и ТЗ, не внедрение. Факт - наблюдение в Chrome и/или публичные CSS/JS. Требование - контракт
воспроизведения. Адаптация - решение для сайта пользователя. Скриншоты физического touch-устройства не
имитировались.
```

### Страница 2

```text
Карта        разделов              и   контракт             данных

 Маршрут референса                  Собственный эффект / управление

 /                                  OVERVIEW:  вступление из центра, 5 колонок, scroll, фиксированное имя,
                                    повторение потока. Фото ведёт в /focus/?rel=N

 /work/ и /work-list/               Две композиции категорий: GRID с центральным hover-title; LIST с фото
                                    слева/справа

 /focus/?rel=N                      Просмотр фотографии из общего массива; rail миниатюр + большое фото;
                                    Back и глобальное меню. INFO/INDEX отсутствуют
 /work/travel/                      Travel: viewer + INFO + INDEX + BACK

 /work/portraits/                   People: viewer + INFO + INDEX + BACK

 /work/wasserwarts/                 Personal Projects: viewer + INDEX + BACK; отдельные подписи к кадрам;
                                    INFO отсутствует

 /work/corporate-b2b/               Commissioned: viewer + INDEX + BACK; подписи клиента; INFO отсутствует

Границы.  Ссылки  Contact Me / IN / LI / FB ведут в почтовое приложение и внешние социальные
сервисы. Это внешние  назначения, а не дополнительные   экраны сайта. В собственных  разделах не
обнаружены  форма  обратной  связи, видеоплеер или 3D-сцена;  добавлять их для имитации  не
требуется.

Photo { id, src, srcset, width, height, alt, caption? }
Collection { id, title, photos[], infoText? }
OverviewTile { photoId, viewerHref, initialSlot? }
Project { id, title, coverPhoto, href }
RouteContext { fromUrl, fromScroll, fromMode, fromFocus }
GalleryState { collectionId, activeId, panel: view|index|info }

Требование. У каждой фотографии стабильный id; его используют viewport-viewer, rail и index. Query rel выбирает именно
кадр, а не номер DOM-узла с учётом копий. INFO показывать только при наличии текста. Сохранить маршруты и данные
сайта пользователя; имена, фото и содержимое референса служат только анализу.
```

### Страница 3

```text
OVERVIEW:                 вступление                 из    центра

Последовательные кадры: центральная стопка → фотографии расходятся по слотам. Разное время перемещения создаёт
ощущение раскладки рукой.

Завершённая раскладка. Центральное имя появляется после начала расхождения фотографий.

O0. До loaded фотографии  скрыты, светлая завеса размывает  сцену. O1. Видимые  стартовые
изображения  появляются  стопкой в центре viewport с разным z-index. O2. После finished каждое фото
уходит к своему grid-slot. O3. Имя раскрывается flip/fade/blur; дальнейший scroll работает как лента.

Для стартовых видимых   slots вычисляются dx = (W - slotWidth)/2 - slotLeft, dy = (H - slotHeight)/2 -
slotTop. Начальная media-transform = translate(dx - 50%, dy - 50%); конечная = translate(-50%, -50%).
Фото двигается целиком, без crop и без обязательного scale.

 Параметр источника               Значение

 Стартовая раскладка              Независимые случайные перестановки z-index и порядка задержек;
                                  стартовых видимых slots в проверенной главной - 11

 Разлёт фотографий                duration = random 0.80-1.40 s; delay = shuffledRank × 10 ms;
                                  cubic-bezier(.77,0,.175,1)

 Имя                              translateY(50%) rotateX(-40deg), opacity 0, blur 12px → none / 1 / 0; 790 ms,
                                  delay 600 ms после finished; perspective 1000px

Адаптация: фиксировать seed в режиме QA для повторяемых кадров; при reduced-motion сразу показать конечную
композицию. Повторное посещение может пропускать вступление - не заставлять его проигрываться при каждом Back.
```

### Страница 4

```text
OVERVIEW:                 grid,      scroll       и   occlusion

Фото проходят поверх имени при scroll. Имя остаётся в центре viewport, изображения сохраняют свою ориентацию.
 Геометрия desktop             Контракт

 Поле                          width 110%; left -5%; top -12vh; grid-template-columns: repeat(5,1fr); column-gap 6vw;
                               row-gap 22vh; overflow hidden

 Высота slot                   (100svh + 2 × 12vh)/3 - (2 × 22vh)/3

 Колонки 2 и 4                 translateY(50% высоты slot + row-gap/2). Это постоянный stagger, не разная
                               скорость scroll

 Media                         обёртка 110% ширины / 120% высоты slot; центр; img max-width/max-height 100%,
                               auto/auto, contain по геометрии

 Пустые стартовые slots        В исходной разметке позиции 3 и 8 не содержат фото: оставить окно для имени,
                               затем продолжить поток

Depth. Реальная глубина  здесь - порядок слоёв: фото могут закрывать буквы имени; случайный  z-index

важен в центральной  стопке. Перспективное вращение   относится к тексту, а не к фотоплоскостям.
Индивидуального  cursor-parallax или вращения фотографий  при hover не обнаружено.
Pointer. Смена координат внутри фотографии не двигает её; курсор обозначает ссылку, click открывает FOCUS на её id. Не
добавлять магнитное смещение, tilt, glow, displacement или курсорный trail. Scroll переносит всё поле с общим сглаживанием;
формула общего clock приведена в разделе 22.
```

### Страница 5

```text
OVERVIEW:                 mobile         и   повторение                 потока

390 × 844: главная сохраняет пять колонок, имя переносится на две строки. Menu скрывает поле за светлой поверхностью.

Mobile portrait ≤768px. Поле width 100%, left 0, offset-gap 8vh; column-gap 16px; row-gap остаётся 22vh.
Media занимает 160%  ширины   и 70% высоты  slot. В отличие от WORK это не двухколоночная  сетка.
Сохранить этот отдельный  responsive-контракт. Имя max-width 65%, font-size clamp(36px,5.5vw,82px);
допускается перенос по словам.

Продолжение,   подтверждено   исходником.   Если расстояние  от нижней границы  потока до viewport
≤500px, JS добавляет копии исходных  фото. Пустые  slots с infinity-item--skip не клонируются. Это
повторение существующего   набора, а не API-загрузка новых фотографий.  Проверка  многократного
прохода конца в Chrome  не была надёжно  завершена;  данное правило  установлено  чтением JS.

Требование адаптации. Сохранить визуальную непрерывность и правильные photo-id при повторении. Ограничить число
живых DOM-узлов оконной виртуализацией или безопасным recycle блоков; не копировать бесконечно DOM и listeners.
Нативный вертикальный swipe главной; не смешивать его с горизонтальным жестом фотогалереи.
```

### Страница 6

```text
Полноэкранное                      меню:          состояния               и   motion

Открытое desktop-меню: общий верхний переключатель, две ссылки, описание и нижние контакты. Это слой над текущей
страницей, без смены URL.
N0 → N1. Click «+»: слой сразу получает height 100%, pointer-events включаются; фон страницы
скрывается светлой backdrop-завесой  с blur 12px. Меню unblur 12px → 0 за 490ms,
cubic-bezier(.5,0,.5,1). Верхние ссылки входят из translateY(30%) rotateX(-40deg), opacity 0; 790ms,
cubic-bezier(.77,0,.175,1), stagger 60ms.

N1 → N2. Через  500ms JS заменяет  opening на open. Description разбит на визуальные строки:
rotateX(-40deg) + translateY(50%) → none; 790ms, stagger 15ms. Контакты входят с delay 100ms,
следующая  группа 130ms; copyright unblur/fade 490ms с delay 300ms.

N2 → N3. Click «×»: ссылки выходят вверх translateY(-30%) rotateX(40deg), текст - translateY(-50%)
rotateX(40deg). Переходы 790ms; JS закрывающие   классы очищает  через 500ms,  а height слоя
сбрасывается  после 800ms. Это раздельные   CSS/JS часы; для воспроизведения   нужна фазовая
машина, а не один toggle display.

Кнопка «+» и «×» - две CSS-фигуры из полос 3px внутри perspective 700px: одна уходит flip вверх, вторая приходит на её
место. Mobile: размер контейнера 24px вместо 32px. Адаптация: семантическая button с label/expanded, Escape, focus trap,
inert фон и возврат focus; в исходнике это не подтверждено полной проверкой.
```

### Страница 7

```text
Фотогалерея                  desktop:            устойчивые                  якоря

Viewer категории: title сверху, большое фото в центре, scroll-rail слева, INFO / INDEX / BACK снизу.
 Элемент                         Позиционирование источника

 Большое фото                    fixed viewport frame: x центр W/2, top 64px; width W - 352px; height H - 128px

 Размер img                      k = min(frameWidth/naturalWidth, frameHeight/naturalHeight); width/height auto;
                                 никаких растягиваний и cover

 Rail                            обычная вертикальная flex-лента слева с outer padding 16px; thumb width 80px;
                                 gap 16px

 Первая / последняя миниатюра    верх/низ padding = H/2 - высота соответствующего thumb/2, чтобы первый и
                                 последний кадр могли попасть точно в центр

 Title / controls                title top 16px; controls bottom 16px; line-height 32px; фиксированы; у категории
                                 верхний «+» отключён

Scroll. Двигается rail, большая фотография остаётся на месте. Когда другая миниатюра становится

ближе к вертикальному  центру, активное фото меняется. Переход  между  самими  focus-items в
источнике задан переключением   opacity 0/1 без CSS transition: не добавлять незаявленную длинную
crossfade.

Перемещение мыши и hover крупного фото не определяют activeId. Click миниатюры центрирует её через scrollBy({behavior:
smooth}); поэтому ближайший кадр определяется тем же алгоритмом. Во время начального входа rail появляется из x = -(80
+ 32)px; 790ms + distance-to-active ×30ms. Frame focus входит с дополнительной задержкой 490ms.
```

### Страница 8

```text
Выбор           кадра         и   выпуклость                 rail

Алгоритм  источника.  Для каждого thumb  используется невидимая  rail-позиция из pseudo-слоя. На
desktop считаются y-центры, на mobile - x-центры. Выбирается минимальное  расстояние  до центра
соответствующей  оси, а не intersecting percentage и не wheel-count.

axis = desktop ? Y : X
center = desktop ? H / 2 : W / 2
d[i] = abs(pseudoCenter[i] - center)
active = argmin(d[i])

R = desktop ? 280 : 220 // CSS px
A = desktop ? 64 : 24
u[i] = A * max(0, 1 - d[i] / R)^2
shift[i] += (u[i] - shift[i]) * 0.08
desktop: translateX(+shift[i])
mobile: translateY(-shift[i])

// During index reflow, freeze active selection.
// When transitions finish, resume nearest-centre sampling.

 Расстояние d                        Desktop target shift             Mobile target shift

 0px, точно в центре                 64px вправо                      24px вверх

 R/2                                 16px вправо                      6px вверх

 ≥ R                                 0px                              0px

Depth. Эта выпуклость ленты  делает центральный  thumb  «ближе»  к основному фото. У неё нет
увеличения размера  или perspective: глубина создаётся горизонтальным/вертикальным   смещением.   В
большом  фото нет parallax внутри пикселей.

Требование.  Для 60Hz  сохранить характер сглаживания  0.08; для другого refresh rate alpha = 1 -
pow(0.92, dt/16.667). Одни geometry-id должны синхронизировать rail, focus-image и index. Считать
геометрию  после загрузки размеров, resize и смены коллекции, а не делать layout-read/write для
каждого thumb в нескольких независимых  RAF.

Псевдослой источника visibility:hidden, opacity:0 и pointer-events:none, но сохраняет размеры. Его роль - стабильная
геометрия, пока реальные миниатюры мигрируют в INDEX. Он не является blur-copy фона. В целевом проекте допустим
cache координат вместо дублирования изображений.
```

### Страница 9

```text
INDEX:          лента        разворачивается                         в  сетку

Завершённый INDEX Travel: пять столбцов в данном desktop viewport, изображения разной высоты выравниваются по
центру flex-ряда. Большое фото скрыто.
I0. Из viewer click INDEX. Если INFO открыт, сначала закрыть его. Зафиксировать текущий activeId. I1.
Измерить реальные   rail-rects и скрытую target-grid. Реальные thumbs временно position:fixed; для
left/top вычесть уже применённый translate из DOMMatrix, чтобы не получить двойное смещение.

I2. Через 20ms стартовать переход из rail в grid-rects. Thumb-width 80 → 176px; transition 790ms
cubic-bezier(.77,0,.175,1). Delay = |i - activeIndex| ×15ms: волна распространяется от выбранного кадра.
Одновременно   focus fade-out 790ms, background blur 0 →12px за 490ms.

I3. Через 800 + 15 × min(maxDistance,40)ms убрать временные  fixed-координаты. INDEX становится
обычным  flex-wrap, justify/align center, gap 96px, padding-top/bottom 64px. Число колонок вычисляется из
доступной ширины,  не фиксируется  равным  пяти. Весь INDEX прокручивается  вертикально; title и
controls остаются fixed.

Ключ эффекта - непрерывность тех же миниатюр в двух layout, а не скрыть sidebar и внезапно показать отдельный grid.
Animated clipping/masking не требуется. На слабом устройстве допустимо заменить width/left/top reflow на FLIP transform по
измеренным rects, сохранив конечные размеры и stagger.
```

### Страница 10

```text
INDEX:          сборка          назад         и   выбранное                 фото

После click третьего изображения в INDEX: оно стало главным, лента вернулась слева, его миниатюра центрирована и
выдвинута вправо.
I3 → I4. Click grid-thumb фиксирует selectedId, замораживает текущие rects и выключает общий scroll
lag (source js-phat--disable). Высота галереи возвращается к rail-режиму. Через 40ms scroll-offset
сдвигается так, чтобы выбранный  pseudo-thumb  оказался в центре оси.

I4 → I5. Через 80ms target left/top берутся из rail-pseudo. Все thumbs переходят к ширине 80px desktop /
высоте 64px mobile, 790ms и тот же distance-stagger 15ms. Focus-frame получает delay 290ms. Через
850 +15 ×min(maxDistance,40)ms  очищаются  временные  стили  и классы; nearest-centre sampling
продолжается.

enterIndex():
 save(activeId, railScroll)
 first = measureRealThumbs()
 last  = measureIndexLayout()
 freezeActive(); animateRects(first, last, 790ms, stagger)
 settleInGrid()
selectFromIndex(id):
 first = measureGridThumbs()
 setRailScrollToCenter(id)
 last = measureRailLayout()
 animateRects(first, last, 790ms, staggerFrom(id))
 showFocus(id, delay=290ms); settleInRail()

Back / INDEX без выбора. В оригинале эти действия из открытого INDEX вызывают click первой миниатюры, собирая viewer
к первому кадру; URL при этом не меняется. Сохранить исходное поведение сайта пользователя, если оно уже другое. При
новой реализации рекомендуемый контракт - возвращать сохранённый activeId; отметить это как сознательное отличие от
референса.
```

### Страница 11

```text
INFO:        текст       занимает              место         фотографии

INFO Travel: главное фото скрыто; текст занимает центральную область. Rail остаётся видимым и интерактивным.
F0 → F1. Click INFO: если INDEX открыт, сначала собрать viewer. Focus-frame opacity →0 за 790ms.
Overlay галереи backdrop-blur 0 →12px за 490ms, затем при open blur снова →0. Через 500ms JS
переводит opening в open; текст получает opacity/pointer-events и приходит построчным flip.

Геометрия  desktop. Info-frame fixed; top 64px; height H -128px; width W -504px; центр по X;
overflow-y:auto. Font-size clamp(21px,3.4vw,44px), line-height 1.15. Каждая визуальная строка имеет
perspective 1000px; текст входит translateY(50%) rotateX(-40deg) →none, opacity 0 →1, 790ms и delay
lineIndex ×15ms.

F1 → F2 →  F0. Повторный  INFO или первый  BACK  закрывает  panel, а не покидает страницу. При
закрытии строки уходят translateY(-50%) rotateX(40deg), без stagger; фон кратко blur после delay 200ms.
Через 500ms  panel-классы очищаются,  focus снова видим. Click миниатюры также закрывает  INFO,

затем центрирует выбранный   кадр.
Требование. INFO не самостоятельная новая страница. Сохранить activeId и railScroll. Текст не должен зависеть от картинки
или блокировать mini-navigation. Для длинного текста использовать внутренний scroll и предсказуемый focus. При resize
разбивать на текущие визуальные строки, не по исходным переносам; source пересчитывает через debounce 250ms.
```

### Страница 12

```text
Viewer         и   INDEX:          mobile-композиция

390 × 844: слева viewer Commissioned с нижней горизонтальной лентой; справа INDEX с обычной вертикальной сеткой.

 Viewer ≤768px                                      INDEX ≤768px

 Большой frame: left 16px; top 96px; width W -32px; height Thumb height 80px, width по aspect ratio; flex-wrap; gap
 H -224px. Фото contain                             32px; верхний padding 96px, нижний 24px

 Rail fixed bottom 12px; thumb height 64px; gap 12px; Rail превращается в relative grid. Удалить viewer virtual
 отступы позволяют первый/последний thumb           height и горизонтальный left-offset
 центрировать по X

 Коллекция сверху; INFO/INDEX/BACK в верхней полосе Title и controls остаются сверху. При возврате grid
 y≈48px; выбор thumb приподнимает его до 24px       собирается в нижнюю rail, выбранный кадр в центр

На mobile подпись идёт вдоль правого края фото, right -14px, размер 11px. Для target-сайта обеспечить отсутствие
пересечения с viewport edge и достаточную читаемость; не копировать обрезание текста ради буквального сходства.
```

### Страница 13

```text
Touch,         wheel,         keyboard             и   виртуальный                    scroll

Факт из JS. Mobile-rail не является обычным overflow-x: auto. Вертикальный scrollY используется как
координата горизонтального  движения: railLeft = -smoothedScroll. Общая высота = H + max(0,
railScrollWidth - W). Это даёт естественную длину виртуального пути от первого до последнего кадра.

mobile viewer:
 horizontal swipe recognized after abs(dx)>5px
 if abs(dx)>abs(dy): lock gesture to X
 scrollByY(-dx); velocity = -dx
 rail.left = -smoothedScrollY

touchend:
 while abs(velocity)>=0.5:
   scrollByY(velocity)
   velocity *= 0.95  // reference, per RAF frame
wheel in viewer:
 if abs(deltaX)>abs(deltaY):
   preventDefault(); scrollByY(deltaX)

thumbnail click:
 desktop target = thumbCY - H/2
 mobile target = thumbCX + smoothedY - W/2 - scrollY

Vertical swipe в INDEX ведёт по grid; source в этом состоянии также преобразует жест в scrollByY. В
обычном  viewer vertical-scroll также меняет выбранный кадр. Touch-нажатие thumb открывает его без
hover. Cursor move не меняет ни активный thumb, ни крупное фото. ArrowDown  / ArrowUp в JS
вызывают  click соседнего thumb.

Требование  адаптации.  Использовать  один  контроллер жеста: отменять  инерцию  новым touchstart;
не перехватывать  pinch, несколько пальцев, browser back gesture или scroll INFO/menu.
dt-нормализовать friction = pow(0.95,dt/16.667). Инициализировать keyboard handler один раз и очищать
его на route change. В проверке ArrowDown менял кадр, но строгий «одна клавиша  = один шаг» требует
отдельной приёмки: source при повторных  навигациях  заново регистрирует keydown.

Touch-поведение установлено чтением исходника и responsive-проверкой. Нативные жесты на физическом телефоне не
выполнялись; это обязательная проверка после реализации.
```

### Страница 14

```text
Mobile:         панели           и   scroll-контекст

INFO и глобальное menu при 390 × 844. Длинный текст не превращается в hover-подсказку; он остаётся отдельным
доступным состоянием.
INFO mobile. Top 136px, frame-width W -32px, frame-height H -240px; font минимум 21px. Верхние
controls и нижний rail сохраняются. Если содержимое длиннее frame, прокручивается текстовая
область; не изменять activeId из-за этой прокрутки.

Menu  mobile. Horizontal padding 16px; общий inner flex распределяет верхнюю навигацию, about и
контакты. Scroll страницы за menu блокирован, menu имеет  overflow-y:auto и

overscroll-behavior-y:contain. About max-height: 100svh -240px; при fully open получает свой
overflow-y:auto.
Требование. Вся важная навигация работает первым tap; кнопкам дать области минимум 44 ×44 CSS px без изменения
видимого размера полос. Проверить iOS dynamic toolbar/safe-area, portrait/landscape, клавиатуру, narrow text и длинное
описание. Использовать svh/dvh последовательно, не смешивать разные H в одной геометрии.
```

### Страница 15

```text
Коллекции:                различия              без     новых           движков

People и Personal Projects: тот же viewer; различаются доступные controls и наличие подписи.

Travel и Commissioned: портрет/landscape занимают разную область frame, сохраняя contain и вертикальные подписи.

 Набор при исследовании                   Controls / данные

 FOCUS  - 136 фото                        BACK + глобальное меню. Опциональные caption; rel выбирает
                                          стартовый кадр

 Travel - 82; People - 99                 INFO / INDEX / BACK; описание коллекции

 Personal - 98; Commissioned -95          INDEX / BACK; описание через caption отдельных фото

Числа - снимок текущего содержимого, не фиксированные требования. Для title длиннее viewport адаптировать font/перенос,
не скрывать Back. Caption: desktop right -20px, writing-mode:vertical-rl + rotate(180deg), Arial normal 13-15px, центр по высоте
изображения.
```

### Страница 16

```text
GRID:        точная           геометрия

Начало GRID. Второе изображение сдвинуто вниз на 32vw относительно первой позиции. Изображение выходит за
логический слот.
Факт. Сетка - flex-wrap, не masonry. W = ширина viewport в CSS px. Контейнер шириной 88vw;
вертикальные  margin по 12vw. Две колонки: слот 32vw высотой и (32vw - 1px) шириной.
Горизонтальный  gap = 24vw, вертикальный  gap = 32vw.

 Параметр                  Правило desktop                                  При W = 1534

 Контейнер / слот          88vw / 32vw                                      1349.9 / 490.9 px

 Центры колонок            около 22vw и 78vw                                около 337.5 и 1196.5 px

 Сдвиг чётного слота       translateY(50% + 16vw) = 32vw                    490.9 px

 Шаг рядов одной колонки   32vw слот + 32vw gap = 64vw                      981.8 px

 Фото                      contain; max-width и max-height: 48vw            максимум 736.3 px по
                                                                            каждой оси

Требование.  Фото центрировать  внутри слота абсолютной   обёрткой. Размер считать по исходному
aspect ratio: k = min(0.48W / naturalWidth, 0.48W / naturalHeight). Для портрета 3:4 результат 36vw ×
48vw. Не обрезать фото  под квадрат слота. Для последнего чётного элемента  добавить
padding-bottom: 32vw, чтобы смещённое  фото не потерялось.
```

### Страница 17

```text
GRID:        hover        названия              по     состояниям

Курсор на первом фото: VOYAGE, VOYAGE занимает центр viewport. Название рисуется поверх изображений и не
перехватывает указатель.
 Состояние                   Transform текста                                   Opacity / blur

 G0. До наведения            translateY(50%) rotateX(-90deg)                    0 / 12px

 G1. Pointer enter           переход к translateY(0) rotateX(0deg)              к 1 / 0px

 G2. Hover удержан           неподвижно, центр viewport                         1 / 0px

 G3. Pointer leave           translateY(-50%) rotateX(90deg)                    к 0 / 12px

Факт. Perspective = 1000px на обёртке названия; transform-origin: center center; transform-style:
preserve-3d; backface-visibility: hidden. Вход и выход заданы по 790 мс с cubic-bezier(.77, 0, .175, 1). Это
flip вокруг горизонтальной оси вместе с вертикальным смещением,  а не только fade.

Требование.  Слой  названий fixed: left/top 50%, translate(-50%, -50%). Каждое название занимает 90vw
и выравнивается  по центру. pointer-events: none; явно выше фото. Hover не меняет масштаб карточки.
При смене карточки старое  название уходит вверх, новое приходит снизу; независимые  переходы
могут кратко пересекаться.
```

### Страница 18

```text
LIST:       выбор           меняет          сторону            превью

Первый пункт: превью слева; underline у активного текста. Превью центрировано по вертикали экрана.

Второй пункт: превью справа. Смена горизонтальной позиции курсора внутри PEOPLE не перемещает фото.

Ключевой момент. Сторона задаётся порядком проекта: позиции 1, 3, 5... - слева; 2, 4, 6... - справа. Это не проверка, в
какой половине экрана находится курсор. Фото находится под текстом по stacking order; пересечение допустимо.
```

### Страница 19

```text
LIST:       координаты                  и   поведение

Факт. Список - flex-column, align-items/justify-content: center, min-height: 100svh. Вертикальный padding -
64px desktop, 48px mobile. Каждая строка имеет border-bottom: 3px solid transparent; desktop hover
меняет только цвет границы. Резервирование   границы предотвращает   layout shift.

 Элемент                   Точное правило / измерение

 Типографика референса     Neue Rational Narrow Bold, weight 800, uppercase; letter-spacing: .02em; font-size:
                           clamp(36px, 5.5vw, 82px); line-height: 1.1

 Список при 1534 × 889     центр (767, 444.5); 4 строки примерно по 93.2 px вместе с границей; верх блока
                           примерно y = 258.1

 Слот превью               fixed-слой на весь экран; внутри absolute 24vw × 24vw, top: 50%, translateY(-50%)

 Горизонтальная привязка   нечётный: left 96px; чётный: right 96px. Это позиция слота, не края изображения

 Размер фото               contain; max-width/max-height: 33.6vw; центр внутри слота. Для 3:4 при W = 1534:
                           примерно 386.6 × 515.4 px

 Края фото 3:4             примерно x = 86.8 слева / x = 1060.6 справа; y = 186.8 при H = 889

 Слой превью               pointer-events: none; под текстовыми ссылками; без cursor-follow

L0 → L1. Pointer enter в ссылку выбирает project.id, underline включается сразу; превью opacity 0 → 1 и
blur 12px → 0 за 490 мс, easing ease. Фото не масштабируется и не перемещается  из точки курсора.

L1 → L2. Движение  внутри той же ссылки не создаёт анимаций.  При переходе  в соседнюю  ссылку
старое фото скрывается, новое  появляется. При выходе  в пустое место opacity 1 → 0, blur 0 → 12px за
те же 490 мс. В проверенном desktop LIST scrollY оставался 0: его высота равнялась viewport.

Использовать локально доступный шрифт сайта с близкими пропорциями. Не скачивать фирменный шрифт референса в
продукт без права использования. Если строки получаются шире, корректировать гарнитуру/fit, а не добавлять text scale на
hover.
```

### Страница 20

```text
Timing,         easing          и   переход            режимов

 Механика                                    Длительность      Easing / задержка

 GRID: вход/выход названия                   790 мс            cubic-bezier(.77, 0, .175, 1)

 LIST: фото входит/выходит                   490 мс            ease = cubic-bezier(.25, .1, .25, 1)

 LIST: начальный flip строк                  790 мс            та же кривая, stagger 30 мс: 0 / 30 / 60 / 90

 Нижний переключатель                        490 мс            flip до -40deg + blur/fade; второй пункт +30
                                                               мс

 Переход страницы/режима                     blur veil: 490 мс cubic-bezier(.5, 0, .5, 1)

       Прогресс CSS-перехода: cubic-bezier(.77, 0, .175, 1)

       0                                                                                   790 мс

Факт. GRID и LIST имеют  разные адреса  /work/ и /work-list/. Общий скрипт перехватывает внутренние
ссылки, добавляет класс перехода  и показывает светлый  blur-overlay. Через 700 мс заменяется

контент; ещё через 150 мс сбрасывается  scroll и запускается вход новой сцены. Для начального
состояния код использует дополнительный   loaded delay 300 мс и finished delay 1100 мс. Это параметры
источника, не гарантированное время  загрузки сети.

Требование.  Воссоздать  визуальную  последовательность:  старая сцена размывается  и растворяется
→ переключается  layout → новая сцена  становится чёткой; в LIST строки входят с stagger. Не делать
морфинг  координат картинок GRID  в позиции LIST: такой FLIP-переход в исследованной  сцене не
подтверждён.

Адаптация. Привязать смену режима к существующему routing/state сайта. Для уже готового локального layout смена
допустима в тот же цикл без искусственной сетевой задержки. Сохранять намерение пользователя при быстрых повторных
переключениях. Не блокировать навигацию ради декоративной анимации.
```

### Страница 21

```text
Desktop           /  mobile         / touch

Снимки 7 и 8. Chrome с viewport 390 × 844 CSS px: GRID слева, LIST справа. Это responsive-проверка, не физическое
touch-устройство.

 ≤ 768px: факт                                      Требование воспроизведения

 GRID: slot 36vw - 1px × 32vw; gap 16vw; margin 24vw Сохранить две колонки и сдвиг 32vw. Фото по-прежнему
                                                    contain, max 48vw; нечётное выровнять по правому краю
                                                    слота, чётное - по левому

 Центральные названия GRID скрыты; фото-превью LIST Не эмулировать hover первым tap. Tap по видимой
 скрыты                                             ссылке сразу открывает её destination

 #phatscroll становится relative                    Обычный  вертикальный scroll. Очистить desktop
                                                    offset/transform и искусственную высоту при resize

Touch. Нативный свайп не должен выбирать проект или требовать hover. Для coarse pointer на широком планшете также
отключать hover-зависимые слои (адаптация через hover/pointer media queries). Действие доступно по ссылке с первого tap.
Multi-touch/pinch не перехватывать. Проверка реального touch остаётся пунктом приёмки.
```

### Страница 22

```text
Общие           переходы,               загрузка            и   Back

Routing. Внутренние a[href] на том же origin перехватываются общим JS: HTML  будущей  страницы
загружается в cache, заменяется .c-body, обновляются title/meta/body classes и History API. Это
собственный  AJAX-router поверх WordPress, не подтверждённый   React/Vue/Three.js. Target-сайту

переносить поведение  через его существующий   router.

 Фаза источника               Параметры

 Первичная загрузка           has-loaded после readyState complete и минимума 300ms; has-finished через
                              +1000ms. Fallback: через 5000ms форсировать loaded, ещё +800ms finished

 Внутренний переход           veil blur 12px / светлая заливка 0→100%: 490ms, cubic-bezier(.5,0,.5,1); контент
                              заменяется через 700ms; scroll/state сбрасываются ещё через 150ms

 Back в panel                 INFO → закрыть INFO. INDEX → собрать viewer. Только следующий Back в viewer
                              покидает галерею

 Back в route                 вернуться к fromUrl и восстановить scroll. При /focus/?rel=N стартовый thumb
                              центрируется после init через 100ms. URL rel не обязан обновляться при каждом
                              scroll

Уточнение  общего  smooth-scroll. Полное  чтение JS показало два RAF-loop, меняющих   один
scrollStartY: PhatFlip использует lerp 0.08, PhatAction - 0.03. При одном вызове каждого в кадр
совокупный коэффициент   = 1 -0.92×0.97 =0.1076. Поэтому 0.03 из отдельной функции не
характеризует всю фактическую  инерцию.  Для воспроизведения   использовать один clock с alpha(dt) =1
-pow(0.8924,dt/16.667), затем уточнить по живому сравнению. Это расчёт исходника, не FPS-замер.

Требование. Сохранить continuity и контекст без искусственных сетевых задержек. Если ресурсы готовы, запускать motion
сразу; ошибку загрузки обрабатывать отдельно, не показывать пустую белую сцену. Rapid navigation имеет last-intent token,
stale fetch не может заменить новую страницу. Modifiers, new-tab, external links и browser History работают штатно.
```

### Страница 23

```text
Слои,        clipping          и   реализация

 Сцена                     Порядок и тип маскирования

 OVERVIEW                  Paper → fixed brand → фото с z-order → header → menu. Фото перекрывают имя. Поле
                           grid overflow:hidden, края viewport отрезают часть фото

 WORK  GRID                Фото → fixed hover-title → footer/header. Внутри slot overflow:visible; сцена
                           ограничивает выход за страницу

 WORK  LIST                Fixed preview под текстом → ссылки → footer/header. Пересечение фото/текста
                           допускается; preview pointer-events:none
 Gallery viewer            Focus-frame z9 → transient blur overlay z10 → rail/title/controls z11 → INFO при open z12

 INDEX                     Real thumbs перемещаются между measured rects. Hidden pseudo-layers нужны только
                           для geometry, не участвуют в hit-testing

 Global menu               Завеса z995 → menu z998 → доступный opener. height:0/100% + overflow:hidden
                           управляет жизненным циклом слоя

Маски. Для исследованных   эффектов  не нужны  clip-path reveal, SVG-mask, Canvas clipping или
fragment shaders. Crop определяется границей поля, viewport и panel overflow. Blur выполняется CSS
filter/backdrop-filter; flip - CSS transform с perspective и backface-visibility. Слоты фотографий не обрезать
под квадрат.

Стек. Подтверждены  HTML/DOM,    CSS и vanilla JS; canvas в исследованных сценах не обнаружен. Для
воспроизведения  достаточно компонентов  текущего  framework, CSS transitions и одного RAF-controller.
GSAP  Flip можно использовать, если он уже в проекте и упрощает INDEX;  он не является условием
совпадения. Canvas/WebGL/Three.js  здесь добавляют  стоимость  без необходимой  функции.

Ключевое: measured layout continuity, shared photo-id, fixed anchors, nearest-centre rail, stagger и типографический flip.
Декоративное: конкретные фотографии, имя автора, бумажный цвет, точная форма «+», copyright/social copy. Голубой halo
указателя на отдельных снимках не задан как эффект сайта; пользовательский cursor-trail в прочитанном JS не найден.
```

### Страница 24

```text
ТЗ    на     интеграцию                 и   приёмку

Работа Codex.  Исследовать  существующий   проект пользователя  и встроить эффекты  в его routing,
scroll и design tokens. Сохранять данные, API, архитектуру и работающие сценарии. Реализовать
OverviewController, ProjectsEffect и GalleryController с panel-state и одним animation clock; не создавать

несвязанные  копии одной коллекции.
SiteMotion
 clock: smoothedScroll, dt, reducedMotion
 route: url, returnContext, requestToken
 overlay: closed|menuOpening|menu|menuClosing

GalleryController
 mode: viewer|indexPreparing|indexOpening|index|returning|info
 photoIds[], activeId, savedActiveId, scrollContext
 geometryCache: railRects, indexRects, imageSizes
Cleanup: listeners, RAF, observers, pending timers/fetch.
Reduced motion: final layouts + same links, no flip/blur/lag.

 Приёмка                  Проверить в работающем сайте

 OVERVIEW                 Стопка → разлёт → имя; корректный z-order; scroll и clip; фото открывает правильный
                          rel; repeat/recycle не меняет id и не растит DOM бесконтрольно

 Viewer / INDEX / INFO    Scroll выбирает ближайший кадр, выпуклость rail по формуле. Index open/select/close
                          сохраняют identity. Back сначала закрывает panel. INFO доступен только при наличии
                          текста
 Desktop / mobile         1534×889, 390×844, 768/769, portrait/landscape; resize после scroll. Mobile rail, index grid,
                          menu/info не имеют stale offset или перекрытых controls

 Ввод и состояния         Pointer enter/move/leave, 10 быстрых hover; touch swipe/tap/pinch; одна arrow = один
                          кадр; Tab/Enter/Escape и возврат focus; loading/image-error/empty/long-title;
                          reduced-motion

 Доказательства           Скриншоты  всех перечисленных сцен; запись intro и INDEX; FPS/frame-time на целевых
                          устройствах, без заявления «60fps» только по успешному build

Tatarin Standard: scoped changes, readable hierarchy, accessibility, отсутствие новых несвязанных функций; подпись
локальным официальным SVG в подходящей нижней области, не поверх rail/controls, минимум 180px desktop /145px mobile.
Проверить темы только если они уже предусмотрены.
```

### Страница 25

```text
Источники,               проверка              и   ограничения

Посещены   в Chrome  пользователя:   OVERVIEW,   WORK   GRID/LIST, FOCUS   с rel, Travel, People,
Personal Projects, Commissioned. В browser проверены вступление главной последовательными
кадрами, scroll/hover главной, выбор фото, scroll viewer, INFO open/Back, INDEX open/select, подписи,

mobile overview/menu/viewer/index/info и ранее mobile WORK. Вкладка возвращена  на исходный /work/,
временный  viewport снят.

Исходники.  Публичные  main.css и script.js v1.1.0 прочитаны для точных состояний, размеров, фаз и
easing. Изображения в PDF  - реальный browser-capture; mobile снимки сняты с viewport 390×844 и clip
этой области. Анимационный   кадр не является FPS-замером.  Полное  содержание
фотографии-каталога  не переписывалось;  исследованы   все собственные шаблоны   и различия
controls.

Не проверено:  физические  touch-жесты, Safari/iOS, слабые устройства, многократный конец
infinite-feed, полный keyboard/accessibility audit оригинала, loading/error/reduced-motion оригинального
сайта и проект пользователя. Touch и infinite-контракты установлены чтением JS; их run-check входит в
приёмку реализации.  Не выдавать  эти ограничения за реализованный  или протестированный
результат.

Поправка  к узкому разбору.  Этот документ заменяет  его как полный технический источник: галерея и
INDEX включены   в объём; общий  scroll lag уточнён с учётом двух RAF-loop. При адаптации не
переносить риски источника - старые cleanup-timers, повторные keydown-listeners и неограниченное

клонирование  DOM.
Первичные      ссылки

OVERVIEW

WORK GRID
WORK LIST
FOCUS

Travel
People

Personal Projects
Commissioned

CSS v1.1.0
JS v1.1.0
Tatarin: UI_GUIDELINES

Tatarin: UI_PATTERNS / CHECKLIST / SPECIFICATION / USAGE
Результат: точное ТЗ для переноса системы эффектов на сайт пользователя. Фотографии и фирменная идентичность
Gregor Collienne использованы только как аналитические иллюстрации. Публикация и реализация не выполнялись.
```

## Ссылки исходного PDF

1. Страница 25: <https://gregorcollienne.com/>
2. Страница 25: <https://gregorcollienne.com/work/>
3. Страница 25: <https://gregorcollienne.com/work-list/>
4. Страница 25: <https://gregorcollienne.com/focus/?rel=2>
5. Страница 25: <https://gregorcollienne.com/work/travel/>
6. Страница 25: <https://gregorcollienne.com/work/portraits/>
7. Страница 25: <https://gregorcollienne.com/work/wasserwarts/>
8. Страница 25: <https://gregorcollienne.com/work/corporate-b2b/>
9. Страница 25: <https://gregorcollienne.com/wp-content/themes/fstheme/assets/css/main.css?ver=1.1.0>
10. Страница 25: <https://gregorcollienne.com/wp-content/themes/fstheme/assets/js/script.js?ver=1.1.0>
11. Страница 25: <https://github.com/garifulinandrej183-lang/tatarin-branding/blob/main/docs/UI_GUIDELINES.md>
12. Страница 25: <https://github.com/garifulinandrej183-lang/tatarin-branding/tree/main/docs>
