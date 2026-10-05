# Каталог эффектов

Ищите по названию, механике или URL. Machine-readable индекс: [catalog.json](catalog.json).

| ID / папка | Эффект | Стек применения | Материалы |
| --- | --- | --- | --- |
| [helloshivam-fluid](effects/helloshivam-fluid/README.md) | Жидкость за курсором | WebGL, vanilla JS; velocity/dye buffers | Есть код применения |
| [quartr-portrait](effects/quartr-portrait/README.md) | Портретная мозаика и маска обработки | Canvas 2D в применении; обработанные текстуры | Есть код применения |
| [alphabet-symbols](effects/alphabet-symbols/README.md) | Поле символов и кольца | WebGL + Canvas 2D fallback, vanilla JS или TS/React | Есть код применения |
| [pacome-spiral](effects/pacome-spiral/README.md) | Пространственная спираль карточек | Three.js 0.180.0 + Canvas software fallback | Есть код применения |
| [podium-scroll](effects/podium-scroll/README.md) | Раскрытие маски и пролёт коллажа | DOM + SVG luminance mask; без WebGL в применении | Есть код применения |
| [belen-gallery](effects/belen-gallery/README.md) | Галерея с поворотом вокруг X | Three.js + GSAP; применение отсутствует | Только анализ |
| [topology-relief](effects/topology-relief/README.md) | Topology: многослойный рельеф, spectral edge и scroll-сценарий | По отчёту: Three.js/GSAP/Lenis/Theatre; собственное применение отсутствует | Полный анализ и ТЗ, 26 страниц PDF |
| [shopify-winter26](effects/shopify-winter26/README.md) | Shopify Winter ’26: consent-control, hero→rail, noise-reveal и Finance X | По отчёту: React/Three.js/Theatre/Lenis + DOM consent; собственное применение отсутствует | Полный анализ и ТЗ, 19 страниц PDF |
| [gregor-photo-system](effects/gregor-photo-system/README.md) | Gregor Collienne: Overview, GRID/LIST, viewer/rail, INDEX/INFO | По отчёту: DOM/CSS/vanilla JS; собственное применение отсутствует | Полный анализ и ТЗ, 25 страниц PDF |

Сходные слова не означают одинаковый эффект: маска портрета, отверстие Podium и кольца Alphabet решают разные задачи. Выбирать по последовательности состояний и способу ввода, а не только по тегу mask.

[Повторно используемые меню и надписи](patterns/README.md) · [Порядок переноса](CODEX_GUIDE.md) · [Проверки](VALIDATION.md)

В архиве девять референсов: исходные шесть и три полных отчёта из пользовательских PDF, добавленных 5 октября 2026. Это не экспорт всей переписки: данные взяты из полных сохранённых отчётов, промптов и актуальных исходников собственных макетов. Изображения референсов и бинарные оригиналы PDF/DOCX не включены; их текст сохранён в analysis.md, названия и контрольные суммы — в provenance.json. Для новых PDF сохранены все 70 страниц текста, формулы, колонки таблиц и hyperlinks; исходная вёрстка и рисунки не воспроизводятся.

Новые записи имеют статус `analysis-only`: исторические наблюдения/сверка кода относятся к исходным PDF. При импорте сайты, physical touch, GPU/FPS и consent повторно не проверялись. Команды внутри документов — архивное ТЗ, а не поручение выполнить его при добавлении или выборе референса.
