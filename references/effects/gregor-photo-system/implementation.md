# Применение: gregor-photo-system

- Сайт / версия / source commit: отсутствуют.
- Дата архивирования: 2026-10-05.
- Статус: **analysis-only**.

## Сохранённые материалы

Полный текст 25 страниц `gregorcollienne.pdf`, архивное задание для Codex, карта всей системы эффектов и hyperlinks. Это полный отчёт, включающий viewer/INDEX/INFO; он уточняет узкий GRID/LIST-разбор и общий scroll lag. Фотографии, фирменные assets, PDF-binary и JS/CSS источника не включены; SHA-256 и URLs в provenance.json.

Каталога `code/` и новой записи кода в SOURCE_MANIFEST.json нет: собственного применения и source commit пока нет.

## Предлагаемая интеграция, не выполненная реализация

| Контроллер | Контракт |
| --- | --- |
| SiteMotion | Один clock, dt-damping, reduced motion, overlay/route lifecycle |
| OverviewController | Central stack → slots, z-order, bounded repeat и стабильные photo-id |
| ProjectsEffect | GRID/LIST и text-flip/preview; не universal parallax |
| GalleryController | ActiveId, nearest-center rail, measured INDEX, INFO и scroll-context |
| Navigation | Действующий router/history, Back, last-intent token, return focus |

DOM/CSS: фотографии contain с natural sizes; fixed title/frame/controls; rail и measured index-grid; transient blur overlay. Геометрия/identity синхронизируются общим cache. CSS perspective применяется к тексту; фотографии не требуют 3D-сцены. При импорте библиотеки не устанавливались. Текущий framework/router целевого проекта сохраняется; GSAP Flip необязателен.

Ссылки на публичные main.css/script.js v1.1.0 — доказательства исходного отчёта, не лицензия на копирование. Фотографии/шрифт/имя и social destinations заменяются реальными разрешёнными материалами target.

## Исторические поправки и риски

- Общая инерция в source получалась от двух RAF (.08/.03), alpha60=.1076; рекомендуемая адаптация имеет один clock.
- Во время INDEX reflow selection sampling заморожен. Сохранённый photo-id, а не DOM-index копий, определяет кадр.
- Повторные route-init могли добавлять keydown-listeners; не копировать этот lifecycle.
- Infinite-feed повторяет текущий набор и может бесконтрольно наращивать DOM; для target необходим bounded recycle, если повторение выбрано.
- INDEX-close без выбора у источника возвращает первый кадр; рекомендуемый savedActiveId является отличием, а действующий контракт target имеет приоритет.
- WORK GRID↔LIST — page/blur transition, не rail↔INDEX morph.

## Проверено и не проверено

При импорте отрендерены и просмотрены все страницы PDF, сохранён текст 25 страниц и ссылки; coverage, SHA-256 и записи каталога проверяются на уровне архива. Новый эффект/проект не создавался.

PDF заявляет Chrome-проверку Overview/WORK/FOCUS/коллекций/панелей и responsive 390×844, плюс чтение публичных файлов. При импорте сайт/код повторно не проверялись. Физический touch, Safari/iOS, слабые устройства, многократный конец infinite-feed, FPS, полный accessibility audit и loading/error/reduced-motion оригинала не подтверждены.

После реализации добавить source commit, файлы/DOM-контракты, assets/licenses, реальные результаты input/INDEX/Back/cleanup/resize, screenshots и измерения. Пока требования codex-prompt.md являются будущей приёмкой, не проверенными сценариями собственного применения.
