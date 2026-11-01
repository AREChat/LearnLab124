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
      togglePw('reg-password', this)
  });
  bind(2, 'click', function (event) {
      registerUser()
  });
  bind(3, 'click', function (event) {
      showLogin()
  });
  bind(4, 'click', function (event) {
      togglePw('login-password', this)
  });
  bind(5, 'click', function (event) {
      loginUser()
  });
  bind(6, 'click', function (event) {
      showRegister()
  });
  bind(7, 'keydown', function (event) {
      handleKeyDown(event)
  });
  bind(7, 'input', function (event) {
      autoResize(this); updateSuggestions(); showTyping(); clearTimeout(typingTimer); typingTimer = setTimeout(hideTyping, 1000);
  });
  bind(8, 'click', function (event) {
      sendMessage()
  });
  bind(9, 'click', function (event) {
      saveUserMemo()
  });
  bind(10, 'click', function (event) {
      resetChat()
  });
  bind(11, 'click', function (event) {
      exportChat('txt')
  });
  bind(12, 'click', function (event) {
      exportChat('csv')
  });
  bind(13, 'click', function (event) {
      window.open('https://arechat.github.io/ARE', '_blank')
  });
  bind(14, 'click', function (event) {
      logout()
  });
  bind(15, 'change', function (event) {
      showAdminChat();showAdminMemo();
  });
  bind(16, 'click', function (event) {
      sendAdminMessage()
  });
  bind(17, 'click', function (event) {
      adminAddUser()
  });
  bind(18, 'click', function (event) {
      adminDeleteUser()
  });
  bind(19, 'click', function (event) {
      window.open('https://arechat.github.io/ARE', '_blank')
  });
  bind(20, 'click', function (event) {
      logout()
  });
})();
