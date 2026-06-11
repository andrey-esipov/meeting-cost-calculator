// workiq.js — LIVE "read your week" insights via the Work IQ A2A API.
// The browser can't call workiq.svc.cloud.microsoft directly (CORS + it's an
// agent endpoint), so we POST through a thin proxy (see proxy/) that forwards
// our delegated WorkIQAgent.Ask token. Dormant until BR_CONFIG.workIq.proxyUrl
// is set; data-source.js falls back to the demo narrative on any failure.
(function () {
  var cfg = window.BR_CONFIG;
  // Work IQ returns model-authored text that app.js renders via innerHTML, so
  // escape it here (trust boundary). Demo narrative is our own trusted HTML.
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16);
    });
  }

  async function ask(promptText) {
    if (!cfg.workIqAvailable || !window.BR_GRAPH) throw new Error("Work IQ not configured.");
    var token = await window.BR_GRAPH.getToken([cfg.workIq.scope]);
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    var body = {
      jsonrpc: "2.0", id: uuid(), method: "SendMessage",
      params: {
        message: {
          role: "ROLE_USER", messageId: uuid(),
          parts: [{ text: promptText }],
          metadata: { Location: { timeZoneOffset: -new Date().getTimezoneOffset(), timeZone: tz } },
        },
      },
    };
    var res = await fetch(cfg.workIq.proxyUrl, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", "A2A-Version": "1.0" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Work IQ proxy " + res.status);
    var data = await res.json();
    var arts = data && data.result && data.result.task && data.result.task.artifacts;
    var text = "";
    if (arts) arts.forEach(function (a) { (a.parts || []).forEach(function (p) { if (p.text) text += p.text + "\n"; }); });
    return text.trim();
  }

  // Returns { narrative, recs:[{text,save}] } parsed from the model's reply.
  async function weekInsight(week) {
    var money = window.BR_ENGINE.money(week.total);
    var top = week.mostExpensive ? week.mostExpensive.meeting.subject : "a recurring meeting";
    var prompt =
      "Help me understand the cost of my meetings this week. I had " + week.count +
      " meetings totaling about " + money + " and " + week.hours + " hours; my priciest meeting is \"" + top + "\". " +
      "In 2-3 blunt, specific sentences, tell me the most striking thing about how I'm spending meeting time. " +
      "Then on new lines give EXACTLY 3 recommendations to cut cost, each starting with '- ' and ending with an " +
      "estimated weekly saving in parentheses like (~$1,200/wk).";

    var text = await ask(prompt);
    if (!text) return null;

    var lines = text.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
    var recLines = lines.filter(function (l) { return /^[-•*]\s+/.test(l); });
    var narrative = lines.filter(function (l) { return !/^[-•*]\s+/.test(l); }).join(" ");
    var recs = recLines.slice(0, 3).map(function (l) {
      var t = l.replace(/^[-•*]\s+/, "");
      var m = t.match(/\(([^)]*\$[^)]*)\)\s*$/);
      var save = m ? m[1] : "";
      if (m) t = t.slice(0, m.index).trim().replace(/[—-]\s*$/, "").trim();
      return { text: esc(t), save: save };
    });
    return { narrative: esc(narrative || text), recs: recs };
  }

  window.BR_WORKIQ = { weekInsight: weekInsight, ask: ask };
})();
