# Применение: avara-selector

- Дата исследования/архивирования: 2026-10-05.
- Статус: **analysis-only**.
- Собственный сайт, source commit, version, каталог code/: отсутствуют.
- SOURCE_MANIFEST.json не расширяется фиктивной реализацией.

## Что сохранено

Полный текст 19 страниц исследования, PDF/TXT «Инструкция для Codex», 17 реальных JPEG-снимков вкладки, самостоятельное адаптированное задание и provenance с SHA-256 каждого сохранённого артефакта. PDF и TXT скопированы без изменения; в Markdown явно исправлена ошибка псевдокода pointerup (сохранение item-id до очистки pointer и проверка pointerId).

## Подтверждённый стек и гипотезы

DOM с прозрачными PNG, вложенными transforms и CSS Modules; Next.js определяется по `__next`/путям chunks. SVG логотипа имеет Lottie-признаки, clipPath и alpha masks. Canvas/video в сцене не обнаружены. Motion/Framer вероятен по drag/presence и inline transforms; Radix context-menu вероятен по DOM-атрибутам. Package.json, исходный репозиторий и source maps Avara не исследованы. GSAP/Three.js/WebGL не подтверждены и не нужны предлагаемой 2D-адаптации.

## Предлагаемая интеграция, не готовый код

| Контроллер/слой | Контракт |
| --- | --- |
| SelectorState | selectedId, overview/detail, last-intent, return focus |
| SceneLayout | desktop row → selected carousel; mobile2×2 → selected hero |
| ItemMotion | anchor → layoutScale → drag/hover → bob; раздельная запись transforms |
| Gesture | pointer capture, threshold, cancel, snap, click suppression |
| DetailOverlay | нативный отдельный scroll, desktop right card/mobile spacer+sheet |
| Lifecycle | один clock, cleanup, hidden-tab pause, resize, reduced motion |

Использовать текущий framework/router/data model целевого проекта. CSS/WAAPI и один RAF достаточны; существующие Motion/GSAP можно переиспользовать. Устанавливать новые зависимости при архивировании не требовалось. Целевые изображения/шрифты/иконки берутся из разрешённых материалов проекта. Публикация каталогизации не создаёт новый сайт и не переносит business logic.

### Ключ и декор

Ключ: пространственная непрерывность overview→detail, корректный drag с возвратом, циклический выбор и mobile sheet. Характер: маленькое независимое bob, постоянные углы, fade соседей, затухающий spring. Декор: proprietary artwork, звук, анимация логотипа, контекстное brand-menu. Blog, статья и внешний Careers не входят автоматически в перенос селектора.

## Фактически проверено в источнике

Исследование в Chrome, zoom100%, desktop1534×889 и временный viewport390×844. Проверены desktop overview без document scroll, hover, drag/snap, выбор всех четырёх элементов, prev-wrap, ArrowRight, Escape/outside/inside; настоящее custom context-menu логотипа. Mobile: композиция2×2, Aave/Lens detail, close и wheel-scroll панели на0/около422/max572. Blog: обычный scroll и фильтр Lens; статья: обычная прокрутка и статическая обложка.

DOM/computed CSS и серии чтений дают конечную geometry/scale/opacity, hover/button transitions и приблизительный bob-период. Серии drag-снимков показывают overshoot, но не точные исходные spring constants. PDF отрендерен, страницы просмотрены, переполнение не найдено; сохранённые файлы и ссылки проверяются при добавлении в каталог. Текущий импорт не является повторным live-сеансом сайта.

## Не проверено

Физический touch/multitouch, mobile Safari, assistive technology, measured FPS/GPU, исходный package.json, точное intro персонажей и параметры JS-переходов. Звуки не прослушаны, sound-preference persistence неизвестен. Tooltip метаданных не захвачен отдельным hover-кадром; shimmer прочитан по CSS без forced-loading. Никакая собственная адаптация не построена/не протестирована.

Предложенные650/500/350ms, spring900/14/1, threshold6px, fit/short-viewport решения являются настройками будущей версии, а не установленными значениями Avara. Все требуемые QA сценарии в codex-prompt — будущая приёмка, не пройденные тесты target.

## Права и следующий шаг

Снимки иллюстрируют публичный сайт и предоставлены как исследовательский reference; права на изображённые иллюстрации, логотипы, шрифты и тексты остаются у их правообладателей. Исходные PNG/SVG/WAV и чужие JS/CSS bundles не включены. Скриншоты не становятся product assets при переносе.

После собственной реализации добавить её source commit/version, карту файлов, DOM-контракт, зависимости, разрешённые assets/licenses, фактические устройства/сценарии, screenshots и замеры. До этого статус остаётся analysis-only.
