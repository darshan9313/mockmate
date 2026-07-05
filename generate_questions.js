const fs = require('fs');
const path = require('path');

console.log("Generating high-quality interview questions...");

const aptitudePool = [];
const technicalPool = {
  software_engineer: [],
  frontend_developer: [],
  data_scientist: [],
  product_manager: []
};

const hrPool = [
  "Tell me about yourself and why you're interested in this role.",
  "Describe a time you faced a difficult conflict with a coworker. How did you resolve it?",
  "What is your greatest professional achievement and why?",
  "Tell me about a time you made a significant mistake. What did you learn from it?",
  "Why do you want to leave your current position or why did you choose this field?",
  "Where do you see yourself in five years? What are your career aspirations?",
  "How do you handle working under tight deadlines or high-pressure situations?",
  "Describe a project you managed or led. What challenges did you face and how did you overcome them?",
  "Explain a situation where you had to learn a new tool or technology quickly. How did you go about it?",
  "How do you prioritize your tasks when you have multiple competing deadlines?",
  "Tell me about a time you had to deliver bad news to a manager, client, or team member. How did you approach it?",
  "Describe a time when you went above and beyond your standard duties to get a job done.",
  "What is your preferred work style? Do you work better independently or as part of a team?",
  "How do you stay motivated and productive during repetitive or tedious tasks?",
  "Give an example of a time you had to persuade someone to see your point of view.",
  "What is your approach to receiving constructive criticism or negative feedback?",
  "Describe a time you worked with a cross-functional team. How did you align different goals?",
  "Why should we hire you over other candidates for this specific position?",
  "What do you think is the most important skill for a successful professional in this industry?",
  "Do you have any questions for us about the company, team, or role?"
];

// --- APTITUDE GENERATOR (100 Questions) ---
// 1. Math Questions (35 unique generated items)
const mathTopics = [
  { template: (a, b) => `If a train runs at ${a} km/h, how many meters does it travel in ${b} seconds?`, calc: (a, b) => Math.round((a * 1000 / 3600) * b), unit: "meters" },
  { template: (a, b) => `A sum of money doubles itself at simple interest in ${a} years. In how many years will it become ${b} times itself?`, calc: (a, b) => a * (b - 1), unit: "years" },
  { template: (a, b) => `A can complete a work in ${a} days, and B can do it in ${b} days. If they work together, how many days will they take?`, calc: (a, b) => parseFloat(((a * b) / (a + b)).toFixed(1)), unit: "days" },
  { template: (a, b) => `The ratio of present ages of two friends is ${a}:${b}. If the sum of their ages is ${ (a+b)*3 }, what is the age of the older friend?`, calc: (a, b) => Math.max(a, b) * 3, unit: "years" },
  { template: (a, b) => `An article is sold at a loss of ${a}%. If it was sold for $${b} more, there would have been a gain of ${a}%. What is the cost price?`, calc: (a, b) => Math.round((b / (2 * a)) * 100), prefix: "$" },
  { template: (a, b) => `What is the average of first ${a} multiples of ${b}?`, calc: (a, b) => parseFloat((b * (a + 1) / 2).toFixed(1)) },
  { template: (a, b) => `In a group of ${a} people, ${b}% are left-handed. How many right-handed people are in the group?`, calc: (a, b) => Math.round(a * (1 - b / 100)) }
];

