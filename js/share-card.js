// share-card.js — the viral loop. Renders a branded 1200x630 image of your
// week (canvas) you can drop into Teams, plus a markdown summary for "Copy".
(function () {
  var money = function (n) { return window.BR_ENGINE.money(n); };

  async function renderCanvas(week) {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    var W = 1200, H = 630, c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");

    // background
    var bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0B0B12"); bg.addColorStop(1, "#0E0E16");
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(W * 0.82, -60, 40, W * 0.82, -60, 620);
    glow.addColorStop(0, "rgba(255,138,44,0.30)"); glow.addColorStop(1, "rgba(255,138,44,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);

    var pad = 70;
    // top row
    x.textBaseline = "alphabetic";
    x.font = "22px 'Press Start 2P', monospace"; x.fillStyle = "#F5F3EF";
    x.fillText("🔥 Burn Rate", pad, pad + 28);
    x.font = "12px 'Press Start 2P', monospace"; x.fillStyle = "#FFC24B";
    x.textAlign = "right"; x.fillText("POWERED BY WORK IQ", W - pad, pad + 24); x.textAlign = "left";

    // eyebrow
    x.font = "13px 'Press Start 2P', monospace"; x.fillStyle = "#9A97A4";
    x.fillText("MY MEETINGS · THIS WEEK", pad, 200);

    // big number (flame gradient)
    var grad = x.createLinearGradient(pad, 220, pad, 360);
    grad.addColorStop(0, "#FFFFFF"); grad.addColorStop(0.45, "#FFC24B");
    grad.addColorStop(0.8, "#FF8A2C"); grad.addColorStop(1, "#FF5A1F");
    x.font = "92px 'Press Start 2P', monospace"; x.fillStyle = grad;
    x.fillText(money(week.total), pad - 4, 330);

    // delta + subline
    x.font = "700 26px 'JetBrains Mono', monospace"; x.fillStyle = "#FF566E";
    var deltaTxt = week.deltaPct != null ? ("▲ " + week.deltaPct + "% vs last week") : "";
    x.fillText(deltaTxt, pad, 392);
    x.font = "500 26px 'JetBrains Mono', monospace"; x.fillStyle = "#C9C6CF";
    x.fillText(week.count + " meetings   ·   " + week.hours + " hours   ·   " + week.people + " people", pad, 444);

    // leaderboard top 3
    var medals = ["🥇", "🥈", "🥉"];
    x.font = "600 24px 'JetBrains Mono', monospace";
    (week.leaderboard || []).slice(0, 3).forEach(function (item, i) {
      var y = 506 + i * 40;
      x.fillStyle = "#E7E4DE";
      var name = item.meeting.subject;
      if (name.length > 38) name = name.slice(0, 37) + "…";
      x.textAlign = "left"; x.fillText(medals[i] + "  " + name, pad, y);
      x.textAlign = "right"; x.fillStyle = "#FFC24B"; x.fillText(money(item.cost), W - pad, y);
      x.textAlign = "left";
    });

    return c;
  }

  function teamsMarkdown(week) {
    var lines = [];
    lines.push("### 🔥 Burn Rate — my meetings this week");
    lines.push("");
    lines.push("**" + money(week.total) + "**" + (week.deltaPct != null ? "  (▲ " + week.deltaPct + "% vs last week)" : ""));
    lines.push(week.count + " meetings · " + week.hours + " hours · " + week.people + " people");
    lines.push("");
    if (week.leaderboard && week.leaderboard.length) {
      lines.push("**Most expensive:**");
      week.leaderboard.slice(0, 3).forEach(function (it, i) {
        lines.push((i + 1) + ". " + it.meeting.subject + " — " + money(it.cost));
      });
      lines.push("");
    }
    if (week.emailable && week.emailable.count) {
      lines.push("📧 " + week.emailable.count + " of these could've been an email (~" + money(week.emailable.cost) + ")");
      lines.push("");
    }
    lines.push("_Powered by Work IQ · titles via Microsoft Graph · salaries estimated from levels.fyi_");
    return lines.join("\n");
  }

  async function dataURL(week) { return (await renderCanvas(week)).toDataURL("image/png"); }

  async function download(week) {
    var url = await dataURL(week);
    var a = document.createElement("a");
    a.href = url; a.download = "burn-rate-week.png"; a.click();
  }

  // Try to put the image on the clipboard; fall back to download. Always also
  // copies the markdown summary as text where supported.
  async function copyForTeams(week) {
    var ok = false;
    try {
      var canvas = await renderCanvas(week);
      var blob = await new Promise(function (r) { canvas.toBlob(r, "image/png"); });
      if (navigator.clipboard && window.ClipboardItem && blob) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        ok = true;
      }
    } catch (e) { /* fall through to download */ }
    if (!ok) await download(week);
    return ok ? "image-copied" : "downloaded";
  }

  window.BR_SHARE = { renderCanvas: renderCanvas, dataURL: dataURL, download: download, copyForTeams: copyForTeams, teamsMarkdown: teamsMarkdown };
})();
