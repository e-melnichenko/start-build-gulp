document.addEventListener('click', function(ev) {
  const target = ev.target.closest('[data-open-modal]');
  if(!target) return;

  // scroll offset
  const widthBefore = document.body.clientWidth;
  const root = document.documentElement;
  document.body.classList.add('modal-show');
  const widthAfter = document.body.clientWidth;
  const scrollWidth = widthAfter - widthBefore;
  root.style.setProperty('--scroll-width', `${scrollWidth}px`);

  // show modal
  const modal = document.getElementById(target.getAttribute('data-target'));
  modal.classList.add('modal--active');
});

document.addEventListener('click', function(ev) {
  const target = ev.target.closest('[data-close-modal]');
  if(!target) return;

  // remove scroll offset
  const root = document.documentElement;
  root.style.setProperty('--scroll-width', 0);

  // hide modal
  document.body.classList.remove('modal-show');
  const modal = target.closest('[data-modal]');
  modal.classList.remove('modal--active');
})