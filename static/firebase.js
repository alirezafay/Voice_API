// ==============================
// Global Variables
// ==============================
let currentStep = 1;
let socket;
let mediaRecorder = null;
let audioChunks = [];
let currentTargetInput = null;
let currentStatusDiv = null;

// ==============================
// Initialize on page load
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);

  // Initialize WebSocket
  socket = new WebSocket("ws://localhost:5001");
  socket.onopen = () => console.log("WebSocket connected");
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const inputBox = document.getElementById(data.qid);
    if (inputBox) inputBox.value += " " + data.text;
  };

  // Attach per-question Start/Stop buttons
  document.querySelectorAll(".question-item").forEach(item => {
    const startBtn = item.querySelector(".start-btn");
    const stopBtn = item.querySelector(".stop-btn");
    const statusDiv = item.querySelector(".status");
    const targetInput = item.querySelector("input, textarea");

    if (!startBtn || !stopBtn || !statusDiv || !targetInput) return;

    startBtn.addEventListener("click", () => startRecording(targetInput, statusDiv, startBtn, stopBtn));
    stopBtn.addEventListener("click", () => stopRecording(startBtn, stopBtn, statusDiv));
  });
});

// ==============================
// Recording Functions
// ==============================
async function startRecording(targetInput, statusDiv, startBtn, stopBtn) {
  currentTargetInput = targetInput;
  currentStatusDiv = statusDiv;

  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusDiv.textContent = "Recording...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    audioChunks = [];

    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

    mediaRecorder.onstop = () => {
      statusDiv.textContent = "Processing...";
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ audio: base64Audio, qid: targetInput.id }));
        }
      };
    };

    mediaRecorder.start();
  } catch (err) {
    console.error("Microphone error:", err);
    statusDiv.textContent = "Error: " + err.message;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function stopRecording(startBtn, stopBtn, statusDiv) {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (statusDiv.textContent === "Recording...") statusDiv.textContent = "Ready to record...";
}

// ==============================
// Step Navigation
// ==============================
function showStep(stepNum) {
  document.querySelectorAll(".step").forEach(step => step.classList.remove("active"));
  const current = document.getElementById(`step${stepNum}`);
  if (current) current.classList.add("active");
}

window.nextStep = function () {
  currentStep++;
  showStep(currentStep);
};

window.previousStep = function () {
  if (currentStep > 1) currentStep--;
  showStep(currentStep);
};

// ==============================
// Start Analysis
// ==============================
window.startAnalysis = function () {
  document.getElementById("intro-page").style.display = "none";
  document.querySelector(".chat-container").style.display = "block";
  showStep(currentStep);
};

// ==============================
// Collect User Data
// ==============================
function getUserData() {
  const fields = [
    "name", "age", "gender", "residence",
    "decision_Making_Logic", "Decision_Making_Analysis", "locus_of_control", "risk_tolerance",
    "conflict_response", "trust_building", "social_prefrence", "anger_management",
    "failure_handling", "learning_from_mistakes", "past_impact", "adaptability",
    "life_goal", "motivation_source", "success_definition", "sacrifice_level",
    "education_level", "profession_title", "skill_set",
    "perceived_social_rank", "community_recognition", "self_identification", "social_influence"
  ];

  const data = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    data[f] = el ? el.value : "";
  });

  return {
    personal_information: {
      name: data.name,
      age: parseInt(data.age) || 0,
      gender: data.gender,
      residence: data.residence
    },
    cognitive_style: {
      decision_Making_Logic: data.decision_Making_Logic,
      Decision_Making_Analysis: data.Decision_Making_Analysis,
      locus_of_control: data.locus_of_control,
      risk_tolerance: data.risk_tolerance
    },
    emotion: {
      conflict_response: data.conflict_response,
      trust_building: data.trust_building,
      social_prefrence: data.social_prefrence,
      anger_management: data.anger_management
    },
    experience: {
      failure_handling: data.failure_handling,
      learning_from_mistakes: data.learning_from_mistakes,
      past_impact: data.past_impact,
      adaptability: data.adaptability
    },
    motivations: {
      life_goal: data.life_goal,
      motivation_source: data.motivation_source,
      success_definition: data.success_definition,
      sacrifice_level: data.sacrifice_level
    },
    background: {
      education_level: data.education_level,
      profession_title: data.profession_title,
      skill_set: data.skill_set
    },
    social_status: {
      perceived_social_rank: data.perceived_social_rank,
      community_recognition: data.community_recognition,
      self_identification: data.self_identification,
      social_influence: data.social_influence
    }
  };
}

// ==============================
// AI Analysis
// ==============================
window.collectAndAnalyze = async function () {
  const userData = getUserData();

  document.getElementById("loading-indicator").style.display = "block";
  document.getElementById("result-box").style.display = "none";

  try {
    const response = await fetch("/analyze_direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_data: userData })
    });

    const result = await response.json();
    document.getElementById("result-box").innerText = result.ai_result || "No response from AI.";
    document.getElementById("result-box").style.display = "block";
  } catch (err) {
    document.getElementById("result-box").innerText = "❌ Error contacting server.";
    document.getElementById("result-box").style.display = "block";
  } finally {
    document.getElementById("loading-indicator").style.display = "none";
  }
};

// ==============================
// Situation Prediction
// ==============================
window.predictBehavior = function () {
  document.getElementById("situation-input-box").style.display = "block";
  document.getElementById("situation-result-box").style.display = "none";
};

window.submitSituation = async function () {
  const situation = document.getElementById("situation-text").value.trim();
  if (!situation) return alert("Please describe a situation.");

  const userData = getUserData();

  document.getElementById("loading-indicator").style.display = "block";
  document.getElementById("situation-result-box").style.display = "none";

  try {
    const response = await fetch("/predict_behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_data: userData, situation })
    });

    const result = await response.json();
    document.getElementById("situation-result-box").innerText = result.prediction || "No prediction returned.";
    document.getElementById("situation-result-box").style.display = "block";
  } catch (err) {
    document.getElementById("situation-result-box").innerText = "❌ Error contacting server.";
    document.getElementById("situation-result-box").style.display = "block";
  } finally {
    document.getElementById("loading-indicator").style.display = "none";
  }
};
