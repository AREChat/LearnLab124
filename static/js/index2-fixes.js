/* 問題データの訂正（index2.js のあとに読み込む）
 * 2026-11-06：問題文の見直し。データ本体（index2.js）は変えず、読み込み直後にここで直します。
 *  1. 項目名の綴り違い（correct_cancer / question_t_text）と、余分な項目（choice_a_en）を直す
 *  2. ○×問題の選択肢を、問いの形に合わせる（「〜ですか？」→はい／いいえ、「〜である。」→正しい／誤り）
 *  3. 表示されない画像を前提にしていた問題を、問題文だけで解ける形に書きかえる
 *  4. 選択肢がかけていた問題を作り直す
 *  5. 答えが「YES」「いいえ」などの文字になっていて、選んでも必ず不正解になっていた問題（約300問）を、選択肢の記号（a／b）に直す
 */
(function () {
  'use strict';
  var NAMES = ['Python_veryeasy', 'Python_verybasic', 'Python_veryhard', 'Python_veryrandom', 'Python_easy', 'Python_Basic', 'Python_hard', 'Python',
    'SQL_Basic', 'SQL_easy', 'SQL_hard', 'SQL', 'WEB_Basic', 'WEB_easy', 'WEB_hard', 'WEB'];

  // 3・4：問題文（先頭がこの文字列で始まるもの）→ 書きかえる項目
  var REWRITE = [
    { start: 'コマンドプロンプトを起動するために、検索ボックスに入力する3文字の言葉は何ですか', set: {
      explanation: 'コマンドプロンプトを起動するための命令は「cmd」です。スタートメニューの検索ボックスに「cmd」と入力して開きます。' } },
    { start: 'ファイルをダブルクリックしたときに、自動で開くアプリのことを何と呼びますか', set: {
      explanation: '「既定のアプリ」とは、その種類のファイルを開くときの「お決まりのアプリ」のことです。たとえばPythonファイル（.py）は、既定のアプリに設定されたものが開きます。' } },
    { start: 'ファイルの既定のアプリを変更したいとき、まずファイルに対して行う操作は何ですか', set: {
      explanation: 'ファイルの設定を変更したり、特別な操作をしたりするときは、まず右クリックしてメニューを表示させます。右クリックから「プロパティ」を選ぶと、既定のアプリなどの設定を変えられます。' } },
    { start: 'Pythonのプログラムでは、`print` と `Print` のように', set: {
      explanation: 'Pythonでは、大文字と小文字が厳密に区別されます。たとえば `len` と書くべきところを `Len` と書くと、「その名前は知りません」というエラー（NameError）になります。' } },
    { start: '画像に表示された `NameError: name \'Len\' is not defined`', set: {
      question_text: 'Pythonで `Len([1, 2, 3])` を実行したところ、`NameError: name \'Len\' is not defined` というエラーが出ました。このエラーは何を意味していますか？' } },
    { start: '画像の最終結果を見ると、リスト`drink`には全部でいくつの飲み物が入っていますか', set: {
      question_text: "次のリストには、全部でいくつの飲み物が入っていますか？\n`drink = ['coffee', 'tea', 'milk', 'water']`",
      explanation: 'リストは `[\'coffee\', \'tea\', \'milk\', \'water\']` です。カンマで区切られた要素の数を数えると、4つあります。' } },
    { start: '画像のコード`for x in \'PYTHON\':`のように', set: {
      question_text: "`for x in 'PYTHON':` の `'PYTHON'` のように、文字がならんだものを何と呼びますか？" } },
    { start: 'プログラミングにおける「変数」の一番近い説明はどれですか', set: {
      explanation: '変数は、たとえば「宝物」という名前の箱に「ダイヤモンド」という1つのデータだけを入れるようなイメージです。中身を入れ替えることはできますが、同時には1つしか保持できません。' } },
    { start: 'プログラミングにおける「イテラブル」の一番近い説明はどれですか', set: {
      explanation: 'イテラブルは、自動販売機に複数の飲み物（データ）が順番に入っていて、ボタンを押して一つずつ取り出せるようなイメージです。リストや文字列が代表例です。' } },
    { start: '変数「宝物」の中身を「ダイヤモンド」から「金の延べ棒」に変えたいとき', set: {
      explanation: '変数の値は、新しい値を代入することで上書きされます。`宝物 = "金の延べ棒"` と書くことで、中身を入れ替えられます。' } },
    { start: '画像にある`for`文は何をするために使われていますか', set: {
      question_text: "次のコードの `for` 文は、何をするために使われていますか？\n```python\ndrinks = ['coffee', 'tea', 'milk']\nfor d in drinks:\n    print(d)\n```" } },
    { start: 'コード `for score in scores:` において、`scores`から取り出された個々の点数を', set: {
      explanation: '`for`ループでは、イテラブル`scores`から取り出した値が、ループの各回で一時的に変数`score`に代入されます。' } },
    { start: '画像のまとめ表によると、「変数」の役割として正しいものはどれですか', set: {
      question_text: '「変数」と「イテラブル」の違いをまとめたとき、「変数」の役割として正しいものはどれですか？',
      explanation: '変数の役割は「データを1つだけ保持する」ことです。例として`x = 10`のように、1つの値だけが入ります。' } },
    { start: '画像のまとめ表によると、「イテラブル」の役割として正しいものはどれですか', set: {
      question_text: '「変数」と「イテラブル」の違いをまとめたとき、「イテラブル」の役割として正しいものはどれですか？',
      explanation: 'イテラブルの役割は「複数のデータをまとめて保持し、繰り返し処理の対象となる」ことです。自動販売機のように、たくさんの商品が入っているイメージです。' } },
    { start: '画像の説明の結論として、変数とイテラブルの違いを理解すると', set: {
      question_text: '変数とイテラブルの違いを理解すると、特にどんなプログラミングの理解が深まりますか？',
      explanation: '特に `for` ループを使ったプログラミングの理解が深まります。`for` ループは、イテラブルから値を一つずつ取り出して変数に入れながら、繰り返し処理をするためです。' } },
    { start: '中身が何もない、空のリストを作成するにはどう書きますか', set: {
      question_text: '中身が何もない、空のリストを作るには、`my_list = ` のあとに何と書きますか？（角括弧2文字）',
      correct_answer: '[]' } },
    // 選択肢がかけていた問題
    { start: '`WeakMap`オブジェクトの主な特徴は何ですか', set: {
      choice_a: 'キーへの参照が「弱く」、ほかから参照されなくなると、キーと値が自動的に削除される',
      choice_b: 'キーに文字列しか使えない',
      choice_c: '`size`プロパティで要素数を調べられる',
      choice_d: 'キーと値が自動的にソートされる',
      correct_answer: 'a' } }
  ];

  function isQuestionForm(t) { return /[？?]/.test(t) || /(ですか|ますか|でしょうか)/.test(t); }
  var YES = { 'YES': 1, 'yes': 1, 'Yes': 1, 'はい': 1 }, NO = { 'NO': 1, 'no': 1, 'No': 1, 'いいえ': 1 };

  function fix(q) {
    if (!q || typeof q !== 'object') return;
    // 1：綴り違いと余分な項目
    if (q.question_text === undefined && q.question_t_text !== undefined) { q.question_text = q.question_t_text; delete q.question_t_text; }
    if (q.correct_answer === undefined && q.correct_cancer !== undefined) { q.correct_answer = q.correct_cancer; delete q.correct_cancer; }
    if (q.choice_a_en !== undefined) delete q.choice_a_en;
    // 答えが「a〜d」ではなく「YES」「いいえ」などの文字になっている問題を、選択肢の記号に直す
    // （そのままだと、どちらを選んでも不正解になってしまう）
    if (q.choice_a !== undefined && String(q.choice_a).trim() !== '' && ['a', 'b', 'c', 'd'].indexOf(q.correct_answer) < 0 && q.correct_answer !== undefined) {
      var ca = String(q.correct_answer).trim().toLowerCase(), found = '';
      ['a', 'b', 'c', 'd'].forEach(function (k) { if (!found && q['choice_' + k] !== undefined && String(q['choice_' + k]).trim().toLowerCase() === ca) found = k; });
      if (!found) {
        if (/^(yes|はい|○|〇|true|正しい|正しいです)$/.test(ca)) found = 'a';
        else if (/^(no|いいえ|×|false|誤り|間違い|間違っています)$/.test(ca)) found = 'b';
      }
      if (found) q.correct_answer = found;
    }
    var text = String(q.question_text || '');
    // 3・4：書きかえ
    for (var i = 0; i < REWRITE.length; i++) {
      if (text.indexOf(REWRITE[i].start) === 0) {
        for (var k in REWRITE[i].set) q[k] = REWRITE[i].set[k];
        text = String(q.question_text);
        break;
      }
    }
    // 2：○×問題の選択肢
    if (q.choice_a !== undefined && q.choice_b !== undefined && q.choice_c === undefined) {
      if (YES[q.choice_a] && NO[q.choice_b]) {
        if (isQuestionForm(text)) { q.choice_a = 'はい'; q.choice_b = 'いいえ'; }
        else { q.choice_a = '正しい'; q.choice_b = '誤り'; }
      }
    }
  }

  NAMES.forEach(function (n) {
    var arr = window[n];
    if (Array.isArray(arr)) arr.forEach(fix);
  });
})();
