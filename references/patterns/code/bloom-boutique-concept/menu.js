(() => {
  'use strict';
  const trigger = document.querySelector('#menu-toggle');
  const dialog = document.querySelector('#site-menu');
  const sheet = dialog.querySelector('.menu-sheet');
  const closeButton = dialog.querySelector('.menu-close');
  const links = Array.from(dialog.querySelectorAll('.menu-item'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 767px)');
  let entering = [];
  let closing = null;

  function clearEntrance() {
    entering.forEach(animation => animation.cancel());
    entering = [];
  }
  function announce(open) {
    window.dispatchEvent(new CustomEvent('bloom:menu', {detail: {open}}));
  }
  function folded() {
    return {
      opacity: 0,
      transform: `translateY(${mobile.matches ? 10 : -10}px) scale(.97)`,
      clipPath: mobile.matches ? 'inset(82% 0 0 0 round 28px)' : 'inset(0 0 82% 0 round 28px)'
    };
  }
  const unfolded = {opacity: 1, transform: 'translateY(0) scale(1)', clipPath: 'inset(0 0 0 0 round 28px)'};

  function openMenu() {
    if (dialog.open) return;
    clearEntrance();
    dialog.classList.remove('is-closing');
    dialog.showModal();
    document.documentElement.classList.add('menu-open');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Меню открыто');
    announce(true);
    if (!reduced.matches && typeof sheet.animate === 'function') {
      entering.push(sheet.animate([folded(), unfolded], {
        duration: 470, easing: 'cubic-bezier(.22,1,.36,1)'
      }));
      links.forEach((link, index) => {
        const order = mobile.matches ? links.length - 1 - index : index;
        entering.push(link.animate([
          {opacity: 0, transform: `translateY(${mobile.matches ? 8 : -8}px)`},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 330, delay: 70 + order * 24, fill: 'backwards', easing: 'cubic-bezier(.22,1,.36,1)'}));
      });
    }
    closeButton.focus({preventScroll: true});
  }

  function finishClose() {
    const animation = closing;
    closing = null;
    animation?.cancel();
    if (dialog.open) dialog.close();
  }
  function closeMenu({immediate = false} = {}) {
    if (!dialog.open) return;
    if (closing && !immediate) return;
    clearEntrance();
    if (immediate || reduced.matches || typeof sheet.animate !== 'function') {
      finishClose();
      return;
    }
    dialog.classList.add('is-closing');
    const animation = sheet.animate([unfolded, folded()], {
      duration: 210, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards'
    });
    closing = animation;
    const complete = () => { if (closing === animation) finishClose(); };
    animation.finished.then(complete, complete);
  }

  trigger.addEventListener('click', openMenu);
  closeButton.addEventListener('click', () => closeMenu());
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeMenu();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeMenu();
    else if (event.target.closest('a[href]')) closeMenu({immediate: true});
  });
  dialog.addEventListener('close', () => {
    clearEntrance();
    const animation = closing;
    closing = null;
    animation?.cancel();
    dialog.classList.remove('is-closing');
    document.documentElement.classList.remove('menu-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Открыть меню');
    announce(false);
    if (!document.hidden) trigger.focus({preventScroll: true});
  });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    clearEntrance();
    if (closing) finishClose();
  });
  window.addEventListener('pagehide', () => closeMenu({immediate: true}));
})();
