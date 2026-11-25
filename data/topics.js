// Subject-wise (topic-wise) tests for each section.
// The exam page matches a section to a group below by the words in its name.
// To make a topic test live, add  link: "test-file.html"  to that topic.
window.TOPICS = {
  reasoning: { label: "Reasoning", match: ["reasoning", "intelligence"], topics: [
    "Analogy", "Classification (Odd one out)", "Number and Letter Series", "Coding-Decoding", "Blood Relations",
    "Direction and Distance", "Syllogism", "Venn Diagrams", "Mirror and Water Images", "Paper Folding and Cutting",
    "Embedded and Counting Figures", "Order and Ranking", "Mathematical Operations", "Seating Arrangement"] },
  ga: { label: "General Awareness", match: ["awareness", "general knowledge"], topics: [
    { name: "Indian Polity", link: "test.html" }, "Modern History", "Ancient and Medieval History", "Geography", "Indian Economy",
    "Physics", "Chemistry", "Biology", "Static GK (books, awards, days, sports)", "Current Affairs", "Art and Culture", "Computer Awareness"] },
  quant: { label: "Quantitative Aptitude", match: ["quantitative", "mathemat", "numerical", "arithmetic"], topics: [
    "Number System", "Simplification", "Percentage", "Profit and Loss", "Ratio and Proportion", "Average", "Time and Work",
    "Time, Speed and Distance", "Simple and Compound Interest", "Algebra", "Geometry", "Mensuration", "Trigonometry", "Data Interpretation"] },
  english: { label: "English", match: ["english", "hindi"], topics: [
    "Reading Comprehension", "Cloze Test", "Error Spotting", "Fill in the Blanks", "Synonyms and Antonyms", "One Word Substitution",
    "Idioms and Phrases", "Spelling Correction", "Active and Passive Voice", "Direct and Indirect Speech", "Sentence Rearrangement"] },
  engineering: { label: "General Engineering", match: ["engineering"], topics: [
    "Civil: Building Materials", "Civil: Surveying", "Civil: Soil Mechanics", "Civil: RCC and Steel Design",
    "Mechanical: Thermodynamics", "Mechanical: Fluid Mechanics", "Mechanical: Strength of Materials", "Mechanical: Theory of Machines",
    "Electrical: Circuits and Networks", "Electrical: Machines", "Electrical: Power Systems", "Electrical: Measurements"] }
};
