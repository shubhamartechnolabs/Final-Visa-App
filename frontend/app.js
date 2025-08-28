document.addEventListener("DOMContentLoaded", () => {




  // MOBILE NAV TOGGLE
  // =========================
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  navToggle?.addEventListener('click', () => {
    if (!mobileNav) return;
    const isOpen = !mobileNav.classList.contains('hidden');
    mobileNav.classList.toggle('hidden');
    navToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close mobile nav when a tab is clicked
  document.querySelectorAll('#mobileNav .step-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (!mobileNav) return;
      mobileNav.classList.add('hidden');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("Clicked button:", btn.id);
    });
  });


  // =========================
  // PROXY MOBILE BUTTONS
  // =========================
  const proxyClick = (fromId, toId) => {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (!from || !to) return;

    from.addEventListener('click', (e) => {
      e.preventDefault();
      to.click();
    });
  };

  proxyClick('prevBtnMobile', 'prevBtn');
  proxyClick('nextBtnMobile', 'nextBtn');

  // =========================
  // STEP NAVIGATION
  // =========================
  const formData = new FormData();
  const tabs = document.querySelectorAll(".step-tab");
  const steps = document.querySelectorAll("#step1, #step2, #step3, #step4, #step5");

  let currentStep = 1;        // current step number (1–5)
  let internalIndex = 0;      // internal step index for current step

  // Return number of internal steps for given step
  function getInternalSteps(stepNumber) {
    if (stepNumber === 2) return 2; // Step 2 has 2 substeps
    return 0;                       // others = no internal steps
  }

  // Jump to a main step (reset internalIndex)
  function goToStep(step) {
    if (step < 1 || step > 5) return;

    currentStep = step;
    internalIndex = 0;
    updateTabsAndContent();
    updateInternalStepUI();
  }

  // =========================
  // NEXT BUTTON
  // =========================
  document.getElementById("nextBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const totalInternal = getInternalSteps(currentStep);

    // Run validation before moving
    if (!validateStep(currentStep, internalIndex)) return;

    console.log(currentStep, "currentStep", internalIndex, "internalIndex");

    if (totalInternal > 0 && internalIndex < totalInternal - 1) {
      // Still inside internal steps (e.g., Step 2 → substep 2)
      internalIndex++;
      updateInternalStepUI();

    } else {
      // Move to next main step
      goToStep(currentStep + 1);
    }

  });

  // =========================
  // PREV BUTTON
  // =========================
  document.getElementById("prevBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const totalInternal = getInternalSteps(currentStep);

    if (totalInternal > 0 && internalIndex > 0) {
      // Go back within internal steps
      internalIndex--;
      updateInternalStepUI();
    } else if (currentStep > 1) {
      // Move to previous main step
      goToStep(currentStep - 1);

      // If previous step has internal steps, go to its last substep
      const prevTotalInternal = getInternalSteps(currentStep);
      if (prevTotalInternal > 0) {
        internalIndex = prevTotalInternal - 1;
        updateInternalStepUI();
      }
    }
  });


  // =========================
  // INTERNAL STEP UI
  // =========================
  function updateInternalStepUI() {
    if (currentStep === 2) {
      const uploadGrid = document.getElementById("uploadGrid");
      const nextStep = document.getElementById("nextStep");

      if (internalIndex === 0) {
        uploadGrid?.classList.remove("hidden");
        nextStep?.classList.add("hidden");
      } else {
        uploadGrid?.classList.add("hidden");
        nextStep?.classList.remove("hidden");
      }

      // Update circle indicators
      const dots = document.querySelectorAll("#internalSteps .internal-step");
      dots.forEach((dot, i) => {
        if (i === internalIndex) {
          dot.classList.remove("bg-gray-200", "text-gray-500");
          dot.classList.add("bg-[#03139D]", "text-white");
        } else {
          dot.classList.add("bg-gray-200", "text-gray-500");
          dot.classList.remove("bg-[#03139D]", "text-white");
        }
      });

      document.getElementById("internalSteps")?.classList.remove("hidden");
    } else {
      document.getElementById("internalSteps")?.classList.add("hidden");
    }
  }

  // =========================
  // TAB CLICK HANDLER
  // =========================
  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const step = parseInt(tab.dataset.step);

      // block forward navigation if current step not validated
      if (step > currentStep && !validateStep(currentStep, internalIndex)) return;

      goToStep(step);
    });
  });

  // =========================
  // UPDATE TAB + CONTENT UI
  // =========================
  function updateTabsAndContent() {
    tabs.forEach(t => {
      t.classList.remove("border-[#03139D]", "font-medium");
      t.classList.add("border-transparent", "text-black", "font-normal");
    });

    steps.forEach(s => s.classList.add("hidden"));
    document.getElementById("step" + currentStep)?.classList.remove("hidden");

    const activeTab = document.querySelector(`.step-tab[data-step="${currentStep}"]`);
    activeTab?.classList.remove("border-transparent", "text-black", "font-normal");
    activeTab?.classList.add("border-[#03139D]", "font-medium");

    // Completed labels
    for (let i = 1; i <= 5; i++) {
      const status = document.getElementById("completed-status-" + i);
      if (i < currentStep) {
        status?.classList.remove("hidden");
      } else {
        status?.classList.add("hidden");
      }
    }
  }


  goToStep(1);



  // =========================
  // FILE UPLOAD LOGIC
  // =========================


  document.querySelectorAll(".upload-component").forEach(component => {
    const fileInput = component.querySelector(".file-input");
    const initialState = component.querySelector(".initial-state");
    const uploadedState = component.querySelector(".uploaded-state");
    const fileName = component.querySelector(".file-name");
    const fileSize = component.querySelector(".file-size");
    const fileLink = component.querySelector(".file-link");
    const deleteBtn = component.querySelector(".delete-btn");

    const key = fileInput?.name || fileInput?.id || `upload_${Date.now()}`;

    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      component?.classList.remove("border-red-500");
      component?.querySelector(".error-text")?.remove();

      if (file) {
        initialState?.classList.add("hidden");
        uploadedState?.classList.remove("hidden");
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
        if (fileLink) fileLink.href = URL.createObjectURL(file);
        formData.append(key, file);

      }
    });

    deleteBtn?.addEventListener("click", () => {
      uploadedState?.classList.add("hidden");
      initialState?.classList.remove("hidden");
      if (fileInput) fileInput.value = "";
      formData.delete(key);

    });
  });





  // =========================
  // MEDIA RECORDING LOGIC
  // =========================
  const cameraPreview = document.getElementById("cameraPreview");
  const previewVideo = document.getElementById("previewVideo");
  const pausarBtn = document.getElementById("Pausar");

  let mediaStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let videoBlob = null;
  let isPaused = false;
  let isvideoUplode = false



  // OPEN CAMERA MODAL
  document.getElementById("openModal")?.addEventListener("click", async () => {
    document.getElementById("videoError").style.display = "none";
    document.getElementById("modal-video-capture")?.classList.remove("hidden");

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (cameraPreview) {
        cameraPreview.srcObject = mediaStream;
        await cameraPreview.play();
      }
    } catch (err) {
      alert("Por favor, permite el acceso a tu cámara y micrófono.");
      console.error(err);
    }
  });

  // STOP STREAM FUNCTION
  function stopStream() {
    console.log("stopStream");
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
      mediaStream = null;
    }
  }

  // RECORDING HANDLER
  document.querySelector(".open-recording-preview-modal")?.addEventListener("click", () => {
    if (!mediaStream) return alert("La cámara no está lista.");

    recordedChunks = [];
    let recordingTime = 30;
    const recordingStatus = document.getElementById("recordingStatus");
    const recordingTimer = document.getElementById("recordingTimer");
    recordingStatus?.classList.remove("hidden");

    const timerInterval = setInterval(() => {
      recordingTime--;
      const minutes = String(Math.floor(recordingTime / 60)).padStart(2, "0");
      const seconds = String(recordingTime % 60).padStart(2, "0");
      if (recordingTimer) recordingTimer.textContent = `${minutes}:${seconds}`;
      if (recordingTime <= 0) stopRecording(timerInterval);
      if (recordingTime <= 0) stopStream();
    }, 1000);

    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = (e) => e.data.size > 0 && recordedChunks.push(e.data);
    mediaRecorder.onstop = () => {
      clearInterval(timerInterval);
      recordingStatus?.classList.add("hidden");
      videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      window.videoBlob = videoBlob;
      if (previewVideo) previewVideo.src = URL.createObjectURL(videoBlob);
    };

    mediaRecorder.start();
  });

  function stopRecording(timerInterval) {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      document.getElementById("modal-video-capture")?.classList.add("hidden");
      document.getElementById("modal-recording-preview")?.classList.remove("hidden");
    }
  }

  // PAUSE / RESUME
  // PAUSE / RESUME recorded video (after recording)
  pausarBtn?.addEventListener("click", () => {
    if (!previewVideo) return;

    if (previewVideo.paused) {
      previewVideo.play();
      pausarBtn.innerText = "⏸️ Pausar";
    } else {
      previewVideo.pause();
      pausarBtn.innerText = "▶️ Reproducir";
    }
  });


  // UPDATE VIDEO TIMER
  const recordedVideoTimer = document.getElementById("recordedVideoTimer");
  previewVideo?.addEventListener("timeupdate", () => {
    const minutes = String(Math.floor(previewVideo.currentTime / 60)).padStart(2, "0");
    const seconds = String(Math.floor(previewVideo.currentTime % 60)).padStart(2, "0");
    if (recordedVideoTimer) recordedVideoTimer.textContent = `${minutes}:${seconds}`;
  });
  previewVideo?.addEventListener("loadedmetadata", () => {
    if (recordedVideoTimer) recordedVideoTimer.textContent = "00:00";
    pausarBtn && (pausarBtn.innerText = "▶️ Reproducir");
  });



  const eliminarBtn = document.getElementById("Eliminar");
  const finalizarBtn = document.querySelector(".open-upload-progress-modal");

  // 🗑️ Eliminar logic
  eliminarBtn?.addEventListener("click", () => {
    if (previewVideo) {
      previewVideo.pause();
      previewVideo.removeAttribute("src");
      previewVideo.load();
    }
    videoBlob = null;
    recordedChunks = [];

    // Close preview modal, reopen camera modal
    document.getElementById("modal-recording-preview")?.classList.add("hidden");
    // document.getElementById("modal-video-capture")?.classList.remove("hidden");


  });
  // ✅ Finalizar grabación logic
  let uploadInterval;


  finalizarBtn?.addEventListener("click", () => {
    if (!videoBlob) {
      alert("No hay grabación para finalizar.");
      return;
    }

    console.log(videoBlob, "videoblob");

    // Hide preview modal → show upload progress modal
    document.getElementById("modal-recording-preview")?.classList.add("hidden");
    document.getElementById("modal-upload-progress")?.classList.remove("hidden");

    // Create FormData



    formData.append("video", videoBlob, "recording.webm");
    console.log("Uploading video...", [...formData.entries()]);


    // Fake upload simulation (progress bar)
    const progressBar = document.getElementById("upload-progress-bar");
    const progressText = document.getElementById("upload-progress-text");
    let progress = 0;

    uploadInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 1;
      if (progress > 100) progress = 100;

      // Update bar + percentage text
      if (progressBar) progressBar.style.width = progress + "%";
      if (progressText) progressText.textContent = progress + "%";

      if (progress >= 100) {
        clearInterval(uploadInterval);
        console.log("Fake upload complete ✅");

        // Change title
        const title = document.querySelector("#modal-upload-progress h2");
        if (title) title.textContent = "Grabación subida con éxito";

        // Hide progress modal → show final modal
        document.getElementById("modal-upload-progress")?.classList.add("hidden");
        document.getElementById("modal-upload-final")?.classList.remove("hidden");
      }
    }, 200); // update every 200ms
  });



  document.querySelector(".open-modal-upload-final")?.addEventListener("click", () => {
    clearInterval(uploadInterval);

    // Reset progress
    const progressBar = document.getElementById("upload-progress-bar");
    const progressText = document.getElementById("upload-progress-text");
    if (progressBar) progressBar.style.width = "0%";
    if (progressText) progressText.textContent = "0%";

    // Hide upload modal
    document.getElementById("modal-upload-progress")?.classList.add("hidden");

    // Optionally re-open preview modal
    document.getElementById("modal-recording-preview")?.classList.remove("hidden");

    console.log("Upload canceled and video deleted ❌");
  });

  const saveAndExitBtn = document.getElementById("saveandexit");

  saveAndExitBtn?.addEventListener("click", () => {
    console.log("Guardar y salir clicked ✅");

    // Hide preview modal
    document.getElementById("modal-upload-final")?.classList.add("hidden");

    isvideoUplode = true

  });







  // =========================
  // PAYMENT LOGIC
  // =========================

  document.getElementById("payBtn")?.addEventListener("click", (e) => {
    e.preventDefault()
    // Hide payment section
    //document.getElementById("payment-section")?.classList.add("hidden");

    // Show confirmation section
    //document.getElementById("step-4-confirmation-section")?.classList.remove("hidden");











    console.log("payBtn clicked");
    console.log("formData before save:", [...formData.entries()]);

    // Debug log: check everything in formData



    saveDataBackend(e)
  });







  // =========================
  //  SEND DATA BACKEND LOGIC
  // =========================






  const saveDataBackend = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/userinfo", {
        method: "POST",
        body: formData,
      });

      if (!response) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log("✅ Upload successful:", result);

      if (result.checkoutUrl) {
        // ✅ Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        alert("Failed to create checkout session");
      }



    } catch (error) {
      console.error("❌ Error uploading:", error);
      alert("Upload failed. Check console for details.");
    }
  };



  const params = new URLSearchParams(window.location.search);

  const session_id = params.get("session_id") || null;
  const country = params.get("country") || "N/A";
  const visaType = params.get("visaType") || "N/A";




  if (session_id) {


    // 🚦 Redirect to index.html if user reloads/revisits
    if (sessionStorage.getItem("visited") == "true") {
      window.location.href = "http://127.0.0.1:5501/simulator.html"; // change if needed
      sessionStorage.setItem("visited", "false");
    } else {
      sessionStorage.setItem("visited", "true");

      (async () => {
        goToStep(5);

        document.getElementById("nextBtn")?.classList.add("hidden");
        document.getElementById("prevBtn")?.classList.add("hidden");

        try {
          const response = await fetch("http://localhost:5000/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId: session_id,
              country: country,
              visaType: visaType,
            }),
          });

          const data = await response.json();
          console.log("✅ Response:", data);

          const { result: gptAnalysis } = data;

          // ✅ Correct IDs
          document.getElementById("loadingsection")?.classList.add("hidden");
          document.getElementById("finalData")?.classList.remove("hidden");

          console.log(gptAnalysis, "gptAnalysis");

          // Evaluation
          document.getElementById("decision").textContent =
            gptAnalysis?.schema_a?.decision || "-";

          // Extract probability as a number
          let probability = 0;
          const probText = gptAnalysis?.schema_a?.probability || "";

          if (probText) {
            // Remove any % sign and convert to number
            probability = parseFloat(probText.replace("%", ""));
          }

          // Display probability
          document.getElementById("probability").textContent = isNaN(probability)
            ? "-"
            : probability;

          // Show/hide approval buttons
          const btnApproved = document.getElementById("btn-approved");
          const btnDenied = document.getElementById("btn-denied");

          if (!isNaN(probability)) {
            if (probability >= 75) {
              btnApproved?.classList.remove("hidden");
              btnDenied?.classList.add("hidden");
            } else {
              btnDenied?.classList.remove("hidden");
              btnApproved?.classList.add("hidden");
            }
          } else {
            // Hide both if probability is invalid
            btnApproved?.classList.add("hidden");
            btnDenied?.classList.add("hidden");
          }
        } catch (error) {
          console.error("❌ Error fetching checkout session:", error);
        }
      })();
    }
  }










  // =========================
  //  LOGIC
  // =========================










  const btnApproved = document.getElementById("btn-approved");
  const btnDenied = document.getElementById("btn-denied");

  console.log(btnDenied, "btnDenied");

  const sectionToHide = document.getElementById("hide-step-05-in1");
  const resultSuccess = document.getElementById("step-5-success-result");
  const resultFailed = document.getElementById("step-5-failed-result");
  const StartApp = document.getElementById("StartApp");
  const StartAppEnd = document.getElementById("StartAppEnd");

  console.log(StartAppEnd, "StartAppEnd");


  // Hide all sections initially
  resultSuccess.style.display = "none";
  resultFailed.style.display = "none";

  StartApp.addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:5501/simulator.html"
  })

  StartAppEnd.addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:5501/simulator.html"
  })
  btnApproved.addEventListener("click", () => {
    console.log("Hello");
    sectionToHide.style.display = "none";
    resultSuccess.style.display = "block";
    resultFailed.style.display = "none";
  });

  btnDenied.addEventListener("click", () => {
    sectionToHide.style.display = "none";
    resultFailed.style.display = "block";
    resultSuccess.style.display = "none";
  });

  const btnsuccesspanel = document.getElementById("btn-success-panel");
  const btndeniedpanel = document.getElementById("btn-denied-panel");

  const step5successpanel = document.getElementById("step-5-success-panel");
  const step5deniedpanel = document.getElementById("step-5-denied-panel");
  const closestep5successpanel = document.getElementById(
    "close-step-5-success-panel"
  );
  const closestep5deniedpanel = document.getElementById(
    "close-step-5-denied-panel"
  );

  btnsuccesspanel.addEventListener("click", () => {
    step5successpanel.style.display = "block";
  });

  btndeniedpanel.addEventListener("click", () => {
    step5deniedpanel.style.display = "block";
    console.log("hello");
  });

  closestep5successpanel.addEventListener("click", () => {
    step5successpanel.style.display = "none";
  });

  closestep5deniedpanel.addEventListener("click", () => {
    step5deniedpanel.style.display = "none";
  });













  // =========================
  // VALIDATION LOGIC
  // =========================
  function validateStep(stepNumber, internalIndex = 0) {
    console.log(formData, "formData");
    let isValid = true;
    switch (stepNumber) {

      case 1: {
        const countrySelect = document.getElementById("countrySelect");
        const visaTypeSelect = document.getElementById("visaTypeSelect");


        [countrySelect, visaTypeSelect].forEach(el => {
          el?.classList.remove("border-red-500");
          el?.nextElementSibling?.classList.contains("error-text") && el.nextElementSibling.remove();
        });

        if (!countrySelect?.value.trim()) {
          countrySelect?.classList.add("border-red-500");
          countrySelect?.insertAdjacentHTML(
            "afterend",
            `<p class="error-text text-red-500 text-xs mt-1">Please select a country.</p>`
          );
          isValid = false;
        }

        if (!visaTypeSelect?.value.trim()) {
          visaTypeSelect?.classList.add("border-red-500");
          visaTypeSelect?.insertAdjacentHTML(
            "afterend",
            `<p class="error-text text-red-500 text-xs mt-1">Please select a visa type.</p>`
          );
          isValid = false;
        }

        if (isValid) {
          formData.append("country", countrySelect.value.trim());
          formData.append("visaType", visaTypeSelect.value.trim());

        }
        return isValid;
      }

      case 2: {
        const allowedExtensions = ["jpg", "jpeg", "png", "doc", "docx", "pdf"];
        const maxFileSize = 25 * 1024 * 1024; // 25MB

        const requiredFiles =
          internalIndex === 0
            ? ["ds160Form", "visaFeeReceipt", "passport", "recentPhoto"]
            : ["travelItinerary", "employerLetter", "proofOfAccommodation", "proofOfFinancialMeans"];

        requiredFiles.forEach(key => {
          const input = document.querySelector(`.upload-component .file-input[name="${key}"]`);
          const component = input?.closest(".upload-component");
          const initialState = component?.querySelector(".initial-state");
          const uploadedState = component?.querySelector(".uploaded-state");

          // 🧹 Clear old error states
          component?.classList.remove("border-red-500");
          component?.querySelectorAll(".error-text").forEach(err => err.remove());

          const file = formData.get(key);

          // 🔴 Check if file exists
          if (!file || !(file instanceof File || file instanceof Blob)) {
            component?.classList.add("border-red-500");
            initialState?.insertAdjacentHTML(
              "beforeend",
              `<p class="error-text text-red-500 text-xs mt-1">This file is required.</p>`
            );
            isValid = false;
            return; // Skip further checks for this file
          }

          // ✅ Extension validation
          const ext = file.name.split(".").pop().toLowerCase();
          if (!allowedExtensions.includes(ext)) {
            component?.classList.add("border-red-500");
            uploadedState?.insertAdjacentHTML(
              "beforeend",
              `<p class="error-text text-red-500 text-xs mt-1">Invalid format. Allowed: JPG, JPEG, PNG, DOC, DOCX, PDF.</p>`
            );
            isValid = false;
          }

          // ✅ Size validation
          if (file.size > maxFileSize) {
            component?.classList.add("border-red-500");
            uploadedState?.insertAdjacentHTML(
              "beforeend",
              `<p class="error-text text-red-500 text-xs mt-1">File size must be ≤ 25MB.</p>`
            );
            isValid = false;
          }
        });

        return isValid;
      }

      case 3: {
        if (formData.has("video") && (formData.get("video") instanceof File || formData.get("video") instanceof Blob)) {
          // Hide error if video exists
          document.getElementById("videoError").style.display = "none";
          return isValid;
        }

        // ❌ No video uploaded → show error
        document.getElementById("videoError").style.display = "block";
        isValid = false;
        return isValid;
      }


      case 4: {
        // ✅ Check if status field exists
        if (formData.has("status") && formData.get("status")) {

          return isValid;
        }

        isValid = false;
        return isValid;
      }




      default:
        return true;
    }
  }










});



