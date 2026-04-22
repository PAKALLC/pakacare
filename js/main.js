/* global emailjs, EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CARE, EMAILJS_TEMPLATE_CONTACT */

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function toast(message, type="success"){
    let area = $(".toast-area");
    if(!area){
      area = document.createElement("div");
      area.className = "toast-area";
      document.body.appendChild(area);
    }
    const el = document.createElement("div");
    el.className = `toast-msg ${type}`;
    el.textContent = message;
    area.appendChild(el);
    setTimeout(()=> el.remove(), 4200);
  }

  function setActiveNav(){
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".navbar .nav-link").forEach(a=>{
      const href = (a.getAttribute("href")||"").toLowerCase();
      if(href === path) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function initEmailJS(){
    try{
      if(typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY"){
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      }
    }catch(e){}
  }

  // ---------- Validation ----------
  function isValidEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
  }

  // US 10-digit phone (allow separators)
  function isValidPhone(phone){
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10;
  }

  function formatUSPhone(phone){
    const d = phone.replace(/\D/g, "");
    if(d.length !== 10) return phone;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }

  // ---------- Smooth scroll + wizard pulse (Request Care button) ----------
  function initRequestCareScroll(){
  // 1) If user came from another page, highlight wizard on load (NO scrolling)
  const params = new URLSearchParams(window.location.search);
  if(params.get("request") === "care"){
    const wizard = document.getElementById("careWizard");
    if(wizard){
      wizard.classList.remove("pulse");
      void wizard.offsetWidth;
      wizard.classList.add("pulse");
      // Optional: focus the first input so user can start typing immediately
      const loc = document.getElementById("careLocation");
      if(loc) loc.focus();
    }
    // clean URL (remove ?request=care)
    params.delete("request");
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", newUrl);
  }

  // 2) Handle ALL request-care clicks (NO jumping, NO scrolling)
  document.addEventListener("click", (e)=>{
    const trigger = e.target.closest(".btn-request-care, a[href='#request-care']");
    if(!trigger) return;

    // Stop default anchor behavior (this is the main fix)
    e.preventDefault();

    const currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    // If not on home page, go home WITHOUT #hash and auto-highlight there
    if(currentPage !== "index.html"){
      window.location.href = "index.html?request=care";
      return;
    }

    // If on home page: highlight wizard only, keep scroll position
    const wizard = document.getElementById("careWizard");
    if(wizard){
      wizard.classList.remove("pulse");
      void wizard.offsetWidth;
      wizard.classList.add("pulse");
      const loc = document.getElementById("careLocation");
      if(loc) loc.focus();
    }
  });
}

  // ---------- Make service cards clickable ----------
  function initServiceCardsClickable(){
    $$(".service-clickable").forEach(card=>{
      card.addEventListener("click", (e)=>{
        const target = e.target;
        if(target.closest("a") || target.closest("button")) return;
        const href = card.getAttribute("data-href");
        if(href) window.location.href = href;
      });
    });
  }

  // ---------- Wizard (FIXED NEXT BUTTON) ----------
  function initWizard(){
    const wizard = $("#careWizard");
    if(!wizard) return;

    const dots = $$(".dot", wizard);
    const steps = $$(".wizard-step", wizard);

    const state = {
      location: "",
      careType: "",            // homecare | afcr | other
      otherDescription: "",
      hoursPerWeek: "",
      startWhen: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    };

    let current = 0;

    const careLocation = $("#careLocation");
    const otherBox = $("#otherBox");
    const otherDescription = $("#otherDescription");
    const hoursPerWeek = $("#hoursPerWeek");
    const startWhenHome = $("#startWhenHome");
    const startWhenAfcr = $("#startWhenAfcr");
    const firstName = $("#firstName");
    const lastName = $("#lastName");
    const email = $("#email");
    const phone = $("#phone");

    const blockHours = $("#blockHours");
    const blockAfcrStart = $("#blockAfcrStart");

    function showStep(i){
      current = i;
      steps.forEach((s, idx)=> s.classList.toggle("d-none", idx !== i));
      dots.forEach((d, idx)=> d.classList.toggle("active", idx <= i));
      updateButtons();
    }

    function updateButtons(){
      const step = steps[current];

      const backBtn = $(".btn-back", step);
      const nextBtn = $(".btn-next", step);
      const submitBtn = $(".btn-submit", step);

      if(backBtn) backBtn.disabled = false;

      if(nextBtn) nextBtn.disabled = !canGoNext();
      if(submitBtn) submitBtn.disabled = !canSubmit();
    }

    function canGoNext(){
      if(current === 0){
        return (careLocation.value || "").trim().length >= 3;
      }
      if(current === 1){
         if(!state.careType) return false;

         // If "Other service or unsure" selected, require description BEFORE Next
         if(state.careType === "other"){
          const desc = (otherDescription.value || "").trim();
          return desc.length > 0;
          }

      return true;
      }
      if(current === 2){
        if(state.careType === "homecare"){
          return !!hoursPerWeek.value;
        }
        if(state.careType === "afcr"){
          return !!startWhenAfcr.value;
        }
        if(state.careType === "other"){
          // Require description before allowing Next
          const desc = (otherDescription.value || "").trim();
          return desc.length > 0;
        }
      }
      if(current === 3){
        // only homecare uses step 3
        return !!startWhenHome.value;
      }
      return true;
    }

    function canSubmit(){
      const fn = (firstName.value || "").trim();
      const ln = (lastName.value || "").trim();
      const em = (email.value || "").trim();
      const ph = (phone.value || "").trim();

      if(!fn || !ln || !em || !ph) return false;
      if(!isValidEmail(em)) return false;
      if(!isValidPhone(ph)) return false;

      return true;
    }

    function syncCareTypeUI(){
      if(state.careType === "other"){
        otherBox.classList.remove("d-none");
      }else{
        otherBox.classList.add("d-none");
        otherDescription.value = "";
        state.otherDescription = "";
      }

      // show correct content in step 2 (dynamic)
      if(state.careType === "homecare"){
        blockHours.classList.remove("d-none");
        blockAfcrStart.classList.add("d-none");
      }else if(state.careType === "afcr"){
        blockHours.classList.add("d-none");
        blockAfcrStart.classList.remove("d-none");
      }else{
        blockHours.classList.add("d-none");
        blockAfcrStart.classList.add("d-none");
      }
    }

    // Care type selection
    $$(".option-card[data-care]", wizard).forEach(card=>{
      card.addEventListener("click", ()=>{
        $$(".option-card[data-care]", wizard).forEach(c=>c.classList.remove("selected"));
        card.classList.add("selected");
        state.careType = card.getAttribute("data-care");

        // reset conditional values
        hoursPerWeek.value = "";
        startWhenHome.value = "";
        startWhenAfcr.value = "";
        state.hoursPerWeek = "";
        state.startWhen = "";

        syncCareTypeUI();
        updateButtons();
      });
    });

    // Inputs update
    careLocation.addEventListener("input", updateButtons);
    otherDescription.addEventListener("input", ()=>{
      state.otherDescription = otherDescription.value.slice(0, 500);
      if(otherDescription.value.length > 500) otherDescription.value = state.otherDescription;
        updateButtons();
    });
    hoursPerWeek.addEventListener("change", updateButtons);
    startWhenHome.addEventListener("change", updateButtons);
    startWhenAfcr.addEventListener("change", updateButtons);

    [firstName,lastName,email,phone].forEach(el=>{
      el.addEventListener("input", ()=>{
        if(el === phone){
          // keep user typing but validate on submit; format on blur:
        }
        updateButtons();
      });
    });

    phone.addEventListener("blur", ()=>{
      if(isValidPhone(phone.value)){
        phone.value = formatUSPhone(phone.value);
      }
    });

    // Navigation between steps
    function nextStep(){
      if(current === 0){
        state.location = (careLocation.value || "").trim();
        showStep(1);
        return;
      }
      if(current === 1){
        if(state.careType === "homecare"){
          showStep(2);
          syncCareTypeUI();
          return;
        }
        if(state.careType === "afcr"){
          showStep(2);
          syncCareTypeUI();
          return;
        }
        if(state.careType === "other"){
          showStep(4);
          return;
        }
      }
      if(current === 2){
        if(state.careType === "homecare"){
          state.hoursPerWeek = hoursPerWeek.value;
          showStep(3);
          return;
        }
        if(state.careType === "afcr"){
          state.startWhen = startWhenAfcr.value;
          showStep(4);
          return;
        }
        if(state.careType === "other"){
          showStep(4);
          return;
        }
      }
      if(current === 3){
        state.startWhen = startWhenHome.value;
        showStep(4);
      }
    }

    function prevStep(){
      if(current === 4){
        if(state.careType === "other") { showStep(1); return; }
        if(state.careType === "afcr") { showStep(2); syncCareTypeUI(); return; }
        if(state.careType === "homecare") { showStep(3); return; }
      }
      if(current === 3){ showStep(2); syncCareTypeUI(); return; }
      if(current === 2){ showStep(1); return; }
      if(current === 1){ showStep(0); return; }
    }

    // Attach handlers to buttons in each step using classes (NO duplicate IDs now)
    steps.forEach(step=>{
      const nextBtn = $(".btn-next", step);
      const backBtn = $(".btn-back", step);
      const submitBtn = $(".btn-submit", step);

      if(nextBtn){
        nextBtn.addEventListener("click", ()=>{
          if(!canGoNext()){
            toast("Please complete the required selection to continue.", "error");
            return;
          }
          nextStep();
          updateButtons();
        });
      }
      if(backBtn){
        backBtn.addEventListener("click", ()=>{
          prevStep();
          updateButtons();
        });
      }
      if(submitBtn){
        submitBtn.addEventListener("click", async ()=>{
          if(!canSubmit()){
            toast("Please enter a valid email and a 10-digit phone number.", "error");
            return;
          }

          state.firstName = firstName.value.trim();
          state.lastName  = lastName.value.trim();
          state.email     = email.value.trim();
          state.phone     = formatUSPhone(phone.value.trim());

          const careTypeLabel =
            state.careType === "homecare" ? "Home care" :
            state.careType === "afcr" ? "AFCR / Shared Living" :
            "Other / Unsure";

          // if afcr, start is from startWhenAfcr; if homecare from startWhenHome
          if(state.careType === "afcr") state.startWhen = startWhenAfcr.value || "N/A";
          if(state.careType === "homecare") state.startWhen = startWhenHome.value || "N/A";

          const payload = {
            town_city_state: state.location,
            care_type: careTypeLabel,
            care_type_subject: careTypeLabel.replaceAll("/", "-"),
            other_description: (state.careType === "other" ? (state.otherDescription || "N/A") : "N/A"),
            hours_per_week: (state.careType === "homecare" ? (state.hoursPerWeek || "N/A") : "N/A"),
            start_when: state.startWhen || "N/A",
            first_name: state.firstName,
            last_name: state.lastName,
            email: state.email,
            phone: state.phone,
            source: "PAKA Website - Request Care"
          };

          try{
            if(typeof emailjs === "undefined"){
              toast("Email service not loaded. Please try again.", "error");
              return;
            }
            if(EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"){
              toast("Please set EmailJS keys in js/emailjs-config.js", "error");
              return;
            }

            submitBtn.disabled = true;
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CARE, payload);

            toast("We received your information. Our team will contact you as soon as possible.", "success");

            // reset
            $("#careWizardForm").reset();
            state.location = "";
            state.careType = "";
            state.otherDescription = "";
            state.hoursPerWeek = "";
            state.startWhen = "";

            $$(".option-card[data-care]", wizard).forEach(c=>c.classList.remove("selected"));
            otherBox.classList.add("d-none");
            syncCareTypeUI();

            showStep(0);
          }catch(e){
            toast("There is a problem with form submission. Please send an email to pakahomecare@gmail.com with your information, and we will contact you as soon as possible.", "error");
          }finally{
            submitBtn.disabled = false;
            updateButtons();
          }
        });
      }
    });

    // initial
    syncCareTypeUI();
    showStep(0);
  }

  // ---------- Contact Form (Validation + messages + placeholders) ----------
  function initContactForm(){
    const form = $("#contactForm");
    if(!form) return;

    const status = $("#contactStatus");
    const btn = $("#contactSubmit");
    const phone = $("#cPhone");
    const email = $("#cEmail");

    phone.addEventListener("blur", ()=>{
      if(isValidPhone(phone.value)){
        phone.value = formatUSPhone(phone.value);
      }
    });

    form.addEventListener("submit", async (e)=>{
      e.preventDefault();

      const first = ($("#cFirstName").value || "").trim();
      const last  = ($("#cLastName").value || "").trim();
      const ph    = (phone.value || "").trim();
      const em    = (email.value || "").trim();
      const subj  = ($("#cSubject").value || "").trim();
      const desc  = ($("#cDescription").value || "").trim().slice(0, 500);

      if(!first || !last || !ph || !em || !subj || !desc){
        status.textContent = "Please fill all fields.";
        toast("Please fill all fields.", "error");
        return;
      }
      if(!isValidEmail(em)){
        status.textContent = "Please enter a valid email address.";
        toast("Please enter a valid email address.", "error");
        return;
      }
      if(!isValidPhone(ph)){
        status.textContent = "Please enter a valid 10-digit phone number.";
        toast("Please enter a valid 10-digit phone number.", "error");
        return;
      }

      const payload = {
        first_name: first,
        last_name: last,
        phone: formatUSPhone(ph),
        email: em,
        subject: subj,
        description: desc,
        source: "PAKA Website - Contact"
      };

      try{
        if(typeof emailjs === "undefined"){
          status.textContent = "Email service not loaded. Please try again.";
          toast("Email service not loaded.", "error");
          return;
        }
        if(EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"){
          status.textContent = "EmailJS is not configured yet.";
          toast("Please set EmailJS keys in js/emailjs-config.js", "error");
          return;
        }

        btn.disabled = true;
        status.textContent = "Sending...";
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CONTACT, payload);

        status.textContent = "We received your information. Our team will contact you as soon as possible.";
        toast("We received your information. Our team will contact you as soon as possible.", "success");
        form.reset();
      }catch(err){
        status.textContent = "There is a problem with form submission. Please send an email to pakahomecare@gmail.com with your information, and we will contact you as soon as possible.";
        toast("There is a problem with form submission. Please send an email to pakahomecare@gmail.com with your information, and we will contact you as soon as possible.", "error");
      }finally{
        btn.disabled = false;
      }
    });
  }

  // ---------- Services filter ----------
  function initServicesFilter(){
    const filter = $("#serviceFilter");
    if(!filter) return;

    const cards = $$(".service-item");
    filter.addEventListener("change", ()=>{
      const val = filter.value;
      cards.forEach(c=>{
        const type = c.getAttribute("data-type");
        c.classList.toggle("d-none", (val !== "all" && type !== val));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    setActiveNav();
    initEmailJS();
    initRequestCareScroll();
    initWizard();
    initContactForm();
    initServicesFilter();
    initServiceCardsClickable();
  });
})();