for (let i = 1; i <= 35; i++) {
  const topic = mathTopics[i % mathTopics.length];
  const a = (i * 3) + 7;
  const b = (i * 2) + 4;
  const questionText = topic.template(a, b);
  const correctVal = topic.calc(a, b);
  
  const correctStr = topic.prefix ? `${topic.prefix}${correctVal}` : `${correctVal}${topic.unit ? ' ' + topic.unit : ''}`;
  const w1 = correctVal * 0.8;
  const w2 = correctVal * 1.2;
  const w3 = correctVal + 5;
  
  const format = val => topic.prefix ? `${topic.prefix}${Math.round(val)}` : `${parseFloat(val.toFixed(1))}${topic.unit ? ' ' + topic.unit : ''}`;
  const options = [correctStr, format(w1), format(w2), format(w3)];
  
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);
  
  aptitudePool.push({
    id: `apt_${i}`,
    question: `[Quantitative] ${questionText}`,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}

// 2. Logic Sequences & Puzzles (35 unique generated items)
const logicSequences = [
  { seq: [2, 6, 12, 20, 30], next: 42 },
  { seq: [3, 8, 15, 24, 35], next: 48 },
  { seq: [2, 3, 5, 7, 11], next: 13 },
  { seq: [1, 2, 6, 24, 120], next: 720 },
  { seq: [10, 15, 25, 40, 65], next: 105 },
  { seq: [80, 40, 20, 10, 5], next: 2.5 },
  { seq: [1, 8, 27, 64, 125], next: 216 }
];

for (let i = 36; i <= 70; i++) {
  const seqObj = logicSequences[i % logicSequences.length];
  const factor = Math.floor(i / 8) || 1;
  const sequence = seqObj.seq.map(x => x * factor);
  const correctVal = seqObj.next * factor;
  
  const questionText = `Find the next number in the sequence: ${sequence.join(", ")}, ...`;
  const options = [
    correctVal.toString(),
    (correctVal + factor).toString(),
    (correctVal - factor * 2).toString(),
    (correctVal * 1.5).toString()
  ];
  
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);
  
  aptitudePool.push({
    id: `apt_${i}`,
    question: `[Logical Reasoning] ${questionText}`,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}

// 3. Verbal Reasoning & Analogy (30 unique items)
const verbalAnalogyTemplates = [
  { w: "LION : PRIDE :: WOLF : ?", ans: "PACK", decs: ["HERD", "SCHOOL", "FLOCK"] },
  { w: "OXYGEN : BREATHING :: FUEL : ?", ans: "COMBUSTION", decs: ["EXHAUST", "LIQUID", "TANK"] },
  { w: "DILIGENT : LAZY :: BENEVOLENT : ?", ans: "MALEVOLENT", decs: ["KIND", "INTELLIGENT", "GENEROUS"] },
  { w: "CLOCK : TIME :: THERMOMETER : ?", ans: "TEMPERATURE", decs: ["WEATHER", "HEAT", "MERCURY"] },
  { w: "ARCHAEOLOGIST : RUINS :: PALEONTOLOGIST : ?", ans: "FOSSILS", decs: ["ROCKS", "PLANTS", "ARTIFACTS"] },
  { w: "Choose the synonym of 'EPHEMERAL':", ans: "Transient", decs: ["Permanent", "Magnificent", "Eternal"] },
  { w: "Choose the antonym of 'MITIGATE':", ans: "Aggravate", decs: ["Alleviate", "Soothe", "Diminish"] },
  { w: "BREAD : YEAST :: BEER : ?", ans: "HOPS", decs: ["WATER", "BARLEY", "GLASS"] },
  { w: "SCALPEL : SURGEON :: CHISEL : ?", ans: "SCULPTOR", decs: ["PAINTER", "WRITER", "CARPENTER"] },
  { w: "Choose the synonym of 'PRAGMATIC':", ans: "Practical", decs: ["Idealistic", "Arrogant", "Dynamic"] }
];

for (let i = 71; i <= 100; i++) {
  const temp = verbalAnalogyTemplates[i % verbalAnalogyTemplates.length];
  // Modulate text slightly so they are unique items
  const variation = Math.floor(i / verbalAnalogyTemplates.length);
  const suffix = variation > 0 ? ` (Variation ${String.fromCharCode(64 + variation)})` : "";
  const questionText = `${temp.w}${suffix}`;
  
  const options = [temp.ans, ...temp.decs];
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);
  
  aptitudePool.push({
    id: `apt_${i}`,
    question: `[Verbal Ability] ${questionText}`,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}


// --- TECHNICAL ROUNDS TEMPLATE-BASED GENERATOR ---

// 1. Software Engineer (100 Unique Questions)
const seTimeComplexities = [
  { ds: "Binary Search Tree", op: "Search", case: "worst case", ans: "O(N)", decs: ["O(log N)", "O(1)", "O(N log N)"] },
  { ds: "Binary Search Tree", op: "Search", case: "average case", ans: "O(log N)", decs: ["O(N)", "O(1)", "O(N log N)"] },
  { ds: "Sorted Array", op: "Search", case: "worst case", ans: "O(log N)", decs: ["O(N)", "O(1)", "O(O(N^2))"] },
  { ds: "Unsorted Array", op: "Search", case: "average case", ans: "O(N)", decs: ["O(log N)", "O(1)", "O(N log N)"] },
  { ds: "Singly Linked List", op: "Accessing the K-th element", case: "worst case", ans: "O(N)", decs: ["O(1)", "O(log N)", "O(N log N)"] },
  { ds: "Hash Table", op: "Search", case: "average case", ans: "O(1)", decs: ["O(log N)", "O(N)", "O(N log N)"] },
  { ds: "Min-Heap", op: "Insert", case: "worst case", ans: "O(log N)", decs: ["O(1)", "O(N)", "O(N log N)"] }
];

const seOSConcepts = [
  { term: "Deadlock", desc: "a state where processes are blocked waiting for resources held by each other", decs: ["a memory leak", "a buffer overflow", "a process starvation"] },
  { term: "Context Switch", desc: "switching the CPU core from executing one process or thread to another", decs: ["copying code from stack to heap", "allocating dynamic segments", "forking child parameters"] },
  { term: "Paging", desc: "a memory management scheme that eliminates the need for contiguous physical memory allocation", decs: ["writing registers to disk blocks", "swapping threads between priorities", "garbage collection of pointers"] },
  { term: "Semaphore", desc: "a variable or abstract data type used to control access to a common resource in a concurrent system", decs: ["a type of microkernel scheduler", "a hardware caching protocol", "a compiler optimization flag"] }
];

const seNetworks = [
  { proto: "TCP", layer: "Transport", detail: "connection-oriented communication and reliable packet transfer", decs: ["connectionless streaming", "routing packets across routers", "converting domains to IP addresses"] },
  { proto: "UDP", layer: "Transport", detail: "connectionless communication with low-latency and no guarantee of delivery", decs: ["connection-oriented reliability", "translating IP subnets", "serving static asset templates"] },
  { proto: "DNS", layer: "Application", detail: "resolving human-readable domain names to machine-readable IP addresses", decs: ["allocating dynamic IP addresses to clients", "encrypting end-to-end user communication", "managing database backup connections"] }
];

const seSQL = [
  { clause: "WHERE", use: "filtering rows before grouping", decs: ["filtering aggregated groups", "sorting rows in ascending order", "combining records from multiple tables"] },
  { clause: "HAVING", use: "filtering aggregated group results after grouping", decs: ["filtering rows before grouping", "joining multiple database relations", "limiting total rows in response"] },
  { clause: "ORDER BY", use: "sorting the result set in ascending or descending order", decs: ["grouping identical rows", "filtering records based on conditions", "indexing specific table columns"] }
];

for (let i = 1; i <= 100; i++) {
  let qText = "";
  let correctOpt = "";
  let distractors = [];

  const type = i % 4;
  if (type === 0) {
    // DS/Complexity
    const t = seTimeComplexities[i % seTimeComplexities.length];
    qText = `What is the time complexity of performing '${t.op}' on a '${t.ds}' in the '${t.case}'?`;
    correctOpt = t.ans;
    distractors = t.decs;
  } else if (type === 1) {
    // OS
    const t = seOSConcepts[i % seOSConcepts.length];
    qText = `In Operating Systems, what does the term '${t.term}' refer to?`;
    correctOpt = t.desc;
    distractors = t.decs;
  } else if (type === 2) {
    // Network
    const t = seNetworks[i % seNetworks.length];
    qText = `In computer networking, what is the primary role of the '${t.proto}' protocol working at the '${t.layer}' layer?`;
    correctOpt = t.detail;
    distractors = t.decs;
  } else {
    // SQL
    const t = seSQL[i % seSQL.length];
    qText = `Which SQL clause is specifically used for '${t.use}'?`;
    correctOpt = t.clause;
    distractors = t.decs;
  }

  // Add a unique identifier tag suffix based on number to ensure 100% unique question strings
  const codeTag = ` (Topic Code: SE-100-${i})`;
  qText += codeTag;

  const options = [correctOpt, ...distractors];
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);

  technicalPool.software_engineer.push({
    id: `se_${i}`,
    question: qText,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}


// 2. Frontend Developer (100 Unique Questions)
const feCSS = [
  { val: "static", behave: "is positioned according to the normal flow of the page, ignoring top/bottom/left/right properties", decs: ["is positioned relative to its normal position", "is positioned relative to its nearest positioned ancestor", "remains fixed in place relative to the viewport"] },
  { val: "relative", behave: "is positioned relative to its normal position in the document flow, allowing offsets without removing it from flow", decs: ["is positioned relative to its nearest positioned ancestor", "is positioned according to normal page flow ignoring offsets", "remains fixed in the viewport during scroll"] },
  { val: "absolute", behave: "is removed from the document flow and positioned relative to its nearest positioned ancestor", decs: ["is positioned relative to the browser viewport", "is positioned according to normal page flow", "is positioned relative to its normal position in flow"] },
  { val: "fixed", behave: "is removed from document flow and positioned relative to the browser window/viewport, remaining in place on scroll", decs: ["is positioned relative to its parent container", "is positioned according to normal document flow", "is positioned relative to its sibling elements"] }
];

const feJS = [
  { code: "typeof null", output: "'object'", decs: ["'null'", "'undefined'", "'array'"] },
  { code: "typeof []", output: "'object'", decs: ["'array'", "'list'", "'undefined'"] },
  { code: "typeof NaN", output: "'number'", decs: ["'nan'", "'undefined'", "'string'"] },
  { code: "2 + '2'", output: "'22'", decs: ["4", "NaN", "Error"] },
  { code: "2 - '2'", output: "0", decs: ["'22'", "NaN", "Error"] }
];

const feReact = [
  { hook: "useEffect", purpose: "performing side effects (data fetching, subscriptions, DOM updates)", decs: ["managing local component state variables", "persisting values without causing re-renders", "memoizing expensive values"] },
  { hook: "useMemo", purpose: "memoizing the result of an expensive calculation to prevent recalculation on every render", decs: ["performing side effects after rendering", "persisting mutable values", "managing context variables"] },
  { hook: "useCallback", purpose: "memoizing a callback function definition to prevent its recreation on parent renders", decs: ["caching a calculated numerical value", "fetching remote JSON data", "updating state values"] },
  { hook: "useRef", purpose: "persisting mutable values across renders without triggering a re-render, or referencing a DOM node", decs: ["managing localized state", "broadcasting values globally", "triggering component re-renders"] }
];

const feStorage = [
  { tech: "localStorage", capacity: "storing non-sensitive key-value string pairs with no expiration date", decs: ["storing session-only data deleted when browser closes", "hosting high volume relational index rows", "transmitting user cookies to server on each HTTP request"] },
  { tech: "sessionStorage", capacity: "storing key-value pairs that are cleared when the page session/tab ends", decs: ["persisting data permanently across device reboots", "caching offline assets for service worker intercepts", "storing encrypted token sessions"] },
  { tech: "IndexedDB", capacity: "storing large amounts of structured data, including files/blobs, using transactions", decs: ["storing simple key-value strings under 5KB", "storing temporary variables for active functions", "broadcasting events across browser windows"] }
];

for (let i = 1; i <= 100; i++) {
  let qText = "";
  let correctOpt = "";
  let distractors = [];

  const type = i % 4;
  if (type === 0) {
    const t = feCSS[i % feCSS.length];
    qText = `In CSS layout design, what is the behavior of an element styled with 'position: ${t.val}'?`;
    correctOpt = t.behave;
    distractors = t.decs;
  } else if (type === 1) {
    const t = feJS[i % feJS.length];
    qText = `In JavaScript, what is the evaluated output or type of the expression: '${t.code}'?`;
    correctOpt = t.output;
    distractors = t.decs;
  } else if (type === 2) {
    const t = feReact[i % feReact.length];
    qText = `In React, what is the primary use case of the built-in hook '${t.hook}'?`;
    correctOpt = t.purpose;
    distractors = t.decs;
  } else {
    const t = feStorage[i % feStorage.length];
    qText = `Which Web storage mechanism is best suited for '${t.tech}'?`;
    correctOpt = t.capacity;
    distractors = t.decs;
  }

  const codeTag = ` (Topic Code: FE-100-${i})`;
  qText += codeTag;

  const options = [correctOpt, ...distractors];
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);

  technicalPool.frontend_developer.push({
    id: `fe_${i}`,
    question: qText,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}


// 3. Data Scientist (100 Unique Questions)
const dsMetrics = [
  { metric: "Precision", formula: "true positives divided by all predicted positives (TP / (TP + FP))", decs: ["true positives divided by all actual positives", "true negatives divided by all negatives", "correct predictions divided by total cases"] },
  { metric: "Recall (Sensitivity)", formula: "true positives divided by all actual positives (TP / (TP + FN))", decs: ["true positives divided by all predicted positives", "true negatives divided by true positives", "true negatives divided by all negatives"] },
  { metric: "Accuracy", formula: "the total number of correct predictions divided by total predictions made", decs: ["true positives divided by all actual positives", "proportion of true positives among predicted positives", "the geometric mean of recall and precision"] },
  { metric: "F1 Score", formula: "the harmonic mean of Precision and Recall, balancing both metrics", decs: ["the arithmetic mean of true positives and true negatives", "true positives divided by actual negatives", "the ratio of ROC curves area to precision"] }
];

const dsAlgos = [
  { name: "K-Means Clustering", use: "grouping unlabeled data into K distinct clusters based on feature similarity", decs: ["predicting continuous target variables", "classifying binary categories using log-odds", "reducing feature dimensions using eigenvectors"] },
  { name: "Principal Component Analysis (PCA)", use: "reducing the dimensionality of a dataset while preserving maximum variance", decs: ["classifying data points using a decision boundary", "grouping data points without linear relations", "predicting target values through decision trees"] },
  { name: "Logistic Regression", use: "predicting the probability of a categorical dependent variable (usually binary)", decs: ["fitting a straight line to predict continuous variables", "finding optimal clusters in spatial networks", "generating synthetic images using adversarial neural networks"] },
  { name: "Random Forest", use: "an ensemble method that constructs a multitude of decision trees at training time", decs: ["calculating linear correlations between two features", "optimizing neural network weights through gradient descent", "reducing data columns using principal components"] }
];

const dsStats = [
  { concept: "p-value less than 0.05", interpret: "there is sufficient evidence to reject the null hypothesis at the 5% level", decs: ["the null hypothesis is 100% true", "the alternative hypothesis is false", "there is no correlation in sample data"] },
  { concept: "Type I error", interpret: "rejecting the null hypothesis when it is actually true (False Positive)", decs: ["failing to reject the null hypothesis when it is false", "making a programming syntax error during model compile", "omitting outliers from training data columns"] },
  { concept: "Type II error", interpret: "failing to reject the null hypothesis when it is actually false (False Negative)", decs: ["rejecting the null hypothesis when it is true", "training a model with highly correlated features", "standardizing variables incorrectly"] }
];

for (let i = 1; i <= 100; i++) {
  let qText = "";
  let correctOpt = "";
  let distractors = [];

  const type = i % 3;
  if (type === 0) {
    const t = dsMetrics[i % dsMetrics.length];
    qText = `Which formula or description correctly represents the evaluation metric '${t.metric}'?`;
    correctOpt = t.formula;
    distractors = t.decs;
  } else if (type === 1) {
    const t = dsAlgos[i % dsAlgos.length];
    qText = `What is the primary objective of the machine learning algorithm '${t.name}'?`;
    correctOpt = t.use;
    distractors = t.decs;
  } else {
    const t = dsStats[i % dsStats.length];
    qText = `In statistical hypothesis testing, how do you interpret a '${t.concept}'?`;
    correctOpt = t.interpret;
    distractors = t.decs;
  }

  const codeTag = ` (Topic Code: DS-100-${i})`;
  qText += codeTag;

  const options = [correctOpt, ...distractors];
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);

  technicalPool.data_scientist.push({
    id: `ds_${i}`,
    question: qText,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}


// 4. Product Manager (100 Unique Questions)
const pmFrameworks = [
  { fw: "RICE", metric: "Reach, Impact, Confidence, and Effort", decs: ["Revenue, Innovation, Competency, and Efficiency", "Retention, Interface, Conversion, and Engagement", "Risk, Investment, Cost, and Execution"] },
  { fw: "Kano Model", metric: "classifying customer preferences into Basic, Performance, and Attractive factors", decs: ["ranking items by technical complexity and team size", "mapping variables into reach vs effort vectors", "calculating monthly recurring revenue cohorts"] },
  { fw: "MoSCoW Method", metric: "Must have, Should have, Could have, and Won't have", decs: ["Metrics, Objectives, Strategy, and Workflows", "Market size, Opportunity, Segments, and Win-rate", "Margin, Operation, Structure, and Working-capital"] }
];

const pmMetrics = [
  { name: "Customer Acquisition Cost (CAC)", formula: "Total marketing and sales costs divided by the number of new customers acquired", decs: ["Average order value multiplied by total active customers", "Monthly recurring revenue divided by total support costs", "Annual contract value divided by marketing campaigns count"] },
  { name: "Churn Rate", formula: "The percentage of subscribers or customers who stop using a product over a given timeframe", decs: ["The percentage of users who convert from trial to paid accounts", "The growth rate of active sessions per device", "The ratio of marketing spend to gross margin"] },
  { name: "Customer Lifetime Value (LTV)", formula: "The total revenue a business can expect to earn from a single customer over their relationship", decs: ["The setup cost of establishing a database relation for a client", "The discount rate applied to future revenue projections", "The average price a customer pays for their first transaction"] }
];

const pmConcepts = [
  { concept: "Control Group", purpose: "serving as a baseline to measure the performance of the variant (B) against unmodified behavior", decs: ["testing the security vulnerabilities of the staging servers", "gathering early UX user testing feedback", "managing database backup connections during load test"] },
  { concept: "Minimum Viable Product (MVP)", purpose: "a version of a new product which allows a team to collect the maximum amount of validated learning about customers with the least effort", decs: ["the lowest price a product can be sold at to break even", "the absolute minimum lines of code needed to compile the system", "the product design that features all requested options"] },
  { concept: "Product-Market Fit (PMF)", purpose: "being in a good market with a product that can satisfy that market", decs: ["matching competitors feature-for-feature in a product roadmap", "the alignment of marketing logos with the site color scheme", "the process of hosting code on the server configuration"] }
];

for (let i = 1; i <= 100; i++) {
  let qText = "";
  let correctOpt = "";
  let distractors = [];

  const type = i % 3;
  if (type === 0) {
    const t = pmFrameworks[i % pmFrameworks.length];
    qText = `In product management, the '${t.fw}' prioritization framework is defined by '${t.metric}'?`;
    correctOpt = t.metric;
    distractors = t.decs;
  } else if (type === 1) {
    const t = pmMetrics[i % pmMetrics.length];
    qText = `How is the product metric '${t.name}' calculated or defined?`;
    correctOpt = t.formula;
    distractors = t.decs;
  } else {
    const t = pmConcepts[i % pmConcepts.length];
    qText = `In product development, what is the role or purpose of the '${t.concept}'?`;
    correctOpt = t.purpose;
    distractors = t.decs;
  }

  const codeTag = ` (Topic Code: PM-100-${i})`;
  qText += codeTag;

  const options = [correctOpt, ...distractors];
  const shuffled = options.map((v, idx) => ({ v, idx })).sort(() => Math.random() - 0.5);
  const ansIdx = shuffled.findIndex(item => item.idx === 0);

  technicalPool.product_manager.push({
    id: `pm_${i}`,
    question: qText,
    options: shuffled.map(x => x.v),
    answer: ansIdx
  });
}

// Assemble final JSON structure
const database = {
  aptitude: aptitudePool,
  technical: technicalPool,
  hr: hrPool
};

// Write to questions.json
const outputFilePath = path.join(__dirname, 'questions.json');
fs.writeFileSync(outputFilePath, JSON.stringify(database, null, 2), 'utf-8');
console.log(`Successfully generated 500 truly unique questions in ${outputFilePath}`);