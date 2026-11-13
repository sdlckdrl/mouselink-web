(function () {
  'use strict';

  var pickers = [];
  document.querySelectorAll('[data-connection-picker]').forEach(function (picker, pickerIndex) {
    var options = picker.querySelector('[data-connection-options]');
    var buttons = Array.from(picker.querySelectorAll('[data-connection-choice]'));
    var panels = Array.from(picker.querySelectorAll('[data-connection-panel]'));
    if (!options || !buttons.length || buttons.length !== panels.length) return;
    if (
      buttons.some(function (button) {
        return !panels.some(function (panel) {
          return (
            panel.id === button.getAttribute('aria-controls') &&
            panel.dataset.connectionPanel === button.dataset.connectionChoice
          );
        });
      })
    )
      return;

    function select(choice, focus) {
      buttons.forEach(function (button) {
        var selected = button.dataset.connectionChoice === choice;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && focus) button.focus();
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.dataset.connectionPanel !== choice;
      });
    }

    buttons.forEach(function (button, index) {
      button.id = 'connection-choice-' + pickerIndex + '-' + button.dataset.connectionChoice;
      button.setAttribute('role', 'tab');
      button.hidden = false;
      var panel = panels.find(function (item) {
        return item.id === button.getAttribute('aria-controls');
      });
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      panel.tabIndex = 0;
      function activate(target, focus) {
        select(target.dataset.connectionChoice, focus);
        try {
          history.replaceState(null, '', '#' + target.getAttribute('aria-controls'));
        } catch (error) {
          /* Local file previews may not allow URL changes. */
        }
      }
      button.addEventListener('click', function () {
        activate(button, false);
      });
      button.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        activate(buttons[next], true);
      });
    });
    options.setAttribute('role', 'tablist');
    options.hidden = false;
    select(buttons[0].dataset.connectionChoice, false);
    pickers.push({ element: picker, select: select });
  });

  function revealHash() {
    var id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch (error) {
      return;
    }
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var panel = target.closest('[data-connection-panel]');
    if (panel) {
      var picker = pickers.find(function (item) {
        return item.element.contains(panel);
      });
      if (picker) picker.select(panel.dataset.connectionPanel, false);
    }
    var parent = target;
    while (parent) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    requestAnimationFrame(function () {
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.gesture-guide').forEach(function (guide) {
    var toggle = guide.querySelector('[data-demo-toggle]');
    if (!toggle) return;
    function setPlaying(playing) {
      guide.dataset.animationPlaying = String(playing);
      toggle.textContent = playing ? toggle.dataset.pauseLabel : toggle.dataset.playLabel;
    }
    toggle.hidden = false;
    setPlaying(!reducedMotion.matches);
    toggle.addEventListener('click', function () {
      setPlaying(guide.dataset.animationPlaying !== 'true');
    });
    reducedMotion.addEventListener('change', function (event) {
      if (event.matches) setPlaying(false);
    });
  });
})();
