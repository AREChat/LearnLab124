
const JMA = 'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json';
const WNI = 'https://site.weathernews.jp/lba/wxdata/api_data_ss1?lat=35.6812&lon=139.7671';
const YAHOO = 'https://transit.yahoo.co.jp/diainfo/area/4';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HOURS = 72, KEEP_H = 6;

const WX = {"100":"晴れ","101":"晴れ時々くもり","102":"晴れ一時雨","103":"晴れ時々雨","104":"晴れ一時雪","105":"晴れ時々雪","106":"晴れ一時雨か雪","107":"晴れ時々雨か雪","108":"晴れ一時雷雨","110":"晴れ後くもり","111":"晴れ後くもり","112":"晴れ後雨","113":"晴れ後時々雨","114":"晴れ後雨","115":"晴れ後雪","116":"晴れ後時々雪","117":"晴れ後雪","118":"晴れ後雨か雪","119":"晴れ後雨か雷雨","120":"晴れ一時雨","121":"晴れ一時雨","122":"晴れ夕方一時雨","123":"晴れ山沿い雷雨","124":"晴れ山沿い雪","125":"晴れ午後は雷雨","126":"晴れ昼頃から雨","127":"晴れ夕方から雨","128":"晴れ夜は雨","129":"晴れ夜半から雨","130":"朝の内霧のち晴れ","131":"晴れ朝方霧","132":"晴れ時々くもり","140":"晴れ時々雨","160":"晴れ一時雪か雨","170":"晴れ時々雪か雨","181":"晴れ後雪か雨","200":"くもり","201":"くもり時々晴れ","202":"くもり一時雨","203":"くもり時々雨","204":"くもり一時雪","205":"くもり時々雪","206":"くもり一時雨か雪","207":"くもり時々雨か雪","208":"くもり一時雷雨","209":"霧","210":"くもり後晴れ","211":"くもり後晴れ","212":"くもり後雨","213":"くもり後時々雨","214":"くもり後雨","215":"くもり後雪","216":"くもり後時々雪","217":"くもり後雪","218":"くもり後雨か雪","219":"くもり後雨か雷雨","220":"くもり朝夕一時雨","221":"くもり朝の内一時雨","222":"くもり夕方一時雨","223":"くもり日中時々晴れ","224":"くもり昼頃から雨","225":"くもり夕方から雨","226":"くもり夜は雨","227":"くもり夜半から雨","228":"くもり昼頃から雪","229":"くもり夕方から雪","230":"くもり夜は雪","231":"くもり海上海岸は霧か霧雨","240":"くもり時々雨で雷を伴う","250":"くもり時々雪で雷を伴う","260":"くもり一時雪か雨","270":"くもり時々雪か雨","281":"くもり後雪か雨","300":"雨","301":"雨時々晴れ","302":"雨時々止む","303":"雨時々雪","304":"雨か雪","306":"大雨","308":"雨で暴風を伴う","309":"雨一時雪","311":"雨後晴れ","313":"雨後くもり","314":"雨後雪","315":"雨後雪","316":"雨か雪後晴れ","317":"雨か雪後くもり","320":"朝の内雨後晴れ","321":"雨後くもり","322":"雨朝晩一時雪","323":"雨昼頃から晴れ","324":"雨夕方から晴れ","325":"雨夜は晴れ","326":"雨夕方から雪","327":"雨夜は雪","328":"雨一時強く降る","329":"雨一時みぞれ","340":"雪か雨","350":"雨で雷を伴う","361":"雪か雨後晴れ","371":"雪か雨後くもり","400":"雪","401":"雪時々晴れ","402":"雪時々止む","403":"雪時々雨","405":"大雪","406":"風雪強い","407":"暴風雪","409":"雪一時雨","411":"雪後晴れ","413":"雪後くもり","414":"雪後雨","420":"朝の内雪後晴れ","421":"朝の内雪後くもり","422":"雪昼頃から雨","423":"雪夕方から雨","424":"雪夜半から雨","425":"雪一時強く降る","426":"雪後みぞれ","427":"雪一時みぞれ","430":"みぞれ","450":"雪で雷を伴う","500":"快晴","550":"猛暑","552":"猛暑時々くもり","553":"猛暑時々雨","558":"猛暑時々大雨・嵐","562":"猛暑後くもり","563":"猛暑後雨","568":"猛暑後大雨・嵐","572":"くもり時々猛暑","573":"雨時々猛暑","582":"くもり後猛暑","583":"雨後猛暑","600":"うすぐもり","650":"小雨","800":"雷","850":"大雨・嵐","851":"大雨・嵐時々晴れ","852":"大雨・嵐時々くもり","853":"大雨・嵐時々雨","854":"大雨・嵐時々雪","855":"大雨・嵐時々猛暑","859":"大雨・嵐一時大雪","861":"大雨・嵐後晴れ","862":"大雨・嵐後くもり","863":"大雨・嵐後雨","864":"大雨・嵐後雪","865":"大雨・嵐後猛暑","869":"大雨・嵐後大雪","871":"晴れ時々大雨・嵐","872":"くもり時々大雨・嵐","873":"雨時々大雨・嵐","874":"雪時々大雨・嵐","881":"晴れ後大雨・嵐","882":"くもり後大雨・嵐","883":"雨後大雨・嵐","884":"雪後大雨・嵐","950":"大雪","951":"大雪時々晴れ","952":"大雪時々くもり","953":"大雪一時雨","954":"大雪時々雪","958":"大雪一時大雨","961":"大雪後晴れ","962":"大雪後くもり","963":"大雪後雨","964":"大雪後雪","968":"大雪後大雨・嵐","971":"晴れ一時大雪","972":"くもり一時大雪","973":"雨一時大雪","974":"雪一時大雪","981":"晴れ後大雪","982":"くもり後大雪","983":"雨後大雪","984":"雪後大雪","999":"データなし"};

