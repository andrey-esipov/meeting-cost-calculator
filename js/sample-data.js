// sample-data.js — a believable week on a Microsoft PM's calendar.
// Used for Demo Mode (no sign-in) and as the instant landing experience.
// Returns the SAME normalized shape that GraphSource produces, so the engine
// and UI never know the difference. Dates are generated relative to "now".

(function () {
  // Roster: name + real-sounding Microsoft titles (titles.js maps title -> comp).
  var R = [
    { name: "You",            email: "you@contoso.com",      jobTitle: "Senior Product Manager" },     // 0
    { name: "Dana Wu",        email: "dana@contoso.com",     jobTitle: "Principal Product Manager" },  // 1
    { name: "Marcus Bell",    email: "marcus@contoso.com",   jobTitle: "Partner Group Product Manager" }, // 2
    { name: "Priya Nair",     email: "priya@contoso.com",    jobTitle: "Corporate Vice President" },    // 3
    { name: "Sam Ortiz",      email: "sam@contoso.com",      jobTitle: "Engineering Manager" },         // 4
    { name: "Alex Kim",       email: "alex@contoso.com",     jobTitle: "Senior Software Engineer" },    // 5
    { name: "Jordan Pratt",   email: "jordan@contoso.com",   jobTitle: "Software Engineer II" },        // 6
    { name: "Lee Zhang",      email: "lee@contoso.com",      jobTitle: "Principal Software Engineer" }, // 7
    { name: "Mia Roe",        email: "mia@contoso.com",      jobTitle: "Senior Designer" },             // 8
    { name: "Noah Frost",     email: "noah@contoso.com",     jobTitle: "UX Researcher" },               // 9
    { name: "Omar Haddad",    email: "omar@contoso.com",     jobTitle: "Data Scientist" },              // 10
    { name: "Quinn Avery",    email: "quinn@contoso.com",    jobTitle: "Program Manager" },             // 11
    { name: "Riley Stone",    email: "riley@contoso.com",    jobTitle: "Software Engineer" },           // 12
    { name: "Tess Owen",      email: "tess@contoso.com",     jobTitle: "Director" },                    // 13
  ];
  function people(indices, spokeIdx) {
    var spoke = spokeIdx || [];
    return indices.map(function (i) {
      return { name: R[i].name, email: R[i].email, jobTitle: R[i].jobTitle, spoke: spoke.indexOf(i) !== -1 };
    });
  }

  // dayOffset: 0=Mon..4=Fri. weeks: which week-offsets to emit (-1 last, 0 this, 1/2 upcoming).
  var TEMPLATES = [
    { subj: "Weekly Staff Sync", day: 0, h: 9,  dur: 60, rec: true,  who: [0,1,2,3,4,5,7,8,9,10,11,13], spoke: [2,3,0] },
    { subj: "Team Standup",      day: 0, h: 9,  min: 15, dur: 15, rec: true, daily: true, who: [0,4,5,6,8,12], spoke: [0,4,5,6,8,12] },
    { subj: "Sprint Status Update", day: 3, h: 9, min: 30, dur: 30, rec: true, who: [0,1,4,5,6,7,8,9,11,12,13], spoke: [4,0] },
    { subj: "Bug Triage",        day: 4, h: 13, dur: 30, rec: true,  who: [0,4,5,6,7,12], spoke: [4,5,6] },
    // one-offs (this week)
    { subj: "Q3 Planning Review", day: 1, h: 13, dur: 90, rec: false, who: [0,1,2,4,7,8,9,11,13], spoke: [0,1,2,4] },
    { subj: "“Quick” sync", day: 2, h: 11, dur: 30, rec: false, who: [0,1,4,5,11], spoke: [0,1] },
    { subj: "Design Review",     day: 1, h: 15, min: 30, dur: 45, rec: false, who: [0,1,8,9,12], spoke: [8,0,9] },
    { subj: "Customer Call – Northwind", day: 3, h: 11, dur: 60, rec: false, who: [0,1,8,4], spoke: [0,1,8] },
    { subj: "Spec Review: Sharing v2", day: 4, h: 10, dur: 45, rec: false, who: [0,1,5,7,8], spoke: [0,1,5,7] },
    { subj: "Roadmap Sync",      day: 2, h: 16, dur: 30, rec: true,  who: [0,1,2,4,11], spoke: [0,1,2] },
    { subj: "1:1 with Sam",      day: 2, h: 14, dur: 30, rec: true,  who: [0,4], spoke: [0,4] },
    { subj: "1:1 with Dana",     day: 3, h: 14, dur: 30, rec: true,  who: [0,1], spoke: [0,1] },
    { subj: "Incident Review (SEV2)", day: 4, h: 15, dur: 30, rec: false, who: [0,4,5,7,13], spoke: [4,5,7] },
    { subj: "Team All-Hands", day: 3, h: 12, dur: 60, rec: true, who: [0,1,2,3,4,5,6,7,8,9,10,11,12,13], spoke: [2,3] },
    { subj: "Leadership Review", day: 2, h: 9, dur: 60, rec: false, who: [0,1,2,3,4,13], spoke: [0,2,3] },
  ];

  function startOfWeek(date) {
    var x = new Date(date); x.setHours(0, 0, 0, 0);
    var day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x;
  }

  function build(t, weekStart, weekOffset, dayOffset) {
    var start = new Date(weekStart);
    start.setDate(start.getDate() + weekOffset * 7 + (t.day + (dayOffset || 0)));
    start.setHours(t.h, t.min || 0, 0, 0);
    var end = new Date(start.getTime() + t.dur * 60000);
    return {
      id: t.subj.replace(/\W+/g, "-").toLowerCase() + "-" + weekOffset + "-" + (dayOffset || 0),
      subject: t.subj,
      start: start, end: end, durationMin: t.dur,
      isRecurring: !!t.rec, organizer: R[0].name, online: true,
      attendees: people(t.who, t.spoke),
    };
  }

  window.getSampleMeetings = function (now) {
    var ws = startOfWeek(now || new Date());
    var out = [];
    TEMPLATES.forEach(function (t) {
      // recurring meetings exist last week, this week, and the next two weeks;
      // one-offs land this week (plus a couple seeded into upcoming weeks).
      var weeks = t.rec ? [-1, 0, 1, 2] : [0];
      weeks.forEach(function (wo) {
        if (t.daily) {
          for (var dd = 0; dd < 5; dd++) out.push(build(t, ws, wo, dd - t.day));
        } else {
          out.push(build(t, ws, wo, 0));
        }
      });
    });
    // seed a few one-offs into next week so "Upcoming" looks alive
    out.push(build({ subj: "Exec Review: H2 Bets", day: 1, h: 10, dur: 60, who: [0,1,2,3,13], spoke: [0,2,3] }, ws, 1, 0));
    out.push(build({ subj: "Hiring Loop Debrief", day: 2, h: 13, dur: 60, who: [0,4,5,8,9], spoke: [0,4,5,8,9] }, ws, 1, 0));
    out.push(build({ subj: "Offsite Planning", day: 4, h: 14, dur: 45, who: [0,1,4,11], spoke: [0,1,4,11] }, ws, 1, 0));
    return out;
  };

  // A canned Work IQ-style narrative for Demo Mode (live mode replaces this
  // with a real Work IQ A2A response).
  window.getSampleInsight = function (week) {
    var top = week.mostExpensive ? week.mostExpensive.meeting.subject : "your biggest recurring meeting";
    return {
      narrative: "You spent most of your meeting time in <b>recurring status updates</b>. <span class='hl'>" +
        top + "</span> is your priciest line item, and three meetings had a partner-level attendee who barely spoke.",
      recs: [
        { text: "Make <b>Sprint Status Update</b> async — a Loom + a Loop component covers it.", save: "~$1,450/wk" },
        { text: "Trim the <b>" + top + "</b> invite to deciders; make the rest optional.", save: "~$1,500/wk" },
        { text: "Block <b>Thursday mornings</b> for focus before the calendar fills.", save: "+4 hrs focus" },
      ],
    };
  };
})();
