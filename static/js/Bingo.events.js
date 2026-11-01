// HTML内の onclick 等の属性を、addEventListener に置き換えたもの
(function () {
  function bind(id, evt, fn, isWin) {
    var el = document.querySelector('[data-ev="' + id + '"]');
    if (!el) return;
    (isWin ? window : el).addEventListener(evt, function (event) {
      var r = fn.call(el, event);
      if (r === false) event.preventDefault();
    });
  }
  bind(1, 'click', function (event) {
      switchMode('host')
  });
  bind(2, 'click', function (event) {
      switchMode('player')
  });
  bind(3, 'change', function (event) {
      updateMaxNumber()
  });
  bind(4, 'click', function (event) {
      drawNumber()
  });
  bind(5, 'click', function (event) {
      resetGame()
  });
  bind(6, 'click', function (event) {
      replayDrawnNumbers()
  });
  bind(7, 'change', function (event) {
      updateMaxNumberPlayer()
  });
  bind(8, 'click', function (event) {
      drawNumberPlayer()
  });
  bind(9, 'click', function (event) {
      generateNewCard()
  });
})();