const pad = n => String(n).padStart(2, '0');
// JST 表記(タイムゾーン非依存)
function jst(ms) {
  const d = new Date(ms + 9 * 3600e3);
  return { iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+09:00`,
           hm: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` };
}
async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.json();
}
const area = (ts, name) => (ts?.areas || []).find(a => a?.area?.name === name) || null;

async function weather() {
  const [jma, wni] = await Promise.all([getJson(JMA), getJson(WNI)]);
  if (!jma?.length || !wni?.srf) throw new Error('APIデータが空です');
  const sf = jma[0] || {}, wk = jma[1] || {};
  const ts = sf.timeSeries || [];
  const wts = ts[0] || {}, pts = ts[1] || {}, tts = ts[2] || {};
  const weathers = area(wts, '東京地方')?.weathers || [];
  const temps = area(tts, '東京')?.temps || [];
  const pops = area(pts, '東京地方')?.pops || [];
  const popBy = {};
  (pts.timeDefines || []).forEach((t, i) => { if (i < pops.length) popBy[t] = pops[i]; });
  const dates = (wts.timeDefines || []).map(d => d.split('T')[0]);
  const wkTs = (wk.timeSeries || [])[1] || {};
  const wkCity = area(wkTs, '東京');
  const wkDates = (wkTs.timeDefines || []).map(d => d.split('T')[0]);

  const num = v => (v === undefined || v === '' || v === null ? NaN : Number(v));
  const forecasts = dates.map((date, i) => {
    let tmin = '--', tmax = '--';
    const pair = i === 0 ? [temps[0], temps[1]] : i === 1 ? [temps[2], temps[3]] : [];
    const nums = pair.map(num).filter(n => !isNaN(n));
    if (nums.length === 2) { tmin = String(Math.min(...nums)); tmax = String(Math.max(...nums)); }
    else if (nums.length === 1) { tmax = String(nums[0]); }
    if (wkCity && (tmin === '--' || tmax === '--')) {
      const k = wkDates.indexOf(date);
      if (k >= 0) {
        if (tmin === '--' && wkCity.tempsMin?.[k]) tmin = wkCity.tempsMin[k];
        if (tmax === '--' && wkCity.tempsMax?.[k]) tmax = wkCity.tempsMax[k];
      }
    }
    return {
      date, weather: weathers[i] ?? '--', temp_min: tmin, temp_max: tmax,
      chance_of_rain: ['00', '06', '12', '18'].map(h => popBy[`${date}T${h}:00:00+09:00`] ?? '--'),
    };
  });
  const hourly = wni.srf.slice(0, HOURS).map(h => {
    const t = jst(Number(h.tm) * 1000);
    return { iso_time: t.iso, time: t.hm, weather: WX[String(h.WX)] || `コード${h.WX}`,
             temp: String(Math.round(parseFloat(h.AIRTMP))), precip: h.PREC ?? '0' };
  });
  const now = Date.now();
  return { publishingOffice: sf.publishingOffice || '気象庁', reportDatetime: sf.reportDatetime || jst(now).iso,
           generatedAt: jst(now).iso, expiresAt: jst(now + KEEP_H * 3600e3).iso, forecasts, hourly_forecast: hourly };
}

const txt = h => h.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
function rows(html) {
  const out = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const td = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => txt(x[1]));
    if (td.length === 3) out.push({ name: td[0], status: td[1], detail: td[2] });
  }
  return out;
}
async function train() {
  const r = await fetch(YAHOO, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`yahoo HTTP ${r.status}`);
  const html = await r.text();
  const lines = [], seen = new Set();
  const ti = html.indexOf('id="mdStatusTroubleLine"');
  if (ti >= 0) {
    const end = html.indexOf('</table>', ti);
    for (const x of rows(html.slice(ti, end > 0 ? end : ti))) { lines.push(x); seen.add(x.name); }
  }
  const mi = html.indexOf('id="main"');
  for (const x of rows(mi >= 0 ? html.slice(mi) : html)) if (!seen.has(x.name)) { lines.push(x); seen.add(x.name); }
  if (!lines.length) throw new Error('路線情報を取得できませんでした');
  const now = Date.now();
  return { lastUpdated: jst(now).iso, generatedAt: jst(now).iso, expiresAt: jst(now + KEEP_H * 3600e3).iso, lines };
}

// Neon の SQL over HTTP（ドライバ不要）
async function save(key, payload) {
  const cs = process.env.DATABASE_URL;
  const host = new URL(cs.replace(/^postgres(ql)?:/, 'http:')).hostname;
  const r = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': cs },
    body: JSON.stringify({
      query: 'insert into public.site_data (key, payload, updated_at) values ($1, $2::jsonb, now()) on conflict (key) do update set payload = excluded.payload, updated_at = now()',
      params: [key, JSON.stringify(payload)],
    }),
  });
  if (!r.ok) throw new Error('db ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const only = url.searchParams.get('only');
    const result = {};
    for (const [key, fn] of [['weather', weather], ['train', train]]) {
      if (only && only !== key) continue;
      try { await save(key, await fn()); result[key] = 'ok'; console.log(key, 'ok'); }
      catch (e) { result[key] = 'error: ' + e.message; console.error(key, e.message); }
    }
    return new Response(JSON.stringify(result), { status: Object.values(result).some(v => v !== 'ok') ? 500 : 200, headers: { 'content-type': 'application/json' } });
  },
};
