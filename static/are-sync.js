"use strict";
/* ===== ARE 引き継ぎ（ゲーム・学習アプリ用）=====
   ねらい：チャットアプリで ログインしたままなら、ほかの端末でも、ゲームや学習アプリの「つづき」が そのまま使える。
   ・ログイン画面は ありません。チャットアプリがブラウザに残している ログインの情報（同じ arechat.github.io の中）を、そのまま借ります。
     チャットアプリで ログアウトしていると、何もしません（この端末だけで これまでどおり動きます）。お試し（ゲスト）も 何もしません。
   ・見張るのは「この端末の localStorage のうち、ゲーム／学習アプリの記録」だけ（下の SCOPE）。端末ごとのもの（ゲームパッドの配置・画面の設定など）は 対象外。
   ・保存先：
       小さいもの（〜12000バイト）   サーバーの user_prefs の 1行（gh:<アプリ>:<番号>）
       すこし大きいもの（〜28万字）   user_prefs に 14000バイトずつ分けて（gd:<アプリ>:<番号>:<n>）
       もっと大きいもの（〜90万字）   GAS ハブ（Google ドライブ）の sync。使えない人（区分「その他」など）は、大きすぎる項目だけ 同期しません
   ・どちらが新しいか：項目ごとに「更新時刻」で決めます（新しいほうが勝つ）。この端末ではじめて同期するときは、サーバーに あるものを先に採用します
     （端末の元の値は、are_gs_bak_<名前> に とっておきます）。
   ・ほかの人のアカウントに切りかわったとき：前の人の記録は、この端末から消して、新しい人のものを 読み込みます（前の人の分は サーバーに あります）。
   ・やめたいとき：localStorage の are_gs_off=1 ／ アドレスに ?nosync=1
   ・ふつうのブラウザの中だけで動きます。exe（別の入れもの）や、チャットにログインしていない状態では、何もしません。 */
