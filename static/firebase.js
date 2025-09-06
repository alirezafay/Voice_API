// ------------------------------
// Global Variables
// ------------------------------
let currentStep = 1;
let socket;
let mediaRecorder;

// ------------------------------
// Initialize on page load
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);

  // Initialize WebSocket for real-time transcription
  socket = new WebSocket("ws://localhost:5001");
  socket.onopen = () => console.log("WebSocket connected");
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const inputBox = document.getElementById(data.qid);
    if (inputBox) {
      inputBox.value += " " + data.text;
    }
  };

  // Add a global mouseup listener to stop recording anywhere on the page
  document.addEventListener("mouseup", () => {
    stopRecording();
    // Reset all buttons in case one was pressed
    document.querySelectorAll(".record-btn").forEach(btn => {
      btn.innerText = "🎤 Record";
    });
  });

  // Attach record button events
  document.querySelectorAll(".record-btn").forEach(btn => {
    btn.addEventListener("mousedown", () => {
      btn.innerText = "🔴 Recording…";
      startRecording(btn.dataset.target);
    });

    // Mobile support
    btn.addEventListener("touchstart", () => {
      btn.innerText = "🔴 Recording…";
      startRecording(btn.dataset.target);
    });

    btn.addEventListener("touchend", () => {
      stopRecording();
      btn.innerText = "🎤 Record";
    });
  });

  // Initialize MediaRecorder
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (e) => {
      e.data.arrayBuffer().then(buffer => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        if (mediaRecorder.qid && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ audio: base64, qid: mediaRecorder.qid }));
        }
      });
    };
  });
});

// ------------------------------
// Step Navigation
// ------------------------------
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
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
};

// ------------------------------
// Start Analysis
// ------------------------------
window.startAnalysis = function () {
  document.getElementById("intro-page").style.display = "none";
  document.querySelector(".chat-container").style.display = "block";
  showStep(currentStep);
};

// ------------------------------
// Collect User Data & AI Analysis
// ------------------------------
function getUserData() {
  return {
    personal_information: {
      name: document.getElementById("name").value,
      age: parseInt(document.getElementById("age").value),
      gender: document.getElementById("gender").value,
      residence: document.getElementById("residence").value
    },
    cognitive_style: {
      decision_Making_Logic: document.getElementById("decision_Making_Logic").value,
      Decision_Making_Analysis: document.getElementById("Decision_Making_Analysis").value,
      locus_of_control: document.getElementById("locus_of_control").value,
      risk_tolerance: document.getElementById("risk_tolerance").value
    },
    emotion: {
      conflict_response: document.getElementById("conflict_response").value,
      trust_building: document.getElementById("trust_building").value,
      social_prefrence: document.getElementById("social_prefrence").value,
      anger_management: document.getElementById("anger_management").value
    },
    experience: {
      failure_handling: document.getElementById("failure_handling").value,
      learning_from_mistakes: document.getElementById("learning_from_mistakes").value,
      past_impact: document.getElementById("past_impact").value,
      adaptability: document.getElementById("adaptability").value
    },
    motivations: {
      life_goal: document.getElementById("life_goal").value,
      motivation_source: document.getElementById("motivation_source").value,
      success_definition: document.getElementById("success_definition").value,
      sacrifice_level: document.getElementById("sacrifice_level").value
    },
    background: {
      education_level: document.getElementById("education_level").value,
      profession_title: document.getElementById("profession_title").value,
      skill_set: document.getElementById("skill_set").value
    },
    social_status: {
      perceived_social_rank: document.getElementById("perceived_social_rank").value,
      community_recognition: document.getElementById("community_recognition").value,
      self_identification: document.getElementById("self_identification").value,
      social_influence: document.getElementById("social_influence").value
    }
  };
}

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
    document.getElementById("result-box").innerText = result.response || result.ai_result || "No response from AI.";
    document.getElementById("result-box").style.display = "block";
  } catch (err) {
    document.getElementById("result-box").innerText = "❌ Error contacting server.";
    document.getElementById("result-box").style.display = "block";
  } finally {
    document.getElementById("loading-indicator").style.display = "none";
  }
};

// ------------------------------
// Situation Prediction
// ------------------------------
window.predictBehavior = function () {
  document.getElementById("situation-input-box").style.display = "block";
  document.getElementById("situation-result-box").style.display = "none";
};

window.submitSituation = async function () {
  const situation = document.getElementById("situation-text").value.trim();
  if (!situation) {
    alert("Please describe a situation.");
    return;
  }

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

// ------------------------------
// Real-Time Voice Recording
// ------------------------------
window.startRecording = function(qid) {
  if (mediaRecorder && mediaRecorder.state === "inactive") {
    mediaRecorder.start(2000); // send chunks every 2s
    mediaRecorder.qid = qid;
  }
};

window.stopRecording = function() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
};
