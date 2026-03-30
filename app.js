import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let selectedRole = "Volunteer";

window.selectRole = (role) => {
  selectedRole = role;
  document.querySelectorAll(".role").forEach(r => r.classList.remove("active"));
  event.currentTarget.classList.add("active");
};

window.goStep2 = () => {
  document.getElementById("step1").style.display = "none";
  document.getElementById("step2").style.display = "block";
  document.getElementById("step2Dot").classList.add("active");
};

window.backStep = () => {
  document.getElementById("step2").style.display = "none";
  document.getElementById("step1").style.display = "block";
};

window.signup = async () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const location = document.getElementById("location").value;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCred.user.uid), {
      name,
      email,
      role: selectedRole,
      location,
      points: 0,
      createdAt: new Date()
    });

    alert("Account created successfully!");
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
};
