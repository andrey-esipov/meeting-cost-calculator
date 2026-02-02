const ROLE_PRESETS = [
  {
    id: "sde-l59",
    name: "SDE",
    level: "59",
    annual: 162000,
    discipline: "Engineering"
  },
  {
    id: "sde-l60",
    name: "SDE",
    level: "60",
    annual: 175000,
    discipline: "Engineering"
  },
  {
    id: "sde-l61",
    name: "SDE II",
    level: "61",
    annual: 190000,
    discipline: "Engineering"
  },
  {
    id: "senior-sde-l62",
    name: "Senior SDE",
    level: "62",
    annual: 210000,
    discipline: "Engineering"
  },
  {
    id: "senior-sde-l63",
    name: "Senior SDE",
    level: "63",
    annual: 232000,
    discipline: "Engineering"
  },
  {
    id: "principal-sde-l64",
    name: "Principal SDE",
    level: "64",
    annual: 285000,
    discipline: "Engineering"
  },
  {
    id: "principal-sde-l65",
    name: "Principal SDE",
    level: "65",
    annual: 337000,
    discipline: "Engineering"
  },
  {
    id: "partner-sde-l66",
    name: "Partner SDE",
    level: "66",
    annual: 450000,
    discipline: "Engineering"
  },
  {
    id: "distinguished-engineer-l67",
    name: "Distinguished Engineer",
    level: "67",
    annual: 600000,
    discipline: "Engineering"
  },
  {
    id: "pm-l59",
    name: "PM",
    level: "59",
    annual: 173000,
    discipline: "Product"
  },
  {
    id: "pm-l60",
    name: "PM",
    level: "60",
    annual: 185000,
    discipline: "Product"
  },
  {
    id: "pm-ii-l61",
    name: "PM II",
    level: "61",
    annual: 198000,
    discipline: "Product"
  },
  {
    id: "senior-pm-l62",
    name: "Senior PM",
    level: "62",
    annual: 215000,
    discipline: "Product"
  },
  {
    id: "senior-pm-l63",
    name: "Senior PM",
    level: "63",
    annual: 232000,
    discipline: "Product"
  },
  {
    id: "principal-pm-l64",
    name: "Principal PM",
    level: "64",
    annual: 280000,
    discipline: "Product"
  },
  {
    id: "principal-pm-l65",
    name: "Principal PM",
    level: "65",
    annual: 326000,
    discipline: "Product"
  },
  {
    id: "partner-pm-l66",
    name: "Partner PM",
    level: "66",
    annual: 450000,
    discipline: "Product"
  },
  {
    id: "group-pm-l67",
    name: "Group PM",
    level: "67",
    annual: 550000,
    discipline: "Product"
  },
  {
    id: "cvp-l68",
    name: "CVP",
    level: "68",
    annual: 816000,
    discipline: "Product"
  },
  {
    id: "designer-l59",
    name: "Designer",
    level: "59",
    annual: 135000,
    discipline: "Design"
  },
  {
    id: "designer-l60",
    name: "Designer",
    level: "60",
    annual: 150000,
    discipline: "Design"
  },
  {
    id: "designer-ii-l61",
    name: "Designer II",
    level: "61",
    annual: 170000,
    discipline: "Design"
  },
  {
    id: "senior-designer-l62",
    name: "Senior Designer",
    level: "62",
    annual: 195000,
    discipline: "Design"
  },
  {
    id: "senior-designer-l63",
    name: "Senior Designer",
    level: "63",
    annual: 220000,
    discipline: "Design"
  },
  {
    id: "principal-designer-l64",
    name: "Principal Designer",
    level: "64",
    annual: 275000,
    discipline: "Design"
  },
  {
    id: "principal-designer-l65",
    name: "Principal Designer",
    level: "65",
    annual: 320000,
    discipline: "Design"
  },
  {
    id: "em-l64",
    name: "Engineering Manager",
    level: "64",
    annual: 290000,
    discipline: "Management"
  },
  {
    id: "senior-em-l65",
    name: "Senior EM",
    level: "65",
    annual: 350000,
    discipline: "Management"
  },
  {
    id: "director-l66",
    name: "Director",
    level: "66",
    annual: 450000,
    discipline: "Management"
  },
  {
    id: "senior-director-l67",
    name: "Senior Director",
    level: "67",
    annual: 600000,
    discipline: "Management"
  },
  {
    id: "vp-l68plus",
    name: "VP",
    level: "68+",
    annual: 1000000,
    discipline: "Management"
  },
  {
    id: "data-scientist-l63",
    name: "Data Scientist",
    level: "63",
    annual: 240000,
    discipline: "Other"
  },
  {
    id: "ux-researcher-l63",
    name: "UX Researcher",
    level: "63",
    annual: 210000,
    discipline: "Other"
  },
  {
    id: "technical-writer-l62",
    name: "Technical Writer",
    level: "62",
    annual: 175000,
    discipline: "Other"
  },
  {
    id: "program-manager-l63",
    name: "Program Manager",
    level: "63",
    annual: 220000,
    discipline: "Other"
  }
];

const MEETING_TYPES = [
  { type: "Standup", weight: 0.2 },
  { type: "Planning", weight: 0.25 },
  { type: "1:1", weight: 0.15 },
  { type: "Review", weight: 0.2 },
  { type: "Retro", weight: 0.2 },
];

const TREND_BASE = [22, 24, 21, 26, 28, 24, 27, 30, 32, 29, 33, 35];
