// HTML内の onclick 等の属性を、addEventListener に置き換えたもの
(function () {
  function bind(id, evt, fn) {
    var el = document.querySelector('[data-ev="' + id + '"]');
    if (!el) return;
    el.addEventListener(evt, function (event) {
      var r = fn.call(el, event);
      if (r === false) event.preventDefault();
    });
  }
  bind(1, 'click', function (event) {
      nextScene(2)
  });
  bind(2, 'click', function (event) {
      nextScene(1)
  });
  bind(3, 'click', function (event) {
      nextScene(3)
  });
  bind(4, 'click', function (event) {
      nextScene(2)
  });
  bind(5, 'click', function (event) {
      nextScene(4)
  });
  bind(6, 'click', function (event) {
      nextScene(3)
  });
  bind(7, 'click', function (event) {
      closeWelcome()
  });
  bind(8, 'click', function (event) {
      closeTodayPopup()
  });
  bind(9, 'click', function (event) {
      closeTodayPopup()
  });
  bind(10, 'click', function (event) {
      closeCongratsPopup()
  });
  bind(11, 'click', function (event) {
      closeExportPopup()
  });
  bind(12, 'click', function (event) {
      confirmExport()
  });
  bind(13, 'click', function (event) {
      closeInstallBanner()
  });
  bind(14, 'click', function (event) {
      toggleFurigana(this)
  });
  bind(15, 'click', function (event) {
      showWelcome()
  });
  bind(16, 'click', function (event) {
      switchTab('input', this)
  });
  bind(17, 'click', function (event) {
      switchTab('list', this)
  });
  bind(18, 'click', function (event) {
      switchTab('stats', this)
  });
  bind(19, 'click', function (event) {
      switchTab('history', this)
  });
  bind(20, 'click', function (event) {
      switchTab('settings', this)
  });
  bind(21, 'submit', function (event) {
      handleSubmit(event)
  });
  bind(22, 'click', function (event) {
      resetForm()
  });
  bind(23, 'keyup', function (event) {
      filterEntries()
  });
  bind(24, 'change', function (event) {
      filterEntries()
  });
  bind(25, 'click', function (event) {
      showExportPopup()
  });
  bind(26, 'click', function (event) {
      reloadData()
  });
  bind(27, 'click', function (event) {
      clearAllData()
  });
})();
