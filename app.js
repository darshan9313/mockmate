/**
 * PrepUp - Interview Preparation Platform Controller
 * Handles SPA navigation, timers, speech-to-text, and local storage state.
 */

// --- GLOBAL APP STATE ---
const state = {
  // User profile
  profile: {
    name: "Guest Candidate",
    title: "Software Engineer Candidate",
    avatar: "👨‍💻",
    totalInterviews: 0,
    avgScore: 0,
    history: []
  },
  
  // Active interview state
  interview: {
    selectedRole: "software_engineer",
    currentRound: 0, // 0: Landing, 1: Aptitude, 2: Technical, 3: HR, 4: Results
    currentQuestionIndex: 0,
    
    // Loaded questions pools
    aptitudePool: [],
    technicalPool: {},
    hrPool: [],
    
    // Active questions for this session
    r1Questions: [], // Aptitude (10)
    r2Questions: [], // Technical (10)
    r3Questions: [], // HR (5)
    
    // User answers
    r1Answers: {}, // index -> chosen option index
    r2Answers: {}, // index -> chosen option index
    r3Answers: {}, // index -> transcript string
    
    // Timers (Rounds 1 & 2)
    timerInterval: null,
    secondsLeft: 0,
    totalSeconds: 1800, // 30 minutes per round
    isSaving: false,
    hrTimerSeconds: 210,
    hrTimerInterval: null,
  },

  // Speech Recognition API
  recognition: null,
  isRecording: false,
  finalTranscript: ""
};

// --- CONSTANTS ---
const HR_MODEL_ANSWERS = {
  "Tell me about yourself and why you're interested in this role.": "A strong answer briefly covers your background, key skills, and specific reasons why this role aligns with your career goals. E.g. 'I have 3 years of experience in software development. I am drawn to this role because of your focus on scalable architecture, which aligns with my goal of building impactful products.'",
  "Describe a time you faced a difficult conflict with a coworker. How did you resolve it?": "Use the STAR method: describe the Situation, your Task, the Action you took (active listening, calm discussion, compromise), and the positive Result. Show you can resolve conflict professionally without blame.",
  "What is your greatest professional achievement and why?": "Pick a specific, measurable achievement. Describe the challenge, your role, the actions you took, and the quantified result (e.g. reduced load time by 40%). Explain why it matters to your growth.",
  "Tell me about a time you made a significant mistake. What did you learn from it?": "Be honest about a real mistake. Show ownership without blame-shifting. Explain what went wrong, how you fixed it, what you changed, and how it made you a better professional.",
  "Why do you want to leave your current position or why did you choose this field?": "Focus on growth and opportunity. Mention what excites you about the new role — new challenges, better culture fit, or alignment with your long-term career goals. Avoid criticising your current employer.",
  "Where do you see yourself in five years? What are your career aspirations?": "Show ambition while being realistic. Align your goals with the role, e.g. growing into a senior or lead position, deepening expertise, or taking on more responsibility. Avoid vague answers.",
  "How do you handle working under tight deadlines or high-pressure situations?": "Describe your process: prioritising tasks by impact, communicating early if timelines are at risk, staying focused by breaking work into smaller milestones, and staying calm. Give a concrete example.",
  "Describe a project you managed or led. What challenges did you face and how did you overcome them?": "Use STAR. Describe your leadership role, the scope, specific challenges (team misalignment, scope creep), the actions you took to resolve them, and the final outcome with measurable results.",
  "Explain a situation where you had to learn a new tool or technology quickly. How did you go about it?": "Show a structured approach: identify what to learn, find best resources (docs, tutorials), set a timeline, practice on a small project, then apply it. Give a specific example with a positive result.",
  "How do you prioritize your tasks when you have multiple competing deadlines?": "Mention techniques like MoSCoW or the Eisenhower matrix. Emphasise communicating with stakeholders if something is at risk, and give a real example of successfully managing competing priorities.",
  "Tell me about a time you had to deliver bad news to a manager, client, or team member. How did you approach it?": "Show empathy, directness, and solution-focus. Describe preparing beforehand, being honest and clear, explaining the impact, and immediately presenting options or a recovery plan rather than just the problem.",
  "Describe a time when you went above and beyond your standard duties to get a job done.": "Give a specific example where you took initiative without being asked — helping another team, fixing a critical issue, or building a tool that saved time. Explain the impact and what motivated you.",
  "What is your preferred work style? Do you work better independently or as part of a team?": "Show flexibility. Explain you are comfortable with both, give an example of succeeding independently and collaborating in a team. Mention how you adapt your communication style to project needs.",
  "How do you stay motivated and productive during repetitive or tedious tasks?": "Mention strategies: breaking tasks into chunks, automating repetitive parts where possible, connecting the task to the larger goal, and rewarding progress. Show self-awareness about managing focus.",
  "Give an example of a time you had to persuade someone to see your point of view.": "Describe using data, logic, or empathy to change someone's mind. Show you first listened to their perspective, then built a case addressing their concerns, achieving a collaborative outcome.",
  "What is your approach to receiving constructive criticism or negative feedback?": "Show maturity: listen without becoming defensive, ask clarifying questions, reflect honestly, and act on the feedback. Give a specific example of feedback that genuinely made you better.",
  "Describe a time you worked with a cross-functional team. How did you align different goals?": "Explain how you identified each stakeholder's priorities, found common ground, established shared goals, communicated clearly across functions, and resolved conflicts from different team objectives.",
  "Why should we hire you over other candidates for this specific position?": "Be specific and confident. Highlight 2-3 unique strengths directly relevant to this role, connect them to the company's needs, and show genuine enthusiasm. Avoid generic answers like 'I am a hard worker'.",
  "What do you think is the most important skill for a successful professional in this industry?": "Give a specific skill with justification. For tech roles: adaptability, communication, or problem-solving are strong choices. Back it up with a personal example of how you have demonstrated this skill.",
  "Do you have any questions for us about the company, team, or role?": "Always have 2-3 thoughtful questions ready. Good examples: 'What does success look like in this role after 90 days?', 'How does the team handle technical disagreements?', 'What are the biggest challenges the team faces?'"
};

