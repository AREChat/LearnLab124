"use strict";
// 右クリック・開発者ツールのキーを止める（「うっかり開く」を防ぐための抑止です）
// ・security.js を読みこまない画面（ログイン前の画面、ゲームなど）で使います。画面にはメッセージを出しません。
// ・本当の安全は、Neon 側のルール（RLS）で守っています。
(function () {
  function isField(t) {
    return !!(t && t.nodeType === 1 && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable));
  }

  document.addEventListener("keydown", function (event) {
    var key = String(event.key || "").toLowerCase();
    var ctrl = event.ctrlKey || event.metaKey;
    var blocked =
      event.key === "F12" ||
      event.key === "F7" ||
      event.key === "ContextMenu" ||
      (event.shiftKey && event.key === "F10") ||
      (ctrl && event.shiftKey && (key === "i" || key === "j" || key === "c" || key === "k" || key === "e" || key === "m" || key === "s")) ||
      (ctrl && event.altKey && (key === "i" || key === "j" || key === "c" || key === "u")) ||
      (ctrl && !event.shiftKey && (key === "u" || key === "s"));
    if (!blocked) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  function stopMenu(event) { event.preventDefault(); }
  document.addEventListener("contextmenu", stopMenu, true);
  window.addEventListener("contextmenu", stopMenu, true);
  document.addEventListener("mousedown", function (e) { if (e.button === 2) e.preventDefault(); }, true);
  document.addEventListener("auxclick", function (e) { if (e.button === 2) stopMenu(e); }, true);

  // 画像・動画のドラッグ保存と、長押し保存メニューを出さない
  document.addEventListener("dragstart", function (event) {
    var t = event.target;
    if (t && (t.tagName === "IMG" || t.tagName === "VIDEO" || t.tagName === "CANVAS")) event.preventDefault();
  }, true);
  var st = document.createElement("style");
  st.textContent = "img,video,canvas,svg{-webkit-touch-callout:none!important;-webkit-user-drag:none!important;user-drag:none!important}";
  (document.head || document.documentElement).appendChild(st);

  // ファイルのドロップ：入力欄の上以外では、ブラウザが勝手にファイルを開かない
  window.addEventListener("dragover", function (e) {
    if (e.defaultPrevented || isField(e.target)) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = "none"; } catch (_e) { /* 何もしない */ }
  });
  window.addEventListener("drop", function (e) {
    if (e.defaultPrevented || isField(e.target)) return;
    e.preventDefault();
  });

  // 他のサイトの中に埋め込まれて使われるのを止める（クリックジャッキング対策）
  try { if (window.top !== window.self) { void window.top.location.href; } }
  catch (_e) { document.documentElement.style.display = "none"; }
})();
