# Пространственная спираль карточек

ID: pacome-spiral  
Референс: https://pacomepertant.com/  
Статус: Опубликованная адаптация; см. границы проверки

[Полный разбор](analysis.md) · [Задание для Codex](codex-prompt.md) · [Применение и карта кода](implementation.md) · [Источники](provenance.json)

## Механика

Wheel/swipe → фазовый сдвиг → инерционное вращение → затухание к медленному autoplay; hover меняет crop/deformation; click открывает работу.

## Реализация

Three.js 0.180.0 + Canvas software fallback. Четыре своих карточки; на mobile горизонтальные и вертикальные свайпы, медленное самовращение; pause в меню. Начальный phase=2.15 показывает Анну. Введены свои ссылки и анимация имени.

## Условия переноса

Portable импортирует ../vendor/three/three.module.js; vendor не включён. В target установить совместимый Three.js 0.180.0 и заменить эти два импорта на three либо предоставить локальный официальный module/core с MIT notice. Медиа карточек заменить своими. TS UI имеет React/lucide/Button/navigation зависимости. LICENSE-Three.txt включён.

User corrections: спираль не должна скрываться за меню/подсказкой; резкость на ПК; mobile wheel и два направления swipe; autoplay и pause. Код содержит fixed 60 Hz physics с interpolation, DPR cap 2 и deltaMode normalization. Не заменять continuous wheel дискретной каруселью. После drag не открывать ссылку.

Читайте документацию в указанном порядке. Числа из анализа референса и числа собственной адаптации не всегда совпадают. Ключевая часть — ввод, состояния, геометрия и движение; цвета, фото, подписи и меню менять под целевой сайт.