const HR_QUESTION_KEYWORDS = {
  "Tell me about yourself and why you're interested in this role.": ['experience','background','skills','interest','passion','career','role','goal','contribute','motivated'],
  "Describe a time you faced a difficult conflict with a coworker. How did you resolve it?": ['conflict','resolve','communication','listen','understand','compromise','solution','discuss','approach','outcome'],
  "What is your greatest professional achievement and why?": ['achieve','deliver','impact','result','success','project','goal','proud','team','contribute'],
  "Tell me about a time you made a significant mistake. What did you learn from it?": ['mistake','learn','improve','responsibility','fix','reflect','growth','feedback','change','lesson'],
  "Why do you want to leave your current position or why did you choose this field?": ['growth','opportunity','challenge','passion','career','learn','field','interest','goal','develop'],
  "Where do you see yourself in five years? What are your career aspirations?": ['goal','leadership','grow','career','aspire','develop','contribute','role','expertise','vision'],
  "How do you handle working under tight deadlines or high-pressure situations?": ['prioritize','deadline','pressure','organize','focus','calm','plan','manage','deliver','communicate'],
  "Describe a project you managed or led. What challenges did you face and how did you overcome them?": ['project','manage','leadership','challenge','team','deliver','overcome','plan','coordinate','result'],
  "Explain a situation where you had to learn a new tool or technology quickly. How did you go about it?": ['learn','adapt','technical','tool','research','practice','apply','challenge','quickly','skill'],
  "How do you prioritize your tasks when you have multiple competing deadlines?": ['prioritize','organize','deadline','plan','manage','focus','schedule','important','delegate','communicate'],
  "Tell me about a time you had to deliver bad news to a manager, client, or team member. How did you approach it?": ['communicate','honest','empathy','solution','approach','transparency','listen','feedback','resolve','professional'],
  "Describe a time when you went above and beyond your standard duties to get a job done.": ['initiative','exceed','deliver','effort','contribute','proactive','result','goal','team','responsibility'],
  "What is your preferred work style? Do you work better independently or as part of a team?": ['team','collaborate','independent','communicate','style','adapt','flexible','contribute','environment','productivity'],
  "How do you stay motivated and productive during repetitive or tedious tasks?": ['motivated','focus','goal','discipline','routine','productive','mindset','progress','purpose','organize'],
  "Give an example of a time you had to persuade someone to see your point of view.": ['persuade','communicate','listen','evidence','influence','approach','understand','solution','outcome','respect'],
  "What is your approach to receiving constructive criticism or negative feedback?": ['feedback','improve','listen','reflect','growth','learn','accept','adapt','positive','constructive'],
  "Describe a time you worked with a cross-functional team. How did you align different goals?": ['collaborate','team','align','communicate','goals','coordinate','stakeholder','understand','deliver','cross-functional'],
  "Why should we hire you over other candidates for this specific position?": ['skills','experience','contribute','unique','value','achieve','strength','fit','deliver','passion'],
  "What do you think is the most important skill for a successful professional in this industry?": ['communication','adaptability','technical','leadership','collaborate','learn','problem','skill','industry','growth'],
  "Do you have any questions for us about the company, team, or role?": ['team','role','culture','growth','expect','opportunity','learn','contribute','goal','company']
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initProfile();
  initEventListeners();
  loadQuestionDatabase();
  initSpeechRecognition();
});

// --- LOAD PROFILE DATA FROM STORAGE ---
function initProfile() {
  const savedProfile = localStorage.getItem("prepup_profile");
  if (savedProfile) {
    try {
      state.profile = JSON.parse(savedProfile);
    } catch (e) {
      console.error("Error parsing profile history, resetting.", e);
    }
  }
  updateSidebarProfileUI();
}

function saveProfileToStorage() {
  localStorage.setItem("prepup_profile", JSON.stringify(state.profile));
  updateSidebarProfileUI();
}

