// titles.js — map a Microsoft Graph job title string to a compensation band.
// Reuses the Microsoft level/comp table in ROLE_PRESETS (js/data.js).
// Real attendees come back from Graph as { displayName, jobTitle } — e.g.
// "Senior Software Engineer", "Principal PM Manager", "Partner GPM". We parse
// discipline + seniority, then snap to the closest band we have data for.

(function () {
  function levelNum(lv) { return parseInt(String(lv).replace(/[^0-9]/g, ""), 10) || 60; }

  // Fallback comp curve by Microsoft level (total comp, US), used when we have
  // no preset for a discipline/level combo. Derived from the ROLE_PRESETS ranges.
  const LEVEL_COMP = {
    59: 160000, 60: 178000, 61: 198000, 62: 218000, 63: 238000,
    64: 285000, 65: 335000, 66: 450000, 67: 580000, 68: 850000,
  };
  function annualForLevel(n) {
    if (LEVEL_COMP[n]) return LEVEL_COMP[n];
    if (n >= 68) return 900000;
    if (n <= 59) return 155000;
    return 200000;
  }

  function detectDiscipline(t) {
    if (/(content design|content strateg|technical writer|\bwriter\b)/.test(t)) return "Content Design";
    if (/(ux research|user research|\bresearcher\b)/.test(t)) return "UX Research";
    if (/(data scien|machine learning|applied scien|\bml\b)/.test(t)) return "Data Science";
    if (/(program manager|\btpm\b)/.test(t)) return "Product"; // TPM comp ~ PM
    if (/(product manager|product lead|\bpm\b|\bgpm\b|group product)/.test(t) || /\bproduct\b/.test(t)) return "Product";
    if (/(designer|\bdesign\b|\bux\b)/.test(t)) return "Design";
    if (/(engineer|developer|\bsde\b|\bswe\b|software|architect)/.test(t)) return "Engineering";
    return "Engineering";
  }

  function isManagement(t) {
    return /(\bmanager\b|\bdirector\b|\bvp\b|vice president|\bcvp\b|chief|head of|general manager|\bpartner\b)/.test(t)
      && !/(product manager|program manager)/.test(t);
  }

  function detectLevel(t) {
    if (/intern/.test(t)) return 59;
    if (/(distinguished|technical fellow|\bfellow\b)/.test(t)) return 67;
    if (/(cvp|corporate vice president)/.test(t)) return 68;
    if (/(\bevp\b|executive vice|\bsvp\b|\bvp\b|vice president)/.test(t)) return 68;
    if (/(senior director|sr\.? director)/.test(t)) return 67;
    if (/(group|\bgpm\b|group program|group product)/.test(t)) return 67;
    if (/(\bdirector\b)/.test(t)) return 66;
    if (/(\bpartner\b)/.test(t)) return 66;
    if (/(principal)/.test(t)) return 64;
    if (/(senior|\bsr\.?\b|\bstaff\b|\blead\b|principal)/.test(t)) return 62;
    if (/(\bii\b|\b2\b)/.test(t)) return 61;
    return 60;
  }

  // Snap to the closest band we have for the discipline.
  function bandFor(discipline, level) {
    var pool = (typeof ROLE_PRESETS !== "undefined")
      ? ROLE_PRESETS.filter(function (r) { return r.discipline === discipline; }) : [];
    if (!pool.length && typeof ROLE_PRESETS !== "undefined") pool = ROLE_PRESETS;
    var best = null, bestGap = Infinity;
    pool.forEach(function (r) {
      var gap = Math.abs(levelNum(r.level) - level);
      if (gap < bestGap) { bestGap = gap; best = r; }
    });
    return best;
  }

  // Public: jobTitle -> { name, level, annual, discipline, estimated }
  window.mapTitleToComp = function (jobTitle) {
    var t = (jobTitle || "").toLowerCase().trim();
    if (!t) {
      return { name: "Unknown role", level: "62", annual: annualForLevel(62), discipline: "Engineering", estimated: true };
    }
    var mgmt = isManagement(t);
    var discipline = mgmt ? "Management" : detectDiscipline(t);
    var level = detectLevel(t);
    var band = bandFor(discipline, level);
    var annual = band ? band.annual : annualForLevel(level);
    // If the band's level is far from what the title implies, blend toward the curve.
    if (band && Math.abs(levelNum(band.level) - level) >= 2) {
      annual = Math.round((annual + annualForLevel(level)) / 2);
    }
    return {
      name: jobTitle,
      level: String(level),
      annual: annual,
      discipline: discipline,
      estimated: false,
    };
  };
})();
