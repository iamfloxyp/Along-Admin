$(document).ready(function () {
  $("#toggleNewPassword").on("click", function () {
    const input = $("#newPassword");
    const currentType = input.attr("type");
    input.attr("type", currentType === "password" ? "text" : "password");
  });

  $("#toggleConfirmPassword").on("click", function () {
    const input = $("#confirmPassword");
    const currentType = input.attr("type");
    input.attr("type", currentType === "password" ? "text" : "password");
  });

  $("#createPasswordForm").on("submit", function (e) {
    e.preventDefault();
  });
});