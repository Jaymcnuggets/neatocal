/*

MIT License

Copyright (c) 2022 Neatnik LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var NEATOCAL_PARAM = {

  // experiments with filling in data in cells
  //
  "data_fn": "",

  "data": { },
  "ics_import_count": 0,
  "ics_imports": [],
  "ics": false,

  "color_cell": [],

  // Putting data in cells can alter the cell/row height,
  // so we allow a user parameter to fiddle with cell height.
  // The parameter here is directly applied to the `tr` style,
  // so values of "1.5em" or "30px" will work.
  //
  "cell_height": "",

  // show info/help screen
  //
  "help" : false,

  // for aligned-weekdays, which day to start (0 indexed)
  //
  //   Monday (1) default
  //
  "start_day": 1,

  // calendar format
  //
  //   default
  //   aligned-weekdays
  //
  "format": "default",

  // year to start
  //
  //   default this year
  //
  "year": new Date().getFullYear(),

  // Text to use for displaying weekdays
  //
  "weekday_code" : [ "Su", "M", "T", "W", "R", "F", "Sa"  ],

  // Weekday representation https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#weekday
  //
  //   long
  //   short
  //   narrow
  //
  "weekday_format": "short",

  // text to sue for month header
  //
  "month_code": [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],

  // Month representation https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#month
  //
  //   numeric
  //   2-digit
  //   long
  //   short
  //   narrow
  //
  "month_format": "short",

  // weekend days (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)
  // Default Sunday Monday.
  //
  "weekend_days": [ 0, 6 ],

  //
  "language" : "",

  // start month (0 indexed)
  //
  //   Janurary (0) default
  //
  "start_month" : 0,

  // number of months to go out to
  //
  "n_month" : 12,

  // weekend highlight color
  //
  "highlight_color": '#eee',

  // today's date highlight color
  //
  "today_highlight_color": '',

  // Moon phase display options
  //
  "show_moon_phase": false,
  "moon_phase_style": "css",  // "css", "symbol", "name"
  "moon_phase_position": "below",  // "below", "inline"
  "moon_phase_display": "changes",  // "all", "changes"
  //
  // show week numbers
  //
  "show_week_numbers": false,

  // fiddly parameters
  //
  "year_font_size": undefined,
  "year_font_weight": undefined,
  "year_foreground_color": undefined,
  "year_background_color": undefined,

  "month_font_size": undefined,
  "month_font_weight": undefined,
  "month_foreground_color": undefined,
  "month_background_color": undefined,

  "weekday_font_size": undefined,
  "weekday_font_weight": undefined,
  "weekday_foreground_color": undefined,
  "weekday_background_color": undefined,

  "weekend_font_size": undefined,
  "weekend_font_weight": undefined,
  "weekend_foreground_color": undefined,
  "weekend_background_color": undefined,

  "week_font_size": undefined,
  "week_font_weight": undefined,
  "week_foreground_color": undefined,
  "week_background_color": undefined,

  "date_font_size": undefined,
  "date_font_weight": undefined,
  "date_foreground_color": undefined,
  "date_background_color": undefined,

  "weekend_date_font_size": undefined,
  "weekend_date_font_weight": undefined,
  "weekend_date_foreground_color": undefined,
  "weekend_date_background_color": undefined

};

// -----------------------------
// Todos + settings (localStorage)
// -----------------------------

var NEATOCAL_TODO = {
  storage_key: "neatocal.todos.v1",
  settings_key: "neatocal.settings.v1",
  schema_version: 1,
  state: null,
  cache: {
    byDate: {},
    statsByDate: {},
    overall: { done: 0, total: 0, percent: 0, asOf: "" }
  }
};

function dbg_log(funcName) {
  // Usage: dbg_log("todoLoad")("msg", obj)
  return function() {
    let args = Array.from(arguments);
    args.unshift("[DEBUG::NeatoCal::" + funcName + "]");
    console.log.apply(console, args);
  };
}

function safe_json_parse(raw, fallback) {
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

function ls_get_json(key, fallback) {
  try {
    let raw = window.localStorage.getItem(key);
    if (!raw) { return fallback; }
    return safe_json_parse(raw, fallback);
  } catch (e) {
    dbg_log("localStorageGet")("error", key, e);
    return fallback;
  }
}

function ls_set_json(key, val) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (e) {
    dbg_log("localStorageSet")("error", key, e);
    return false;
  }
}

function gen_id(prefix) {
  let p = prefix || "id";
  return p + "_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function date_to_yyyy_mm_dd(dt) {
  return fmt_date(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

function clamp_date_to_day(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function parse_yyyy_mm_dd(s) {
  if (!s || typeof s !== "string") { return null; }
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) { return null; }
  let y = parseInt(m[1], 10);
  let mo = parseInt(m[2], 10) - 1;
  let d = parseInt(m[3], 10);
  let dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) { return null; }
  return dt;
}

function is_valid_yyyy_mm_dd(s) {
  return parse_yyyy_mm_dd(s) !== null;
}

function min_date(a, b) {
  return (a.getTime() <= b.getTime()) ? a : b;
}

function max_date(a, b) {
  return (a.getTime() >= b.getTime()) ? a : b;
}

function add_days(dt, n) {
  let d = new Date(dt.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

function days_in_month(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}

function apply_neatocal_param_from_object(obj) {
  // Apply a whitelist of settings; used by settings modal + load-on-startup
  let allowed = new Set([
    "year", "layout", "start_day", "start_month", "n_month",
    "weekday_code", "weekday_format", "month_code", "month_format",
    "weekend_days", "language",
    "show_moon_phase", "moon_phase_style", "moon_phase_position", "moon_phase_display",
    "cell_height", "highlight_color", "today_highlight_color",
    "show_week_numbers",
    "year_font_size", "year_font_weight", "year_foreground_color", "year_background_color",
    "month_font_size", "month_font_weight", "month_foreground_color", "month_background_color",
    "weekday_font_size", "weekday_font_weight", "weekday_foreground_color", "weekday_background_color",
    "weekend_font_size", "weekend_font_weight", "weekend_foreground_color", "weekend_background_color",
    "week_font_size", "week_font_weight", "week_foreground_color", "week_background_color",
    "date_font_size", "date_font_weight", "date_foreground_color", "date_background_color",
    "weekend_date_font_size", "weekend_date_font_weight", "weekend_date_foreground_color", "weekend_date_background_color"
  ]);

  if (!obj || typeof obj !== "object") { return; }
  Object.keys(obj).forEach((k) => {
    if (!allowed.has(k)) { return; }
    NEATOCAL_PARAM[k] = obj[k];
  });
}

function neatocal_settings_load() {
  let log = dbg_log("settingsLoad");
  let settings = ls_get_json(NEATOCAL_TODO.settings_key, null);
  if (!settings || typeof settings !== "object") {
    log("no settings found");
    return;
  }
  log("loaded keys", Object.keys(settings));
  apply_neatocal_param_from_object(settings);
}

function neatocal_settings_save() {
  let log = dbg_log("settingsSave");
  // Only persist the whitelisted settings by reusing the same whitelist logic
  let out = {};
  // Explicitly pick from the whitelist used above (to avoid persisting data/data_fn/etc.)
  let allowedKeys = [
    "year", "layout", "start_day", "start_month", "n_month",
    "weekday_code", "weekday_format", "month_code", "month_format",
    "weekend_days", "language",
    "show_moon_phase", "moon_phase_style", "moon_phase_position", "moon_phase_display",
    "cell_height", "highlight_color", "today_highlight_color",
    "show_week_numbers",
    "year_font_size", "year_font_weight", "year_foreground_color", "year_background_color",
    "month_font_size", "month_font_weight", "month_foreground_color", "month_background_color",
    "weekday_font_size", "weekday_font_weight", "weekday_foreground_color", "weekday_background_color",
    "weekend_font_size", "weekend_font_weight", "weekend_foreground_color", "weekend_background_color",
    "week_font_size", "week_font_weight", "week_foreground_color", "week_background_color",
    "date_font_size", "date_font_weight", "date_foreground_color", "date_background_color",
    "weekend_date_font_size", "weekend_date_font_weight", "weekend_date_foreground_color", "weekend_date_background_color"
  ];
  for (let i = 0; i < allowedKeys.length; i++) {
    let k = allowedKeys[i];
    if (typeof NEATOCAL_PARAM[k] !== "undefined") {
      out[k] = NEATOCAL_PARAM[k];
    }
  }
  out.schemaVersion = 1;
  let ok = ls_set_json(NEATOCAL_TODO.settings_key, out);
  log("saved", ok, "keys", Object.keys(out));
  return ok;
}

function neatocal_todo_default_state() {
  return {
    schemaVersion: NEATOCAL_TODO.schema_version,
    oneOffByDate: {},
    seriesById: {},
    instanceState: {},
    seriesExceptions: {}
  };
}

function neatocal_todo_load() {
  let log = dbg_log("todoLoad");
  let state = ls_get_json(NEATOCAL_TODO.storage_key, null);
  if (!state || typeof state !== "object") {
    log("no state found; creating default");
    state = neatocal_todo_default_state();
    ls_set_json(NEATOCAL_TODO.storage_key, state);
  }
  if (state.schemaVersion !== NEATOCAL_TODO.schema_version) {
    log("schema mismatch", state.schemaVersion, "expected", NEATOCAL_TODO.schema_version, "resetting");
    state = neatocal_todo_default_state();
    ls_set_json(NEATOCAL_TODO.storage_key, state);
  }
  NEATOCAL_TODO.state = state;
  log("loaded", {
    oneOffDates: Object.keys(state.oneOffByDate || {}).length,
    series: Object.keys(state.seriesById || {}).length,
    instanceState: Object.keys(state.instanceState || {}).length
  });
  return state;
}

function neatocal_todo_save() {
  let log = dbg_log("todoSave");
  if (!NEATOCAL_TODO.state) {
    NEATOCAL_TODO.state = neatocal_todo_default_state();
  }
  let ok = ls_set_json(NEATOCAL_TODO.storage_key, NEATOCAL_TODO.state);
  log("saved", ok);
  return ok;
}

var ICS_PALETTE = [
  { "bg": "#cfe8ff", "fg": "#000000" },
  { "bg": "#1e4f8a", "fg": "#ffffff" },
  { "bg": "#ffd6d6", "fg": "#000000" },
  { "bg": "#8a1f2b", "fg": "#ffffff" },
  { "bg": "#d8f5d0", "fg": "#000000" },
  { "bg": "#1f6b3d", "fg": "#ffffff" },
  { "bg": "#fff2b3", "fg": "#000000" },
  { "bg": "#8a6b10", "fg": "#ffffff" }
];

// use __base to allow additional events from ics files to be
// consolidated with any supplied via data param on page load
function data_clone_base(data) {
  let clone = JSON.parse(JSON.stringify(data || {}));
  if (clone && typeof clone === "object") {
    delete clone.__base;
  }
  return clone;
}

function data_set_base(data) {
  let base = data_clone_base(data);
  let current = data_clone_base(base);
  current.__base = base;
  NEATOCAL_PARAM.data = current;
}

// simple HTML convenience functions
//
var H = {
  "text": function(txt) { return document.createTextNode(txt); },
  "div": function() { return document.createElement("div"); },
  "tr": function() { return document.createElement("tr"); },
  "th": function(v) {
    let th = document.createElement("th");
    if (typeof v !== "undefined") { th.innerHTML = v; }
    return th;
  },
  "td": function() { return document.createElement("td"); },
  "span": function(v,_class) {
    let s = document.createElement("span");
    if (typeof v !== "undefined") { s.innerHTML = v; }
    if (typeof _class !== "undefined") { s.classList.add(_class); }
    return s;
  }
};

// Probably overkill but have parameters to fiddle with the weekend text, weekday text,
// date (day in month) text, month text, week number (if specified) and dates that fall
// on the weekend (day in month that are also weekends).
// Logic is in each of the render functions but the idea is that date stylings happens
// first then weekend_date stylings are applied.
//
// ele is the HTML element that class stylings are being applied.
// _type is one of "weekend", "weekday", "date", "month", "week", "weekend_date"
//
// _type is checked for validity from the `valid_types` array.
// If not found, returns.
//
// If found, each of the parameter variables is enumerated by tacking on the suffix
// in the `sfx_param` array and testing to see if specified in the NEATOCAL_PARAM list.
// If found, the class stylings are applied to the HTML element using the `class_key`
// value specified.
//
function ele_styles(ele, _type) {
  let valid_type = ["weekend", "weekday", "date", "month", "week", "weekend_date", "year"];
  let sfx_param = [ "_font_size", "_font_weight", "_foreground_color", "_background_color"];
  let class_key = ["fontSize", "fontWeight", "color", "background"];

  let _t = "";
  for (let i=0; i<valid_type.length; i++) {
    if (valid_type[i] == _type) { _t = valid_type[i];  break; }
  }
  if (_t == "") { return; }

  for (let i=0; i<sfx_param.length; i++) {
    let _param = _t + sfx_param[i];
    if ((_param in NEATOCAL_PARAM) &&
        (typeof NEATOCAL_PARAM[_param] !== "undefined")) {
      ele.style[class_key[i]] = NEATOCAL_PARAM[_param];
    }
  }

}

// for convenience, functions wrap the above meta function
//
function weekend_styles(weekend_ele) { ele_styles(weekend_ele, "weekend"); }
function weekday_styles(weekday_ele) { ele_styles(weekday_ele, "weekday"); }
function week_styles(week_ele) { ele_styles(week_ele, "week"); }
function date_styles(date_ele) { ele_styles(date_ele, "date"); }
function weekend_date_styles(weekend_date_ele) { ele_styles(weekend_date_ele, "weekend_date"); }
function month_styles(month_ele) { ele_styles(month_ele, "month"); }
function year_styles(year_ele) { ele_styles(year_ele, "year"); }

function render_cell_data(td, yyyy_mm_dd) {
  if (!(yyyy_mm_dd in NEATOCAL_PARAM.data)) { return; }

  let val = NEATOCAL_PARAM.data[yyyy_mm_dd];

  if (typeof val === "string") {
    let txt = H.div();
    txt.innerHTML = val;
    txt.style.textAlign = "center";
    txt.style.fontWeight = "300";
    td.appendChild(txt);
    return;
  }

  if (!Array.isArray(val)) { return; }

  for (let i = 0; i < val.length; i++) {
    let item = val[i];

    // for simple data, just render text
    //
    if (typeof item === "string") {
      let txt = H.div();
      txt.innerHTML = item;
      txt.style.textAlign = "center";
      txt.style.fontWeight = "300";
      td.appendChild(txt);
      continue;
    }

    // for more complex date information,
    // from iCal, say, decorate with extra
    // markup
    //
    let line = H.div();
    line.classList.add("event");
    line.textContent = item.title || "";

    if (item.color) {
      line.style.background = item.color;
    }
    if (item.text_color) {
      line.style.color = item.text_color;
    }
    if (item.span) {
      line.classList.add("event-span");
      if (item.span.start) { line.classList.add("event-span-start"); }
      if (item.span.end) { line.classList.add("event-span-end"); }
    }

    td.appendChild(line);
  }
}

function render_todo_cell_data(td, yyyy_mm_dd) {
  if (!NEATOCAL_TODO || !NEATOCAL_TODO.cache || !NEATOCAL_TODO.cache.byDate) { return; }
  let items = NEATOCAL_TODO.cache.byDate[yyyy_mm_dd];
  if (!items || items.length === 0) { return; }

  // Compact render inside cell: show up to 2, plus summary badge
  let stats = NEATOCAL_TODO.cache.statsByDate[yyyy_mm_dd] || { done: 0, total: items.length };

  let container = H.div();
  container.classList.add("todo-container");

  let badge = H.div();
  badge.classList.add("todo-badge");
  badge.textContent = stats.done.toString() + "/" + stats.total.toString();
  container.appendChild(badge);

  let max_show = 2;
  for (let i = 0; i < items.length && i < max_show; i++) {
    let it = items[i];
    let row = H.div();
    row.classList.add("todo-item");
    if (it.completed) { row.classList.add("todo-completed"); }

    let cb = document.createElement("input");
    cb.type = "checkbox";
    cb.classList.add("todo-checkbox");
    cb.checked = !!it.completed;
    cb.dataset.date = yyyy_mm_dd;
    cb.dataset.kind = it.kind;
    if (it.kind === "oneoff") {
      cb.dataset.id = it.id;
    } else if (it.kind === "series") {
      cb.dataset.seriesId = it.seriesId;
      cb.dataset.instanceKey = it.instanceKey;
    }

    let label = H.span("", "todo-title");
    label.textContent = it.title || "";
    label.dataset.date = yyyy_mm_dd;
    label.dataset.kind = it.kind;
    if (it.kind === "oneoff") {
      label.dataset.id = it.id;
    } else {
      label.dataset.seriesId = it.seriesId;
      label.dataset.instanceKey = it.instanceKey;
    }

    row.appendChild(cb);
    row.appendChild(label);
    container.appendChild(row);
  }

  if (items.length > max_show) {
    let more = H.div();
    more.classList.add("todo-more");
    more.textContent = "+" + (items.length - max_show).toString() + " more";
    container.appendChild(more);
  }

  td.appendChild(container);
}

function add_event_to_date(yyyy_mm_dd, event) {
  if (!(yyyy_mm_dd in NEATOCAL_PARAM.data)) {
    NEATOCAL_PARAM.data[yyyy_mm_dd] = [];
  } else if (!Array.isArray(NEATOCAL_PARAM.data[yyyy_mm_dd])) {
    NEATOCAL_PARAM.data[yyyy_mm_dd] = [NEATOCAL_PARAM.data[yyyy_mm_dd]];
  }
  NEATOCAL_PARAM.data[yyyy_mm_dd].push(event);
}

function get_view_range() {
  let start = new Date(NEATOCAL_PARAM.year, NEATOCAL_PARAM.start_month, 1);
  let end = new Date(NEATOCAL_PARAM.year, NEATOCAL_PARAM.start_month + NEATOCAL_PARAM.n_month, 1);
  return { start: start, end: end };
}

function neatocal_todo_ensure_loaded() {
  if (!NEATOCAL_TODO.state) {
    neatocal_todo_load();
  }
}

function neatocal_todo_get_series_ex(seriesId) {
  if (!NEATOCAL_TODO.state.seriesExceptions) { NEATOCAL_TODO.state.seriesExceptions = {}; }
  if (!(seriesId in NEATOCAL_TODO.state.seriesExceptions)) {
    NEATOCAL_TODO.state.seriesExceptions[seriesId] = { skipDates: [] };
  }
  let ex = NEATOCAL_TODO.state.seriesExceptions[seriesId];
  if (!Array.isArray(ex.skipDates)) { ex.skipDates = []; }
  return ex;
}

function neatocal_todo_is_skipped(seriesId, dateStr) {
  let ex = NEATOCAL_TODO.state.seriesExceptions && NEATOCAL_TODO.state.seriesExceptions[seriesId];
  if (!ex) { return false; }
  if (ex.terminatedAfterDate && is_valid_yyyy_mm_dd(ex.terminatedAfterDate)) {
    if (dateStr > ex.terminatedAfterDate) { return true; }
  }
  if (Array.isArray(ex.skipDates) && ex.skipDates.indexOf(dateStr) >= 0) { return true; }
  return false;
}

function neatocal_todo_instance_state(seriesId, dateStr) {
  if (!NEATOCAL_TODO.state.instanceState) { NEATOCAL_TODO.state.instanceState = {}; }
  let k = seriesId + "|" + dateStr;
  return NEATOCAL_TODO.state.instanceState[k] || null;
}

function neatocal_todo_expand_series_into_view(series, viewStart, viewEnd) {
  let log = dbg_log("recurExpand");
  let out = [];
  if (!series || !series.rule || !series.startDate) { return out; }
  if (!is_valid_yyyy_mm_dd(series.startDate)) { return out; }

  let startDt = parse_yyyy_mm_dd(series.startDate);
  let rule = series.rule || {};
  let freq = rule.freq || "daily";
  let interval = parseInt(rule.interval || 1, 10);
  if (isNaN(interval) || interval < 1) { interval = 1; }

  // End handling
  let end = series.end || { type: "never" };
  let endType = end.type || "never";
  let untilDate = (endType === "until" && end.untilDate && is_valid_yyyy_mm_dd(end.untilDate)) ? end.untilDate : null;
  let maxCount = (endType === "count") ? parseInt(end.count || 0, 10) : null;
  if (endType === "count" && (isNaN(maxCount) || maxCount < 1)) { maxCount = 1; }

  // We generate sequentially and count occurrences even if outside viewStart,
  // so count-based series remain accurate.
  let occCount = 0;

  function include_date(dt) {
    let ds = date_to_yyyy_mm_dd(dt);
    if (untilDate && ds > untilDate) { return false; }
    if (endType === "count" && occCount >= maxCount) { return false; }
    if (neatocal_todo_is_skipped(series.id, ds)) { return true; } // counts still advance for skipped? Google-style skips still counts as occurrence? We'll count it as occurrence for end=count.
    return true;
  }

  function maybe_add(dt) {
    let ds = date_to_yyyy_mm_dd(dt);
    if (untilDate && ds > untilDate) { return false; }
    if (endType === "count" && occCount >= maxCount) { return false; }

    // Advance count for each logical occurrence (even if skipped)
    occCount += 1;

    if (neatocal_todo_is_skipped(series.id, ds)) { return true; }
    if (dt >= viewStart && dt < viewEnd) {
      out.push(ds);
    }
    return true;
  }

  if (freq === "daily") {
    let dt = clamp_date_to_day(startDt);
    while (dt < viewEnd) {
      if (!maybe_add(dt)) { break; }
      dt = add_days(dt, interval);
      if (untilDate && date_to_yyyy_mm_dd(dt) > untilDate) { break; }
      if (endType === "count" && occCount >= maxCount) { break; }
    }
  }

  else if (freq === "weekly") {
    let byWeekday = Array.isArray(rule.byWeekday) ? rule.byWeekday.slice() : [];
    if (byWeekday.length === 0) {
      byWeekday = [startDt.getDay()];
    }
    byWeekday = byWeekday.map(x => parseInt(x, 10)).filter(x => !isNaN(x) && x >= 0 && x <= 6);
    byWeekday.sort((a,b) => a-b);

    let startWeekStart = add_days(clamp_date_to_day(startDt), -startDt.getDay()); // Sunday start
    let weekIndex = 0;
    while (true) {
      let weekStart = add_days(startWeekStart, 7 * interval * weekIndex);
      if (weekStart >= viewEnd) { break; }
      for (let i = 0; i < byWeekday.length; i++) {
        let dt = add_days(weekStart, byWeekday[i]);
        if (dt < clamp_date_to_day(startDt)) { continue; }
        if (dt >= viewEnd) { continue; }
        if (!maybe_add(dt)) { weekIndex = 1e9; break; }
      }
      if (endType === "count" && occCount >= maxCount) { break; }
      if (untilDate && date_to_yyyy_mm_dd(weekStart) > untilDate) { break; }
      weekIndex += 1;
    }
  }

  else if (freq === "monthly") {
    let startY = startDt.getFullYear();
    let startM = startDt.getMonth();
    let dom = startDt.getDate();
    let moIndex = 0;
    while (true) {
      let m = startM + moIndex * interval;
      let y = startY + Math.floor(m / 12);
      let mm = ((m % 12) + 12) % 12;
      let dim = days_in_month(y, mm);
      let d = Math.min(dom, dim);
      let dt = new Date(y, mm, d);
      if (dt >= viewEnd) { break; }
      if (dt >= clamp_date_to_day(startDt)) {
        if (!maybe_add(dt)) { break; }
      }
      if (endType === "count" && occCount >= maxCount) { break; }
      if (untilDate && date_to_yyyy_mm_dd(dt) > untilDate) { break; }
      moIndex += 1;
    }
  }

  else if (freq === "yearly") {
    let startY = startDt.getFullYear();
    let mo = startDt.getMonth();
    let dom = startDt.getDate();
    let yIndex = 0;
    while (true) {
      let y = startY + yIndex * interval;
      let dim = days_in_month(y, mo);
      let d = Math.min(dom, dim);
      let dt = new Date(y, mo, d);
      if (dt >= viewEnd) { break; }
      if (dt >= clamp_date_to_day(startDt)) {
        if (!maybe_add(dt)) { break; }
      }
      if (endType === "count" && occCount >= maxCount) { break; }
      if (untilDate && date_to_yyyy_mm_dd(dt) > untilDate) { break; }
      yIndex += 1;
    }
  }

  log(series.id, freq, "interval", interval, "occTotal", occCount, "inView", out.length);
  return out;
}

function neatocal_todo_recompute_cache() {
  let log = dbg_log("todoCache");
  neatocal_todo_ensure_loaded();
  let view = get_view_range();
  let viewStart = clamp_date_to_day(view.start);
  let viewEnd = clamp_date_to_day(view.end);

  let state = NEATOCAL_TODO.state;
  let byDate = {};
  let statsByDate = {};

  // One-offs
  if (state.oneOffByDate && typeof state.oneOffByDate === "object") {
    Object.keys(state.oneOffByDate).forEach((dateStr) => {
      if (!is_valid_yyyy_mm_dd(dateStr)) { return; }
      let dt = parse_yyyy_mm_dd(dateStr);
      if (dt < viewStart || dt >= viewEnd) { return; }
      let arr = state.oneOffByDate[dateStr];
      if (!Array.isArray(arr)) { return; }
      if (!(dateStr in byDate)) { byDate[dateStr] = []; }
      for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        if (!item || typeof item !== "object") { continue; }
        byDate[dateStr].push({
          kind: "oneoff",
          id: item.id,
          title: item.title || "",
          notes: item.notes || "",
          completed: !!item.completed,
          date: dateStr
        });
      }
    });
  }

  // Series occurrences
  if (state.seriesById && typeof state.seriesById === "object") {
    Object.keys(state.seriesById).forEach((sid) => {
      let series = state.seriesById[sid];
      if (!series || typeof series !== "object") { return; }
      series.id = series.id || sid;
      let dates = neatocal_todo_expand_series_into_view(series, viewStart, viewEnd);
      for (let i = 0; i < dates.length; i++) {
        let dateStr = dates[i];
        if (!(dateStr in byDate)) { byDate[dateStr] = []; }
        let inst = neatocal_todo_instance_state(series.id, dateStr) || {};
        let completed = (typeof inst.completed === "boolean") ? inst.completed : false;
        let title = (typeof inst.overrideTitle === "string") ? inst.overrideTitle : (series.title || "");
        let notes = (typeof inst.overrideNotes === "string") ? inst.overrideNotes : (series.notes || "");
        byDate[dateStr].push({
          kind: "series",
          seriesId: series.id,
          instanceKey: series.id + "|" + dateStr,
          title: title,
          notes: notes,
          completed: completed,
          date: dateStr
        });
      }
    });
  }

  // Stats
  Object.keys(byDate).forEach((dateStr) => {
    let done = 0;
    let total = byDate[dateStr].length;
    for (let i = 0; i < byDate[dateStr].length; i++) {
      if (byDate[dateStr][i].completed) { done += 1; }
    }
    statsByDate[dateStr] = { done: done, total: total };
  });

  // Overall progress up to today (but within view range)
  let today = clamp_date_to_day(new Date());
  let asOf = min_date(today, add_days(viewEnd, -1));
  let asOfStr = date_to_yyyy_mm_dd(asOf);

  let doneAll = 0;
  let totalAll = 0;
  Object.keys(byDate).forEach((dateStr) => {
    if (dateStr > asOfStr) { return; }
    let s = statsByDate[dateStr];
    totalAll += s.total;
    doneAll += s.done;
  });
  let percent = (totalAll > 0) ? Math.round((doneAll / totalAll) * 100) : 0;

  NEATOCAL_TODO.cache = {
    byDate: byDate,
    statsByDate: statsByDate,
    overall: { done: doneAll, total: totalAll, percent: percent, asOf: asOfStr }
  };

  log("recomputed", {
    dates: Object.keys(byDate).length,
    overall: NEATOCAL_TODO.cache.overall
  });
}


// Moon phase calculation functions
// Reference: Known new moon on Jan 6, 2000, 18:14 UTC (Julian Day 2451550.26)
//
function calculateLunarAge(year, month, day) {

  // Calculate days since reference new moon (Jan 6, 2000)
  //
  let refDate = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  let targetDate = new Date(Date.UTC(year, month, day, 0, 0, 0));

  let daysSince = (targetDate - refDate) / (1000 * 60 * 60 * 24);

  // Lunar synodic period (new moon to new moon)
  //
  let lunarCycle = 29.53058867;

  // Calculate lunar age (days since last new moon)
  //
  let lunarAge = daysSince % lunarCycle;
  if (lunarAge < 0) { lunarAge += lunarCycle; }

  return lunarAge;
}

function getMoonPhase(lunarAge) {

  // Returns phase index 0-7
  // 0: New Moon, 1: Waxing Crescent, 2: First Quarter, 3: Waxing Gibbous
  // 4: Full Moon, 5: Waning Gibbous, 6: Last Quarter, 7: Waning Crescent
  //
  let phase = Math.round((lunarAge / 29.53058867) * 8) % 8;

  return phase;
}

function getMoonIllumination(lunarAge) {
  // Returns illumination percentage 0-100
  let cycle = 29.53058867;
  let percent = ((1 - Math.cos((lunarAge / cycle) * 2 * Math.PI)) / 2) * 100;
  return Math.round(percent);
}

function getMoonPhaseName(phase) {
  const names = [
    "New", "Wax Cres", "First Qtr", "Wax Gibb",
    "Full", "Wan Gibb", "Last Qtr", "Wan Cres"
  ];
  return names[phase];
}

function getMoonPhaseSymbol(phase) {
  const symbols = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return symbols[phase];
}

// Counter for unique mask IDs
//
var MOON_PHASE_COUNTER = 0;

function createMoonPhaseCSS(phase, lunarAge) {

  // Create an inline SVG moon phase visualization with unique mask IDs
  //
  let span = H.span("", "moon-phase");
  let uid = ++MOON_PHASE_COUNTER;

  // SVG moon phase definitions using masks for curved terminators
  //
  const svgs = [

    // 0: New Moon
    //
    "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><circle cx='32' cy='32' r='30' fill='#404040'/></svg>",

    // 1: Waxing Crescent
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m1-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='22' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m1-${uid})'/></svg>`,

    // 2: First Quarter
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m2-${uid}'><rect x='32' y='0' width='32' height='64' fill='white'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m2-${uid})'/></svg>`,

    // 3: Waxing Gibbous
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m3-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='42' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#d0d0d0'/><circle cx='32' cy='32' r='30' fill='#404040' mask='url(#m3-${uid})'/></svg>`,

    // 4: Full Moon
    //
    "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><circle cx='32' cy='32' r='30' fill='#d0d0d0'/></svg>",

    // 5: Waning Gibbous
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m5-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='22' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#d0d0d0'/><circle cx='32' cy='32' r='30' fill='#404040' mask='url(#m5-${uid})'/></svg>`,

    // 6: Last Quarter (Third Quarter)
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m6-${uid}'><rect x='0' y='0' width='32' height='64' fill='white'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m6-${uid})'/></svg>`,

    // 7: Waning Crescent
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m7-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='42' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m7-${uid})'/></svg>`
  ];

  span.innerHTML = svgs[phase];
  return span;
}

function renderMoonPhase(td, year, month, day) {
  if (!NEATOCAL_PARAM.show_moon_phase) { return; }

  let lunarAge = calculateLunarAge(year, month, day);
  let phase = getMoonPhase(lunarAge);

  // If only showing phase changes, check if phase is different from previous day
  //
  if (NEATOCAL_PARAM.moon_phase_display === "changes") {

    // Calculate previous day
    //
    let prevDate = new Date(year, month, day - 1);
    let prevLunarAge = calculateLunarAge(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
    let prevPhase = getMoonPhase(prevLunarAge);

    // Skip if phase hasn't changed
    //
    if (phase === prevPhase) { return; }
  }

  let moonElement;

  if (NEATOCAL_PARAM.moon_phase_style === "symbol") {
    moonElement = H.span(getMoonPhaseSymbol(phase), "moon-symbol");
  }

  else if (NEATOCAL_PARAM.moon_phase_style === "name") {
    moonElement = H.span(getMoonPhaseName(phase), "moon-name");
  }

  else {

    // Default to CSS
    //
    moonElement = createMoonPhaseCSS(phase, lunarAge);
  }

  if (NEATOCAL_PARAM.moon_phase_position === "inline") {

    // Add inline after a space
    //
    moonElement.classList.add("moon-inline");
    td.appendChild(H.text(" "));
    td.appendChild(moonElement);
  }

  else {

    // Add below in its own container
    //
    let moonContainer = H.div();
    moonContainer.classList.add("moon-container");
    moonContainer.appendChild(moonElement);
    td.appendChild(moonContainer);
  }

}

function localized_day(locale, day_idx) {
  let iday = 17 + day_idx;
  let s = '1995-12-' + iday.toString() + 'T12:00:01Z';
  let d = new Date(s);
  return d.toLocaleDateString(locale, {"weekday":NEATOCAL_PARAM.weekday_format});
}

function localized_month(locale, mo_idx) {
  let imo = 1 + mo_idx;
  let imo_str = ((imo < 10) ? ("0" + imo.toString()) : imo.toString());
  let s = '1995-' + imo_str + '-18T12:00:01Z';
  let d = new Date(s);
  return d.toLocaleDateString(locale, {"month":NEATOCAL_PARAM.month_format});
}

function neatocal_hallon_almanackan() {
  let year      = NEATOCAL_PARAM.year;
  let start_mo  = NEATOCAL_PARAM.start_month;
  let n_mo      = NEATOCAL_PARAM.n_month;

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let th_mo = H.th( NEATOCAL_PARAM.month_code[ i_mo%12 ] );
    month_styles(th_mo);
    ui_tr_mo.appendChild( th_mo );
  }

  // Precompute the parity of week the day falls on.
  // Calendar is month major order, making it more difficult
  // to calculate the parity of week the day falls in.
  //
  let week_parity = 0;
  let day_parity = {};
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

    let cur_year = parseInt(year) + Math.floor(i_mo/12);
    let cur_mo = i_mo%12;
    let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();

    if (!(i_mo in day_parity)) {
      day_parity[i_mo] = {};
    }

    for (let day_idx=0; day_idx < 31; day_idx++) {
      if (day_idx >= nday_in_mo) { break; }

      day_parity[i_mo][day_idx] = week_parity;

      let dt = new Date(cur_year, cur_mo, day_idx+1);
      if (dt.getDay() == 0) {
        week_parity = 1-week_parity;
      }

    }
  }

  let tbody = document.getElementById("ui_tbody");
  for (let idx=0; idx<31; idx++) {

    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }


    let cur_year = year;
    for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

      cur_year = parseInt(year) + Math.floor(i_mo/12);

      let cur_mo = i_mo%12;

      let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();

      let td = H.td();
      td.style.width = (100/n_mo).toString() + "%";

      td.id = "ui_" + fmt_date(cur_year, cur_mo+1, idx+1);

      if (idx < nday_in_mo) {

        let dt = new Date(cur_year, cur_mo, idx+1);

        let d = NEATOCAL_PARAM.weekday_code[ dt.getDay() ];

        if (day_parity[i_mo][idx]) {
          td.classList.add("weekend");
        }

        if ((dt.getDay() != 0) ||
            (idx == (nday_in_mo-1))) {
          td.style.borderBottom = '0';
        }


        let span_date = H.span((idx+1).toString(), "date");
        let span_day = H.span(d, "day");

        // If any param specified stylings apply, apply them.
        // Date stylings happen before weekend_date so that
        // the weekend_date, if specified, can override
        //

        date_styles(span_date);

        //if (dt.getDay() == 0) {
        if (NEATOCAL_PARAM.weekend_days.includes(dt.getDay())) {
          span_date.style.color = "rgb(230,37,7)";
          span_day.style.color = "rgb(230,37,7)";
          weekend_styles(span_day);
          weekend_date_styles(span_date);
        }

        else {
          weekday_styles(span_day);
        }

        td.appendChild( span_date );
        td.appendChild( span_day );

        if ((dt.getDay() == 1) && NEATOCAL_PARAM.show_week_numbers) {
          let span_week_no = H.span(getISOWeekNumber(dt), "date");
          span_week_no.style.float = "right";
          span_week_no.style.color = "rgb(230,37,7)";
          week_styles(span_week_no);
          td.appendChild(span_week_no);
        }

        let yyyy_mm_dd = fmt_date(cur_year, cur_mo+1, idx+1);
        render_cell_data(td, yyyy_mm_dd);
        render_todo_cell_data(td, yyyy_mm_dd);

        // Add moon phase if enabled
        //
        renderMoonPhase(td, cur_year, cur_mo, idx+1);

      }
      tr.appendChild(td);

    }

    tbody.appendChild(tr);

  }

}

function neatocal_default() {
  let year      = NEATOCAL_PARAM.year;
  let start_mo  = NEATOCAL_PARAM.start_month;
  let n_mo      = NEATOCAL_PARAM.n_month;

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let th_mo = H.th( NEATOCAL_PARAM.month_code[ i_mo%12 ] );
    month_styles(th_mo);
    ui_tr_mo.appendChild( th_mo );
  }

  let tbody = document.getElementById("ui_tbody");
  for (let idx=0; idx<31; idx++) {

    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }


    let cur_year = year;
    for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

      cur_year = parseInt(year) + Math.floor(i_mo/12);

      let cur_mo = i_mo%12;

      let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();

      let td = H.td();
      td.style.width = (100/n_mo).toString() + "%";
      td.id = "ui_" + fmt_date(cur_year, cur_mo+1, idx+1);

      if (idx < nday_in_mo) {

        let dt = new Date(cur_year, cur_mo, idx+1);

        let d = NEATOCAL_PARAM.weekday_code[ dt.getDay() ];

        //if ((dt.getDay() == 0) ||
        //    (dt.getDay() == 6)) {
        if (NEATOCAL_PARAM.weekend_days.includes(dt.getDay())) {
          td.classList.add("weekend");
        }

        let span_date = H.span((idx+1).toString(), "date");
        let span_day = H.span(d, "day");

        // If any param specified stylings apply, apply them.
        // Date stylings happen before weekend_date so that
        // the weekend_date, if specified, can override
        //

        date_styles(span_date);

        if ((dt.getDay() == 0) ||
            (dt.getDay() == 6)) {
          weekend_styles(span_day);
          weekend_date_styles(span_date);
        }

        else {
          weekday_styles(span_day);
        }

        td.appendChild( span_date );
        td.appendChild( span_day );

        if ((dt.getDay() == 1) && NEATOCAL_PARAM.show_week_numbers) {
          let span_week_no = H.span(getISOWeekNumber(dt), "date");
          span_week_no.style.float = "right";
          span_week_no.style.color = "rgb(230,37,7)";
          week_styles(span_week_no);
          td.appendChild(span_week_no);
        }

        let yyyy_mm_dd = fmt_date(cur_year, cur_mo+1, idx+1);
        render_cell_data(td, yyyy_mm_dd);
        render_todo_cell_data(td, yyyy_mm_dd);

        // Add moon phase if enabled
        //
        renderMoonPhase(td, cur_year, cur_mo, idx+1);

      }
      tr.appendChild(td);

    }

    tbody.appendChild(tr);

  }

}

function fmt_date(y,m,d) {
  let res = y.toString() + "-";
  if (m<10) {
    res += "0";
  }
  res += m.toString() + "-";
  if (d < 10) {
    res += "0";
  }
  res += d.toString();
  return res;
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  //

  // Convert Sunday from 0 to 7
  //
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  // Get first day of year
  //
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  // Calculate full weeks from year start to nearest Thursday
  //
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function neatocal_aligned_weekdays() {
  let year      = parseInt(NEATOCAL_PARAM.year);
  let start_mo  = parseInt(NEATOCAL_PARAM.start_month);
  let n_mo      = parseInt(NEATOCAL_PARAM.n_month);

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let th_mo = H.th( NEATOCAL_PARAM.month_code[ i_mo%12 ] );
    month_styles(th_mo);
    ui_tr_mo.appendChild( th_mo );
  }

  // start_day, when to start the first day in the month.
  // day_in_mo_start is the number of days past the start_day
  //   the month starts, so we know how much to skip over when
  //   displaying the aligned cells.
  //
  let max_start = -1;
  let start_day = NEATOCAL_PARAM.start_day;
  let day_in_mo_start = [];
  for (let i=0; i<n_mo; i++) { day_in_mo_start.push(0); }
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let cur_year = parseInt(year) + Math.floor(i_mo/12);
    let cur_mo = i_mo%12;
    let s = new Date(cur_year, cur_mo, 1).getDay();
    day_in_mo_start[i_mo - start_mo] = s;

    if (day_in_mo_start[i_mo - start_mo] > max_start) {
      max_start = day_in_mo_start[i_mo - start_mo];
    }
  }

  let tbody = document.getElementById("ui_tbody");
  for (let idx=0; idx<42; idx++) {

    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }

    let cur_year = year;
    for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

      cur_year = parseInt(year) + Math.floor(i_mo/12);

      // cur_mo is the month in the current year
      // nday_in_mo is the number of days in the month under consideration
      // day_idx is the day of the month this cell would fall in,
      //  which can be out of bounds (less than 0 or greater than the number of
      //  days in the month)
      //
      let cur_mo = i_mo%12;
      let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();
      let day_idx = idx - ((day_in_mo_start[i_mo - start_mo] - start_day + 7)%7);

      let td = H.td();
      td.style.width = (100/n_mo).toString() + "%";
      td.id = "ui_" + fmt_date(cur_year, cur_mo+1, day_idx+1);

      // if our day falls within bounds, we decorate the td with the appropriate
      // values
      //
      if ((day_idx >= 0) &&
          (day_idx < nday_in_mo)) {

        let dt = new Date(cur_year, cur_mo, day_idx+1);

        let wd_code = NEATOCAL_PARAM.weekday_code[ dt.getDay() ];

        // If it's a weekend (Su,Sa), add the 'weekend' class to allow for highlighting
        //
        //if ((dt.getDay() == 0) ||
        //    (dt.getDay() == 6)) {
        if (NEATOCAL_PARAM.weekend_days.includes(dt.getDay())) {
          td.classList.add("weekend");
        }


        // date - day in month
        // day  - name of weekday (e.g. Su,M,T,W,R,F,Sa)
        //
        let span_date = H.span((day_idx+1).toString(), "date");
        let span_day = H.span(wd_code, "day");

        // If any param specified stylings apply, apply them.
        // Date stylings happen before weekend_date so that
        // the weekend_date, if specified, can override
        //

        date_styles(span_date);

        if ((dt.getDay() == 0) ||
            (dt.getDay() == 6)) {
          weekend_styles(span_day);
          weekend_date_styles(span_date);
        }

        else {
          weekday_styles(span_day);
        }

        td.appendChild( span_date );
        td.appendChild( span_day );

        if ((dt.getDay() == 1) && NEATOCAL_PARAM.show_week_numbers) {
          let span_week_no = H.span(getISOWeekNumber(dt), "date");
          span_week_no.style.float = "right";
          span_week_no.style.color = "rgb(230,37,7)";
          week_styles(span_week_no);
          td.appendChild(span_week_no);
        }

        let yyyy_mm_dd = fmt_date(cur_year, cur_mo+1, day_idx+1);
        render_cell_data(td, yyyy_mm_dd);
        render_todo_cell_data(td, yyyy_mm_dd);

        // Add moon phase if enabled
        //
        renderMoonPhase(td, cur_year, cur_mo, day_idx+1);

      }
      tr.appendChild(td);

    }

    tbody.appendChild(tr);
  }

}

function neatocal_post_process() {
  let highlight_color = NEATOCAL_PARAM.highlight_color;
  let x = document.getElementsByClassName("weekend");
  for (let i = 0; i < x.length; i++) {
    x[i].style.background = highlight_color;
  }

  // Highlight today's date
  if (NEATOCAL_PARAM.today_highlight_color) {
    let today = new Date();
    let today_str = fmt_date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    let today_ele = document.getElementById("ui_" + today_str);
    if (today_ele) {
      today_ele.style.background = NEATOCAL_PARAM.today_highlight_color;
    }
  }

  if ("color_cell" in NEATOCAL_PARAM) {
    let color_cell = NEATOCAL_PARAM.color_cell;

    for (let i=0; i < color_cell.length; i++) {
      let ele = document.getElementById("ui_" + color_cell[i].date);
      if ((typeof ele === "undefined") || (ele == null)) { continue; }
      ele.style.background = color_cell[i].color;
    }
  }
}

function neatocal_update_header_progress() {
  let log = dbg_log("progressHeader");
  let ele = document.getElementById("ui_progress");
  if (!ele) { return; }
  if (!NEATOCAL_TODO || !NEATOCAL_TODO.cache || !NEATOCAL_TODO.cache.overall) {
    ele.textContent = "";
    return;
  }
  let o = NEATOCAL_TODO.cache.overall;
  if (!o.total || o.total <= 0) {
    ele.textContent = "Progress: —";
    log("empty");
    return;
  }
  ele.textContent = "Progress: " + o.done.toString() + "/" + o.total.toString() + " (" + o.percent.toString() + "%) as of " + o.asOf;
  log("updated", o);
}

// -----------------------------
// Todo mutations
// -----------------------------

function neatocal_todo_get_oneoff_list(dateStr) {
  let state = NEATOCAL_TODO.state;
  if (!state.oneOffByDate || typeof state.oneOffByDate !== "object") {
    state.oneOffByDate = {};
  }
  if (!(dateStr in state.oneOffByDate)) {
    state.oneOffByDate[dateStr] = [];
  }
  if (!Array.isArray(state.oneOffByDate[dateStr])) {
    state.oneOffByDate[dateStr] = [];
  }
  return state.oneOffByDate[dateStr];
}

function neatocal_todo_add_oneoff(dateStr, title, notes) {
  let log = dbg_log("todoAddOneoff");
  neatocal_todo_ensure_loaded();
  if (!is_valid_yyyy_mm_dd(dateStr)) { return null; }
  let t = (title || "").trim();
  if (!t) { return null; }
  let now = new Date().toISOString();
  let item = {
    id: gen_id("todo"),
    title: t,
    notes: (notes || "").trim(),
    completed: false,
    createdAt: now,
    updatedAt: now
  };
  neatocal_todo_get_oneoff_list(dateStr).push(item);
  log(dateStr, item.id, item.title);
  neatocal_todo_save();
  return item;
}

function neatocal_todo_toggle_oneoff(dateStr, id, completed) {
  let log = dbg_log("todoToggleOneoff");
  neatocal_todo_ensure_loaded();
  let list = neatocal_todo_get_oneoff_list(dateStr);
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) {
      list[i].completed = !!completed;
      list[i].updatedAt = new Date().toISOString();
      log(dateStr, id, list[i].completed);
      neatocal_todo_save();
      return true;
    }
  }
  return false;
}

function neatocal_todo_update_oneoff_title(dateStr, id, title) {
  let log = dbg_log("todoEditOneoff");
  neatocal_todo_ensure_loaded();
  let t = (title || "").trim();
  if (!t) { return false; }
  let list = neatocal_todo_get_oneoff_list(dateStr);
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) {
      list[i].title = t;
      list[i].updatedAt = new Date().toISOString();
      log(dateStr, id, t);
      neatocal_todo_save();
      return true;
    }
  }
  return false;
}

function neatocal_todo_delete_oneoff(dateStr, id) {
  let log = dbg_log("todoDeleteOneoff");
  neatocal_todo_ensure_loaded();
  let list = neatocal_todo_get_oneoff_list(dateStr);
  let before = list.length;
  let after = list.filter(x => x && x.id !== id);
  NEATOCAL_TODO.state.oneOffByDate[dateStr] = after;
  log(dateStr, id, "removed", before - after.length);
  neatocal_todo_save();
  return (before !== after.length);
}

function neatocal_todo_add_series(series) {
  let log = dbg_log("todoAddSeries");
  neatocal_todo_ensure_loaded();
  if (!NEATOCAL_TODO.state.seriesById) { NEATOCAL_TODO.state.seriesById = {}; }
  let sid = series.id || gen_id("series");
  series.id = sid;
  NEATOCAL_TODO.state.seriesById[sid] = series;
  log("added", sid, series.rule);
  neatocal_todo_save();
  return sid;
}

function neatocal_todo_set_instance_state(seriesId, dateStr, patch) {
  let log = dbg_log("todoSetInstance");
  neatocal_todo_ensure_loaded();
  if (!NEATOCAL_TODO.state.instanceState) { NEATOCAL_TODO.state.instanceState = {}; }
  let k = seriesId + "|" + dateStr;
  let cur = NEATOCAL_TODO.state.instanceState[k] || {};
  let next = Object.assign({}, cur, patch || {});

  // Compact storage: if only completed=false and no overrides, delete
  let hasTitle = (typeof next.overrideTitle === "string" && next.overrideTitle.trim() !== "");
  let hasNotes = (typeof next.overrideNotes === "string" && next.overrideNotes.trim() !== "");
  let hasCompleted = (typeof next.completed === "boolean");

  if (!hasTitle && !hasNotes && (!hasCompleted || next.completed === false)) {
    delete NEATOCAL_TODO.state.instanceState[k];
    log("cleared", k);
  } else {
    NEATOCAL_TODO.state.instanceState[k] = next;
    log("set", k, next);
  }
  neatocal_todo_save();
}

function neatocal_prev_date_str(dateStr) {
  let dt = parse_yyyy_mm_dd(dateStr);
  if (!dt) { return null; }
  return date_to_yyyy_mm_dd(add_days(dt, -1));
}

function neatocal_todo_delete_series_instance(seriesId, dateStr) {
  let log = dbg_log("todoDeleteInstance");
  neatocal_todo_ensure_loaded();
  let ex = neatocal_todo_get_series_ex(seriesId);
  if (ex.skipDates.indexOf(dateStr) < 0) {
    ex.skipDates.push(dateStr);
  }
  log(seriesId, dateStr, "skipDates", ex.skipDates.length);
  neatocal_todo_save();
}

function neatocal_todo_delete_series_following(seriesId, dateStr) {
  let log = dbg_log("todoDeleteFollowing");
  neatocal_todo_ensure_loaded();
  let ex = neatocal_todo_get_series_ex(seriesId);
  let prev = neatocal_prev_date_str(dateStr);
  ex.terminatedAfterDate = prev;
  log(seriesId, "terminatedAfterDate", prev);
  neatocal_todo_save();
}

function neatocal_todo_delete_series_all(seriesId) {
  let log = dbg_log("todoDeleteSeries");
  neatocal_todo_ensure_loaded();
  if (NEATOCAL_TODO.state.seriesById) {
    delete NEATOCAL_TODO.state.seriesById[seriesId];
  }
  if (NEATOCAL_TODO.state.seriesExceptions) {
    delete NEATOCAL_TODO.state.seriesExceptions[seriesId];
  }
  if (NEATOCAL_TODO.state.instanceState) {
    Object.keys(NEATOCAL_TODO.state.instanceState).forEach((k) => {
      if (k.startsWith(seriesId + "|")) { delete NEATOCAL_TODO.state.instanceState[k]; }
    });
  }
  log("deleted", seriesId);
  neatocal_todo_save();
}

function neatocal_todo_edit_series_title(seriesId, title) {
  let log = dbg_log("todoEditSeries");
  neatocal_todo_ensure_loaded();
  let t = (title || "").trim();
  if (!t) { return false; }
  if (!NEATOCAL_TODO.state.seriesById || !NEATOCAL_TODO.state.seriesById[seriesId]) { return false; }
  NEATOCAL_TODO.state.seriesById[seriesId].title = t;
  NEATOCAL_TODO.state.seriesById[seriesId].updatedAt = new Date().toISOString();
  log(seriesId, t);
  neatocal_todo_save();
  return true;
}

function neatocal_todo_split_series_from_date(seriesId, dateStr, newTitle) {
  // Best-effort split; we support never/until ends cleanly.
  let log = dbg_log("todoSplitSeries");
  neatocal_todo_ensure_loaded();
  let s = NEATOCAL_TODO.state.seriesById && NEATOCAL_TODO.state.seriesById[seriesId];
  if (!s) { return null; }
  let t = (newTitle || "").trim();
  if (!t) { return null; }
  if (!is_valid_yyyy_mm_dd(dateStr)) { return null; }

  let endType = (s.end && s.end.type) ? s.end.type : "never";
  if (endType === "count") {
    // Count-based splitting is ambiguous without recomputing remaining count.
    // For now, fall back to editing entire series.
    log("count-based split unsupported; editing series instead", seriesId);
    neatocal_todo_edit_series_title(seriesId, t);
    return seriesId;
  }

  // Terminate old series before dateStr
  neatocal_todo_delete_series_following(seriesId, dateStr);

  // Create a new series starting at dateStr with same rule/end (but end.untilDate stays)
  let now = new Date().toISOString();
  let newSeries = JSON.parse(JSON.stringify(s));
  newSeries.id = gen_id("series");
  newSeries.startDate = dateStr;
  newSeries.title = t;
  newSeries.createdAt = now;
  newSeries.updatedAt = now;
  neatocal_todo_add_series(newSeries);
  log("split", seriesId, "->", newSeries.id, "from", dateStr);
  return newSeries.id;
}

// -----------------------------
// UI
// -----------------------------

var NEATOCAL_UI = {
  bound: false,
  activeDate: null,
  modalType: null
};

function neatocal_ui_ensure_topbar() {
  let header = document.getElementById("ui_header");
  if (!header) { return; }

  let topbar = document.getElementById("ui_topbar");
  if (!topbar) {
    topbar = document.createElement("div");
    topbar.id = "ui_topbar";
    topbar.classList.add("nc-topbar");
    header.insertBefore(topbar, header.firstChild);
  }

  let progress = document.getElementById("ui_progress");
  if (!progress) {
    progress = document.createElement("div");
    progress.id = "ui_progress";
    progress.classList.add("nc-progress");
    topbar.appendChild(progress);
  }

  let btn = document.getElementById("ui_settings_btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "ui_settings_btn";
    btn.type = "button";
    btn.classList.add("nc-gear");
    btn.title = "Settings";
    btn.textContent = "⚙";
    topbar.appendChild(btn);
  }
}

function neatocal_ui_ensure_modals() {
  let root = document.getElementById("nc_modal_root");
  if (!root) {
    root = document.createElement("div");
    root.id = "nc_modal_root";
    document.body.appendChild(root);
  }

  function ensure_modal(id) {
    let m = document.getElementById(id);
    if (m) { return m; }
    m = document.createElement("div");
    m.id = id;
    m.classList.add("nc-modal-overlay");
    m.innerHTML = "<div class='nc-modal' role='dialog' aria-modal='true'></div>";
    root.appendChild(m);
    return m;
  }

  ensure_modal("nc_day_modal");
  ensure_modal("nc_settings_modal");
}

function neatocal_ui_close_modals() {
  ["nc_day_modal", "nc_settings_modal"].forEach((id) => {
    let m = document.getElementById(id);
    if (m) { m.classList.remove("visible"); }
  });
  NEATOCAL_UI.modalType = null;
}

function neatocal_ui_td_to_date(td) {
  if (!td || !td.id) { return null; }
  if (!td.id.startsWith("ui_")) { return null; }
  let dateStr = td.id.slice(3);
  if (!is_valid_yyyy_mm_dd(dateStr)) { return null; }
  // Only allow opening days within current view range
  let view = get_view_range();
  let dt = parse_yyyy_mm_dd(dateStr);
  if (!dt) { return null; }
  if (dt < clamp_date_to_day(view.start) || dt >= clamp_date_to_day(view.end)) { return null; }
  return dateStr;
}

function neatocal_ui_find_td(target) {
  let cur = target;
  while (cur && cur !== document.body) {
    if (cur.tagName && cur.tagName.toLowerCase() === "td") { return cur; }
    cur = cur.parentElement;
  }
  return null;
}

function neatocal_ui_open_day_modal(dateStr) {
  let log = dbg_log("uiOpenDay");
  neatocal_ui_ensure_modals();
  let overlay = document.getElementById("nc_day_modal");
  if (!overlay) { return; }
  overlay.classList.add("visible");
  NEATOCAL_UI.modalType = "day";
  NEATOCAL_UI.activeDate = dateStr;
  neatocal_ui_render_day_modal(dateStr);
  log("opened", dateStr);
}

function neatocal_ui_render_day_modal(dateStr) {
  let log = dbg_log("uiRenderDay");
  neatocal_todo_recompute_cache();
  neatocal_update_header_progress();

  let overlay = document.getElementById("nc_day_modal");
  if (!overlay) { return; }
  let modal = overlay.querySelector(".nc-modal");
  if (!modal) { return; }

  let items = (NEATOCAL_TODO.cache.byDate && NEATOCAL_TODO.cache.byDate[dateStr]) ? NEATOCAL_TODO.cache.byDate[dateStr] : [];
  let stats = (NEATOCAL_TODO.cache.statsByDate && NEATOCAL_TODO.cache.statsByDate[dateStr]) ? NEATOCAL_TODO.cache.statsByDate[dateStr] : { done: 0, total: 0 };
  let pct = (stats.total > 0) ? Math.round((stats.done / stats.total) * 100) : 0;

  modal.innerHTML = "";

  let header = document.createElement("div");
  header.classList.add("nc-modal-header");
  header.innerHTML = "<div class='nc-modal-title'>" + dateStr + "</div>" +
    "<div class='nc-modal-subtitle'>" + stats.done.toString() + "/" + stats.total.toString() + " (" + pct.toString() + "%)</div>";

  let closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.classList.add("nc-modal-close");
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", function() { neatocal_ui_close_modals(); });
  header.appendChild(closeBtn);
  modal.appendChild(header);

  let list = document.createElement("div");
  list.classList.add("nc-todo-list");

  function render_item_row(it) {
    let row = document.createElement("div");
    row.classList.add("nc-todo-row");
    if (it.completed) { row.classList.add("nc-todo-done"); }

    let cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!it.completed;
    cb.classList.add("nc-todo-cb");

    cb.addEventListener("click", function(e) {
      e.stopPropagation();
      if (it.kind === "oneoff") {
        neatocal_todo_toggle_oneoff(it.date, it.id, cb.checked);
      } else {
        neatocal_todo_set_instance_state(it.seriesId, it.date, { completed: cb.checked });
      }
      neatocal_render();
      neatocal_ui_render_day_modal(dateStr);
    });

    let titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = it.title || "";
    titleInput.classList.add("nc-todo-title-input");

    let scopeSel = null;
    if (it.kind === "series") {
      scopeSel = document.createElement("select");
      scopeSel.classList.add("nc-todo-scope");
      scopeSel.innerHTML = "<option value='instance'>This</option><option value='following'>This+following</option><option value='series'>Series</option>";
    }

    let saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.classList.add("nc-todo-action");
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      let nextTitle = titleInput.value;
      if (it.kind === "oneoff") {
        neatocal_todo_update_oneoff_title(it.date, it.id, nextTitle);
      } else {
        let scope = scopeSel ? scopeSel.value : "series";
        if (scope === "instance") {
          neatocal_todo_set_instance_state(it.seriesId, it.date, { overrideTitle: nextTitle });
        } else if (scope === "following") {
          neatocal_todo_split_series_from_date(it.seriesId, it.date, nextTitle);
        } else {
          neatocal_todo_edit_series_title(it.seriesId, nextTitle);
        }
      }
      neatocal_render();
      neatocal_ui_render_day_modal(dateStr);
    });

    let delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.classList.add("nc-todo-action", "danger");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (it.kind === "oneoff") {
        neatocal_todo_delete_oneoff(it.date, it.id);
      } else {
        // Google-calendar-like: instance / this+following / series
        let choice = "instance";
        if (scopeSel) { choice = scopeSel.value; }
        if (choice === "instance") {
          neatocal_todo_delete_series_instance(it.seriesId, it.date);
        } else if (choice === "following") {
          neatocal_todo_delete_series_following(it.seriesId, it.date);
        } else {
          neatocal_todo_delete_series_all(it.seriesId);
        }
      }
      neatocal_render();
      neatocal_ui_render_day_modal(dateStr);
    });

    let meta = document.createElement("div");
    meta.classList.add("nc-todo-meta");
    meta.textContent = (it.kind === "series") ? "Recurring" : "One-off";

    row.appendChild(cb);
    row.appendChild(titleInput);
    if (scopeSel) { row.appendChild(scopeSel); }
    row.appendChild(saveBtn);
    row.appendChild(delBtn);
    row.appendChild(meta);
    return row;
  }

  for (let i = 0; i < items.length; i++) {
    list.appendChild(render_item_row(items[i]));
  }

  modal.appendChild(list);

  // Add form
  let addBox = document.createElement("div");
  addBox.classList.add("nc-add-box");
  addBox.innerHTML =
    "<div class='nc-add-title'>Add</div>" +
    "<div class='nc-add-row'>" +
    "  <input id='nc_add_title' class='nc-add-input' type='text' placeholder='Todo title' />" +
    "  <button id='nc_add_btn' class='nc-add-btn' type='button'>Add</button>" +
    "</div>" +
    "<details class='nc-recurring-details'><summary>Make recurring…</summary>" +
    "  <div class='nc-recurring-grid'>" +
    "    <label>Frequency <select id='nc_freq'><option value='daily'>Daily</option><option value='weekly'>Weekly</option><option value='monthly'>Monthly</option><option value='yearly'>Yearly</option></select></label>" +
    "    <label>Interval <input id='nc_interval' type='number' min='1' value='1' /></label>" +
    "    <label id='nc_byweekday_wrap' style='display:none;'>Days <input id='nc_byweekday' type='text' placeholder='0,1,2.. (Sun=0)' /></label>" +
    "    <label>End <select id='nc_end_type'><option value='never'>Never</option><option value='until'>Until</option><option value='count'>After N</option></select></label>" +
    "    <label id='nc_until_wrap' style='display:none;'>Until <input id='nc_until' type='date' /></label>" +
    "    <label id='nc_count_wrap' style='display:none;'>Count <input id='nc_count' type='number' min='1' value='10' /></label>" +
    "  </div>" +
    "  <button id='nc_add_series_btn' class='nc-add-btn secondary' type='button'>Add recurring</button>" +
    "</details>";

  modal.appendChild(addBox);

  // bind add handlers
  let titleInput = modal.querySelector("#nc_add_title");
  let addBtn = modal.querySelector("#nc_add_btn");
  if (addBtn && titleInput) {
    addBtn.addEventListener("click", function() {
      neatocal_todo_add_oneoff(dateStr, titleInput.value, "");
      neatocal_render();
      neatocal_ui_render_day_modal(dateStr);
      titleInput.value = "";
      titleInput.focus();
    });
    titleInput.addEventListener("keydown", function(ev) {
      if (ev.key === "Enter") { addBtn.click(); }
    });
  }

  function update_recur_ui() {
    let freq = modal.querySelector("#nc_freq").value;
    let endType = modal.querySelector("#nc_end_type").value;
    let byW = modal.querySelector("#nc_byweekday_wrap");
    let untilW = modal.querySelector("#nc_until_wrap");
    let countW = modal.querySelector("#nc_count_wrap");
    if (byW) { byW.style.display = (freq === "weekly") ? "" : "none"; }
    if (untilW) { untilW.style.display = (endType === "until") ? "" : "none"; }
    if (countW) { countW.style.display = (endType === "count") ? "" : "none"; }
  }

  let freqSel = modal.querySelector("#nc_freq");
  let endSel = modal.querySelector("#nc_end_type");
  if (freqSel) { freqSel.addEventListener("change", update_recur_ui); }
  if (endSel) { endSel.addEventListener("change", update_recur_ui); }
  update_recur_ui();

  let addSeriesBtn = modal.querySelector("#nc_add_series_btn");
  if (addSeriesBtn && titleInput) {
    addSeriesBtn.addEventListener("click", function() {
      let t = titleInput.value;
      if (!t || !t.trim()) { return; }
      let freq = modal.querySelector("#nc_freq").value;
      let interval = parseInt(modal.querySelector("#nc_interval").value || "1", 10);
      if (isNaN(interval) || interval < 1) { interval = 1; }
      let endType = modal.querySelector("#nc_end_type").value;
      let end = { type: endType };
      if (endType === "until") {
        let u = modal.querySelector("#nc_until").value;
        if (u) {
          // input[type=date] returns YYYY-MM-DD
          end.untilDate = u;
        }
      } else if (endType === "count") {
        let c = parseInt(modal.querySelector("#nc_count").value || "1", 10);
        if (isNaN(c) || c < 1) { c = 1; }
        end.count = c;
      }

      let rule = { freq: freq, interval: interval };
      if (freq === "weekly") {
        let byWRaw = (modal.querySelector("#nc_byweekday").value || "").trim();
        if (byWRaw) {
          rule.byWeekday = byWRaw.split(",").map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x) && x >= 0 && x <= 6);
        }
      }
      let now = new Date().toISOString();
      neatocal_todo_add_series({
        id: gen_id("series"),
        title: t.trim(),
        notes: "",
        startDate: dateStr,
        rule: rule,
        end: end,
        createdAt: now,
        updatedAt: now
      });
      neatocal_render();
      neatocal_ui_render_day_modal(dateStr);
      titleInput.value = "";
      titleInput.focus();
    });
  }

  // Close on overlay click
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) { neatocal_ui_close_modals(); }
  });

  log("rendered", dateStr, "items", items.length);
}

function neatocal_build_share_url() {
  // Does not include todos; only calendar params.
  let params = new URLSearchParams();
  let keys = [
    "year", "layout", "start_month", "n_month", "start_day",
    "highlight_color", "today_highlight_color", "cell_height",
    "language", "weekday_code", "weekday_format", "month_code", "month_format",
    "weekend_days", "show_moon_phase", "moon_phase_style", "moon_phase_position", "moon_phase_display",
    "show_week_numbers"
  ];
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    let v = NEATOCAL_PARAM[k];
    if (typeof v === "undefined" || v === null || v === "") { continue; }
    if (Array.isArray(v)) {
      params.set(k, v.join(","));
    } else {
      params.set(k, v.toString());
    }
  }
  return window.location.origin + window.location.pathname + "?" + params.toString();
}

function neatocal_ui_open_settings_modal() {
  let log = dbg_log("uiOpenSettings");
  neatocal_ui_ensure_modals();
  let overlay = document.getElementById("nc_settings_modal");
  if (!overlay) { return; }
  overlay.classList.add("visible");
  NEATOCAL_UI.modalType = "settings";

  let modal = overlay.querySelector(".nc-modal");
  modal.innerHTML = "";

  let header = document.createElement("div");
  header.classList.add("nc-modal-header");
  header.innerHTML = "<div class='nc-modal-title'>Settings</div><div class='nc-modal-subtitle'>Saved locally</div>";
  let closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.classList.add("nc-modal-close");
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", function() { neatocal_ui_close_modals(); });
  header.appendChild(closeBtn);
  modal.appendChild(header);

  let form = document.createElement("div");
  form.classList.add("nc-settings-form");

  function add_field(label, inputEl) {
    let row = document.createElement("label");
    row.classList.add("nc-settings-row");
    let span = document.createElement("span");
    span.textContent = label;
    row.appendChild(span);
    row.appendChild(inputEl);
    form.appendChild(row);
  }

  let year = document.createElement("input");
  year.type = "number";
  year.value = NEATOCAL_PARAM.year;
  add_field("Year", year);

  let layout = document.createElement("select");
  layout.innerHTML = "<option value='default'>default</option><option value='aligned-weekdays'>aligned-weekdays</option><option value='hallon-almanackan'>hallon-almanackan</option>";
  layout.value = NEATOCAL_PARAM.layout || "default";
  add_field("Layout", layout);

  let startMonth = document.createElement("input");
  startMonth.type = "number";
  startMonth.min = "0";
  startMonth.max = "11";
  startMonth.value = NEATOCAL_PARAM.start_month;
  add_field("Start month (0-11)", startMonth);

  let nMonth = document.createElement("input");
  nMonth.type = "number";
  nMonth.min = "1";
  nMonth.value = NEATOCAL_PARAM.n_month;
  add_field("Months shown", nMonth);

  let startDay = document.createElement("input");
  startDay.type = "number";
  startDay.min = "0";
  startDay.max = "6";
  startDay.value = NEATOCAL_PARAM.start_day;
  add_field("Start day (aligned)", startDay);

  let weekendDays = document.createElement("input");
  weekendDays.type = "text";
  weekendDays.value = Array.isArray(NEATOCAL_PARAM.weekend_days) ? NEATOCAL_PARAM.weekend_days.join(",") : "";
  add_field("Weekend days (0-6)", weekendDays);

  let highlight = document.createElement("input");
  highlight.type = "text";
  highlight.value = NEATOCAL_PARAM.highlight_color || "";
  add_field("Weekend color", highlight);

  let todayInput = document.createElement("input");
  todayInput.type = "text";
  todayInput.value = NEATOCAL_PARAM.today_highlight_color || "";
  add_field("Today color", todayInput);

  let cellH = document.createElement("input");
  cellH.type = "text";
  cellH.value = NEATOCAL_PARAM.cell_height || "";
  add_field("Cell height", cellH);

  let showWeeks = document.createElement("select");
  showWeeks.innerHTML = "<option value='false'>false</option><option value='true'>true</option>";
  showWeeks.value = NEATOCAL_PARAM.show_week_numbers ? "true" : "false";
  add_field("Show week numbers", showWeeks);

  let showMoon = document.createElement("select");
  showMoon.innerHTML = "<option value='false'>false</option><option value='true'>true</option>";
  showMoon.value = NEATOCAL_PARAM.show_moon_phase ? "true" : "false";
  add_field("Show moon phase", showMoon);

  let moonStyle = document.createElement("select");
  moonStyle.innerHTML = "<option value='css'>css</option><option value='symbol'>symbol</option><option value='name'>name</option>";
  moonStyle.value = NEATOCAL_PARAM.moon_phase_style || "css";
  add_field("Moon style", moonStyle);

  let moonPos = document.createElement("select");
  moonPos.innerHTML = "<option value='below'>below</option><option value='inline'>inline</option>";
  moonPos.value = NEATOCAL_PARAM.moon_phase_position || "below";
  add_field("Moon position", moonPos);

  let moonDisp = document.createElement("select");
  moonDisp.innerHTML = "<option value='changes'>changes</option><option value='all'>all</option>";
  moonDisp.value = NEATOCAL_PARAM.moon_phase_display || "changes";
  add_field("Moon display", moonDisp);

  modal.appendChild(form);

  let actions = document.createElement("div");
  actions.classList.add("nc-settings-actions");

  let saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.classList.add("nc-add-btn");
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", function() {
    NEATOCAL_PARAM.year = parseInt(year.value || NEATOCAL_PARAM.year, 10);
    NEATOCAL_PARAM.layout = layout.value;
    NEATOCAL_PARAM.start_month = parseInt(startMonth.value || "0", 10);
    NEATOCAL_PARAM.n_month = parseInt(nMonth.value || "12", 10);
    NEATOCAL_PARAM.start_day = parseInt(startDay.value || "1", 10);
    NEATOCAL_PARAM.weekend_days = (weekendDays.value || "").split(",").map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x) && x >= 0 && x <= 6);
    NEATOCAL_PARAM.highlight_color = highlight.value || NEATOCAL_PARAM.highlight_color;
    NEATOCAL_PARAM.today_highlight_color = todayInput.value || "";
    NEATOCAL_PARAM.cell_height = cellH.value || "";
    NEATOCAL_PARAM.show_week_numbers = (showWeeks.value === "true");
    NEATOCAL_PARAM.show_moon_phase = (showMoon.value === "true");
    NEATOCAL_PARAM.moon_phase_style = moonStyle.value;
    NEATOCAL_PARAM.moon_phase_position = moonPos.value;
    NEATOCAL_PARAM.moon_phase_display = moonDisp.value;

    neatocal_settings_save();
    neatocal_render();
    neatocal_ui_close_modals();
  });

  let copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.classList.add("nc-add-btn", "secondary");
  copyBtn.textContent = "Copy sharable link";
  copyBtn.addEventListener("click", function() {
    let url = neatocal_build_share_url();
    dbg_log("settingsCopyLink")(url);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      window.prompt("Copy this URL:", url);
    }
  });

  actions.appendChild(saveBtn);
  actions.appendChild(copyBtn);
  modal.appendChild(actions);

  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) { neatocal_ui_close_modals(); }
  });

  log("opened");
}

function neatocal_ui_bind_events_once() {
  if (NEATOCAL_UI.bound) { return; }
  let log = dbg_log("uiBind");

  // Settings button
  let btn = document.getElementById("ui_settings_btn");
  if (btn) {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      neatocal_ui_open_settings_modal();
    });
  }

  // Cell click delegation + checkbox toggles
  let table = document.getElementById("ui_table");
  if (table) {
    table.addEventListener("click", function(e) {
      let tgt = e.target;

      // Checkbox toggle inside cell
      if (tgt && tgt.classList && tgt.classList.contains("todo-checkbox")) {
        e.stopPropagation();
        let dateStr = tgt.dataset.date;
        let kind = tgt.dataset.kind;
        let checked = tgt.checked;
        dbg_log("uiCellToggle")(dateStr, kind, checked);
        if (kind === "oneoff") {
          neatocal_todo_toggle_oneoff(dateStr, tgt.dataset.id, checked);
        } else if (kind === "series") {
          neatocal_todo_set_instance_state(tgt.dataset.seriesId, dateStr, { completed: checked });
        }
        neatocal_render();
        if (NEATOCAL_UI.modalType === "day" && NEATOCAL_UI.activeDate === dateStr) {
          neatocal_ui_render_day_modal(dateStr);
        }
        return;
      }

      // Otherwise open modal if we clicked a valid day cell
      let td = neatocal_ui_find_td(tgt);
      if (!td) { return; }
      let dateStr = neatocal_ui_td_to_date(td);
      dbg_log("uiCellClick")("td.id", td.id, "resolved", dateStr);
      if (!dateStr) { return; }
      neatocal_ui_open_day_modal(dateStr);
    });
  }

  // Escape closes modals
  window.addEventListener("keydown", function(ev) {
    if (ev.key === "Escape") { neatocal_ui_close_modals(); }
  });

  NEATOCAL_UI.bound = true;
  log("bound");
}

function neatocal_ui_init() {
  neatocal_ui_ensure_topbar();
  neatocal_ui_ensure_modals();
  neatocal_ui_bind_events_once();
}

function loadXHR(url, _cb, _errcb) {
  let xhr = new XMLHttpRequest();

  if (typeof _errcb !== "undefined") {
    xhr.addEventListener("error", _errcb);
  }

  xhr.addEventListener("loadend", _cb);
  xhr.open("GET", url);
  xhr.send();
  return xhr;
}

function neatocal_parse_data_error(raw) {
  console.log("error:", raw);
}

function neatocal_override_param(param, data) {

  let admissible_param = [
    "help",

    "year",
    "layout",

    "start_day",
    "start_month",
    "n_month",

    "weekday_code",
    "weekday_format",
    "month_code",
    "month_format",

    "weekend_days",

    "language",

    "show_moon_phase",
    "moon_phase_style",
    "moon_phase_position",
    "moon_phase_display",

    "cell_height",
    "highlight_color",
    "today_highlight_color",

    "year_font_size",
    "year_font_weight",
    "year_foreground_color",
    "year_background_color",

    "month_font_size",
    "month_font_weight",
    "month_foreground_color",
    "month_background_color",

    "weekday_font_size",
    "weekday_font_weight",
    "weekday_foreground_color",
    "weekday_background_color",

    "weekend_font_size",
    "weekend_font_weight",
    "weekend_foreground_color",
    "weekend_background_color",

    "week_font_size",
    "week_font_weight",
    "week_foreground_color",
    "week_background_color",

    "date_font_size",
    "date_font_weight",
    "date_foreground_color",
    "date_background_color",

    "weekend_date_font_size",
    "weekend_date_font_weight",
    "weekend_date_foreground_color",
    "weekend_date_background_color"

  ];

  for (let idx = 0; idx < admissible_param.length; idx++) {
    let key = admissible_param[idx];

    if (key in data) {
      param[key] = data[key];
    }
  }

  if ("color_cell" in data) {
    param.color_cell = data.color_cell;
  }

  return param;
}

function neatocal_parse_data(raw) {

  if (raw.type == "loadend") {

    if ((raw.target.readyState == 4) &&
        (raw.target.status == 200)) {

      try {
        let json_data = JSON.parse(raw.target.response);
        data_set_base(json_data);

        if (typeof NEATOCAL_PARAM.data.param !== "undefined") {
          neatocal_override_param(NEATOCAL_PARAM, NEATOCAL_PARAM.data.param);
        }
      }
      catch (e) {
        console.log("error parsing data file:", e);
      }

      neatocal_render();

    }

    // default to render
    //
    if ((raw.target.readyState == 4) &&
        (raw.target.status == 404)) {
      neatocal_render();
    }

  }

}

function ics_unfold_lines(raw) {
  let lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let out = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }

  return out;
}

function ics_parse_datetime(value, params) {
  let is_all_day = false;
  let is_utc = false;

  if (params && params.indexOf("VALUE=DATE") >= 0) {
    is_all_day = true;
  }

  let match_date = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match_date) {
    is_all_day = true;
    return {
      date: new Date(parseInt(match_date[1]), parseInt(match_date[2]) - 1, parseInt(match_date[3])),
      all_day: true
    };
  }

  let match_dt = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!match_dt) {
    return null;
  }

  if (match_dt[7] === "Z") {
    is_utc = true;
  }

  let year = parseInt(match_dt[1]);
  let month = parseInt(match_dt[2]) - 1;
  let day = parseInt(match_dt[3]);
  let hour = parseInt(match_dt[4]);
  let minute = parseInt(match_dt[5]);
  let second = match_dt[6] ? parseInt(match_dt[6]) : 0;

  let date = is_utc
    ? new Date(Date.UTC(year, month, day, hour, minute, second))
    : new Date(year, month, day, hour, minute, second);

  return { date: date, all_day: is_all_day };
}

function ics_parse_events(raw) {
  let lines = ics_unfold_lines(raw);
  let events = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) { events.push(current); }
      current = null;
      continue;
    }
    if (!current) { continue; }

    let idx = line.indexOf(":");
    if (idx < 0) { continue; }

    let name_params = line.slice(0, idx);
    let value = line.slice(idx + 1);

    let parts = name_params.split(";");
    let name = parts[0];
    let params = parts.slice(1).join(";");

    if (name === "SUMMARY") {
      current.summary = value;
    } else if (name === "DTSTART") {
      current.dtstart = { value: value, params: params };
    } else if (name === "DTEND") {
      current.dtend = { value: value, params: params };
    } else if (name === "RRULE") {
      current.rrule = value;
    } else if (name === "DURATION") {
      current.duration = value;
    }
  }

  return events;
}

function ics_color_for_index(idx) {
  return ICS_PALETTE[idx % ICS_PALETTE.length].bg;
}

function ics_text_color_for_index(idx) {
  return ICS_PALETTE[idx % ICS_PALETTE.length].fg;
}

function ics_expand_event(event, color, text_color, source_id, view_start, view_end) {
  if (!event.dtstart) { return; }

  let start_parsed = ics_parse_datetime(event.dtstart.value, event.dtstart.params);
  if (!start_parsed) { return; }

  let end_parsed = null;
  if (event.dtend) {
    end_parsed = ics_parse_datetime(event.dtend.value, event.dtend.params);
  }

  let start_date = start_parsed.date;
  let end_date = end_parsed ? end_parsed.date : new Date(start_date.getTime());
  let all_day = start_parsed.all_day || (end_parsed && end_parsed.all_day);

  if (!end_parsed) {
    if (all_day) {
      end_date = new Date(start_date.getTime() + 86400000);
    }
  }

  let start_day = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate());
  let end_day = new Date(end_date.getFullYear(), end_date.getMonth(), end_date.getDate());

  if (all_day ||
      (end_date.getHours() === 0 && end_date.getMinutes() === 0 && end_date.getSeconds() === 0)) {
    end_day = new Date(end_day.getTime() - 86400000);
  }

  let view_start_day = new Date(view_start.getFullYear(), view_start.getMonth(), view_start.getDate());
  let view_end_last = new Date(view_end.getTime() - 86400000);

  let cur = new Date(start_day.getTime());
  while (cur <= end_day) {
    if (cur >= view_start && cur < view_end) {
      let date_id = fmt_date(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
      let is_start = (cur.getTime() === start_day.getTime()) ||
        (cur.getTime() === view_start_day.getTime() && start_day < view_start_day);
      let is_end = (cur.getTime() === end_day.getTime()) ||
        (cur.getTime() === view_end_last.getTime() && end_day > view_end_last);

      add_event_to_date(date_id, {
        title: event.summary || "(no title)",
        color: color,
        text_color: text_color,
        source_id: source_id,
        span: {
          start: is_start,
          end: is_end
        }
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
}

function ics_import_text(raw, color, text_color, source_id) {
  let events = ics_parse_events(raw);
  let view = get_view_range();

  for (let i = 0; i < events.length; i++) {
    if (events[i].rrule) {
      continue;
    }
    ics_expand_event(events[i], color, text_color, source_id, view.start, view.end);
  }
}

function ics_reset_data() {
  if (NEATOCAL_PARAM.data && NEATOCAL_PARAM.data.__base) {
    data_set_base(NEATOCAL_PARAM.data.__base);
  } else {
    data_set_base({});
  }
}

function ics_update_style(source_id, color, text_color) {
  for (let i = 0; i < NEATOCAL_PARAM.ics_imports.length; i++) {
    if (NEATOCAL_PARAM.ics_imports[i].id === source_id) {
      NEATOCAL_PARAM.ics_imports[i].color = color;
      NEATOCAL_PARAM.ics_imports[i].text_color = text_color;
      break;
    }
  }

  let keys = Object.keys(NEATOCAL_PARAM.data);
  for (let k = 0; k < keys.length; k++) {
    let val = NEATOCAL_PARAM.data[keys[k]];
    if (!Array.isArray(val)) { continue; }
    for (let i = 0; i < val.length; i++) {
      if (val[i] && val[i].source_id === source_id) {
        val[i].color = color;
        val[i].text_color = text_color;
      }
    }
  }

  render_ics_legend();
  neatocal_render();
}

function ics_handle_files(file_list) {
  let files = Array.from(file_list).filter(f => f.name.toLowerCase().endsWith(".ics"));
  if (files.length === 0) { return; }

  let reads = files.map((file, idx) => {
    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.onload = function() {
        resolve({ text: reader.result, idx: idx });
      };
      reader.readAsText(file);
    });
  });

  Promise.all(reads).then((results) => {
    for (let i = 0; i < results.length; i++) {
      let import_id = NEATOCAL_PARAM.ics_import_count + results[i].idx;
      let color = ics_color_for_index(import_id);
      let text_color = ics_text_color_for_index(import_id);
      let file = files[results[i].idx];
      let label = file ? file.name.replace(/\.ics$/i, "") : ("Calendar " + (import_id + 1).toString());

      NEATOCAL_PARAM.ics_imports.push({
        id: import_id,
        name: label,
        color: color,
        text_color: text_color
      });

      ics_import_text(results[i].text, color, text_color, import_id);
    }
    NEATOCAL_PARAM.ics_import_count += results.length;
    render_ics_legend();
    neatocal_render();
  });
}

function render_ics_legend() {
  let legend = document.getElementById("ics_legend");
  if (!legend) { return; }

  legend.innerHTML = "";
  if (NEATOCAL_PARAM.ics_imports.length === 0) { return; }

  for (let i = 0; i < NEATOCAL_PARAM.ics_imports.length; i++) {
    let item = NEATOCAL_PARAM.ics_imports[i];

    let row = H.div();
    row.classList.add("ics-legend-row");

    let swatch = H.span();
    swatch.classList.add("ics-legend-swatch");
    swatch.style.background = item.color;
    if (item.text_color) {
      swatch.style.borderColor = item.text_color;
    }
    swatch.dataset.id = item.id.toString();

    swatch.addEventListener("click", function(e) {
      e.stopPropagation();
      let id = parseInt(e.target.dataset.id, 10);
      if (isNaN(id)) { return; }

      let palette = H.div();
      palette.classList.add("ics-legend-palette");

      for (let p = 0; p < ICS_PALETTE.length; p++) {
        let opt = H.span();
        opt.classList.add("ics-legend-palette-item");
        opt.style.background = ICS_PALETTE[p].bg;
        opt.style.color = ICS_PALETTE[p].fg;
        opt.dataset.id = id.toString();
        opt.dataset.bg = ICS_PALETTE[p].bg;
        opt.dataset.fg = ICS_PALETTE[p].fg;
        opt.addEventListener("click", function(ev) {
          ev.stopPropagation();
          let _id = parseInt(ev.target.dataset.id, 10);
          if (isNaN(_id)) { return; }
          ics_update_style(_id, ev.target.dataset.bg, ev.target.dataset.fg);
        });
        palette.appendChild(opt);
      }

      palette.addEventListener("click", function(ev) {
        ev.stopPropagation();
      });

      function close_palette() {
        window.removeEventListener("click", close_palette);
        render_ics_legend();
      }

      window.addEventListener("click", close_palette);
      swatch.replaceWith(palette);
    });

    let name = H.span();
    name.classList.add("ics-legend-name");
    name.textContent = item.name;
    name.dataset.idx = i.toString();

    name.addEventListener("click", function(e) {
      let idx = parseInt(e.target.dataset.idx, 10);
      if (isNaN(idx)) { return; }

      let input = document.createElement("input");
      input.type = "text";
      input.value = NEATOCAL_PARAM.ics_imports[idx].name;
      input.classList.add("ics-legend-input");

      function commit() {
        let val = input.value.trim();
        if (val) {
          NEATOCAL_PARAM.ics_imports[idx].name = val;
        }
        render_ics_legend();
      }

      input.addEventListener("blur", commit);
      input.addEventListener("keydown", function(ev) {
        if (ev.key === "Enter") { commit(); }
        if (ev.key === "Escape") { render_ics_legend(); }
      });

      name.replaceWith(input);
      input.focus();
      input.select();
    });

    row.appendChild(swatch);
    row.appendChild(name);
    legend.appendChild(row);
  }
}
function neatocal_setup_ics_drop() {
  let overlay = document.getElementById("ics_drop_overlay");
  let input = document.getElementById("ics_file_input");

  if (!overlay || !input) { return; }

  let drag_counter = 0;

  function show() {
    overlay.classList.add("visible");
  }

  function hide() {
    overlay.classList.remove("visible");
  }

  window.addEventListener("dragenter", function(e) {
    e.preventDefault();
    drag_counter += 1;
    show();
  });

  window.addEventListener("dragover", function(e) {
    e.preventDefault();
  });

  window.addEventListener("dragleave", function(e) {
    e.preventDefault();
    drag_counter -= 1;
    if (drag_counter <= 0) {
      drag_counter = 0;
      hide();
    }
  });

  window.addEventListener("drop", function(e) {
    e.preventDefault();
    drag_counter = 0;
    hide();
    if (e.dataTransfer && e.dataTransfer.files) {
      ics_handle_files(e.dataTransfer.files);
    }
  });

  overlay.addEventListener("click", function() {
    input.click();
  });

  input.addEventListener("change", function() {
    if (input.files) {
      ics_handle_files(input.files);
      input.value = "";

      hide();
    }
  });

  if (NEATOCAL_PARAM.ics) {
    show();
  }
}

function neatocal_init() {
  // Load local-only settings first; URL params (below) can override.
  neatocal_settings_load();
  neatocal_todo_load();

  // Create/bind UI affordances (progress text, gear, modals, click handlers)
  neatocal_ui_init();

  let sp = new URLSearchParams(window.location.search);

  // peel off parameters from URL
  //

  let help_param = sp.get("help");
  let year_param = sp.get("year");
  let layout_param = sp.get("layout");
  let start_month_param = sp.get("start_month");
  let n_month_param = sp.get("n_month");
  let start_day_param = sp.get("start_day");
  let highlight_color_param = sp.get("highlight_color");
  let today_highlight_color_param = sp.get("today_highlight_color");
  let cell_height_param = sp.get("cell_height");
  let weekday_code_param = sp.get("weekday_code");
  let weekday_format_param = sp.get("weekday_format");
  let month_code_param = sp.get("month_code");
  let month_format_param = sp.get("month_format");
  let language_param = sp.get("language");
  let show_week_numbers_param = sp.get("show_week_numbers");
  let ics_param = sp.get("ics");

  let weekend_days_param = sp.get("weekend_days");

  // Moon phase parameters
  //
  let show_moon_phase_param = sp.get("show_moon_phase");
  let moon_phase_style_param = sp.get("moon_phase_style");
  let moon_phase_position_param = sp.get("moon_phase_position");
  let moon_phase_display_param = sp.get("moon_phase_display");

  // fiddly stylings
  //
  let _ele_pfx = [ "year", "month", "weekday", "weekend", "week", "date", "weekend_date" ];
  let _ele_sfx = [ "font_size", "font_weight", "foreground_color", "background_color" ];
  for (let i_p=0; i_p<_ele_pfx.length; i_p++) {
    for (let i_s=0; i_s<_ele_sfx.length; i_s++) {
      let _ele_name = _ele_pfx[i_p] + "_" + _ele_sfx[i_s];
      let _ele_param = sp.get(_ele_name);

      if ((_ele_param != null) &&
          (typeof _ele_param !== "undefined")) {
        NEATOCAL_PARAM[_ele_name] = _ele_param;
      }

    }
  }

  // JSON data file
  //
  let datafn_param = sp.get("data");

  //---

  let data_fn = "";
  if ((datafn_param != null) &&
      (typeof datafn_param !== "undefined")) {
    data_fn = datafn_param;
  }
  NEATOCAL_PARAM.data_fn = data_fn;

  //---

  if ((help_param != null) &&
      (typeof help_param !== "undefined")) {
    let ui_info = document.getElementById("ui_info");
    ui_info.style.display = '';
  }

  //---

  let year = new Date().getFullYear();
  if ((year_param != null) &&
      (typeof year_param !== "undefined")) {
    year = year_param;
  }
  NEATOCAL_PARAM.year = year;

  //---

  let layout = NEATOCAL_PARAM.layout;
  if ((layout_param != null) &&
      (typeof layout_param !== "undefined")) {
    _l = sp.get("layout");
    if      (_l == "default")           { layout = "default"; }
    else if (_l == "aligned-weekdays")  { layout = "aligned-weekdays"; }
    else if (_l == "hallon-almanackan") {
      layout = "hallon-almanackan";
      NEATOCAL_PARAM.show_week_numbers = true;
      NEATOCAL_PARAM.weekend_days = [0];
    }
  }
  NEATOCAL_PARAM.layout = layout;

  //---

  let start_month = NEATOCAL_PARAM.start_month;
  if ((start_month_param != null) &&
      (typeof start_month_param !== "undefined")) {
    start_month = parseInt(start_month_param);
    if (isNaN(start_month)) {
      start_month = 0;
    }
  }
  NEATOCAL_PARAM.start_month = start_month;

  //---

  let n_month = NEATOCAL_PARAM.n_month;
  if ((n_month_param != null) &&
      (typeof n_month_param !== "undefined")) {
    n_month = parseInt(n_month_param);
    if (isNaN(n_month)) {
      n_month = 0;
    }
  }
  NEATOCAL_PARAM.n_month = n_month;

  //---

  let start_day = NEATOCAL_PARAM.start_day;
  if ((start_day_param != null) &&
      (typeof start_day_param !== "undefined")) {
    start_day = parseInt(start_day_param);
    if (isNaN(start_day)) {
      start_day = 0;
    }
  }
  NEATOCAL_PARAM.start_day = start_day;

  //---

  let highlight_color = NEATOCAL_PARAM.highlight_color;
  if ((highlight_color_param != null) &&
      (typeof highlight_color_param !== "undefined")) {
    highlight_color = highlight_color_param;
    if (highlight_color.match( /^[\da-fA-F]+/ )) {
      highlight_color = "#" + highlight_color;
    }
  }
  NEATOCAL_PARAM.highlight_color = highlight_color;

  //---

  let today_highlight_color = NEATOCAL_PARAM.today_highlight_color;
  if ((today_highlight_color_param != null) &&
      (typeof today_highlight_color_param !== "undefined")) {
    today_highlight_color = today_highlight_color_param;
    if (today_highlight_color.match( /^[\da-fA-F]+/ )) {
      today_highlight_color = "#" + today_highlight_color;
    }
  }
  NEATOCAL_PARAM.today_highlight_color = today_highlight_color;

  //---

  let cell_height = NEATOCAL_PARAM.cell_height;
  if ((cell_height_param != null) &&
      (typeof cell_height_param !== "undefined")) {
    cell_height = cell_height_param;
  }
  NEATOCAL_PARAM.cell_height = cell_height;

  //---

  if (new Set(["long", "short", "narrow"]).has(weekday_format_param)) {
    NEATOCAL_PARAM.weekday_format = weekday_format_param;
  }

  //---

  if (new Set(["numeric", "2-digit", "long", "short", "narrow"]).has(month_format_param)) {
    NEATOCAL_PARAM.month_format = month_format_param;
  }

  //---

  // language fills out the month/day codes and happens
  // before so it can be overriden by month day code
  // specification.
  //
  if ((language_param != null) &&
      (typeof language_param !== "undefined")) {

    for (let day_idx=0; day_idx<7; day_idx++) {
      NEATOCAL_PARAM.weekday_code[day_idx] = localized_day(language_param, day_idx);
    }

    for (let mo_idx=0; mo_idx<12; mo_idx++) {
      NEATOCAL_PARAM.month_code[mo_idx] = localized_month(language_param, mo_idx);
    }
  }

  //---

  let weekday_code = NEATOCAL_PARAM.weekday_code;
  if ((weekday_code_param != null) &&
      (typeof weekday_code_param !== "undefined")) {

    weekday_code = weekday_code_param.split(",");

    // padd out with blank
    //
    for (let i=weekday_code.length; i<7; i++) {
      weekday_code.push("");
    }

  }
  NEATOCAL_PARAM.weekday_code = weekday_code;

  //---

  let month_code = NEATOCAL_PARAM.month_code;
  if ((month_code_param != null) &&
      (typeof month_code_param !== "undefined")) {

    month_code = month_code_param.split(",");

    // padd out with blank
    //
    for (let i=month_code.length; i<7; i++) {
      month_code.push("");
    }

  }
  NEATOCAL_PARAM.month_code = month_code;

  //---

  // thanks to https://github.com/fawaz-alesayi/neatocal
  //
  if ((weekend_days_param != null) &&
      (typeof weekend_days_param !== "undefined")) {
    let days = weekend_days_param.split(",").map(d => parseInt(d.trim()));
    NEATOCAL_PARAM.weekend_days = days.filter(d => !isNaN(d) && d >= 0 && d <= 6);
  }

  // hallon-almanackan defaults to showing week numbers.
  // If the showing week numbers is specified, use user specified value,
  // whether true or false, otherwise, leave it alone.
  //
  if ((show_week_numbers_param != null) &&
      (typeof show_week_numbers_param !== "undefined")) {
    NEATOCAL_PARAM.show_week_numbers = (show_week_numbers_param === "true");
  }

  if ((ics_param != null) &&
      (typeof ics_param !== "undefined")) {
    NEATOCAL_PARAM.ics = !(ics_param === "false" || ics_param === "0");
  }

  neatocal_setup_ics_drop();

  //---

  // Moon phase parameters
  //
  let show_moon_phase = NEATOCAL_PARAM.show_moon_phase;
  if ((show_moon_phase_param != null) &&
      (typeof show_moon_phase_param !== "undefined")) {
    show_moon_phase = (show_moon_phase_param === "true" || show_moon_phase_param === "1");
  }
  NEATOCAL_PARAM.show_moon_phase = show_moon_phase;

  //---

  let moon_phase_style = NEATOCAL_PARAM.moon_phase_style;
  if ((moon_phase_style_param != null) &&
      (typeof moon_phase_style_param !== "undefined")) {
    if (moon_phase_style_param === "css" ||
        moon_phase_style_param === "symbol" ||
        moon_phase_style_param === "name") {
      moon_phase_style = moon_phase_style_param;
    }
  }
  NEATOCAL_PARAM.moon_phase_style = moon_phase_style;

  //---

  let moon_phase_position = NEATOCAL_PARAM.moon_phase_position;
  if ((moon_phase_position_param != null) &&
      (typeof moon_phase_position_param !== "undefined")) {
    if (moon_phase_position_param === "below" ||
        moon_phase_position_param === "inline") {
      moon_phase_position = moon_phase_position_param;
    }
  }
  NEATOCAL_PARAM.moon_phase_position = moon_phase_position;

  //---

  let moon_phase_display = NEATOCAL_PARAM.moon_phase_display;
  if ((moon_phase_display_param != null) &&
      (typeof moon_phase_display_param !== "undefined")) {
    if (moon_phase_display_param === "all" ||
        moon_phase_display_param === "changes") {
      moon_phase_display = moon_phase_display_param;
    }
  }
  NEATOCAL_PARAM.moon_phase_display = moon_phase_display;

  //---

  // if we have a data file, short circuit to wait till load.
  // neatocal_parse_data will call neatocal_render to render the
  // calendar.
  //
  if (NEATOCAL_PARAM.data_fn) {
    loadXHR( NEATOCAL_PARAM.data_fn, neatocal_parse_data, neatocal_parse_data_error );
    return;
  }

  // no data file, just render
  //
  if (!NEATOCAL_PARAM.data || !NEATOCAL_PARAM.data.__base) {
    data_set_base({});
  }
  neatocal_render();
}

function neatocal_render() {
  // recompute todo cache once per render; render_* functions will read it
  neatocal_todo_recompute_cache();
  neatocal_update_header_progress();

  let cur_start_month = NEATOCAL_PARAM.start_month;
  let month_remain = NEATOCAL_PARAM.n_month;
  let s_year = parseInt(NEATOCAL_PARAM.year);
  let e_year = parseInt(NEATOCAL_PARAM.year) + Math.floor((cur_start_month + month_remain-1)/12)

  let layout = NEATOCAL_PARAM.layout;

  let year_fraction_tot = 0;
  let year_fraction = [];
  for ( let y = s_year; y <= e_year; y++ ) {
    let del_mo = (((cur_start_month + month_remain) > 12) ? (12-cur_start_month) : (month_remain));
    year_fraction.push( del_mo );
    cur_start_month = 0;
    month_remain -= del_mo;

    year_fraction_tot += del_mo;
  }

  for (let i=0; i < year_fraction.length; i++) {
    year_fraction[i] /= year_fraction_tot;
  }

  // if we only have one year, put it in the center
  // otherwise find the proportion of other years
  //   and adjust the year header appropriately

  let ui_year = document.getElementById("ui_year");
  ui_year.innerHTML = "";

  for ( let y = s_year, idx = 0; y <= e_year; y++, idx++) {
    let span = H.span();
    span.innerHTML = y.toString();
    span.style["display"] = "inline-block";
    span.style["width"] = (100*year_fraction[idx]).toString() + "%";
    span.style["justify-content"] = "center";
    span.style["text-align"] = "center";
    span.style["margin"] = "0 0 .5em 0";

    year_styles(span);

    ui_year.appendChild( span );
  }

  //---
  let ui_tbody = document.getElementById("ui_tbody");
  ui_tbody.innerHTML = "";

  if (layout == "aligned-weekdays") {
    neatocal_aligned_weekdays();
  }
  else if (layout == "hallon-almanackan") {
    neatocal_hallon_almanackan();
  }
  else {
    neatocal_default();
  }

  neatocal_post_process();
}
