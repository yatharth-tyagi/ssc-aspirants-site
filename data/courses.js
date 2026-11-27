// Courses (Admin → Courses). A course has chapters; each chapter has lessons.
// type: "subject" (one subject) or "full" (all subjects). price 0 = free. Lessons with free: true are a free demo.
// lesson kinds: video { vid } · live { when (time stamp), link } · notes { note (notes chapter id) } · pdf { pdf (assets/uploads/… or https link) } · test { test (test id) }
window.COURSES = [
 {
  "id": "polity-foundation",
  "title": "Indian Polity – Foundation (sample)",
  "type": "subject",
  "subjects": ["polity"],
  "exams": ["cgl", "chsl", "mts", "gd"],
  "price": 0,
  "mrp": 0,
  "validity": "Till SSC CGL 2027",
  "color": "#1F3A93",
  "desc": "Polity from zero: video lectures, chapter notes, PDFs and a test after every chapter. (This is a sample course – edit or delete it in Admin → Courses.)",
  "chapters": [
   { "id": "ch1", "title": "Historical Background", "subject": "polity", "lessons": [
     { "id": "l1", "kind": "video", "title": "Regulating Act 1773 to Independence Act 1947", "vid": "", "mins": 45, "free": true },
     { "id": "l2", "kind": "notes", "title": "Chapter notes", "note": "historical-background", "free": true },
     { "id": "l3", "kind": "test", "title": "Chapter test", "test": "" }
   ] },
   { "id": "ch2", "title": "Making of the Constitution", "subject": "polity", "lessons": [
     { "id": "l4", "kind": "notes", "title": "Chapter notes", "note": "making" },
     { "id": "l5", "kind": "live", "title": "Live doubt class", "when": 0, "link": "" }
   ] }
  ]
 },
 {
  "id": "cgl-2027-complete",
  "title": "SSC CGL 2027 – Complete Course (sample)",
  "type": "full",
  "subjects": ["maths", "reasoning", "english", "polity", "history", "geography", "economy", "science"],
  "exams": ["cgl"],
  "price": 499,
  "mrp": 999,
  "validity": "Till SSC CGL 2027",
  "color": "#0F6B5B",
  "desc": "Every subject for CGL Tier 1 and Tier 2: video lectures, live classes, notes, PDFs and chapter tests, plus full mocks. (Sample – edit in Admin → Courses.)",
  "chapters": [
   { "id": "m1", "title": "Number System", "subject": "maths", "lessons": [
     { "id": "m1v", "kind": "video", "title": "Number System – basics", "vid": "", "mins": 60, "free": true }
   ] },
   { "id": "e1", "title": "Parts of Speech", "subject": "english", "lessons": [
     { "id": "e1v", "kind": "video", "title": "Parts of Speech – full lecture", "vid": "", "mins": 50 }
   ] }
  ]
 }
];
