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
      startQuiz('ARE')
  });
  bind(2, 'click', function (event) {
      startQuiz('story')
  });
  bind(3, 'click', function (event) {
      startQuiz('admin')
  });
  bind(4, 'click', function (event) {
      nextQuestion()
  });
  bind(5, 'click', function (event) {
      retireQuiz()
  });
  bind(6, 'click', function (event) {
      restartQuiz()
  });
  bind(7, 'click', function (event) {
      backToSelection()
  });
})();
