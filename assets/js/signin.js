// ===============================
// CONFIG
// ===============================
const API_BASE_URL = "https://apialongcom-2arld62n.on-forge.com/api";

// ===============================
// INIT
// ===============================
$(document).ready(function () {
  const $messageBox = $("#signinMessage");

  // ===============================
  // SHOW MESSAGE
  // ===============================
  function showMessage(message, type = "error") {
    if (!$messageBox.length) return;

    $messageBox.removeClass("hidden");
    $messageBox.removeClass("bg-red-100 text-red-600 bg-green-100 text-green-600");

    if (type === "success") {
      $messageBox.addClass("bg-green-100 text-green-600");
    } else {
      $messageBox.addClass("bg-red-100 text-red-600");
    }

    $messageBox.text(message);
  }

  // ===============================
  // TOGGLE PASSWORD
  // ===============================
  $("#togglePassword").on("click", function () {
    const passwordInput = $("#password");
    const currentType = passwordInput.attr("type");

    passwordInput.attr(
      "type",
      currentType === "password" ? "text" : "password"
    );
  });

  // ===============================
  // HANDLE LOGIN
  // ===============================
  $("#adminSignInForm").on("submit", async function (e) {
    e.preventDefault();

    const email = $("#email").val().trim();
    const password = $("#password").val().trim();
    const signInBtn = $("#signInBtn");

    if (!email || !password) {
      showMessage("Please enter email and password", "error");
      return;
    }

    try {
      signInBtn.prop("disabled", true).text("Signing in...");

      const response = await fetch(`${API_BASE_URL}/admin/auth/login-v2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();
      

      if (!response.ok || !data.success) {
        showMessage(data.message || "Login failed", "error");
        return;
      }

      const userId = data?.data?.user_id;

      if (!userId) {
        showMessage("User ID not received", "error");
        return;
      }

      // save with the SAME key verify page uses
      sessionStorage.setItem("user_id", userId);
      sessionStorage.setItem("admin_email", email);

      showMessage(data.message || "OTP sent successfully", "success");

      setTimeout(() => {
        window.location.href = "verify-phone.html";
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      showMessage("Something went wrong. Try again.", "error");
    } finally {
      signInBtn.prop("disabled", false).text("Sign In");
    }
  });
});