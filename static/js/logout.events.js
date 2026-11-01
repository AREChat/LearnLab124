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
      logout()
  });
})();
