const ROLE_PRESETS = [
  { id: "engineer", name: "Engineer", annual: 140000 },
  { id: "pm", name: "Product Manager", annual: 155000 },
  { id: "designer", name: "Designer", annual: 130000 },
  { id: "manager", name: "Manager", annual: 175000 },
  { id: "director", name: "Director", annual: 210000 },
  { id: "vp", name: "VP", annual: 260000 },
  { id: "cxo", name: "CXO", annual: 320000 },
];

const MEETING_TYPES = [
  { type: "Standup", weight: 0.2 },
  { type: "Planning", weight: 0.25 },
  { type: "1:1", weight: 0.15 },
  { type: "Review", weight: 0.2 },
  { type: "Retro", weight: 0.2 },
];

const TREND_BASE = [22, 24, 21, 26, 28, 24, 27, 30, 32, 29, 33, 35];
