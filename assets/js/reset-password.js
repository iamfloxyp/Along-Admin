const API_BASE_URL =
  "https://apialongcom-2arld62n.on-forge.com/api";


$(document).ready(function () {


  // ==========================================================
  // CONFIRM JAVASCRIPT LOADED
  // ==========================================================

  console.log(
    "Reset password JavaScript loaded."
  );


  // ==========================================================
  // GET RESET TOKEN FROM URL
  // ==========================================================

  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  const resetToken =
    urlParams.get("token");


  console.log(
    "Reset token found:",
    !!resetToken
  );


  // ==========================================================
  // ELEMENTS
  // ==========================================================

  const $form =
    $("#createPasswordForm");


  const $newPassword =
    $("#newPassword");


  const $confirmPassword =
    $("#confirmPassword");


  const $updatePasswordBtn =
    $("#updatePasswordBtn");


  const $message =
    $("#resetPasswordMessage");


  // ==========================================================
  // MESSAGE HELPER
  // ==========================================================

  function showResetPasswordMessage(
    message,
    type = "error"
  ) {

    if (!$message.length) {
      console.error(
        "resetPasswordMessage element was not found."
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

  function hideResetPasswordMessage() {

    $message
      .addClass("hidden")
      .text("");
  }


  

  // ==========================================================
  // SHOW / HIDE NEW PASSWORD
  // ==========================================================

  $("#toggleNewPassword").on(
    "click",
    function () {

      const currentType =
        $newPassword.attr(
          "type"
        );


      if (
        currentType ===
        "password"
      ) {

        $newPassword.attr(
          "type",
          "text"
        );

      } else {

        $newPassword.attr(
          "type",
          "password"
        );
      }
    }
  );


  // ==========================================================
  // SHOW / HIDE CONFIRM PASSWORD
  // ==========================================================

  $("#toggleConfirmPassword").on(
    "click",
    function () {

      const currentType =
        $confirmPassword.attr(
          "type"
        );


      if (
        currentType ===
        "password"
      ) {

        $confirmPassword.attr(
          "type",
          "text"
        );

      } else {

        $confirmPassword.attr(
          "type",
          "password"
        );
      }
    }
  );


  // ==========================================================
  // CLEAR MESSAGE WHEN USER TYPES
  // ==========================================================

  $newPassword.on(
    "input",
    function () {

      hideResetPasswordMessage();
    }
  );


  $confirmPassword.on(
    "input",
    function () {

      hideResetPasswordMessage();
    }
  );


  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  $form.on(
    "submit",
    async function (e) {

      e.preventDefault();


      const newPassword =
        $newPassword
          .val()
          .trim();


      const confirmPassword =
        $confirmPassword
          .val()
          .trim();


      // ========================================================
      // CHECK TOKEN
      // ========================================================

      if (!resetToken) {

        showResetPasswordMessage(
          "This password reset link is invalid or incomplete.",
          "error"
        );

        return;
      }


      // ========================================================
      // CHECK PASSWORD FIELDS
      // ========================================================

      if (
        !newPassword ||
        !confirmPassword
      ) {

        showResetPasswordMessage(
          "Please enter and confirm your new password.",
          "error"
        );

        return;
      }


      // ========================================================
      // CHECK PASSWORDS MATCH
      // ========================================================

      if (
        newPassword !==
        confirmPassword
      ) {

        showResetPasswordMessage(
          "The passwords do not match.",
          "error"
        );

        return;
      }


      try {


        // ======================================================
        // CLEAR OLD MESSAGE
        // ======================================================

        hideResetPasswordMessage();


        // ======================================================
        // BUTTON LOADING STATE
        // ======================================================

        $updatePasswordBtn
          .prop(
            "disabled",
            true
          )
          .css({
            opacity: "0.7",
            cursor: "not-allowed"
          })
          .text(
            "Resetting Password..."
          );


        // ======================================================
        // API REQUEST
        // ======================================================

        const response =
          await fetch(
            `${API_BASE_URL}/auth/reset-password`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json"
              },

              body: JSON.stringify({
                reset_token:
                  resetToken,

                password:
                  newPassword,

                password_confirmation:
                  confirmPassword
              })
            }
          );


        // ======================================================
        // READ RESPONSE
        // ======================================================

        const data =
          await response.json();


        console.log(
          "Reset password response:",
          data
        );


        // ======================================================
        // HANDLE ERROR RESPONSE
        // ======================================================

        if (
          !response.ok ||
          data.success === false
        ) {

          let errorMessage =
            data.message ||
            "Unable to reset password.";


          if (data.errors) {


            // PASSWORD ERROR
            if (
              Array.isArray(
                data.errors.password
              ) &&
              data.errors.password.length
            ) {

              errorMessage =
                data.errors.password[0];

            }


            // RESET TOKEN ERROR
            else if (
              Array.isArray(
                data.errors.reset_token
              ) &&
              data.errors.reset_token.length
            ) {

              errorMessage =
                data.errors.reset_token[0];

            }


            // PASSWORD CONFIRMATION ERROR
            else if (
              Array.isArray(
                data.errors.password_confirmation
              ) &&
              data.errors.password_confirmation.length
            ) {

              errorMessage =
                data.errors.password_confirmation[0];
            }
          }


          throw new Error(
            errorMessage
          );
        }


        // ======================================================
        // SUCCESS
        // ======================================================

        showResetPasswordMessage(
          data.message ||
          data?.data?.message ||
          "Password reset successfully.",
          "success"
        );


        // ======================================================
        // CLEAR PASSWORD FIELDS
        // ======================================================

        $newPassword
          .val("");


        $confirmPassword
          .val("");


        // ======================================================
        // CHANGE BUTTON TEXT
        // ======================================================

        $updatePasswordBtn
          .text(
            "Password Updated"
          );


        // ======================================================
        // REDIRECT TO LOGIN
        // ======================================================

        setTimeout(
          function () {

            window.location.href =
              "login.html";

          },
          2000
        );


      } catch (error) {


        console.error(
          "Reset password error:",
          error
        );


        // ======================================================
        // SHOW ERROR
        // ======================================================

        showResetPasswordMessage(
          error.message ||
          "Unable to reset password.",
          "error"
        );


        // ======================================================
        // RESTORE BUTTON
        // ======================================================

        $updatePasswordBtn
          .text(
            "Reset Password"
          );


      } finally {


        // ======================================================
        // RE-ENABLE BUTTON
        // ======================================================

        if (resetToken) {

          $updatePasswordBtn
            .prop(
              "disabled",
              false
            )
            .css({
              opacity: "1",
              cursor: "pointer"
            });
        }
      }
    }
  );

});