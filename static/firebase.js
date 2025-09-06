/*
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCm2yhk8G-vCjOvLT1uDXDfu1lzhgWUfZQ",
  authDomain: "analysisbot-c6ea3.firebaseapp.com",
  projectId: "analysisbot-c6ea3",
};
 
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
 */


// ------------------------------
// Global Variables
// ------------------------------
let currentStep = 1;
let socket;
let mediaRecorder;

// ------------------------------
// Window onload: Initialize UI and WebSocket
// ------------------------------
window.onload = () => {
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
};

window.startAnalysis = function () {
  document.getElementById("intro-page").style.display = "none";
  document.querySelector(".chat-container").style.display = "block";
  showStep(currentStep);  
}

window.collectAndAnalyze = async function () {
  const userData = getUserData();
  const name = userData.personal_information.name;
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const userId = `user_${cleanName}`;

  document.getElementById("loading-indicator").style.display = "block";
  document.getElementById("result-box").style.display = "none";

    /* await setDoc(doc(db, "users", userId), userData); */

  const response = await fetch("/analyze_direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_data: userData })
  });

  const result = await response.json();

  document.getElementById("loading-indicator").style.display = "none";
  document.getElementById("result-box").innerText = result.response || result.ai_result || "No response from AI.";
  document.getElementById("result-box").style.display = "block";
};


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

let currentStep = 1;
function getUserData() {
  const name = document.getElementById("name").value;
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const residence = document.getElementById("residence").value;
  const decision_Making_Logic = document.getElementById("decision_Making_Logic").value;
  const Decision_Making_Analysis = document.getElementById("Decision_Making_Analysis").value;
  const locus_of_control = document.getElementById("locus_of_control").value;
  const risk_tolerance = document.getElementById("risk_tolerance").value;
  const conflict_response = document.getElementById("conflict_response").value;
  const trust_building = document.getElementById("trust_building").value;
  const social_prefrence = document.getElementById("social_prefrence").value;
  const anger_management = document.getElementById("anger_management").value;
  const failure_handling = document.getElementById("failure_handling").value;
  const learning_from_mistakes = document.getElementById("learning_from_mistakes").value;
  const past_impact = document.getElementById("past_impact").value;
  const adaptability = document.getElementById("adaptability").value;
  const life_goal = document.getElementById("life_goal").value;
  const motivation_source = document.getElementById("motivation_source").value;
  const success_definition = document.getElementById("success_definition").value;
  const sacrifice_level = document.getElementById("sacrifice_level").value;
  const education_level = document.getElementById("education_level").value;
  const profession_title = document.getElementById("profession_title").value;
  const skill_set = document.getElementById("skill_set").value;
  const wealth_status = document.getElementById("wealth_status").value;
  const perceived_social_rank = document.getElementById("perceived_social_rank").value;
  const community_recognition = document.getElementById("community_recognition").value;
  const self_identification = document.getElementById("self_identification").value;
  const social_influence = document.getElementById("social_influence").value;
      
  return {
    personal_information : { name, age, gender, residence },
    cognitive_style : { decision_Making_Logic, Decision_Making_Analysis, locus_of_control, risk_tolerance },
    emotion: { conflict_response, trust_building, social_prefrence, anger_management },
    experience:  { failure_handling, learning_from_mistakes, past_impact, adaptability },
    motivations: { life_goal, motivation_source, success_definition, sacrifice_level },
    background: { education_level, profession_title, skill_set},
    social_status: { perceived_social_rank, community_recognition, self_identification, social_influence},
  };
}


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
window.onload = () => showStep(currentStep);



// ------------------------------
// Real-Time Voice Recording & WebSocket
// ------------------------------

