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
  bind(1, 'submit', function (event) {
      submitted=true;
  });
  bind(2, 'load', function (event) {
      if(submitted){window.location='thanks.html';}
  });
})();