function updateSidebarProfileUI() {
  // Update texts
  document.getElementById("user-name").textContent = state.profile.name;
  document.getElementById("user-title").textContent = state.profile.title;
  document.getElementById("profile-avatar").textContent = state.profile.avatar;
  
  document.getElementById("stats-total").textContent = state.profile.totalInterviews;
  document.getElementById("stats-avg").textContent = `${Math.round(state.profile.avgScore)}%`;

  // Update inputs in edit form
  document.getElementById("edit-name").value = state.profile.name;
  document.getElementById("edit-title").value = state.profile.title;
  document.getElementById("edit-avatar").value = state.profile.avatar;

  // Build History list
  const historyList = document.getElementById("history-list");
  if (state.profile.history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-history">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h10"/></svg>
        <p>No interview records yet. Complete your first round to see history!</p>
      </div>`;
  } else {
    // Show latest records first
    const sortedHistory = [...state.profile.history].reverse();
    historyList.innerHTML = sortedHistory.map((h, index) => {
      const formattedRole = h.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const percentage = Math.round((h.totalScore / 30) * 100);
      return `
        <div class="history-card" onclick="viewHistoryItem('${h.id}')">
          <div class="history-card-header">
            <span class="history-role">${formattedRole}</span>
            <span class="history-score">${h.totalScore}/30</span>
          </div>
          <div class="history-card-header">
            <span class="history-date">${h.date}</span>
            <span class="history-date">${percentage}% Score</span>
          </div>
          <div class="history-rounds">
            <span>R1: ${h.r1Score}/10</span>
            <span>R2: ${h.r2Score}/10</span>
            <span>R3: ${h.r3Score}/10</span>
          </div>
          <button class="history-delete-btn" title="Delete this result" onclick="event.stopPropagation(); deleteHistoryItem('${h.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete
          </button>
        </div>
      `;
    }).join('');
  }
}

// --- FETCH QUESTIONS DATABASE ---
async function loadQuestionDatabase() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error("Could not fetch questions database.");
    const data = await response.json();
    
    state.interview.aptitudePool = data.aptitude || [];
    state.interview.technicalPool = data.technical || {};
    state.interview.hrPool = data.hr || [];
  } catch (error) {
    console.error("Failed to load interview questions:", error);
    alert("Error loading question bank. Please verify server.js is running.");
  }
}

// --- EVENT LISTENERS ---
function initEventListeners() {
  // Profile editing triggers
  const editBtn = document.getElementById("edit-profile-trigger");
  const cancelBtn = document.getElementById("cancel-profile-btn");
  const saveBtn = document.getElementById("save-profile-btn");
  const displayCard = document.getElementById("profile-info-display");
  const editForm = document.getElementById("profile-info-edit");

  editBtn.addEventListener("click", () => {
    displayCard.classList.add("hidden");
    editForm.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    displayCard.classList.remove("hidden");
    editForm.classList.add("hidden");
  });

  saveBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("edit-name").value.trim();
    const titleInput = document.getElementById("edit-title").value.trim();
    const avatarSelect = document.getElementById("edit-avatar").value;

    if (nameInput && titleInput) {
      state.profile.name = nameInput;
      state.profile.title = titleInput;
      state.profile.avatar = avatarSelect;
      saveProfileToStorage();
      displayCard.classList.remove("hidden");
      editForm.classList.add("hidden");
    }
  });

  // Role selections
  const roleCards = document.querySelectorAll(".role-card");
  roleCards.forEach(card => {
    card.addEventListener("click", () => {
      roleCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      state.interview.selectedRole = card.getAttribute("data-role");
    });
  });

  // Start Prep Button
  document.getElementById("start-interview-btn").addEventListener("click", startPrepSession);

  // MCQ Navigation Buttons
  document.getElementById("mcq-prev-btn").addEventListener("click", mcqPrevQuestion);
  document.getElementById("mcq-next-btn").addEventListener("click", mcqNextQuestion);
  document.getElementById("mcq-submit-btn").addEventListener("click", submitMcqRound);

  // Voice Recording Button (HR Round)
  document.getElementById("mic-record-trigger").addEventListener("click", toggleVoiceRecording);

  // HR Round Navigation
  document.getElementById("hr-next-btn").addEventListener("click", hrNextQuestion);
  document.getElementById("hr-submit-btn").addEventListener("click", submitHrRound);

  // Results Back button
  document.getElementById("results-done-btn").addEventListener("click", resetToHome);
}

// --- INIT SPEECH RECOGNITION (WEB SPEECH API) ---
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn("Browser does not support Web Speech API. Falling back to textarea.");
    setupVoiceFallback();
    return;
  }

  const recObj = new SpeechRecognition();
  recObj.continuous = true;
  recObj.interimResults = true;
  recObj.lang = 'en-US';

  recObj.onstart = () => {
    state.isRecording = true;
    document.getElementById("hr-speech-indicator").classList.add("recording");
    document.getElementById("hr-speech-indicator").querySelector(".status-label-text").textContent = "Recording...";
    document.getElementById("mic-record-trigger").classList.add("recording");
    document.getElementById("soundwave-anim").classList.add("active");
    document.getElementById("mic-instruction-text").textContent = "Recording... Click mic to stop.";
  };

  recObj.onresult = (event) => {
    let interimTranscript = "";
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        state.finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    const bodyText = state.finalTranscript + interimTranscript;
    const transcriptContainer = document.getElementById("speech-transcript-text");
    
    if (bodyText.trim().length > 0) {
      transcriptContainer.innerHTML = bodyText;
      // Enable next button since they spoke something
      enableHrNext(true);
    }
  };

  recObj.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    const transcriptContainer = document.getElementById("speech-transcript-text");
    let errorMsg = "";
    if (event.error === 'not-allowed') {
      errorMsg = "Microphone access denied. Please click the camera/mic icon in the browser address bar to allow microphone access.";
      setupVoiceFallback();
    } else if (event.error === 'network') {
      errorMsg = "Speech recognition requires an internet connection. Please check your network and try again, or use manual input.";
    } else if (event.error === 'no-speech') {
      errorMsg = "No speech detected. Please speak closer to your microphone.";
    } else {
      errorMsg = `Speech recognition error: ${event.error}. Please try typing your answer if this continues.`;
    }
    if (transcriptContainer) {
      transcriptContainer.innerHTML = `<span class="error-text" style="color: var(--color-danger); font-style: normal; font-weight: 500;">⚠️ ${errorMsg}</span>`;
    }
  };

  recObj.onend = () => {
    state.isRecording = false;
    document.getElementById("hr-speech-indicator").classList.remove("recording");
    document.getElementById("hr-speech-indicator").querySelector(".status-label-text").textContent = "Recording Paused";
    document.getElementById("mic-record-trigger").classList.remove("recording");
    document.getElementById("soundwave-anim").classList.remove("active");
    document.getElementById("mic-instruction-text").textContent = "Click mic to resume recording";

    // If user clicked Next/Submit (isSaving=true), the answer was already captured
    // by saveCurrentHrAnswer() before stop() was called — just reset the flag.
    // If mic stopped naturally, save finalTranscript but do NOT auto-advance.
    if (state.interview.isSaving) {
      state.interview.isSaving = false;
    } else {
      let transcriptText = (state.finalTranscript || "").trim();
      if (!transcriptText) {
        const domText = document.getElementById("speech-transcript-text").textContent.trim();
        if (!domText.startsWith("Your transcribed answer")) transcriptText = domText;
      }
      const qIndex = state.interview.currentQuestionIndex;
      state.interview.r3Answers[qIndex] = transcriptText;
      console.log(`[HR onend natural stop] Q${qIndex+1}:`, JSON.stringify(transcriptText));
    }
  };

  state.recognition = recObj;
}

function setupVoiceFallback() {
  document.getElementById("soundwave-anim").style.display = "none";
  document.getElementById("mic-record-trigger").style.display = "none";
  document.getElementById("mic-instruction-text").textContent = "Voice input is unavailable. Please type your answers below.";
  document.getElementById("speech-transcript-text").classList.add("hidden");
  
  const fallback = document.getElementById("text-fallback-area");
  fallback.classList.remove("hidden");

  const textarea = document.getElementById("manual-text-input");
  textarea.value = "";
  
  // Listen for typing events to enable navigation
  textarea.oninput = () => {
    enableHrNext(textarea.value.trim().length > 5);
  };
}

async function toggleVoiceRecording() {
  if (!state.recognition) {
    setupVoiceFallback();
    return;
  }

  if (state.isRecording) {
    state.recognition.stop();
  } else {
    try {
      // Explicitly check for mic permissions and hardware
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clear transcript for this attempt if starting fresh
      const placeholder = document.getElementById("speech-transcript-text").querySelector(".placeholder-text");
      if (placeholder) {
        state.finalTranscript = "";
        document.getElementById("speech-transcript-text").textContent = "";
      }
      state.recognition.start();
    } catch (err) {
      console.error("Microphone hardware access error:", err);
      const transcriptContainer = document.getElementById("speech-transcript-text");
      if (transcriptContainer) {
        transcriptContainer.innerHTML = `<span class="error-text" style="color: var(--color-danger); font-style: normal; font-weight: 500;">⚠️ Microphone access error: ${err.message}. Please connect a microphone and grant permission in browser settings.</span>`;
      }
      setupVoiceFallback();
    }
  }
}

function enableHrNext(enabled) {
  const nextBtn = document.getElementById("hr-next-btn");
  const submitBtn = document.getElementById("hr-submit-btn");

  if (state.interview.currentQuestionIndex === 4) {
    submitBtn.disabled = !enabled;
  } else {
    nextBtn.disabled = !enabled;
  }
}

// --- INTERVIEW INITIALIZATION WORKFLOW ---
function startPrepSession() {
  if (state.interview.aptitudePool.length < 10) {
    alert("Question bank is still loading. Please wait a second.");
    return;
  }

  console.log("Starting interview for role:", state.interview.selectedRole);

  // 1. Pick 10 random Aptitude questions
  state.interview.r1Questions = shuffleArray([...state.interview.aptitudePool]).slice(0, 10);

  // 2. Pick 10 random Technical questions based on selected role
  const rolePool = state.interview.technicalPool[state.interview.selectedRole] || [];
  if (rolePool.length < 10) {
    alert("Error loading technical questions for role: " + state.interview.selectedRole);
    return;
  }
  state.interview.r2Questions = shuffleArray([...rolePool]).slice(0, 10);

  // 3. Pick 5 random HR questions
  state.interview.r3Questions = shuffleArray([...state.interview.hrPool]).slice(0, 5);

  // Reset answer states
  state.interview.r1Answers = {};
  state.interview.r2Answers = {};
  state.interview.r3Answers = {};

  // Switch to Round 1
  state.interview.currentRound = 1;
  state.interview.currentQuestionIndex = 0;
  
  switchScreen("screen-mcq-round");
  loadRoundUI();
}

function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

// --- ROUND STATE LOADERS ---
function loadRoundUI() {
  const round = state.interview.currentRound;
  
  if (round === 1 || round === 2) {
    // MCQ Rounds 1 & 2
    const questions = round === 1 ? state.interview.r1Questions : state.interview.r2Questions;
    const answers = round === 1 ? state.interview.r1Answers : state.interview.r2Answers;
    const qIndex = state.interview.currentQuestionIndex;
    const question = questions[qIndex];

    // Headers
    document.getElementById("mcq-round-badge").textContent = `ROUND ${round}`;
    document.getElementById("mcq-round-name").textContent = round === 1 ? "Aptitude Assessment" : "Technical Round";
    
    // Progress track
    const progressPercent = ((qIndex + 1) / 10) * 100;
    document.getElementById("mcq-progress-bar").style.width = `${progressPercent}%`;
    document.getElementById("mcq-progress-text").textContent = `Question ${qIndex + 1} of 10`;

    // Question
    document.getElementById("mcq-q-num").textContent = `Q${qIndex + 1}`;
    // Extract category from question prefix (e.g. [Logical Reasoning])
    const categoryMatch = question.question.match(/^\[(.*?)\]/);
    const category = categoryMatch ? categoryMatch[1] : (round === 1 ? "Quantitative" : "Technical");
    const cleanText = question.question.replace(/^\[.*?\]\s*/, "");
    
    document.getElementById("mcq-q-category").textContent = category;
    const cleanTextFinal = cleanText.replace(/\s*\(Topic Code:[^)]*\)/gi, "").trim();
    document.getElementById("mcq-question-text").textContent = cleanTextFinal;

    // Options
    const optionsContainer = document.getElementById("mcq-options-container");
    const hasAnswered = answers[qIndex] !== undefined;
    optionsContainer.innerHTML = question.options.map((opt, oIdx) => {
      const isSelected = answers[qIndex] === oIdx;
      const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
      return `
        <button class="option-btn ${isSelected ? 'selected' : ''} ${hasAnswered ? 'disabled' : ''}" 
                onclick="selectMcqOption(${oIdx})" 
                ${hasAnswered ? 'disabled' : ''}>
          <div class="option-badge">${letter}</div>
          <span>${opt}</span>
        </button>
      `;
    }).join('');

    // Navigation
    document.getElementById("mcq-prev-btn").disabled = qIndex === 0;
    
    if (qIndex === 9) {
      document.getElementById("mcq-next-btn").classList.add("hidden");
      document.getElementById("mcq-submit-btn").classList.remove("hidden");
    } else {
      document.getElementById("mcq-next-btn").classList.remove("hidden");
      document.getElementById("mcq-submit-btn").classList.add("hidden");
    }

    // Start Timer if not running
    if (qIndex === 0 && !state.interview.timerInterval) {
      startRoundTimer();
    }
  } else if (round === 3) {
    // HR round
    const qIndex = state.interview.currentQuestionIndex;
    const question = state.interview.r3Questions[qIndex];

    // Progress
    const progressPercent = ((qIndex + 1) / 5) * 100;
    document.getElementById("hr-progress-bar").style.width = `${progressPercent}%`;
    document.getElementById("hr-progress-text").textContent = `Question ${qIndex + 1} of 5`;

    // Question
    document.getElementById("hr-q-num").textContent = `Q${qIndex + 1}`;
    document.getElementById("hr-question-text").textContent = question;

    // Reset Voice inputs
    state.finalTranscript = "";
    document.getElementById("speech-transcript-text").innerHTML = `<span class="placeholder-text">Your transcribed answer will appear here in real-time as you speak...</span>`;
    startHrQuestionTimer();
    
    const textarea = document.getElementById("manual-text-input");
    if (textarea) textarea.value = "";
    
    // Enable navigation button checking
    enableHrNext(false);

    if (qIndex === 4) {
      document.getElementById("hr-next-btn").classList.add("hidden");
      document.getElementById("hr-submit-btn").classList.remove("hidden");
    } else {
      document.getElementById("hr-next-btn").classList.remove("hidden");
      document.getElementById("hr-submit-btn").classList.add("hidden");
    }
  }
}

// --- TIMER CONTROLLER ---
function startRoundTimer() {
  clearInterval(state.interview.timerInterval);
  state.interview.secondsLeft = state.interview.totalSeconds;
  
  updateTimerProgress();

  state.interview.timerInterval = setInterval(() => {
    state.interview.secondsLeft--;
    updateTimerProgress();

    if (state.interview.secondsLeft <= 0) {
      clearInterval(state.interview.timerInterval);
      state.interview.timerInterval = null;
      alert("Time is up for this round! Auto-submitting details.");
      
      if (state.interview.currentRound === 1) {
        submitMcqRound();
      } else {
        submitMcqRound(); // R2 handles same submit logic
      }
    }
  }, 1000);
}

function updateTimerProgress() {
  const min = Math.floor(state.interview.secondsLeft / 60);
  const sec = state.interview.secondsLeft % 60;
  
  // Update text
  document.getElementById("mcq-timer-display").textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  
  // Update SVG circular dash offset
  const circumference = 125.6; // 2 * PI * 20
  const percentageLeft = state.interview.secondsLeft / state.interview.totalSeconds;
  const strokeOffset = circumference - (percentageLeft * circumference);
  
  const ringFill = document.getElementById("mcq-timer-progress-ring");
  ringFill.style.strokeDashoffset = strokeOffset;

  // Change timer color to red alert if under 30 seconds
  if (state.interview.secondsLeft < 30) {
    ringFill.style.stroke = "var(--color-danger)";
  } else {
    ringFill.style.stroke = "var(--color-primary)";
  }
}

// --- MCQ HANDLERS ---
window.selectMcqOption = function(optionIndex) {
  const round = state.interview.currentRound;
  const qIndex = state.interview.currentQuestionIndex;
  const answers = round === 1 ? state.interview.r1Answers : state.interview.r2Answers;

  // Prevent changing selected option once chosen
  if (answers[qIndex] !== undefined) {
    return;
  }
  
  if (round === 1) {
    state.interview.r1Answers[qIndex] = optionIndex;
  } else {
    state.interview.r2Answers[qIndex] = optionIndex;
  }
  
  // Rerender UI options to show selected state
  loadRoundUI();
};

function mcqPrevQuestion() {
  if (state.interview.currentQuestionIndex > 0) {
    state.interview.currentQuestionIndex--;
    loadRoundUI();
  }
}

function mcqNextQuestion() {
  if (state.interview.currentQuestionIndex < 9) {
    state.interview.currentQuestionIndex++;
    loadRoundUI();
  }
}

function submitMcqRound() {
  // Clear Active timers
  clearInterval(state.interview.timerInterval);
  state.interview.timerInterval = null;

  if (state.interview.currentRound === 1) {
    // Shift to Round 2 (Technical)
    state.interview.currentRound = 2;
    state.interview.currentQuestionIndex = 0;
    loadRoundUI();
  } else {
    // Shift to Round 3 (HR Speech Round)
    state.interview.currentRound = 3;
    state.interview.currentQuestionIndex = 0;
    switchScreen("screen-hr-round");
    loadRoundUI();
  }
}

// --- HR VOICE HANDLERS ---
function saveCurrentHrAnswer() {
  const qIndex = state.interview.currentQuestionIndex;
  let answerText = "";

  const fallbackContainer = document.getElementById("text-fallback-area");
  const fallbackTextarea  = document.getElementById("manual-text-input");
  const isFallbackVisible = fallbackContainer && !fallbackContainer.classList.contains("hidden");

  if (isFallbackVisible) {
    answerText = fallbackTextarea ? fallbackTextarea.value.trim() : "";
  } else {
    // Read from state.finalTranscript BEFORE stopping the mic (stop() is async)
    answerText = (state.finalTranscript || "").trim();
    if (!answerText) {
      const domText = document.getElementById("speech-transcript-text").textContent.trim();
      if (!domText.startsWith("Your transcribed answer")) answerText = domText;
    }
  }

  if (state.isRecording && state.recognition) state.recognition.stop();

  state.interview.r3Answers[qIndex] = answerText;
  console.log(`[HR Save] Q${qIndex+1}:`, JSON.stringify(answerText));
}

function startHrQuestionTimer() {
  stopHrQuestionTimer();
  state.interview.hrTimerSeconds = 210;
  updateHrTimerDisplay();
  state.interview.hrTimerInterval = setInterval(() => {
    state.interview.hrTimerSeconds--;
    updateHrTimerDisplay();
    if (state.interview.hrTimerSeconds <= 0) {
      stopHrQuestionTimer();
      if (state.interview.currentQuestionIndex === 4) submitHrRound();
      else hrNextQuestion();
    }
  }, 1000);
}

function stopHrQuestionTimer() {
  if (state.interview.hrTimerInterval) {
    clearInterval(state.interview.hrTimerInterval);
    state.interview.hrTimerInterval = null;
  }
}

function updateHrTimerDisplay() {
  const s   = state.interview.hrTimerSeconds;
  const min = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  const display = document.getElementById("hr-timer-display");
  const fill    = document.getElementById("hr-timer-fill");
  if (display) display.textContent = `${min}:${sec}`;
  if (fill) {
    fill.style.width = ((s / 210) * 100) + "%";
    fill.className = "hr-timer-fill" + (s <= 30 ? " danger" : s <= 60 ? " warning" : "");
  }
}

function hrNextQuestion() {
  state.interview.isSaving = true;
  saveCurrentHrAnswer();
  
  if (state.interview.currentQuestionIndex < 4) {
    state.interview.currentQuestionIndex++;
    loadRoundUI();
  }
}

function submitHrRound() {
  stopHrQuestionTimer();
  state.interview.isSaving = true;
  saveCurrentHrAnswer();
  
  // Stop speech synthesis / recording completely
  if (state.recognition) {
    state.recognition.stop();
  }

  state.interview.currentRound = 4; // Results
  processInterviewScores();
  switchScreen("screen-results");
}

// --- SCORING & COMPILATION ---
function processInterviewScores() {
  let scoreR1 = 0; // Aptitude
  let scoreR2 = 0; // Technical
  let scoreR3 = 0; // HR
  
  const hrFeedbackList = [];

  // 1. Mark Aptitude MCQ
  state.interview.r1Questions.forEach((q, idx) => {
    const userAns = state.interview.r1Answers[idx];
    if (userAns !== undefined && userAns === q.answer) {
      scoreR1++;
    }
  });

  // 2. Mark Technical MCQ
  state.interview.r2Questions.forEach((q, idx) => {
    const userAns = state.interview.r2Answers[idx];
    if (userAns !== undefined && userAns === q.answer) {
      scoreR2++;
    }
  });

  // 3. Evaluate HR Speech Answers
  state.interview.r3Questions.forEach((q, idx) => {
    const answer = state.interview.r3Answers[idx] || "";
    let score = 0;
    const matchedKeywords = [];

    const relevantKeywords = HR_QUESTION_KEYWORDS[q] || [];
    const cleanAnswer = answer.toLowerCase().replace(/[^a-zA-Z\s]/g, "");
    const words = cleanAnswer.split(/\s+/);

    relevantKeywords.forEach(kw => { if (words.includes(kw)) matchedKeywords.push(kw); });

    const uniqueWords  = new Set(words.filter(w => w.length > 2)).size;
    const hasLength    = answer.length > 80;
    const hasShortLen  = answer.length > 25;
    const kwCount      = matchedKeywords.length;

    if (hasLength && uniqueWords >= 15 && kwCount >= 2)      score = 2;
    else if ((hasShortLen || kwCount >= 1) && uniqueWords >= 5) score = 1;
    else                                                       score = 0;

    scoreR3 += score;

    // Build highlighted HTML transcript
    let highlightedAnswer = answer;
    if (answer) {
      // Highlight matching keywords inside response
      matchedKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        highlightedAnswer = highlightedAnswer.replace(regex, `<span class="keyword-highlight">$1</span>`);
      });
    } else {
      highlightedAnswer = "[Candidate did not provide an answer for this question]";
    }

    hrFeedbackList.push({
      question: q,
      answer: highlightedAnswer,
      score: score,
      keywords: matchedKeywords
    });
  });

  const totalScore = scoreR1 + scoreR2 + scoreR3; // max = 10 + 10 + 10 = 30 marks
  
  // Render results on screen
  document.getElementById("results-total-score").textContent = totalScore;
  document.getElementById("score-r1").textContent = `${scoreR1}/10`;
  document.getElementById("score-r2").textContent = `${scoreR2}/10`;
  document.getElementById("score-r3").textContent = `${scoreR3}/10`;

  // Set Progress Bars widths
  document.getElementById("progress-bar-r1").style.width = `${scoreR1 * 10}%`;
  document.getElementById("progress-bar-r2").style.width = `${scoreR2 * 10}%`;
  document.getElementById("progress-bar-r3").style.width = `${scoreR3 * 10}%`;

  // Score circular meter animate
  const donutCircumference = 314.16; // 2 * PI * 50
  const scorePercent = totalScore / 30;
  const offsetValue = donutCircumference - (scorePercent * donutCircumference);
  document.getElementById("results-donut-progress").style.strokeDashoffset = offsetValue;

  // Status Badge
  const statusBadge = document.getElementById("overall-status-badge");
  if (totalScore >= 22) {
    statusBadge.textContent = "Excellent";
    statusBadge.className = "badge badge-success";
  } else if (totalScore >= 15) {
    statusBadge.textContent = "Qualified";
    statusBadge.className = "badge badge-success";
  } else {
    statusBadge.textContent = "Needs Improvement";
    statusBadge.className = "badge badge-warning";
  }

  // Populate HR Feedback
  const feedbackContainer = document.getElementById("results-hr-qa-list");
  feedbackContainer.innerHTML = hrFeedbackList.map((item, idx) => {
    const modelAnswer = HR_MODEL_ANSWERS[item.question] || "";
    let feedbackHtml = "";
    if (item.score === 2) {
      feedbackHtml = `<div class="hr-feedback-correct">
        <span class="hr-feedback-icon">✓</span>
        <strong>Your answer was 100% correct!</strong> You demonstrated strong communication and covered key points effectively.
      </div>`;
    } else if (item.score === 1) {
      feedbackHtml = `<div class="hr-feedback-partial">
        <span class="hr-feedback-icon">◐</span>
        <strong>Partially correct.</strong> You touched on some relevant points but could go deeper.
        ${modelAnswer ? `<div class="hr-model-answer"><span class="model-answer-label">Suggested Answer:</span> ${modelAnswer}</div>` : ""}
      </div>`;
    } else {
      const noAnswer = !item.answer || !item.answer.trim();
      feedbackHtml = `<div class="hr-feedback-wrong">
        <span class="hr-feedback-icon">✗</span>
        <strong>${noAnswer ? "No answer provided." : "Answer needs improvement."}</strong>
        ${modelAnswer ? `<div class="hr-model-answer"><span class="model-answer-label">Suggested Answer:</span> ${modelAnswer}</div>` : ""}
      </div>`;
    }
    return `
      <div class="hr-qa-item">
        <div class="hr-qa-question">Q${idx+1}: ${item.question}</div>
        <div class="hr-qa-answer">${item.answer || "<em>No answer recorded.</em>"}</div>
        <div class="hr-analysis-row"><span class="hr-analysis-score">${item.score}/2 Marks</span></div>
        ${feedbackHtml}
      </div>`;
  }).join('');

  // Draw pie chart
  renderResultsPieChart(scoreR1, scoreR2, scoreR3);

  // 4. Save results to profile history list
  const historyItem = {
    id: `hist_${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    role: state.interview.selectedRole,
    r1Score: scoreR1,
    r2Score: scoreR2,
    r3Score: scoreR3,
    totalScore: totalScore
  };

  // Push record to history array
  state.interview.hrFeedback = hrFeedbackList;
  state.profile.history.push(historyItem);
  
  // Recalculate stats
  state.profile.totalInterviews = state.profile.history.length;
  
  const totalAccumulated = state.profile.history.reduce((sum, item) => sum + (item.totalScore / 30 * 100), 0);
  state.profile.avgScore = totalAccumulated / state.profile.totalInterviews;

  // Persist to local storage
  saveProfileToStorage();
}

// --- DISPLAY SAVED RECORD DETAILS IN RESULTS SCREEN ---
window.viewHistoryItem = function(historyId) {
  const item = state.profile.history.find(h => h.id === historyId);
  if (!item) return;

  // Mock active questions with dummy question text for visual review
  // Since we don't save full question lists in history array, we recreate placeholders
  state.interview.selectedRole = item.role;
  state.interview.currentRound = 4; // Set screen results active

  // Re-fill dashboard scores
  document.getElementById("results-total-score").textContent = item.totalScore;
  document.getElementById("score-r1").textContent = `${item.r1Score}/10`;
  document.getElementById("score-r2").textContent = `${item.r2Score}/10`;
  document.getElementById("score-r3").textContent = `${item.r3Score}/10`;

  document.getElementById("progress-bar-r1").style.width = `${item.r1Score * 10}%`;
  document.getElementById("progress-bar-r2").style.width = `${item.r2Score * 10}%`;
  document.getElementById("progress-bar-r3").style.width = `${item.r3Score * 10}%`;

  const donutCircumference = 314.16;
  const scorePercent = item.totalScore / 30;
  const offsetValue = donutCircumference - (scorePercent * donutCircumference);
  document.getElementById("results-donut-progress").style.strokeDashoffset = offsetValue;

  const statusBadge = document.getElementById("overall-status-badge");
  if (item.totalScore >= 22) {
    statusBadge.textContent = "Excellent";
    statusBadge.className = "badge badge-success";
  } else if (item.totalScore >= 15) {
    statusBadge.textContent = "Qualified";
    statusBadge.className = "badge badge-success";
  } else {
    statusBadge.textContent = "Needs Improvement";
    statusBadge.className = "badge badge-warning";
  }

  // Set simplified history summary feedback
  const feedbackContainer = document.getElementById("results-hr-qa-list");
  feedbackContainer.innerHTML = `
    <div class="hr-qa-item">
      <div class="hr-qa-question">Session Log Details</div>
      <div class="hr-qa-answer">Historically recorded attempt for the <strong>${item.role.replace('_', ' ').toUpperCase()}</strong> role. Details on question items are archived.</div>
      <div class="hr-analysis-row">
        <span class="hr-analysis-score">R1: ${item.r1Score} marks</span>
        <span class="hr-analysis-score">R2: ${item.r2Score} marks</span>
        <span class="hr-analysis-score">R3: ${item.r3Score} marks</span>
      </div>
    </div>
  `;

  renderResultsPieChart(item.r1Score, item.r2Score, item.r3Score);
  switchScreen("screen-results");
};

// --- DELETE HISTORY ITEM ---
window.deleteHistoryItem = function(historyId) {
  state.profile.history = state.profile.history.filter(h => h.id !== historyId);
  state.profile.totalInterviews = state.profile.history.length;
  if (state.profile.history.length > 0) {
    const total = state.profile.history.reduce((sum, h) => sum + (h.totalScore / 30 * 100), 0);
    state.profile.avgScore = total / state.profile.history.length;
  } else {
    state.profile.avgScore = 0;
  }
  saveProfileToStorage();
  updateDashboard();
};

// --- RESET & RETURN HOME ---
function resetToHome() {
  state.interview.currentRound = 0;
  state.interview.currentQuestionIndex = 0;
  switchScreen("screen-landing");
}

// --- UTILS ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- PIE CHART ---
function renderResultsPieChart(r1, r2, r3) {
  const canvas = document.getElementById("results-pie-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const total = r1 + r2 + r3 || 1;
  const slices = [
    { label: "Aptitude",  value: r1, color: "#62e72d" },
    { label: "Technical", value: r2, color: "#9333ea" },
    { label: "HR Round",  value: r3, color: "#e00b0b" }
  ];

  const cx = W / 2, cy = H / 2 - 10, radius = Math.min(cx, cy) - 10;
  let startAngle = -Math.PI / 2;

  slices.forEach(slice => {
    const sweep = (slice.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    startAngle += sweep;
  });

  // Centre hole (donut effect)
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.5, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || "#0f0f1a";
  ctx.fill();

  // Legend
  const legendY = H - 28;
  const spacing = W / slices.length;
  slices.forEach((slice, i) => {
    const lx = spacing * i + spacing / 2;
    ctx.fillStyle = slice.color;
    ctx.fillRect(lx - 28, legendY, 12, 12);
    ctx.fillStyle = "#ccc";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`${slice.label} (${slice.value})`, lx - 14, legendY + 11);
  });
}

// --- PDF REPORT DOWNLOAD ---
function downloadReport() {
  const name    = document.getElementById("profile-name-display")?.textContent || "Candidate";
  const role    = (state.interview.selectedRole || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const date    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const r1      = document.getElementById("score-r1")?.textContent || "—";
  const r2      = document.getElementById("score-r2")?.textContent || "—";
  const r3      = document.getElementById("score-r3")?.textContent || "—";
  const total   = document.getElementById("results-total-score")?.textContent || "—";
  const status  = document.getElementById("overall-status-badge")?.textContent || "—";

  let hrRows = "";
  (state.interview.r3Questions || []).forEach((q, i) => {
    const ans   = state.interview.r3Answers?.[i] || "No answer recorded.";
    const score = state.interview.hrFeedback?.[i]?.score ?? "—";
    const model = HR_MODEL_ANSWERS[q] || "";
    hrRows += `
      <tr>
        <td style="padding:8px;border:1px solid #333;vertical-align:top;color:#ccc;font-size:12px;">${i+1}. ${q}</td>
        <td style="padding:8px;border:1px solid #333;vertical-align:top;color:#eee;font-size:12px;">${ans}</td>
        <td style="padding:8px;border:1px solid #333;text-align:center;color:#fff;font-weight:600;">${score}/2</td>
      </tr>
      ${model ? `<tr><td colspan="3" style="padding:6px 8px;border:1px solid #333;background:#1a1a2e;color:#9333ea;font-size:11px;"><strong>Suggested:</strong> ${model}</td></tr>` : ""}`;
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Interview Report — ${name}</title>
  <style>
    body{font-family:Arial,sans-serif;background:#0f0f1a;color:#eee;margin:0;padding:32px;}
    h1{color:#9333ea;margin-bottom:4px;}h2{color:#14b8a6;margin:24px 0 8px;}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;background:#10b981;color:#fff;}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0;}
    .card{background:#1a1a2e;border:1px solid #2a2a4a;border-radius:10px;padding:16px;text-align:center;}
    .card h3{margin:0 0 4px;font-size:28px;color:#fff;}.card p{margin:0;color:#aaa;font-size:13px;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th{background:#1a1a2e;padding:10px 8px;border:1px solid #333;color:#9333ea;font-size:13px;text-align:left;}
    @media print{body{background:#fff;color:#000;}h1,h2{color:#5b21b6;}.card{background:#f5f5f5;border-color:#ddd;}.card h3{color:#000;}.badge{background:#059669;}}
  </style></head><body>
  <h1>Interview Feedback Report</h1>
  <p style="color:#aaa;margin:0 0 8px;">${date} &nbsp;|&nbsp; Role: <strong style="color:#fff">${role}</strong></p>
  <span class="badge">${status}</span>
  <h2>Score Summary</h2>
  <div class="grid">
    <div class="card"><h3>${r1}</h3><p>Aptitude Round</p></div>
    <div class="card"><h3>${r2}</h3><p>Technical Round</p></div>
    <div class="card"><h3>${r3}</h3><p>HR Round</p></div>
  </div>
  <div class="card" style="display:inline-block;padding:12px 32px;margin-bottom:16px;">
    <h3 style="font-size:36px;">${total}/30</h3><p>Total Score</p>
  </div>
  <h2>HR Round — Question &amp; Answer Review</h2>
  <table><thead><tr>
    <th style="width:35%">Question</th><th>Your Answer</th><th style="width:60px">Score</th>
  </tr></thead><tbody>${hrRows}</tbody></table>
  <p style="margin-top:32px;color:#555;font-size:11px;">Generated by Interview Preparation Platform</p>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `Interview_Report_${name.replace(/\s+/g,"_")}.html`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}