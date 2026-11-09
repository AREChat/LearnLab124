"use strict";
// ミニゲーム集: 神経衰弱 / 数あて / タイピング / はんのうテスト / かんたん計算 / じゃんけん
// ・すべてこの端末の中だけで動く（ネットなし・ログインなし）。ベストスコアはこの端末の localStorage だけに保存。
(function(){
  var $ = function(s, r){ return (r || document).querySelector(s); };
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text !== undefined) e.textContent = text; return e; }
  function best(key, val, lowerIsBetter){
    var k = "mg-best-" + key, old = null;
    try{ old = localStorage.getItem(k); }catch(_e){}
    var o = old === null ? null : +old, better = o === null || (lowerIsBetter ? val < o : val > o);
    if(better){ try{ localStorage.setItem(k, String(val)); }catch(_e){} return {isNew: true, value: val}; }
    return {isNew: false, value: o};
  }
  function rnd(n){ return Math.floor(Math.random() * n); }
  function shuffle(a){ for(var i = a.length - 1; i > 0; i--){ var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var games = {};

  // ---- 神経衰弱 ----
  games.memory = {title: "🃏 しんけいすいじゃく", build: function(box){
    var FACES = ["🍎","🍌","🍇","🍓","🍉","🍑","🥕","🌽"], first = null, lock = false, moves = 0, found = 0;
    var info = el("div", "mg-big"), grid = el("div", "mg-grid"), row = el("div", "mg-row"), again = el("button", "mg-btn", "もういちど");
    box.append(el("p", "mg-note", "おなじ絵を 2まい そろえよう。すくない手数が ベスト！"), info, grid, row); row.append(again);
    function start(){
      grid.textContent = ""; first = null; lock = false; moves = 0; found = 0; info.textContent = "手数: 0";
      shuffle(FACES.concat(FACES)).forEach(function(f){
        var c = el("button", "mg-cell", "？"); c.type = "button"; c.dataset.f = f; c.setAttribute("aria-label", "カード");
        c.addEventListener("click", function(){
          if(lock || c.classList.contains("open") || c.classList.contains("done")) return;
          c.classList.add("open"); c.textContent = f;
          if(!first){ first = c; return; }
          moves++; info.textContent = "手数: " + moves;
          if(first.dataset.f === f){ first.classList.add("done"); c.classList.add("done"); first = null; found++;
            if(found === FACES.length){ var b = best("memory", moves, true); info.textContent = "🎉 クリア！ " + moves + "手" + (b.isNew ? "（ベスト更新！）" : "（ベスト " + b.value + "手）"); } }
          else{ lock = true; var a = first; first = null; setTimeout(function(){ a.classList.remove("open"); a.textContent = "？"; c.classList.remove("open"); c.textContent = "？"; lock = false; }, 800); }
        });
        grid.appendChild(c);
      });
    }
    again.addEventListener("click", start); start();
  }};

  // ---- 数あて ----
  games.guess = {title: "🔢 かずあて", build: function(box){
    var n, tries, info = el("div", "mg-big"), inp = el("input", "mg-input"), ok = el("button", "mg-btn", "きめる"), again = el("button", "mg-btn", "もういちど"), row = el("div", "mg-row");
    inp.type = "number"; inp.min = 1; inp.max = 100; inp.inputMode = "numeric"; inp.setAttribute("aria-label", "1から100の数");
    box.append(el("p", "mg-note", "1〜100の どれかを あてよう。ヒント: 「もっと大きい／小さい」。すくない回数が ベスト！"), info, row); row.append(inp, ok, again);
    function start(){ n = 1 + rnd(100); tries = 0; info.textContent = "1〜100の 数は？"; inp.value = ""; inp.disabled = false; ok.disabled = false; }
    function go(){
      var v = Math.floor(+inp.value); if(!(v >= 1 && v <= 100)){ info.textContent = "1〜100の 数を 入れてね"; return; }
      tries++; inp.value = "";
      if(v === n){ var b = best("guess", tries, true); info.textContent = "🎉 せいかい！ " + tries + "回" + (b.isNew ? "（ベスト更新！）" : "（ベスト " + b.value + "回）"); inp.disabled = true; ok.disabled = true; }
      else info.textContent = v < n ? "⬆ もっと 大きい（" + tries + "回め）" : "⬇ もっと 小さい（" + tries + "回め）";
    }
    ok.addEventListener("click", go); inp.addEventListener("keydown", function(e){ if(e.key === "Enter") go(); }); again.addEventListener("click", start); start();
  }};

  // ---- タイピング ----
  games.typing = {title: "⌨️ ミニタイピング", build: function(box){
    var WORDS = ["print","variable","function","loop","string","integer","list","array","class","object","method","return","import","input","output","python","server","browser","network","password","backup","database","keyboard","program","excel","word","internet","update","download","folder"];
    var t0 = 0, count = 0, cur = "", timer = null, left = 30;
    var info = el("div", "mg-big"), q = el("div", "mg-q"), inp = el("input", "mg-input"), start = el("button", "mg-btn", "スタート"), row = el("div", "mg-row");
    inp.type = "text"; inp.autocomplete = "off"; inp.autocapitalize = "off"; inp.spellcheck = false; inp.setAttribute("aria-label", "うつ ことば"); inp.disabled = true;
    box.append(el("p", "mg-note", "30秒で なん語 うてるかな？ 出た 英単語を そのまま うちこもう（Enterで つぎへ）。"), info, q, row); row.append(inp, start);
    function next(){ cur = WORDS[rnd(WORDS.length)]; q.textContent = cur; inp.value = ""; }
    function end(){ clearInterval(timer); inp.disabled = true; start.disabled = false; q.textContent = ""; var b = best("typing", count, false); info.textContent = "⏱ おしまい！ " + count + "語" + (b.isNew ? "（ベスト更新！）" : "（ベスト " + b.value + "語）"); }
    start.addEventListener("click", function(){ count = 0; left = 30; start.disabled = true; inp.disabled = false; inp.focus(); next(); info.textContent = "のこり " + left + "秒 ／ " + count + "語";
      timer = setInterval(function(){ left--; info.textContent = "のこり " + left + "秒 ／ " + count + "語"; if(left <= 0) end(); }, 1000); });
    inp.addEventListener("input", function(){ if(inp.value.trim().toLowerCase() === cur){ count++; info.textContent = "のこり " + left + "秒 ／ " + count + "語"; next(); } });
    info.textContent = "「スタート」を おしてね";
  }};

  // ---- はんのうテスト ----
  games.react = {title: "⚡ はんのうテスト", build: function(box){
    var pad = el("div", "mg-react idle", "タップして スタート"), info = el("div", "mg-big"), st = "idle", t0 = 0, to = null;
    pad.setAttribute("role", "button"); pad.tabIndex = 0;
    box.append(el("p", "mg-note", "画面が 緑に なったら すぐ タップ！ はやいほど ベスト。（はやすぎると やりなおし）"), pad, info);
    function act(){
      if(st === "idle"){ st = "wait"; pad.className = "mg-react wait"; pad.textContent = "まって…"; info.textContent = ""; to = setTimeout(function(){ st = "go"; pad.className = "mg-react go"; pad.textContent = "いま！"; t0 = performance.now(); }, 1200 + rnd(2500)); }
      else if(st === "wait"){ clearTimeout(to); st = "idle"; pad.className = "mg-react idle"; pad.textContent = "はやすぎ！ もういちど タップ"; }
      else if(st === "go"){ var ms = Math.round(performance.now() - t0), b = best("react", ms, true); st = "idle"; pad.className = "mg-react idle"; pad.textContent = "もういちど タップ"; info.textContent = ms + " ミリ秒" + (b.isNew ? "（ベスト更新！）" : "（ベスト " + b.value + "ミリ秒）"); }
    }
    pad.addEventListener("pointerdown", function(e){ e.preventDefault(); act(); }); pad.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); act(); } });
  }};

  // ---- かんたん計算 ----
  games.math = {title: "➕ かんたん計算", build: function(box){
    var score = 0, left = 30, timer = null, ans = 0, info = el("div", "mg-big"), q = el("div", "mg-q"), inp = el("input", "mg-input"), start = el("button", "mg-btn", "スタート"), row = el("div", "mg-row");
    inp.type = "number"; inp.inputMode = "numeric"; inp.disabled = true; inp.setAttribute("aria-label", "こたえ");
    box.append(el("p", "mg-note", "30秒で なんもん とけるかな？ たし算・ひき算・かけ算（九九）。こたえを 入れて Enter。"), info, q, row); row.append(inp, start);
    function next(){ var k = rnd(3), a, b; if(k === 0){ a = 1 + rnd(30); b = 1 + rnd(30); ans = a + b; q.textContent = a + " ＋ " + b + " ＝ ？"; } else if(k === 1){ a = 10 + rnd(40); b = 1 + rnd(a - 1); ans = a - b; q.textContent = a + " － " + b + " ＝ ？"; } else { a = 1 + rnd(9); b = 1 + rnd(9); ans = a * b; q.textContent = a + " × " + b + " ＝ ？"; } inp.value = ""; }
    function end(){ clearInterval(timer); inp.disabled = true; start.disabled = false; q.textContent = ""; var b = best("math", score, false); info.textContent = "⏱ おしまい！ " + score + "問 せいかい" + (b.isNew ? "（ベスト更新！）" : "（ベスト " + b.value + "問）"); }
    start.addEventListener("click", function(){ score = 0; left = 30; start.disabled = true; inp.disabled = false; inp.focus(); next(); info.textContent = "のこり " + left + "秒 ／ " + score + "問";
      timer = setInterval(function(){ left--; info.textContent = "のこり " + left + "秒 ／ " + score + "問"; if(left <= 0) end(); }, 1000); });
    inp.addEventListener("keydown", function(e){ if(e.key !== "Enter" || inp.disabled) return; if(+inp.value === ans && inp.value !== ""){ score++; info.textContent = "のこり " + left + "秒 ／ " + score + "問"; } next(); });
    info.textContent = "「スタート」を おしてね";
  }};

  // ---- じゃんけん ----
  games.rps = {title: "✊ じゃんけん", build: function(box){
    var H = [["✊", "グー"], ["✌️", "チョキ"], ["✋", "パー"]], win = 0, lose = 0, draw = 0, streak = 0;
    var info = el("div", "mg-big", "どれを だす？"), res = el("div", "mg-q"), hands = el("div", "mg-hands"), tally = el("p", "mg-note");
    H.forEach(function(h, i){ var b = el("button", "mg-btn", h[0] + " " + h[1]); b.type = "button";
      b.addEventListener("click", function(){ var c = rnd(3), d = (i - c + 3) % 3, r;
        if(d === 0){ draw++; r = "あいこ"; streak = 0; } else if(d === 1){ win++; streak++; r = "かち！"; var bb = best("rps", streak, false); if(bb.isNew && streak > 1) r += "（れんしょう ベスト！）"; } else { lose++; streak = 0; r = "まけ…"; }
        info.textContent = "あなた " + h[0] + " ／ あいて " + H[c][0]; res.textContent = r; tally.textContent = win + "勝 " + lose + "敗 " + draw + "分 ／ いまの連勝: " + streak; });
      hands.appendChild(b); });
    box.append(el("p", "mg-note", "コンピュータと じゃんけん。連勝が ベスト記録に なるよ。"), info, res, hands, tally);
  }};

  // ---- 画面 ----
  var tabs = $("#mgTabs"), stage = $("#mgStage"); if(!tabs || !stage) return;
  var keys = Object.keys(games), cur = null;
  function show(k){
    cur = k; stage.textContent = "";
    Array.prototype.forEach.call(tabs.children, function(t){ t.setAttribute("aria-selected", t.dataset.k === k ? "true" : "false"); });
    var card = el("section", "mg-card"); card.append(el("h2", "", games[k].title)); stage.appendChild(card); games[k].build(card);
    try{ history.replaceState(null, "", "#" + k); }catch(_e){}
  }
  keys.forEach(function(k){ var b = el("button", "mg-tab", games[k].title); b.type = "button"; b.dataset.k = k; b.setAttribute("role", "tab"); b.addEventListener("click", function(){ show(k); }); tabs.appendChild(b); });
  var h = (location.hash || "").slice(1); show(games[h] ? h : keys[0]);
})();
