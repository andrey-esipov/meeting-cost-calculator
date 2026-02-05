// Mock AI Analysis Functions
// These simulate AI responses for demo purposes
// To use real AI, set up a backend proxy to hide your API key

async function analyzeMeetingROI(agendaText, notesText, meetingCost) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Extract some basic signals from the text
  const combinedText = (agendaText + " " + notesText).toLowerCase();
  const hasActionWords = /\b(will|to do|action|follow up|send|review|schedule|complete)\b/i.test(combinedText);
  const hasDecisionWords = /\b(decided|agreed|approved|confirmed|chosen|selected)\b/i.test(combinedText);
  const hasVagueWords = /\b(discuss|sync|touch base|catch up|align|chat)\b/i.test(combinedText);
  const wordCount = combinedText.split(/\s+/).length;

  // Generate semi-intelligent mock results
  const clarityScore = hasVagueWords ?
    Math.floor(30 + Math.random() * 30) :
    Math.floor(55 + Math.random() * 40);

  const onTopicPercent = Math.floor(50 + Math.random() * 45);

  // Mock action items extraction
  const actionItemTemplates = [
    { owner: "John", task: "Send updated proposal to stakeholders", deadline: "Friday" },
    { owner: "Sarah", task: "Review budget numbers and flag concerns", deadline: "EOD Tuesday" },
    { owner: "Team", task: "Async feedback on naming options in Slack", deadline: null },
    { owner: "Mike", task: "Schedule follow-up with design team", deadline: "Next week" },
    { owner: "Lisa", task: "Update project timeline in Jira", deadline: "Tomorrow" },
    { owner: "Dev Team", task: "Spike on technical feasibility", deadline: "Sprint end" }
  ];

  const decisionTemplates = [
    "Approved Q2 roadmap priorities",
    "Selected Option B for the new feature architecture",
    "Agreed to postpone launch by 2 weeks",
    "Confirmed weekly sync cadence",
    "Chose React over Vue for frontend rewrite"
  ];

  const wastedTemplates = [
    "15 minutes spent on off-topic discussion about lunch plans",
    "Rehashed decisions already made in previous meeting",
    "Waited 8 minutes for late attendees",
    "Tangent about unrelated project took 10 minutes"
  ];

  const recommendationTemplates = [
    "Send a pre-read 24 hours before to reduce context-setting time",
    "Consider making this a 25-minute meeting instead of 30",
    "Add a decision log to track outcomes",
    "Assign a timekeeper to stay on agenda",
    "This could be an async Loom video instead",
    "Reduce attendee list - not everyone needs to be here",
    "Start with decisions needed, not status updates"
  ];

  const verdictTemplates = {
    good: [
      "Solid meeting with clear outcomes. Money well spent.",
      "Efficient use of time. Action items are concrete.",
      "This meeting earned its calendar slot."
    ],
    medium: [
      "Decent meeting, but could be tighter. Some drift detected.",
      "Okay ROI, but half of this could've been async.",
      "Not bad, but the action items are a bit vague."
    ],
    bad: [
      "This meeting was a scenic route to nowhere.",
      "High cost, low output. Classic sync-that-should-be-email.",
      "Expensive conversation with fuzzy outcomes."
    ]
  };

  // Determine meeting quality
  const quality = clarityScore >= 70 ? "good" : clarityScore >= 45 ? "medium" : "bad";

  // Generate random counts
  const actionCount = hasActionWords ? Math.floor(2 + Math.random() * 4) : Math.floor(Math.random() * 2);
  const decisionCount = hasDecisionWords ? Math.floor(1 + Math.random() * 2) : Math.floor(Math.random() * 2);
  const wastedCount = quality === "bad" ? Math.floor(1 + Math.random() * 2) : (quality === "medium" ? Math.floor(Math.random() * 2) : 0);

  // Pick random items
  const shuffleAndPick = (arr, count) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const meetingTypes = ["decision", "brainstorm", "status-update", "planning", "review"];
  const meetingType = hasDecisionWords ? "decision" :
                      hasVagueWords ? "status-update" :
                      meetingTypes[Math.floor(Math.random() * meetingTypes.length)];

  return {
    clarityScore,
    onTopicPercent,
    actionItems: shuffleAndPick(actionItemTemplates, actionCount),
    decisions: shuffleAndPick(decisionTemplates, decisionCount),
    meetingType,
    verdict: verdictTemplates[quality][Math.floor(Math.random() * verdictTemplates[quality].length)],
    recommendations: shuffleAndPick(recommendationTemplates, 2 + Math.floor(Math.random() * 2)),
    couldBeEmail: quality === "bad" || (quality === "medium" && Math.random() > 0.5),
    wastedTopics: shuffleAndPick(wastedTemplates, wastedCount)
  };
}

async function quickAgendaCheck(agendaText) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

  const text = agendaText.toLowerCase();
  const hasGoal = /\b(goal|objective|outcome|decide|review)\b/i.test(text);
  const hasAgenda = /\b(agenda|topics?|discuss)\b/i.test(text);
  const hasOwners = /@|\b(owner|lead|presenter)\b/i.test(text);
  const isVague = /\b(sync|catch up|touch base|align|chat)\b/i.test(text);

  let score = 50;
  if (hasGoal) score += 20;
  if (hasAgenda) score += 15;
  if (hasOwners) score += 10;
  if (isVague) score -= 25;
  score = Math.max(10, Math.min(95, score + Math.floor(Math.random() * 10 - 5)));

  const verdicts = {
    high: ["Clear and focused", "Good to go", "Well-structured"],
    medium: ["Needs more specifics", "Add expected outcomes", "Clarify the goal"],
    low: ["Too vague", "Could be an email", "Needs an agenda overhaul"]
  };

  const level = score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  return {
    clarityScore: score,
    redFlags: isVague ? ["Vague purpose detected"] : [],
    suggestion: level === "high" ? "Ready to send" : "Add specific outcomes expected",
    shouldHold: score >= 50,
    quickVerdict: verdicts[level][Math.floor(Math.random() * verdicts[level].length)]
  };
}
