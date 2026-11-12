"use strict";
// ===== LearnLab124 サービスワーカー（オフライン対応）=====
// ・インストール時に、全ページ・JS・CSS・データ・画像・音を まとめて保存（約12MB）→ ネットが なくても 学習できる
// ・画面（html）はネット優先（4秒まって だめなら 控え）。JS/CSS/データは 控え先・裏で更新（2回目から速い）
// ・GET 以外／ほかのサイト（Neon など）には さわらない
// ・ファイルを足す・消す・変えたら  node tools/gen-precache.js  を実行し、下の CACHE の数字を上げる
importScripts("precache-manifest.js", "sw-core.js");
const CACHE = "study-cache-v22-" + (self.ARE_MANIFEST ? self.ARE_MANIFEST.v : "0");
const core = self.areCore({shell: CACHE, root: "./", precache: true, swr: true, owns: (k) => k.indexOf("study-cache-") === 0});
self.addEventListener("install", () => { self.skipWaiting(); });
