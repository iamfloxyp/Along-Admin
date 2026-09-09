const API_BASE_URL =
  "https://apialongcom-2arld62n.on-forge.com/api";


$(document).ready(function () {


  // ==========================================================
  // CONFIRM JAVASCRIPT LOADED
  // ==========================================================

  console.log(
    "Forgot password JavaScript loaded."
  );


  // ==========================================================
  // ELEMENTS
  // ==========================================================

  const $form =
    $("#forgotPasswordForm");


  const $email =
    $("#forgotPasswordEmail");


  const $sendButton =
    $("#sendResetLinkBtn");


  const $message =
    $("#forgotPasswordMessage");


  // ==========================================================
  // MESSAGE HELPER
  // ==========================================================

  function showForgotPasswordMessage(
    message,
    type = "error"
  ) {

    if (!$message.length) {

      console.error(
        "forgotPasswordMessage element was not found."
      );

      return;
    }


    $message
      .removeClass(
        "hidden bg-red-100 text-red-600 bg-green-100 text-green-600"
      );


    if (type === "success") {

      $message.addClass(
        "bg-green-100 text-green-600"
      );

    } else {

      $message.addClass(
        "bg-red-100 text-red-600"
      );

    }


    $message.text(
      message
    );
  }


  // ==========================================================
  // HIDE MESSAGE
  // ==========================================================

  function hideForgotPasswordMessage() {

    $message
      .addClass("hidden")
      .text("");
  }


  // ==========================================================
  // CLEAR MESSAGE WHEN USER TYPES
  // ==========================================================

  $email.on(
    "input",
    function () {

      hideForgotPasswordMessage();

    }
  );


  // ==========================================================
  // REQUEST PASSWORD RESET LINK
  // ==========================================================

  $form.on(
    "submit",
    async function (e) {

      e.preventDefault();


      const email =
        $email
          .val()
          .trim();


      // ========================================================
      // VALIDATE EMAIL
      // ========================================================

      if (!email) {

        showForgotPasswordMessage(
          "Please enter your email address.",
          "error"
        );

        return;
      }


      // ========================================================
      // BASIC EMAIL FORMAT CHECK
      // ========================================================

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(
          email
        )
      ) {

        showForgotPasswordMessage(
          "Please enter a valid email address.",
          "error"
        );

        return;
      }


      const originalButtonText =
        $sendButton.text();


      try {


        // ======================================================
        // CLEAR OLD MESSAGE
        // ======================================================

        hideForgotPasswordMessage();


        // ======================================================
        // LOADING STATE
        // ======================================================

        $sendButton
          .prop(
            "disabled",
            true
          )
          .css({
            opacity: "0.7",
            cursor: "not-allowed"
          })
          .text(
            "Sending..."
          );


        // ======================================================
        // REQUEST RESET LINK
        // ======================================================

        const response =
          await fetch(
            `${API_BASE_URL}/admin/users/reset-password`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json"
              },

              body:
                JSON.stringify({
                  email:
                    email
                })
            }
          );


        // ======================================================
        // READ RESPONSE
        // ======================================================

        const data =
          await response.json();


        console.log(
          "Forgot password response:",
          data
        );


        // ======================================================
        // HANDLE RESPONSE
        // ======================================================

        if (
          !response.ok ||
          data.success === false
        ) {

          let errorMessage =
            data.message ||
            "Unable to send password reset link.";


          if (
            data.errors &&
            Array.isArray(
              data.errors.email
            ) &&
            data.errors.email.length
          ) {

            errorMessage =
              data.errors.email[0];
          }


          throw new Error(
            errorMessage
          );
        }


        // ======================================================
        // SUCCESS
        // ======================================================

        showForgotPasswordMessage(
          data.message ||
          "Password reset link has been sent to your email.",
          "success"
        );


        // ======================================================
        // CLEAR EMAIL
        // ======================================================

        $email.val("");


      } catch (error) {


        console.error(
          "Forgot password error:",
          error
        );


        showForgotPasswordMessage(
          error.message ||
          "Unable to send password reset link.",
          "error"
        );


      } finally {


        // ======================================================
        // RESTORE BUTTON
        // ======================================================

        $sendButton
          .prop(
            "disabled",
            false
          )
          .css({
            opacity: "1",
            cursor: "pointer"
          })
          .text(
            originalButtonText
          );

      }

    }
  );

});