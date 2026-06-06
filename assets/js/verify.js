$(document).ready(function () {

  /* =========================
     MESSAGE DISPLAY
  ========================= */
  function showMessage(message, type = "error") {
    const box = $("#otpMessage");

    box.removeClass("hidden");
    box.removeClass("bg-red-100 text-red-600 bg-green-100 text-green-600");

    if (type === "success") {
      box.addClass("bg-green-100 text-green-600");
    } else {
      box.addClass("bg-red-100 text-red-600");
    }

    box.text(message);
  }


  /* =========================
     OTP INPUT HANDLING
  ========================= */
  const $otpInputs = $(".otp-input");

  $otpInputs.on("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");

    if (this.value.length === 1) {
      $(this).next(".otp-input").focus();
    }
  });

  $otpInputs.on("keydown", function (e) {
    if (e.key === "Backspace" && this.value === "") {
      $(this).prev(".otp-input").focus();
    }
  });


  /* =========================
     COUNTDOWN TIMER
  ========================= */
  let totalSeconds = 116;
  let timerId = null;

  function updateCountdown() {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    $("#countdown").text(`${minutes}:${seconds}`);

    if (totalSeconds > 0) {
      totalSeconds--;
    } else if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  updateCountdown();
  timerId = setInterval(updateCountdown, 1000);


  /* =========================
     RESEND OTP
  ========================= */
  $("#resendOtp").on("click", function (e) {
    e.preventDefault();

    totalSeconds = 116;

    if (timerId) {
      clearInterval(timerId);
    }

    updateCountdown();
    timerId = setInterval(updateCountdown, 1000);

    showMessage("OTP resent successfully", "success");
  });


  /* =========================
     VERIFY OTP FUNCTION
  ========================= */
  async function verifyOTP() {
    const userId = sessionStorage.getItem("user_id");

    if (!userId) {
      showMessage("Session expired. Please login again.");
      return;
    }

    // collect OTP
    let otp = "";
    $otpInputs.each(function () {
      otp += $(this).val();
    });

    if (otp.length !== 6) {
      showMessage("Please enter complete OTP");
      return;
    }

    try {
      const response = await fetch(
        "https://apialongcom-2arld62n.on-forge.com/api/admin/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            otp: otp
          })
        }
      );

      const data = await response.json();

      console.log("VERIFY RESPONSE:", data);

      // ❌ ERROR
      if (!response.ok || !data.success) {
        showMessage(data.message || "Invalid OTP", "error");

        $otpInputs.val("");
        $otpInputs.first().focus();
        return;
      }

     // SUCCESS
showMessage(data.message || "Verification successful", "success");

if (data.data && data.data.token) {
  sessionStorage.setItem("auth_token", data.data.token);
}

if (data.data && data.data.user) {
  sessionStorage.setItem("admin_user", JSON.stringify(data.data.user));
}

setTimeout(() => {
  window.location.href = "dashboard.html";
}, 1000);

    } catch (error) {
      console.error(error);
      showMessage("Network error. Try again.");
    }
  }


  /* =========================
     AUTO SUBMIT WHEN COMPLETE
  ========================= */
  $otpInputs.on("input", function () {
    let otp = "";
    $otpInputs.each(function () {
      otp += $(this).val();
    });

    if (otp.length === 6) {
      verifyOTP();
    }
  });

});