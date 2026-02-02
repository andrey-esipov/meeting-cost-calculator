const ROLE_PRESETS = [
  // Engineering
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

  // Product
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

  // Design
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

  // Content Design (formerly Technical Writer)
  {
    id: "content-designer-l59",
    name: "Content Designer",
    level: "59",
    annual: 130000,
    discipline: "Content Design"
  },
  {
    id: "content-designer-l60",
    name: "Content Designer",
    level: "60",
    annual: 150000,
    discipline: "Content Design"
  },
  {
    id: "content-designer-l61",
    name: "Content Designer II",
    level: "61",
    annual: 168000,
    discipline: "Content Design"
  },
  {
    id: "senior-content-designer-l62",
    name: "Senior Content Designer",
    level: "62",
    annual: 188000,
    discipline: "Content Design"
  },
  {
    id: "senior-content-designer-l63",
    name: "Senior Content Designer",
    level: "63",
    annual: 210000,
    discipline: "Content Design"
  },
  {
    id: "principal-content-designer-l64",
    name: "Principal Content Designer",
    level: "64",
    annual: 249000,
    discipline: "Content Design"
  },

  // UX Research
  {
    id: "ux-researcher-l59",
    name: "UX Researcher",
    level: "59",
    annual: 140000,
    discipline: "UX Research"
  },
  {
    id: "ux-researcher-l60",
    name: "UX Researcher",
    level: "60",
    annual: 158000,
    discipline: "UX Research"
  },
  {
    id: "ux-researcher-l61",
    name: "UX Researcher II",
    level: "61",
    annual: 178000,
    discipline: "UX Research"
  },
  {
    id: "senior-ux-researcher-l62",
    name: "Senior UX Researcher",
    level: "62",
    annual: 198000,
    discipline: "UX Research"
  },
  {
    id: "senior-ux-researcher-l63",
    name: "Senior UX Researcher",
    level: "63",
    annual: 220000,
    discipline: "UX Research"
  },
  {
    id: "principal-ux-researcher-l64",
    name: "Principal UX Researcher",
    level: "64",
    annual: 250000,
    discipline: "UX Research"
  },
  {
    id: "principal-ux-researcher-l65",
    name: "Principal UX Researcher",
    level: "65",
    annual: 300000,
    discipline: "UX Research"
  },
  {
    id: "partner-ux-researcher-l66",
    name: "Partner UX Researcher",
    level: "66",
    annual: 400000,
    discipline: "UX Research"
  },

  // Data Science
  {
    id: "data-scientist-l59",
    name: "Data Scientist",
    level: "59",
    annual: 163000,
    discipline: "Data Science"
  },
  {
    id: "data-scientist-l60",
    name: "Data Scientist",
    level: "60",
    annual: 177000,
    discipline: "Data Science"
  },
  {
    id: "data-scientist-l61",
    name: "Data Scientist II",
    level: "61",
    annual: 208000,
    discipline: "Data Science"
  },
  {
    id: "senior-data-scientist-l62",
    name: "Senior Data Scientist",
    level: "62",
    annual: 230000,
    discipline: "Data Science"
  },
  {
    id: "senior-data-scientist-l63",
    name: "Senior Data Scientist",
    level: "63",
    annual: 242000,
    discipline: "Data Science"
  },
  {
    id: "principal-data-scientist-l64",
    name: "Principal Data Scientist",
    level: "64",
    annual: 300000,
    discipline: "Data Science"
  },
  {
    id: "principal-data-scientist-l65",
    name: "Principal Data Scientist",
    level: "65",
    annual: 334000,
    discipline: "Data Science"
  },
  {
    id: "partner-data-scientist-l66",
    name: "Partner Data Scientist",
    level: "66",
    annual: 450000,
    discipline: "Data Science"
  },
  {
    id: "distinguished-data-scientist-l67",
    name: "Distinguished Data Scientist",
    level: "67",
    annual: 559000,
    discipline: "Data Science"
  },

  // Management
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

  // Other
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
