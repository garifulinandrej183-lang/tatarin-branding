# Проверки архива и применений

Дата: 5 октября 2026. Runtime: Node 24.19.0. Прогоны в исходных checkout перед копированием; после копирования проверки переносимых частей повторены. Это проверки логики/структуры; новый браузерный GPU-прогон, физический телефон и измерение FPS не выполнялись.

| Эффект | Выполнено | Результат |
| --- | --- | --- |
| Alphabet, TS snapshot | node scripts/check-motion.mjs | 500 layouts, 10 010 accepted drags, 490 safely rejected; 6 gesture cases, passed |
| Alphabet, portable JS | node tests/motion-engine.test.mjs | 3 passed: layout/drag, gesture cancel/multitouch, signature timing/cooldown |
| Fluid, portable JS | node tests/fluid-controller.test.mjs; node tests/portrait-scene.test.mjs | 31 + 3 passed: lifecycle, startup, touch, reduced motion, no-WebGL, context recovery, mapping/atlas |
| Bloom / Podium | node scripts/check-motion.cjs | Все заданные симулированные 320–1440 widths, 60/120/144 Hz, reverse scroll, permanent mask, pause, reduced motion passed |
| Bloom wordmark | node scripts/check-wordmark.cjs | typing/deletion, 20 s repeat, mobile detach/rejoin, pause/visibility/resize passed |
| Bloom menu | node scripts/check-menu.cjs | repeated open, Escape, inside/backdrop click, links, focus return, scroll unlock, pagehide/reduced motion passed |
| Quartr portrait | JavaScript syntax + source provenance | Snapshot сохранён; новый функциональный/визуальный прогон не выполнен |
| Pacôme spiral | JavaScript syntax + source provenance | Snapshot сохранён; новый GPU/touch прогон не выполнен |
| Belen Jones | Полный отчёт и prompt | analysis-only; собственного применения и его тестов нет |
| Topology | Импорт 26 страниц PDF, просмотр rendered pages, текст/колонки, hyperlinks и SHA-256 | analysis-only; новый live/GPU/touch-прогон и собственное применение отсутствуют |
| Shopify Winter ’26 | Импорт 19 страниц PDF, просмотр rendered pages, текст/колонки, hyperlinks и SHA-256 | analysis-only; cookies исходного отчёта подтверждены по коду, live-клик отсутствует; новый прогон не выполнялся |
| Gregor Collienne | Импорт 25 страниц PDF, просмотр rendered pages, текст/колонки, hyperlinks и SHA-256 | analysis-only; полный Overview/WORK/viewer/INDEX/INFO; новый live/touch-прогон отсутствует |

Числа Hz в симуляции — частота вычислительных ticks, не измеренный FPS браузера. Node тесты с mocked DOM не подтверждают browser compositing/native dialog focus на устройстве.

## Что хранится

Пять актуальных опубликованных source snapshots, девять текстовых разборов, исходные Codex prompts и самостоятельные ТЗ (для Hello Shivam и трёх новых PDF), карта зависимостей и происхождение файлов. Код копирован без изменений; SHA-256 и source commit в SOURCE_MANIFEST.json. Контент и DOM сохранены как контекст интеграции, новые проекты должны заменить их своими. Новые PDF не добавляют кода, поэтому SOURCE_MANIFEST.json не расширяется фиктивными implementation-источниками.

Оригинальные изображения/видео, 3rd-party vendor и полный starter не включены. HTML отчёты преобразованы в Markdown с таблицами и формулами; изображения исключены. PDF Quartr извлечён по страницам и имеет ограничение порядка колонок. Эти копии сохраняют технические сведения, но не исходную вёрстку отчётов.

Три новых PDF содержат 26 + 19 + 25 = 70 страниц. Все страницы отрендерены и просмотрены при импорте; текст сохранён с исходной нумерацией, формулами и колонками в моноширинных блоках. Повторяющиеся колонтитулы удалены, подписи рисунков сохранены, сами иллюстрации и диаграммы отсутствуют. Hyperlinks восстановлены из PDF-аннотаций; это provenance-ссылки, их текущая доступность при импорте не проверялась. Имена и SHA-256 исходных PDF находятся в отдельных provenance.json.

Проверка архива: девять уникальных ID; обязательные файлы каждой записи; JSON parsing и существование локальных ссылок; покрытие всех страниц новых отчётов; сохранность основного текста/формул после удаления колонтитулов; SHA-256 оригиналов; новые статусы `analysis-only` и null implementation fields; `git diff --check`. Эти проверки документации не доказывают работу будущих эффектов. Команды и заявления о прежних Chrome/JS/CSS-проверках внутри PDF не выполнялись заново. Физический телефон, measured FPS, loading/error/reduced-motion оригиналов и target-приложение не проверены.

## Что проверять при переносе

Desktop 1440×900, 1024×768; mobile 390×844, 360×800, короткий 320 px viewport; реальные жесты, reverse, cancel, resize/orientation, меню и ссылки; no-WebGL, reduced motion, background tab, pause. Зафиксировать устройства и ограничения. Визуальная приёмка — на target, а не по факту наличия архива.
