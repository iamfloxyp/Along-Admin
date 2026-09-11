$(document).ready(function () {

  /* =========================
     MESSAGE DISPLAY
  ========================= */
  function showMessage(message, type = "error") {
    const box = $("#otpMessage");

    box.removeClass("hidden");
    box.removeClass(
      "bg-red-100 text-red-600 bg-green-100 text-green-600"
    );

    if (type === "success") {
      box.addClass(
        "bg-green-100 text-green-600"
      );
    } else {
      box.addClass(
        "bg-red-100 text-red-600"
      );
    }

    box.text(message);
  }


  /* =========================
     OTP INPUTS
  ========================= */
  const otpInputs =
    Array.from(
      document.querySelectorAll(".otp-input")
    );

  const $otpInputs =
    $(".otp-input");

  let isFillingOtp = false;

  let isVerifyingOtp = false;


  /* =========================
     FILL OTP INTO ALL BOXES
  ========================= */
  function fillOtpBoxes(value) {

    const digits =
      String(value || "")
        .replace(/\D/g, "")
        .slice(0, 6);

    console.log(
      "OTP DETECTED:",
      digits
    );

    if (!digits) {
      return;
    }


    isFillingOtp = true;


    otpInputs.forEach(
      function (input, index) {

        input.value =
          digits[index] || "";

      }
    );


    isFillingOtp = false;


    if (
      digits.length === 6
    ) {

      otpInputs[5].focus();

      verifyOTP();

    } else {

      const nextIndex =
        Math.min(
          digits.length,
          otpInputs.length - 1
        );

      otpInputs[nextIndex].focus();
    }
  }


  /* =========================
     STRONG PASTE HANDLER
  ========================= */
  document.addEventListener(
    "paste",
    async function (event) {

      const target =
        event.target;


      if (
        !target ||
        !target.classList.contains("otp-input")
      ) {
        return;
      }


      event.preventDefault();
      event.stopPropagation();


      let pastedValue = "";


      /* =========================
         NORMAL CLIPBOARD DATA
      ========================= */
      if (
        event.clipboardData
      ) {

        pastedValue =
          event.clipboardData.getData(
            "text/plain"
          ) ||
          event.clipboardData.getData(
            "text"
          );
      }


      console.log(
        "PASTE EVENT VALUE:",
        pastedValue
      );


      const cleanedValue =
        String(pastedValue || "")
          .replace(/\D/g, "")
          .slice(0, 6);


      /* =========================
         FULL VALUE FOUND
      ========================= */
      if (
        cleanedValue.length > 1
      ) {

        fillOtpBoxes(
          cleanedValue
        );

        return;
      }


      /* =========================
         CLIPBOARD API FALLBACK
      ========================= */
      try {

        if (
          navigator.clipboard &&
          navigator.clipboard.readText
        ) {

          const clipboardText =
            await navigator.clipboard.readText();


          console.log(
            "DIRECT CLIPBOARD VALUE:",
            clipboardText
          );


          const clipboardDigits =
            String(clipboardText || "")
              .replace(/\D/g, "")
              .slice(0, 6);


          if (clipboardDigits) {

            fillOtpBoxes(
              clipboardDigits
            );

            return;
          }
        }

      } catch (error) {

        console.warn(
          "Direct clipboard read unavailable:",
          error
        );
      }


      /* =========================
         LAST FALLBACK
      ========================= */
      if (cleanedValue) {

        fillOtpBoxes(
          cleanedValue
        );
      }

    },
    true
  );


  /* =========================
     NORMAL INPUT +
     MOBILE OTP AUTOFILL
  ========================= */
  otpInputs.forEach(
    function (input, index) {

      input.addEventListener(
        "input",
        function () {

          if (isFillingOtp) {
            return;
          }


          let value =
            String(
              input.value || ""
            )
              .replace(/\D/g, "");


          /* =========================
             COMPLETE OTP INSERTED
          ========================= */
          if (
            value.length > 1
          ) {

            fillOtpBoxes(
              value
            );

            return;
          }


          /* =========================
             NORMAL SINGLE DIGIT
          ========================= */
          input.value =
            value.slice(0, 1);


          if (
            input.value &&
            index < otpInputs.length - 1
          ) {

            otpInputs[
              index + 1
            ].focus();
          }


          /* =========================
             CHECK COMPLETE OTP
          ========================= */
          const completeOtp =
            otpInputs
              .map(
                function (item) {
                  return item.value;
                }
              )
              .join("");


          if (
            completeOtp.length === 6
          ) {

            verifyOTP();
          }

        }
      );


      /* =========================
         BACKSPACE HANDLING
      ========================= */
      input.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key === "Backspace" &&
            input.value === "" &&
            index > 0
          ) {

            otpInputs[
              index - 1
            ].focus();
          }

        }
      );

    }
  );


  /* =========================
     COUNTDOWN TIMER
  ========================= */
  let totalSeconds = 116;

  let timerId = null;


  function updateCountdown() {

    const minutes =
      String(
        Math.floor(
          totalSeconds / 60
        )
      ).padStart(
        2,
        "0"
      );


    const seconds =
      String(
        totalSeconds % 60
      ).padStart(
        2,
        "0"
      );


    $("#countdown").text(
      `${minutes}:${seconds}`
    );


    if (
      totalSeconds > 0
    ) {

      totalSeconds--;

    } else if (timerId) {

      clearInterval(
        timerId
      );

      timerId = null;
    }
  }


  updateCountdown();


  timerId =
    setInterval(
      updateCountdown,
      1000
    );


  /* =========================
     RESEND OTP
  ========================= */
  $("#resendOtp").on(
    "click",
    function (e) {

      e.preventDefault();


      totalSeconds = 116;


      if (timerId) {

        clearInterval(
          timerId
        );
      }


      updateCountdown();


      timerId =
        setInterval(
          updateCountdown,
          1000
        );


      showMessage(
        "OTP resent successfully",
        "success"
      );

    }
  );


  /* =========================
     VERIFY OTP FUNCTION
  ========================= */
  async function verifyOTP() {

    if (isVerifyingOtp) {
      return;
    }


    const userId =
      sessionStorage.getItem(
        "user_id"
      );


    if (!userId) {

      showMessage(
        "Session expired. Please login again."
      );

      return;
    }


    /* =========================
       COLLECT OTP
    ========================= */
    let otp = "";


    $otpInputs.each(
      function () {

        otp +=
          $(this).val();

      }
    );


    if (
      otp.length !== 6
    ) {

      showMessage(
        "Please enter complete OTP"
      );

      return;
    }


    try {

      isVerifyingOtp = true;


      const response =
        await fetch(
          "https://apialongcom-2arld62n.on-forge.com/api/admin/auth/verify-otp",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                user_id:
                  userId,

                otp:
                  otp
              })
          }
        );


      const data =
        await response.json();


      /* =========================
         ERROR RESPONSE
      ========================= */
      if (
        !response.ok ||
        !data.success
      ) {

        showMessage(
          data.message ||
          "Invalid OTP",
          "error"
        );


        $otpInputs
          .val("");


        $otpInputs
          .first()
          .focus();


        return;
      }


      /* =========================
         SUCCESS MESSAGE
      ========================= */
      showMessage(
        data.message ||
        "Verification successful",
        "success"
      );


      /* =========================
         STORE AUTH TOKEN
      ========================= */
      if (
        data.data &&
        data.data.token
      ) {

        sessionStorage.setItem(
          "auth_token",
          data.data.token
        );
      }


      /* =========================
         STORE ADMIN USER
      ========================= */
      if (
        data.data &&
        data.data.user
      ) {

        sessionStorage.setItem(
          "admin_user",
          JSON.stringify(
            data.data.user
          )
        );
      }


      /* =========================
         REDIRECT
      ========================= */
      setTimeout(
        function () {

          window.location.href =
            "dashboard.html";

        },
        1000
      );


    } catch (error) {

      console.error(
        error
      );


      showMessage(
        "Network error. Try again."
      );

    } finally {

      isVerifyingOtp = false;

    }
  }

});