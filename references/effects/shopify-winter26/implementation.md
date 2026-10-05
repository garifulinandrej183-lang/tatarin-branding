# Применение: shopify-winter26

- Сайт / версия / source commit: отсутствуют.
- Дата архивирования: 2026-10-05.
- Статус: **analysis-only**.

## Сохранённые материалы

Полный текст 19 страниц `Winner Shopify.pdf`, самостоятельное архивное ТЗ, краткая карта четырёх зон и hyperlinks исходного PDF. Название файла сохранено буквально; название референса нормализовано по содержимому как Shopify Editions Winter ’26. SHA-256 и ссылки — в provenance.json. Изображения, бинарный PDF, GLB, текстуры и чужие bundles не включены.

Каталога `code/` и новой записи кода в SOURCE_MANIFEST.json нет: собственная адаптация с source commit не предоставлена.

## Предлагаемая интеграция, не выполненная реализация

| Контракт | Ответственность |
| --- | --- |
| SceneStage / CompositePass | Один canvas, roots активных сцен, два RT, noise threshold / contours / glow |
| ScrollDirector | Section bounds → camera/model/shader progress; deep links и resize |
| HeroNavigation | Независимый time-based dock после порога, mobile menu без rail |
| ConsentControl | Действующая privacy persistence, expanded/icon/settings, клавиатура/focus |
| Asset / Quality lifecycle | Собственные GLB/posters, lazy preload, pause, DPR и cleanup |

DOM-контракт: canvas под контентом, semantically readable text и непрозрачные cards поверх; navigation/consent/dialog выше. Исходный стек по PDF: React, Three.js r181, Theatre.js, Lenis 1.3.23. Ни R3F, ни GSAP автоматически не требуются; текущий framework/scroll/consent-manager имеют приоритет. При импорте зависимости не устанавливались.

Выбор cookies не связан со стартом hero. Отдельно сохраняются privacy values и UI expansion; нет fake consent или принятия для запуска сцены. Номер X относится к Finance референса, а не к обязательству добавить десять разделов target.

## Проверено и не проверено

При импорте: отрендерены и просмотрены все страницы PDF, сохранён текст 19 страниц и ссылки; индекс, coverage и SHA-256 проверяются на уровне архива. Новый target и motion/consent-control не создавались.

По исходному PDF: desktop и responsive Chrome проверены, сцены/камеры сверены с публичными модулями/JSON. Cookies в live не отображались; Accept/Reject-collapse установлен по коду. Физический touch, iOS/Safari, GPU/FPS и обработка ошибок оригинала не проверены. При импорте эти исторические факты не проверялись повторно.

Известный риск источника: easing expansion с недопустимыми x-координатами CSS; в адаптации использовать валидную кривую. Нельзя переносить всю художественную сцену/контент без прав или объявлять responsive-снимок тестом телефона.

Будущие source commit, target assets/licenses, результаты consent persistence, reverse/deep-link/fallback, screenshots и измерения записать сюда после реальной реализации. Требования в prompt пока не пройдены.
