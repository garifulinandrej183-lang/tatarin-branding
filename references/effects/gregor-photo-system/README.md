# Gregor Collienne: Overview, GRID/LIST и фотогалереи

- ID: gregor-photo-system
- Референс: <https://gregorcollienne.com/>
- Дата отчёта / импорта: 2026-10-05
- Статус: **analysis-only**; собственного применения пока нет

[Полный разбор, 25 страниц](analysis.md) · [Задание для Codex](codex-prompt.md) · [Применение и ограничения](implementation.md) · [Источники и SHA-256](provenance.json)

## Система механизмов

Overview: центральная стопка → разлёт фотографий в смещённое поле; фото проходят поверх фиксированного имени, поток повторяется. WORK GRID: две смещённые колонки и центральный hover-title с flip/blur. WORK LIST: текстовые ссылки и превью слева/справа по чётности проекта. Viewer: главное фото contain и rail миниатюр; активен ближайший к центру кадр. INDEX: те же миниатюры мигрируют из rail в сетку и обратно. INFO занимает область фото; Back сначала закрывает панель. Глобальное меню и маршруты имеют отдельные состояния.

Это DOM/CSS/vanilla JS, без обнаруженного Canvas/WebGL и без cursor-parallax фотографий. Нельзя заменять все механики универсальным parallax. Отдельные CSS perspective/rotateX относятся к тексту, а не к вращению фотографий.

| Страницы PDF / analysis | Содержание |
| --- | --- |
| 1–6 | Полный scope, данные, Overview, повторение потока и menu |
| 7–15 | Viewer/rail, INDEX туда/обратно, INFO, mobile, touch и коллекции |
| 16–21 | Точная геометрия GRID, hover-title, LIST, переход режима и responsive |
| 22–25 | Routing/Back, общий scroll lag, stacking, архитектура, приёмка и ссылки |

## Опорные контракты

| Механика | Контракт отчёта |
| --- | --- |
| Active photo | `argmin(abs(pseudoCenter[i]-axisCenter))`; не wheel-count |
| Выпуклость rail | `A*max(0,1-d/R)^2`; desktop A=64/R=280, mobile A=24/R=220 |
| Rail ↔ INDEX | Measured rect continuity; 790 ms; distance-stagger 15 ms |
| Текстовый flip | Perspective 1000 px; 790 ms; `.77,0,.175,1`; blur/opacity |
| LIST preview | Нечётные слева, чётные справа; 490 ms; без cursor-follow |
| Общий scroll | Два исходных loop .08/.03 дают alpha60=.1076; адаптация использует один clock |
| Responsive | Overview сохраняет пять колонок; WORK две; viewer rail на mobile горизонтальный |

Не спутать INDEX rail↔grid с переходом WORK GRID↔LIST: второй является blur/page transition, а не подтверждённым morph фото между режимами.

## Границы и проверка

Исходник охватывает главную, WORK GRID/LIST, FOCUS, Travel/People/Personal/Commissioned, INDEX/INFO и меню. Формы, видео, 3D, email-клиент и внешние социальные сайты не входят. Число фотографий и пути категорий — snapshot источника, а не фиксированные данные target.

PDF уточняет прежний узкий разбор и общий scroll lag с учётом двух RAF. В нём отмечены повторные keydown-listeners, timers и неограниченное клонирование DOM как риски для адаптации. Физический touch, многократный конец infinite-feed, FPS и полный accessibility audit не проверены. При импорте просмотрены все страницы, новый live-прогон и собственная адаптация не выполнялись.