(function(){
    if(window.AREDataSync) return;
    var SB_URL = "https://kzrrnuzzvwijujhlbtln.supabase.co";
    var SB_KEY = "sb_publishable_lO7m63Or44b-CIRWfYMcjA_z_WuONpi";        // 公開してよい鍵（apikey.js と同じもの）
    var SES_KEY = "sb-kzrrnuzzvwijujhlbtln-auth-token";                   // チャットアプリの ログイン情報の入れ場所

    // ---------- 対象（アプリごと）----------
    var GAMES = {
        app: "games",
        exact: ["are_settings", "are_play_log", "are_hub_cs", "are_gki_v1"],
        prefix: ["tq_", "areq2_", "areq3_", "areq4_", "are7_", "g8_", "g9_", "g10_", "game6_", "game6-", "game7_", "game8_", "game9_",
                 "dreamFrontier", "dreamfrontier", "quest2_", "quest3_", "are_pk_", "are_ad_", "are_st_", "gk_", "arefp_", "are_secrets_", "are_gtips_"],
        not: ["tq_suggest_name"]                      // チャット側の同期が 受け持つもの
    };
    var LEARN = {
        app: "learn",
        exact: ["agreed", "userPoints", "pointHistory", "loginStreak", "quizResults", "linkClickCounts", "searchHistory", "searchCounts",
                "viewingList", "historyLog", "nextId", "furiganaEnabled", "hasVisited", "lastWeatherCheck", "lastTrainCheck", "lastManualAccess", "learningLastAccess"],
        prefix: ["pt_daily_", "pt_once_", "story_read_", "story_link_", "mg-best-", "ll_tips_"],
        not: ["banned", "disagreeCount"]             // 端末（ブラウザ）ごとの 注意の記録は 持ちこさない
    };
    var SCOPE = window.ARE_SYNC_CFG || (/\/LearnLab124\//.test(location.pathname) ? LEARN : GAMES);
    var APP = SCOPE.app;
    function inScope(k){
        if(typeof k !== "string" || !k || k.length > 400) return false;
        if(SCOPE.not.indexOf(k) >= 0) return false;
        if(SCOPE.exact.indexOf(k) >= 0) return true;
        for(var i = 0; i < SCOPE.prefix.length; i++){ if(k.lastIndexOf(SCOPE.prefix[i], 0) === 0) return true; }
        return false;
    }

    var CHUNK = 14000, INLINE = 12000, MAX_SQL = 280000, MAX_GAS = 900000, DEBOUNCE = 2500, RETRY = 30000;
    var S = {on: false, uid: null, tok: null, meta: {uid: null, keys: {}}, touched: {}, dirty: {}, applying: false, timer: null, busy: Promise.resolve(),
             interacted: false, boot: {}, synced: false, hub: undefined, hiddenAt: 0, lastErr: "", started: Date.now(), applied: []};
    var LS_SET = Storage.prototype.setItem, LS_REM = Storage.prototype.removeItem, LS_GET = Storage.prototype.getItem;
    function lget(k){ try{ return LS_GET.call(localStorage, k); }catch(_e){ return null; } }
    function lset(k, v){ try{ LS_SET.call(localStorage, k, v); return true; }catch(_e){ return false; } }
    function lrem(k){ try{ LS_REM.call(localStorage, k); }catch(_e){} }

    // ---------- 小さな道具 ----------
    function h32(s, seed){ var h = seed >>> 0; for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
    function hex8(n){ return ("00000000" + (n >>> 0).toString(16)).slice(-8); }
    function idOf(k){ return "k" + hex8(h32(k, 2166136261)) + hex8(h32(k, 0x9747b28c)); }
    function vh(v){ return v === null ? "-" : v.length.toString(36) + "." + hex8(h32(v, 2166136261)); }
    function bytes(s){ try{ return new TextEncoder().encode(s).length; }catch(_e){ return s.length * 3; } }
    function split(s){
        var out = [], cur = "", n = 0;
        for(var i = 0; i < s.length; i++){
            var cp = s.codePointAt(i), ch = String.fromCodePoint(cp); if(cp > 0xffff) i++;
            var b = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
            if(n + b > CHUNK){ out.push(cur); cur = ""; n = 0; }
            cur += ch; n += b;
        }
        if(cur !== "" || !out.length) out.push(cur);
        return out;
    }
    function metaKey(){ return "are_gs_meta_" + APP; }
    function loadMeta(){ try{ var o = JSON.parse(lget(metaKey()) || "null"); if(o && typeof o === "object" && o.keys) return o; }catch(_e){} return {uid: null, keys: {}}; }
    function saveMeta(){ lset(metaKey(), JSON.stringify(S.meta)); }
    function localKeys(){ var out = []; try{ for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(inScope(k)) out.push(k); } }catch(_e){} return out; }
    function warn(m, e){ S.lastErr = m + (e && e.message ? ": " + e.message : ""); try{ console.warn("[ARE 引き継ぎ] " + S.lastErr); }catch(_e){} }

    // ---------- ログインの情報（チャットアプリのものを借りる）----------
    function readSession(){
        try{
            var o = JSON.parse(lget(SES_KEY) || "null");
            if(o && o.currentSession) o = o.currentSession;
            return o && typeof o.access_token === "string" && o.user && o.user.id ? o : null;
        }catch(_e){ return null; }
    }
    async function refreshSession(){
        var run = async function(){
            var cur = readSession();                                  // ほかの画面が 先に新しくしていたら、それを使う
            if(cur && (!cur.expires_at || cur.expires_at * 1000 > Date.now() + 60000)) return cur;
            if(!cur || !cur.refresh_token) return null;
            var r = await fetch(SB_URL + "/auth/v1/token?grant_type=refresh_token", {method: "POST", headers: {apikey: SB_KEY, "Content-Type": "application/json"}, body: JSON.stringify({refresh_token: cur.refresh_token})});
            if(!r.ok) return null;
            var j = await r.json();
            if(!j || !j.access_token) return null;
            var ns = Object.assign({}, cur, j); ns.expires_at = Math.floor(Date.now() / 1000) + (Number(j.expires_in) || 3600);
            lset(SES_KEY, JSON.stringify(ns));
            return ns;
        };
        try{
            if(navigator.locks && navigator.locks.request) return await navigator.locks.request("lock:" + SES_KEY, run);      // チャット側（gotrue）と同じ名前の鍵で 順番を守る
            return await run();
        }catch(_e){ return null; }
    }
    async function session(){
        var s = readSession(); if(!s) return null;
        if(s.expires_at && s.expires_at * 1000 < Date.now() + 30000){ s = await refreshSession(); if(!s) return null; }
        return {tok: s.access_token, uid: s.user.id};
    }

    // ---------- サーバーとの やりとり（PostgREST）----------
    async function rest(method, path, body, o){
        o = o || {};
        var ses = await session(); if(!ses || ses.uid !== S.uid) throw new Error("login");
        var h = {apikey: SB_KEY, Authorization: "Bearer " + ses.tok};
        if(body !== undefined) h["Content-Type"] = "application/json";
        if(o.prefer) h.Prefer = o.prefer;
        var init = {method: method, headers: h}; if(body !== undefined) init.body = JSON.stringify(body);
        if(o.keepalive && init.body && init.body.length < 60000) init.keepalive = true;
        var r = await fetch(SB_URL + "/rest/v1/" + path, init);
        if(!r.ok){ var t = ""; try{ t = (await r.text()).slice(0, 120); }catch(_e){} throw new Error(r.status + " " + t); }
        if(method === "GET" || (o.prefer && /return=representation/.test(o.prefer))) return r.json();
        return null;
    }
    var rowHead = function(id){ return "gh:" + APP + ":" + id; };
    var rowChunk = function(id, i){ return "gd:" + APP + ":" + id + ":" + i; };
    async function listHeads(only){
        var sel = encodeURIComponent("key,t:value->>t,k:value->>k,n:value->>n,len:value->>len,g:value->>g,d:value->>del"), rows = [];
        if(only){                                                      // 指定した項目だけ（送る前の 確認用。20件ずつ）
            for(var i = 0; i < only.length; i += 20){
                var keys = only.slice(i, i + 20).map(function(n){ return rowHead(idOf(n)); });
                rows = rows.concat(await rest("GET", "user_prefs?select=" + sel + "&user_id=eq." + S.uid + "&key=in.(" + keys.join(",") + ")") || []);
            }
        }else rows = await rest("GET", "user_prefs?select=" + sel + "&user_id=eq." + S.uid + "&key=like." + encodeURIComponent("gh:" + APP + ":%") + "&limit=2000") || [];
        var out = {};
        rows.forEach(function(x){
            var name = x.k; if(typeof name !== "string" || !inScope(name)) return;
            var id = String(x.key).slice(("gh:" + APP + ":").length);
            if(id !== idOf(name)) return;                          // 名前と番号が合わないもの（こわれ・いたずら）は 無視
            out[name] = {id: id, t: Number(x.t) || 0, n: x.n != null ? Number(x.n) : 0, len: x.len != null ? Number(x.len) : null, gas: x.g != null && x.g !== "", del: x.d != null && x.d !== ""};
        });
        return out;
    }
    async function fetchHeads(ids){          // 項目の中身つきの 先頭の行（20行ずつ）
        var by = {};
        for(var i = 0; i < ids.length; i += 20){
            var keys = ids.slice(i, i + 20).map(rowHead);
            var rows = await rest("GET", "user_prefs?select=key,value&user_id=eq." + S.uid + "&key=in.(" + keys.join(",") + ")");
            (rows || []).forEach(function(x){ by[x.key] = x.value; });
        }
        return by;
    }
    async function fetchChunks(id, n, len){
        var keys = []; for(var i = 0; i < n; i++) keys.push(rowChunk(id, i));
        var rows = await rest("GET", "user_prefs?select=key,value&user_id=eq." + S.uid + "&key=in.(" + keys.join(",") + ")");
        var by = {}; (rows || []).forEach(function(x){ by[x.key] = x.value; });
        var s = ""; for(var j = 0; j < keys.length; j++){ if(typeof by[keys[j]] !== "string") return null; s += by[keys[j]]; }
        if(len != null && s.length !== len) return null;             // 書きかけを読んだ → 今回は 採用しない
        return s;
    }

    // ---------- GAS ハブ（大きいもの）----------
    async function hubUrl(){
        if(S.hub !== undefined) return S.hub;
        S.hub = "";
        try{
            var ses = await session(); if(!ses) return "";
            var r = await fetch(SB_URL + "/rest/v1/rpc/my_aibot_config", {method: "POST", headers: {apikey: SB_KEY, Authorization: "Bearer " + ses.tok, "Content-Type": "application/json"}, body: "{}"});
            if(r.ok){ var j = await r.json(); if(j && typeof j.url === "string" && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(j.url)) S.hub = j.url; }
        }catch(_e){}
        return S.hub;
    }
    async function hubCall(body){
        var url = await hubUrl(); if(!url) throw new Error("hub");
        var ses = await session(); if(!ses) throw new Error("login");
        var r = await fetch(url, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(Object.assign({action: "sync", token: ses.tok, app: APP}, body))});
        var j = await r.json();
        if(!j || !j.ok) throw new Error((j && j.message) || "hub");
        return j;
    }

    // ---------- 送る ----------
    function tFor(name, floor){
        var m = S.meta.keys[name];
        return Math.max(S.touched[name] || Date.now(), (m ? m.t + 1 : 0), floor || 0);
    }
    async function pushOne(name, t, closing){
        var v = lget(name), id = idOf(name), old = S.meta.keys[name] || {}, now = new Date().toISOString(), head, rows = [], n = 0;
        if(v === null){ head = {k: name, t: t, del: 1}; }
        else if(bytes(v) <= INLINE){ head = {k: name, t: t, v: v}; }
        else if(v.length <= MAX_SQL){
            var parts = split(v); n = parts.length;
            parts.forEach(function(p, i){ rows.push({user_id: S.uid, key: rowChunk(id, i), value: p, updated_at: now}); });
            head = {k: name, t: t, n: n, len: v.length};
        }else if(v.length <= MAX_GAS){
            var it = {}; it[id] = {t: t, v: v};
            await hubCall({op: "push", items: it});                 // 使えない人は ここで例外 → 送らずに 次の機会へ
            head = {k: name, t: t, g: 1, len: v.length};
        }else{ warn("大きすぎて 同期しません: " + name); return "skip"; }
        rows.push({user_id: S.uid, key: rowHead(id), value: head, updated_at: now});
        await rest("POST", "user_prefs?on_conflict=user_id,key", rows, {prefer: "resolution=merge-duplicates,return=minimal", keepalive: closing});
        if(old.n > n){ var ks = []; for(var i = n; i < old.n; i++) ks.push(rowChunk(id, i)); try{ await rest("DELETE", "user_prefs?user_id=eq." + S.uid + "&key=in.(" + ks.join(",") + ")"); }catch(_e){} }
        S.meta.keys[name] = {t: t, s: t, h: vh(v), n: n};
        return "ok";
    }
    // dirty な項目（と、頼まれた項目）のうち、前に送ったものと ちがうものを送る
    async function pushNames(names, closing, forceT){
        var sent = 0;
        for(var i = 0; i < names.length; i++){
            var name = names[i]; if(!inScope(name)) { delete S.dirty[name]; continue; }
            var v = lget(name), m = S.meta.keys[name];
            if(m ? vh(v) === m.h : v === null){ delete S.dirty[name]; continue; }      // 変わっていない
            try{
                var r = await pushOne(name, Math.max(tFor(name), forceT && forceT[name] || 0), closing);
                if(r === "ok"){ sent++; delete S.dirty[name]; delete S.touched[name]; }
                else delete S.dirty[name];
            }catch(e){ warn("送れませんでした(" + name + ")", e); S.dirty[name] = 1; }
        }
        if(sent) saveMeta();
        return sent;
    }

    // ---------- 受け取る ----------
    function applyLocal(name, val, t, wasKnown){
        S.applying = true;
        try{
            var cur = lget(name);
            if(cur !== val){
                if(cur !== null && !wasKnown && cur.length < 200000) lset("are_gs_bak_" + name.slice(0, 80), cur);      // はじめての採用で ちがうとき、元の値を とっておく
                if(val === null) lrem(name); else lset(name, val);
            }
        }finally{ S.applying = false; }
        S.meta.keys[name] = {t: t, s: t, h: vh(val), n: (S.meta.keys[name] && S.meta.keys[name].n) || 0};
        delete S.dirty[name]; delete S.touched[name];
    }
    async function reconcile(only){
        var heads = await listHeads(only);
        var names = {};
        if(only) only.forEach(function(k){ if(inScope(k)) names[k] = 1; });
        else{
            localKeys().forEach(function(k){ names[k] = 1; });
            Object.keys(heads).forEach(function(k){ names[k] = 1; });
            Object.keys(S.meta.keys).forEach(function(k){ if(inScope(k)) names[k] = 1; });
        }
        var toApply = [], toPush = [], force = {};
        Object.keys(names).forEach(function(name){
            var L = lget(name), m = S.meta.keys[name], H = heads[name];
            var changed = m ? vh(L) !== m.h : L !== null;
            if(!H){ if(L !== null){ toPush.push(name); } return; }           // サーバーに無いのに 手元にある → 送る（サーバー側が空になっていたときの 回復も兼ねる）
            var serverNewer = m ? H.t > m.t : true;
            if(!m){ toApply.push(name); return; }                              // はじめて：サーバーを先に採用
            if(changed && !serverNewer){ toPush.push(name); return; }
            if(changed && serverNewer){
                // 両方が 変わっていた：ページを開いた直後の自動の書きこみ（毎日のボーナスなど）は サーバー優先。ふだんの操作は 時刻の新しいほう
                if(!S.boot[name] && S.touched[name] && S.touched[name] > H.t){ toPush.push(name); force[name] = H.t + 1; } else toApply.push(name);
                return;
            }
            if(serverNewer) toApply.push(name);
        });
        // 受け取り
        var applied = [];
        var need = toApply.filter(function(n){ return !heads[n].del; });
        var full = need.length ? await fetchHeads(need.map(function(n){ return heads[n].id; })) : {};
        var gasIds = [];
        need.forEach(function(n){ if(heads[n].gas) gasIds.push(heads[n].id); });
        var gasVals = {};
        if(gasIds.length){ try{ var gj = await hubCall({op: "pull", keys: gasIds}); gasVals = gj.items || {}; }catch(e){ warn("大きいデータを受け取れませんでした", e); } }
        for(var i = 0; i < toApply.length; i++){
            var name = toApply[i], H = heads[name], known = !!S.meta.keys[name], val;
            if(H.del) val = null;
            else{
                var row = full[rowHead(H.id)]; if(!row) continue;
                if(typeof row.v === "string") val = row.v;
                else if(H.gas){ var g = gasVals[H.id]; if(!g || typeof g.v !== "string" || (H.len != null && g.v.length !== H.len)) continue; val = g.v; }
                else if(H.n > 0){ try{ val = await fetchChunks(H.id, H.n, H.len); }catch(e){ val = null; warn("分けた項目を受け取れませんでした", e); } if(val === null) continue; }
                else continue;
            }
            var before = lget(name);
            applyLocal(name, val, H.t, known);
            if(before !== val) applied.push(name);
            if(S.meta.keys[name]) S.meta.keys[name].n = H.n || 0;
        }
        saveMeta();
        // 送る
        Object.keys(names).forEach(function(n){ if(toPush.indexOf(n) < 0) delete S.dirty[n]; });          // 送らなくてよいと わかったものは、あとで もう確認しない
        S.lastSent = await pushNames(toPush, false, force);
        return applied;
    }

    // ---------- 流れ ----------
    function queue(fn){ var p = S.busy.then(fn, fn); S.busy = p.catch(function(){}); return p; }
    function pull(){ return queue(async function(){
        if(!S.on) return [];
        var applied;
        try{ applied = await reconcile(); }catch(e){ warn("同期できませんでした", e); S.synced = true; return []; }
        S.synced = true; S.boot = {};
        if(applied.length) onApplied(applied);
        return applied;
    }); }
    function flush(closing){ return queue(async function(){
        if(!S.on) return 0;
        var names = Object.keys(S.dirty); if(!names.length) return 0;
        if(closing) return pushNames(names, true);                         // ページを閉じるとき：確認せずに すぐ送る
        // 送る前に サーバーの時刻を 確かめる（オフラインの間に ほかの端末が 新しく書いていたら、それを 消さない）
        S.lastSent = 0;
        var applied;
        try{ applied = await reconcile(names); }catch(e){ warn("送れませんでした", e); return 0; }
        if(applied.length) onApplied(applied);
        return S.lastSent;
    }); }
    function schedule(ms){ clearTimeout(S.timer); S.timer = setTimeout(function(){ flush(false).then(function(){ if(Object.keys(S.dirty).length) schedule(RETRY); }); }, ms || DEBOUNCE); }

    function onApplied(names){
        S.applied = S.applied.concat(names);
        try{ window.dispatchEvent(new CustomEvent("are-data-synced", {detail: {names: names}})); }catch(_e){}
        var recent = 0; try{ recent = Number(sessionStorage.getItem("are_gs_rl") || 0); }catch(_e){}
        var early = Date.now() - S.started < 20000 && !S.interacted;
        if(early && Date.now() - recent > 60000 && !window.ARE_SYNC_NORELOAD){          // まだ なにも さわっていないなら、読みこみ直して 反映する
            try{ sessionStorage.setItem("are_gs_rl", String(Date.now())); }catch(_e){}
            location.reload(); return;
        }
        toast("ほかの端末の「つづき」を 受け取りました。");
    }
    function toast(msg){
        try{
            if(!document.body){ document.addEventListener("DOMContentLoaded", function(){ toast(msg); }, {once: true}); return; }
            var old = document.getElementById("areSyncToast"); if(old) old.remove();
            var d = document.createElement("div"); d.id = "areSyncToast"; d.setAttribute("role", "status");
            d.style.cssText = "position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483600;max-width:92vw;background:#13204f;color:#fff;border:1px solid #8fb4ff;border-radius:12px;padding:10px 14px;font:14px/1.5 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center";
            var t = document.createElement("span"); t.textContent = msg;
            var b = document.createElement("button"); b.type = "button"; b.textContent = "読み込み直す";
            b.style.cssText = "background:#8fb4ff;color:#0b1330;border:0;border-radius:8px;padding:6px 10px;font:inherit;font-weight:700;cursor:pointer";
            b.addEventListener("click", function(){ location.reload(); });
            var x = document.createElement("button"); x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "とじる");
            x.style.cssText = "background:none;color:#fff;border:0;font:inherit;font-size:18px;cursor:pointer";
            x.addEventListener("click", function(){ d.remove(); });
            d.appendChild(t); d.appendChild(b); d.appendChild(x); document.body.appendChild(d);
            setTimeout(function(){ if(d.parentNode) d.remove(); }, 25000);
        }catch(_e){}
    }

    async function start(){
        if(S.on) return;
        try{ if(lget("are_gs_off") === "1" || /[?&]nosync=1/.test(location.search)) return; }catch(_e){}
        var ses = await session(); if(!ses) return;                              // チャットで ログアウトしている → 何もしない
        try{                                                                      // お試し（ゲスト）は 同期しない
            var g = await fetch(SB_URL + "/rest/v1/rpc/guest_status_me", {method: "POST", headers: {apikey: SB_KEY, Authorization: "Bearer " + ses.tok, "Content-Type": "application/json"}, body: "{}"});
            if(g.ok){ var gj = await g.json(); if(gj && gj.guest === true) return; }
        }catch(_e){ /* 判定できなくても つづける */ }
        S.uid = ses.uid; S.meta = loadMeta();
        if(S.meta.uid && S.meta.uid !== S.uid){                                   // 別の人に かわった：前の人の記録は この端末から 外す
            S.applying = true;
            try{ localKeys().forEach(function(k){ lrem(k); }); }finally{ S.applying = false; }
            S.meta = {uid: S.uid, keys: {}}; S.dirty = {}; S.touched = {};
        }
        S.meta.uid = S.uid; saveMeta();
        S.on = true;
        await pull();
        if(Object.keys(S.dirty).length) schedule(DEBOUNCE);
    }

    // ---------- 端末の書きこみを 見張る ----------
    function isLocal(o){ try{ return o === window.localStorage; }catch(_e){ return false; } }      // localStorage が使えない環境でも、sessionStorage の書きこみを こわさない
    Storage.prototype.setItem = function(k, v){
        LS_SET.call(this, k, v);
        if(isLocal(this) && !S.applying && inScope(k)){ S.touched[k] = Math.max(Date.now(), (S.touched[k] || 0) + 1); S.dirty[k] = 1; if(!S.synced) S.boot[k] = 1; if(S.on) schedule(); }
    };
    Storage.prototype.removeItem = function(k){
        LS_REM.call(this, k);
        if(isLocal(this) && !S.applying && inScope(k)){ S.touched[k] = Math.max(Date.now(), (S.touched[k] || 0) + 1); S.dirty[k] = 1; if(!S.synced) S.boot[k] = 1; if(S.on) schedule(); }
    };
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach(function(ev){ window.addEventListener(ev, function(){ S.interacted = true; }, {capture: true, passive: true}); });
    document.addEventListener("visibilitychange", function(){
        if(!S.on) return;
        if(document.hidden){ S.hiddenAt = Date.now(); flush(true).catch(function(){}); }
        else if(S.hiddenAt && Date.now() - S.hiddenAt > 60000){ flush(false).then(function(){ return pull(); }).catch(function(){}); }
    });
    window.addEventListener("pagehide", function(){ if(S.on) flush(true).catch(function(){}); });

    window.AREDataSync = {
        start: start, pull: pull, flush: function(){ return flush(false); },
        inScope: inScope, idOf: idOf,
        state: function(){ return {on: S.on, synced: S.synced, uid: S.uid, app: APP, dirty: Object.keys(S.dirty), keys: Object.keys(S.meta.keys).length, applied: S.applied.slice(), err: S.lastErr}; }
    };
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ start().catch(function(e){ warn("はじめられませんでした", e); }); }, {once: true});
    else start().catch(function(e){ warn("はじめられませんでした", e); });
})();
