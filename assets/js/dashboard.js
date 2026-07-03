/*========================== HEADER SECTION ==========================*/

function getAdminFullName(user) {
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

  return `${firstName} ${lastName}`.trim() || user?.email || "Admin";
}

function getInitialsFromUser(user) {
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`
    .toUpperCase()
    .trim();

  return initials || "A";
}

function renderAdminProfile(user) {
  const nameEl = document.getElementById("adminProfileName");
  const avatarEl = document.getElementById("adminProfileAvatar");
  const initialsEl = document.getElementById("adminProfileInitials");

  if (!user) return;

  const fullName = getAdminFullName(user);
  const initials = getInitialsFromUser(user);
  const image = user.profile_photo_url || "";

  if (nameEl) nameEl.textContent = fullName;

  if (image && avatarEl && initialsEl) {
    avatarEl.src = image;
    avatarEl.classList.remove("hidden");
    initialsEl.classList.add("hidden");
  } else {
    avatarEl.src = "";
    avatarEl.classList.add("hidden");
    initialsEl.textContent = initials;
    initialsEl.classList.remove("hidden");
  }
}

function loadAdminHeaderFromSession() {
  const savedUser = sessionStorage.getItem("admin_user");

  if (!savedUser) return;

  const user = JSON.parse(savedUser);
  renderAdminProfile(user);
}

async function loadAdminProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to load profile");
    }

    const user = result.data;

    sessionStorage.setItem("admin_user", JSON.stringify(user));

    renderAdminProfile(user);
    renderSettingsProfile(user);

    return user;
  } catch (error) {
    console.error("Admin profile error:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadAdminHeaderFromSession();
  loadAdminProfile();
});
function showGlobalLoader() {
  const loader = document.getElementById("globalPageLoader");
  if (!loader) return;

  loader.classList.remove("hidden");
  loader.classList.add("flex");
}

function hideGlobalLoader() {
  const loader = document.getElementById("globalPageLoader");
  if (!loader) return;

  loader.classList.add("hidden");
  loader.classList.remove("flex");
}

// ** =========================DRIVER MANANEGENT DASHBOARD JS========================= **
const API_BASE_URL = "https://apialongcom-2arld62n.on-forge.com/api";
const AUTH_TOKEN = sessionStorage.getItem("auth_token");

if (!AUTH_TOKEN) {
  window.location.href = "signin.html";
}
let allDrivers = [];
let filteredDrivers = [];
let currentSearchTerm = "";
let currentStatusFilter = "all";
let currentPage = 1;
let totalDriversFromBackend = 0;
let ROWS_PER_PAGE = 20;


const SIDEBAR_ITEMS = [
  {
    linkId: "sidebarDashboardLink",
    iconId: "sidebarDashboardIcon",
    textId: "sidebarDashboardText",
    sectionId: "dashboardHomeSection"
  },
  {
    linkId: "sidebarDriversLink",
    iconId: "sidebarDriversIcon",
    textId: "sidebarDriversText",
    sectionId: "driversManagementSection"
  },
  {
    linkId: "sidebarCustomersLink",
    iconId: "sidebarCustomersIcon",
    textId: "sidebarCustomersText",
    sectionId: "customersSection"
  },
  {
    linkId: "sidebarDeliveriesLink",
    iconId: "sidebarDeliveriesIcon",
    textId: "sidebarDeliveriesText",
    sectionId: "deliveriesSection"
  },
  {
    linkId: "sidebarPaymentsLink",
    iconId: "sidebarPaymentsIcon",
    textId: "sidebarPaymentsText",
    sectionId: "paymentsSection"
  },
  {
    linkId: "sidebarSupportRequestsLink",
    iconId: "sidebarSupportRequestsIcon",
    textId: "sidebarSupportRequestsText",
    sectionId: "supportRequestsSection"
  },
  {
    linkId: "sidebarAdminUsersLink",
    iconId: "sidebarAdminUsersIcon",
    textId: "sidebarAdminUsersText",
    sectionId: "adminUsersSection"
  },
  {
    linkId: "sidebarSettingsLink",
    iconId: "sidebarSettingsIcon",
    textId: "sidebarSettingsText",
    sectionId: "settingsSection"
  },
  
];

const LOGOUT_TABS = [
  {
  linkId: "sidebarLogoutLink",
  iconId: "sidebarLogoutIcon",
  textId: "sidebarLogoutText",
  sectionId: "logoutSection"
}
];

let payments = [];
let currentPaymentPagination = null;
let selectedPayoutToComplete = null;
let currentPaymentFilters = {
  search: "",
  status: "all"
};
/* ================= HASH ROUTES ================= */

const ROUTE_MAP = {
  dashboardHomeSection: "#dashboard",
  driversManagementSection: "#drivers",
  driverDetailsSection: "#drivers/details",
  customersSection: "#customers",
  deliveriesSection: "#tags",
  paymentsSection: "#payout",
  supportRequestsSection: "#support-requests",
  adminUsersSection: "#admin-users",
  createAdminUserSection: "#admin-users/create",
  settingsSection: "#settings",
  notificationsSection: "#notifications",
  logoutSection: "#logout"
};

const HASH_TO_SECTION = {
  "#dashboard": "dashboardHomeSection",
  "#drivers": "driversManagementSection",
  "#customers": "customersSection",
  "#tags": "deliveriesSection",
  "#payout": "paymentsSection",
  "#support-requests": "supportRequestsSection",
  "#admin-users": "adminUsersSection",
  "#admin-users/create": "createAdminUserSection",
  "#settings": "settingsSection",
    "#notifications": "notificationsSection",
    "#logout": "logoutSection"
};

const ALL_MAIN_SECTION_IDS = [
  "dashboardHomeSection",
  "driversManagementSection",
  "driverDetailsSection",
  "customersSection",
  "deliveriesSection",
  "paymentsSection",
  "supportRequestsSection",
  "adminUsersSection",
  "createAdminUserSection",
  "settingsSection",
  "notificationsSection",
  "logoutSection"
  
];

function hideAllDashboardSections() {
  ALL_MAIN_SECTION_IDS.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.classList.add("hidden");
  });
}

function resetSidebarMenuStyles() {
  SIDEBAR_ITEMS.forEach((item) => {
    const link = document.getElementById(item.linkId);
    const icon = document.getElementById(item.iconId);
    const text = document.getElementById(item.textId);

    if (link) link.style.backgroundColor = "transparent";
    if (icon) icon.style.color = "#7C8AA0";
    if (text) text.style.color = "#7C8AA0";
  });
}

function activateSidebarMenu(linkId, iconId, textId) {
  const link = document.getElementById(linkId);
  const icon = document.getElementById(iconId);
  const text = document.getElementById(textId);

  if (link) link.style.backgroundColor = "#49D6F2";
  if (icon) icon.style.color = "#FFFFFF";
  if (text) text.style.color = "#FFFFFF";
}

function showDashboardSection(sectionId, updateUrl = true) {
  hideAllDashboardSections();

  const section = document.getElementById(sectionId);
  if (section) section.classList.remove("hidden");

  if (updateUrl && ROUTE_MAP[sectionId]) {
    window.location.hash = ROUTE_MAP[sectionId];
  }
}

function activateLogoutMenu() {
  const link = document.getElementById("sidebarLogoutLink");
  const icon = document.getElementById("sidebarLogoutIcon");
  const text = document.getElementById("sidebarLogoutText");

  if (link) link.style.backgroundColor = "#FFF5F5";
  if (icon) icon.style.color = "#E5484D";
  if (text) text.style.color = "#E5484D";
}

function switchSidebarTab(sectionId, linkId, iconId, textId, updateUrl = true) {
  showDashboardSection(sectionId, updateUrl);
  resetSidebarMenuStyles();
  activateSidebarMenu(linkId, iconId, textId);
}

function loadSectionFromHash() {
  const fullHash = window.location.hash || "#dashboard";
  const hash = fullHash.split("?")[0];

  if (hash === "#dashboard") {
  switchSidebarTab(
    "dashboardHomeSection",
    "sidebarDashboardLink",
    "sidebarDashboardIcon",
    "sidebarDashboardText",
    false
  );

  if (typeof loadDashboardStats === "function") {
    loadDashboardStats();
  }

  if (typeof loadDashboardData === "function") {
    loadDashboardData();
  }

  return;
}

  if (hash.startsWith("#drivers/details/")) {
    const driverId = hash.replace("#drivers/details/", "");

    resetSidebarMenuStyles();
    activateSidebarMenu("sidebarDriversLink", "sidebarDriversIcon", "sidebarDriversText");

    openDriverDetails(driverId, false);
    return;
  }

  if (hash.startsWith("#tags/details/")) {
    const tagId = hash.replace("#tags/details/", "");

    showDashboardSection("deliveriesSection", false);
    resetSidebarMenuStyles();
    activateSidebarMenu("sidebarDeliveriesLink", "sidebarDeliveriesIcon", "sidebarDeliveriesText");

    viewTag(tagId, false);
    return;
  }

  if (hash.startsWith("#support-requests/chat/")) {
    const ticketId = hash.replace("#support-requests/chat/", "");

    showDashboardSection("supportRequestsSection", false);
    resetSidebarMenuStyles();
    activateSidebarMenu(
      "sidebarSupportRequestsLink",
      "sidebarSupportRequestsIcon",
      "sidebarSupportRequestsText"
    );

    loadSupportTickets().then(() => {
      if (ticketId) openSupportTicketFromAPI(ticketId);
    });

    return;
  }

  if (hash.startsWith("#customers/")) {
    const customerId = hash.replace("#customers/", "");

    showDashboardSection("customersSection", false);
    resetSidebarMenuStyles();
    activateSidebarMenu("sidebarCustomersLink", "sidebarCustomersIcon", "sidebarCustomersText");

    openSenderDetailsById(customerId);
    return;
  }

  if (hash.startsWith("#payout/details/")) {
  const payoutId = hash.replace("#payout/details/", "");

  showDashboardSection("paymentsSection", false);

  resetSidebarMenuStyles();

  activateSidebarMenu(
    "sidebarPaymentsLink",
    "sidebarPaymentsIcon",
    "sidebarPaymentsText"
  );

  openPayoutDetailsPage(payoutId, false);

  return;
}
 if (hash === "#payout") {
  switchSidebarTab(
    "paymentsSection",
    "sidebarPaymentsLink",
    "sidebarPaymentsIcon",
    "sidebarPaymentsText",
    false
  );

  document.getElementById("payoutDetailsView")?.classList.add("hidden");
  document.getElementById("paymentsListView")?.classList.remove("hidden");

  loadPaymentStats();
  loadPaymentsFromUrl();

  return;
}

  if (hash === "#drivers") {
    switchSidebarTab(
      "driversManagementSection",
      "sidebarDriversLink",
      "sidebarDriversIcon",
      "sidebarDriversText",
      false
    );

    if (typeof loadDriversFromApi === "function") {
      loadDriversFromApi();
    }

    return;
  }

  if (hash === "#customers") {
    switchSidebarTab(
      "customersSection",
      "sidebarCustomersLink",
      "sidebarCustomersIcon",
      "sidebarCustomersText",
      false
    );

    loadSendersFromAPI(1);
    return;
  }
if (hash === "#tags") {
  switchSidebarTab(
    "deliveriesSection",
    "sidebarDeliveriesLink",
    "sidebarDeliveriesIcon",
    "sidebarDeliveriesText",
    false
  );

  if (typeof loadTagsFromAPI === "function") {
    loadTagsFromAPI(1);
  }

  return;
}

  if (hash === "#payout") {
    switchSidebarTab(
      "paymentsSection",
      "sidebarPaymentsLink",
      "sidebarPaymentsIcon",
      "sidebarPaymentsText",
      false
    );

    loadPaymentsFromUrl();
    return;
  }

  if (hash === "#support-requests") {
    switchSidebarTab(
      "supportRequestsSection",
      "sidebarSupportRequestsLink",
      "sidebarSupportRequestsIcon",
      "sidebarSupportRequestsText",
      false
    );

    loadSupportTickets();
    return;
  }
  if (
  hash.startsWith("#admin-users/") &&
  hash !== "#admin-users/create"
) {
  const adminId = hash.replace("#admin-users/", "");

  switchSidebarTab(
    "adminUsersSection",
    "sidebarAdminUsersLink",
    "sidebarAdminUsersIcon",
    "sidebarAdminUsersText",
    false
  );

  loadAdminUsers();

  if (adminId) {
    openUpdateAdminModal(adminId);
  }

  return;
}

if (hash === "#admin-users") {
  switchSidebarTab(
    "adminUsersSection",
    "sidebarAdminUsersLink",
    "sidebarAdminUsersIcon",
    "sidebarAdminUsersText",
    false
  );

  loadAdminUsers();
  return;
}

if (hash === "#admin-users/create") {
  switchSidebarTab(
    "createAdminUserSection",
    "sidebarAdminUsersLink",
    "sidebarAdminUsersIcon",
    "sidebarAdminUsersText",
    false
  );

  return;
}

 if (hash === "#settings") {
  switchSidebarTab(
    "settingsSection",
    "sidebarSettingsLink",
    "sidebarSettingsIcon",
    "sidebarSettingsText",
    false
  );

  loadSettingsSection();

  return;
}
  if (hash === "#notifications") {
    switchSidebarTab(
      "notificationsSection",
      "sidebarNotificationsLink",
      "sidebarNotificationsIcon",
      "sidebarNotificationsText",
      false
    );

    if (typeof loadNotifications === "function") {
      loadNotifications();
    }

    return;
  }
 if (hash === "#logout") {
  showDashboardSection("logoutSection", false);
  resetSidebarMenuStyles();
  activateLogoutMenu();
  return;
}

 switchSidebarTab(
  "dashboardHomeSection",
  "sidebarDashboardLink",
  "sidebarDashboardIcon",
  "sidebarDashboardText",
  false
);



if (typeof loadDashboardStats === "function") {
  loadDashboardStats();
}

if (typeof loadDashboardData === "function") {
  loadDashboardData();
}
}

window.addEventListener("hashchange", loadSectionFromHash);
document.addEventListener("DOMContentLoaded", loadSectionFromHash);


async function reloadDashboardSection() {
  showGlobalLoader();

  try {
    if (typeof loadDashboardStats === "function") {
      await loadDashboardStats();
    }

    if (typeof loadDashboardData === "function") {
      await loadDashboardData();
    }
  } finally {
    hideGlobalLoader();
  }
}

async function reloadPayoutSection() {
  showGlobalLoader();

  try {
    document.getElementById("payoutDetailsView")?.classList.add("hidden");
    document.getElementById("paymentsListView")?.classList.remove("hidden");

    if (typeof loadPaymentStats === "function") {
      await loadPaymentStats();
    }

    if (typeof loadPayments === "function") {
      await loadPayments(`${API_BASE_URL}/admin/payouts?per_page=5`);
    }
  } finally {
    hideGlobalLoader();
  }
}

function refreshSidebarSection(sectionId) {
  if (sectionId === "dashboardHomeSection") {
  showGlobalLoader();

  Promise.allSettled([
    typeof fetchDashboardAnalytics === "function" ? fetchDashboardAnalytics() : null,
    typeof loadDashboardStats === "function" ? loadDashboardStats() : null,
    typeof loadDashboardData === "function" ? loadDashboardData() : null
  ]).finally(() => {
    hideGlobalLoader();
  });

  return;
}

  if (sectionId === "paymentsSection") {
    reloadPayoutSection();
    return;
  }

  if (sectionId === "deliveriesSection") {
  showGlobalLoader();

  Promise.allSettled([
    typeof loadDeliveryStats === "function" ? loadDeliveryStats() : null,
    typeof renderDeliveries === "function" ? renderDeliveries(1, false) : null,
    typeof loadTagsFromAPI === "function" ? loadTagsFromAPI(1) : null
  ]).finally(() => {
    hideGlobalLoader();
  });

  return;
}

  if (sectionId === "supportRequestsSection") {
    loadSupportTickets();
    return;
  }

  if (sectionId === "customersSection") {
    loadSendersFromAPI(1);
    return;
  }

  if (sectionId === "driversManagementSection") {
    loadDriversFromApi();
    return;
  }

  if (sectionId === "settingsSection") {
    loadSettingsSection();
    return;
  }
  if (sectionId === "adminUsersSection") { 
    return;
  }
}



function setupSidebarNavigation() {
  SIDEBAR_ITEMS.forEach((item) => {
    const link = document.getElementById(item.linkId);
    if (!link) return;

    link.onclick = function (e) {
  e.preventDefault();

  const route = ROUTE_MAP[item.sectionId];

  if (route) {
  const currentHash = window.location.hash.split("?")[0];

  if (currentHash === route) {
    console.log("Refreshing section:", item.sectionId);
    refreshSidebarSection(item.sectionId);
    return;
  }

  window.location.hash = route;

  setTimeout(() => {
    refreshSidebarSection(item.sectionId);
  }, 100);
} else {
    switchSidebarTab(
      item.sectionId,
      item.linkId,
      item.iconId,
      item.textId,
      false
    );

    refreshSidebarSection(item.sectionId);
  }
};
  });

  const logoutLink = document.getElementById("sidebarLogoutLink");

  if (logoutLink) {
    logoutLink.onclick = function (e) {
      e.preventDefault();

      if (window.location.hash === "#logout") {
        loadSectionFromHash();
      } else {
        window.location.hash = "#logout";
      }
    };
  }

  loadSectionFromHash();
}



/* ========================= NOTIFICATIONS ================================ */

let adminNotifications = [];
let previousSectionBeforeNotifications = "#dashboard";
let supportPusher = null;
let currentSupportChannel = null;
let notificationPusherChannel = null;

function notificationAuthHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${AUTH_TOKEN}`
  };
}

function showLiveNotificationToast(data = {}) {
  const wrap = document.getElementById("liveNotificationToastWrap");
  if (!wrap) return;

  const toast = document.createElement("div");

  toast.className =
    "w-[360px] rounded-[14px] border border-[#FACC15] shadow-[0_12px_32px_rgba(0,0,0,0.14)] p-[16px] flex items-start gap-[12px]";

  toast.style.backgroundColor = "#FEF08A";

  toast.innerHTML = `
    <div class="w-[38px] h-[38px] rounded-full bg-white text-[#30BBC7] flex items-center justify-center shrink-0">
      <i class="fa-solid fa-bell text-[14px]"></i>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-[10px]">
        <h3 class="text-[#11313B] text-[14px] font-semibold leading-[20px]">
          ${data.title || "New Notification"}
        </h3>

        <button
          type="button"
          class="closeLiveNotificationToast w-[24px] h-[24px] rounded-full bg-white text-[#7C8AA0] flex items-center justify-center shrink-0 cursor-pointer"
        >
          <i class="fa-solid fa-xmark text-[11px]"></i>
        </button>
      </div>

      <p class="mt-[6px] text-[#344054] text-[13px] leading-[19px]">
        ${data.message || "You have a new update."}
      </p>

      <p class="mt-[8px] text-[#667085] text-[11px]">
        Just now
      </p>
    </div>
  `;

  wrap.prepend(toast);

  toast.querySelector(".closeLiveNotificationToast")?.addEventListener("click", function () {
    toast.remove();
  });

  setTimeout(() => {
    toast.remove();
  }, 30000);
}

function subscribeToAdminNotifications() {
  const pusher = initSupportPusher();

  if (notificationPusherChannel) return;

  notificationPusherChannel = pusher.subscribe("notifications");

  notificationPusherChannel.bind("pusher:subscription_succeeded", function () {
    
  });

  notificationPusherChannel.bind("notifications.created", async function (data) {
  console.log("New notification received:", data);

  showLiveNotificationToast({
    title: data.title,
    message: data.message
  });

  await updateNotificationBadge();

  if (!document.getElementById("notificationsSection")?.classList.contains("hidden")) {
    await loadNotifications(false);
  }
});
}

function openNotificationsSection() {
  previousSectionBeforeNotifications = window.location.hash || "#dashboard";

  showDashboardSection("notificationsSection", true);
  resetSidebarMenuStyles();

  window.location.hash = "#notifications";
}

async function fetchAllNotifications() {
  const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
    method: "GET",
    headers: notificationAuthHeaders()
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load notifications");
  }

  return Array.isArray(result.data) ? result.data : [];
}

async function fetchUnreadNotificationCount() {
  const response = await fetch(`${API_BASE_URL}/admin/notifications/unread`, {
    method: "GET",
    headers: notificationAuthHeaders()
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load unread count");
  }

  return Number(result.data?.unread_count || 0);
}

async function markNotificationAsRead(notificationId) {
  const response = await fetch(
    `${API_BASE_URL}/admin/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: notificationAuthHeaders()
    }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to mark notification as read");
  }

  return result;
}

function formatNotificationTime(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function updateNotificationBadge() {
  const badge = document.getElementById("adminNotificationBadge");
  if (!badge) return;

  try {
    const unreadCount = await fetchUnreadNotificationCount();

    badge.textContent = unreadCount;
    badge.classList.toggle("hidden", unreadCount === 0);
  } catch (error) {
    console.error("Unread badge error:", error);
  }
}

function renderNotifications() {
  const list = document.getElementById("notificationsList");
  if (!list) return;

  list.innerHTML = "";

  if (!adminNotifications.length) {
    list.innerHTML = `
      <div class="rounded-[14px] bg-white p-[18px] border border-[#E5E7EB]">
        <p class="text-[#11313B] text-[14px] font-semibold">
          No notifications found.
        </p>
        <p class="mt-[4px] text-[#7C8AA0] text-[13px]">
          New alerts will appear here.
        </p>
      </div>
    `;
    return;
  }

  adminNotifications.forEach((item) => {
    list.innerHTML += `
     

          <div
  class="notificationItem w-full rounded-[12px] p-[12px] border bg-white border-[#E5E7EB] shadow-[0px_1px_4px_rgba(178,163,163,0.45)]"
  data-id="${item.id}"
>
  <div class="flex items-start justify-between gap-[10px]">
    <div class="flex items-start gap-[10px] min-w-0">
      <div class="w-[32px] h-[32px] rounded-full bg-[#EAFBFD] text-[#30BBC7] flex items-center justify-center shrink-0">
        <i class="fa-solid fa-bell text-[12px]"></i>
      </div>

      <div class="min-w-0 flex-1">
        <h3 class="text-[#11313B] text-[13px] font-semibold">
          ${item.title || "Notification"}
        </h3>

        <p class="mt-[2px] text-[#7C8AA0] text-[12px] leading-[16px]">
          ${item.message || ""}
        </p>

        <p class="mt-[4px] text-[#98A2B3] text-[11px]">
          ${formatNotificationTime(item.created_at)}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="markNotificationReadBtn w-[24px] h-[24px] rounded-full bg-[#FDECEF] text-[#E57373] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#FAD8DE]"
      data-id="${item.id}"
    >
      <i class="fa-solid fa-xmark text-[10px]"></i>
    </button>
  </div>
</div>
    `;
  });

  attachNotificationReadEvents();
}

function attachNotificationReadEvents() {
  document.querySelectorAll(".markNotificationReadBtn").forEach((btn) => {
    btn.addEventListener("click", async function (event) {
      event.stopPropagation();

      const id = this.dataset.id;
      if (!id) return;

      try {
  this.disabled = true;
  this.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-[12px]"></i>`;

  await markNotificationAsRead(id);

  await loadNotifications(true);

  showActionPopupMessage(
    "Notification removed successfully.",
    "success"
  );
}
catch (error) {
        console.error("Mark notification read error:", error);

        showActionPopupMessage(
          error.message || "Unable to clear notification.",
          "error"
        );

        this.disabled = false;
        this.innerHTML = `<i class="fa-solid fa-xmark text-[12px]"></i>`;
      }
    });
  });
}

async function loadNotifications(showLoader = true) {
  if (showLoader) showGlobalLoader();

  try {
    adminNotifications = await fetchAllNotifications();

    renderNotifications();
    await updateNotificationBadge();
  } catch (error) {
    console.error("Notifications error:", error);

    const list = document.getElementById("notificationsList");

    if (list) {
      list.innerHTML = `
        <div class="rounded-[14px] bg-white p-[18px] border border-[#FDECEF] text-[#E57373] text-[13px]">
          ${error.message || "Unable to load notifications."}
        </div>
      `;
    }
  } finally {
    if (showLoader) hideGlobalLoader();
  }
}

document.getElementById("adminNotificationBtn")?.addEventListener("click", async function () {
  openNotificationsSection();
  await loadNotifications(true);
});

document.getElementById("backFromNotificationsBtn")?.addEventListener("click", function () {
  window.location.hash = previousSectionBeforeNotifications || "#dashboard";
});

document.addEventListener("DOMContentLoaded", function () {
  updateNotificationBadge();
  subscribeToAdminNotifications
});

/* ========================= END OF NOTIFICATIONS ================================ */

window.addEventListener("hashchange", loadSectionFromHash);

function initializeDashboardSections() {
  setupSidebarNavigation();
  subscribeToAdminNotifications();
}

/*============================= DASHBOARD SECTION =============================*/


let driversChartInstance = null;
let sendersChartInstance = null;
let deliveriesChartInstance = null;
let paymentsChartInstance = null;

async function fetchDashboardAnalytics() {
    showGlobalLoader();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Analytics failed: ${response.status}`);
    }

    renderDashboardAnalytics(result.data);
    renderDashboardCharts(result.data);
  } catch (error) {
    console.error("Error loading dashboard analytics:", error);
    showActionPopupMessage(error.message || "Unable to load dashboard analytics.", "error");
  }
  finally {
    hideGlobalLoader();
  }
}

function renderDashboardAnalytics(data) {
  const users = data?.users || {};
  const drivers = data?.drivers || {};
  const tags = data?.tags || {};
  const revenue = data?.revenue || {};

  setDashboardNumber("dashboardTotalDrivers", drivers.total_drivers);
  setDashboardNumber("dashboardApprovedDrivers", drivers.approved_drivers);
  setDashboardNumber("dashboardPendingDrivers", drivers.pending_approval);
  setDashboardNumber("dashboardRejectedDrivers", drivers.rejected_drivers);

  setDashboardNumber("dashboardTotalCustomers", users.total_customers);
  setDashboardNumber("dashboardActiveCustomers", users.active_customers);
  setDashboardNumber("dashboardNewCustomersThisWeek", users.new_customers_this_week);
  setDashboardNumber("dashboardNewCustomersThisMonth", users.new_customers_this_month);

  setDashboardNumber("dashboardTotalDeliveries", tags.total_tags);
  setDashboardNumber("dashboardInProgressDeliveries", tags.in_progress);
  setDashboardNumber("dashboardCompletedDeliveries", tags.completed);
  setDashboardNumber("dashboardTodayDeliveries", tags.today);
  setDashboardNumber("dashboardFailedDeliveries", tags.failed);

  setDashboardText("dashboardTotalRevenue", formatDashboardMoney(revenue.total_revenue));
  setDashboardText("dashboardPendingPayouts", formatDashboardMoney(revenue.pending_payouts));
  setDashboardText("dashboardCompletedPayouts", formatDashboardMoney(revenue.completed_payouts));
}

function renderDashboardCharts(data) {
  const users = data?.users || {};
  const drivers = data?.drivers || {};
  const tags = data?.tags || {};
  const revenue = data?.revenue || {};

  driversChartInstance = renderBarChart(
    "driversChart",
    driversChartInstance,
    ["Approved", "Pending", "Rejected"],
    [
      drivers.approved_drivers || 0,
      drivers.pending_approval || 0,
      drivers.rejected_drivers || 0
    ],
    ["#3BB273", "#F2B66D", "#E57373"]
  );

  sendersChartInstance = renderBarChart(
  "sendersChart",
  sendersChartInstance,
  ["Total", "Active", "This Week", "This Month"],
  [
    users.total_customers || 0,
    users.active_customers || 0,
    users.new_customers_this_week || 0,
    users.new_customers_this_month || 0
  ],
  ["#30BBC7", "#3BB273", "#F2B66D", "#9B51E0"]
);

  deliveriesChartInstance = renderDoughnutChart(
    "deliveriesChart",
    deliveriesChartInstance,
    ["In Progress", "Completed", "Failed"],
    [
      tags.in_progress || 0,
      tags.completed || 0,
      tags.failed || 0
    ],
    ["#F2B66D", "#3BB273", "#E57373"]
  );

  paymentsChartInstance = renderPieChart(
    "paymentsChart",
    paymentsChartInstance,
    ["Total Revenue", "Pending", "Completed"],
    [
      revenue.total_revenue || 0,
      revenue.pending_payouts || 0,
      revenue.completed_payouts || 0
    ],
    ["#30BBC7", "#9B51E0", "#3BB273"]
  );
}

function renderBarChart(canvasId, oldChart, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return oldChart;

  if (oldChart) oldChart.destroy();

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderRadius: 10,
          barThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 1200,
        easing: "easeOutQuart",
        delay: function (context) {
          return context.dataIndex * 120;
        }
      },

      transitions: {
        active: {
          animation: {
            duration: 350,
            easing: "easeOutQuart"
          }
        },
        resize: {
          animation: {
            duration: 600,
            easing: "easeOutQuart"
          }
        }
      },

      interaction: {
        mode: "nearest",
        intersect: true
      },

      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#11313B",
          titleColor: "#FFFFFF",
          bodyColor: "#FFFFFF",
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            size: 12,
            weight: "600"
          },
          bodyFont: {
            size: 12,
            weight: "500"
          }
        }
      },

      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "#7C8AA0",
            font: {
              size: 10,
              weight: "500"
            }
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(...values, 5),
          grid: {
            color: "#EEF2F6"
          },
          ticks: {
            color: "#7C8AA0",
            precision: 0,
            font: {
              size: 10,
              weight: "500"
            }
          }
        }
      }
    }
  });
}

function renderDoughnutChart(canvasId, oldChart, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return oldChart;

  if (oldChart) oldChart.destroy();

  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 4,
          borderColor: "#FFFFFF",
          hoverOffset: 10,
          spacing: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",

      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1300,
        easing: "easeOutQuart"
      },

      transitions: {
        active: {
          animation: {
            duration: 350,
            easing: "easeOutQuart"
          }
        }
      },

      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#11313B",
          titleColor: "#FFFFFF",
          bodyColor: "#FFFFFF",
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            size: 12,
            weight: "600"
          },
          bodyFont: {
            size: 12,
            weight: "500"
          }
        }
      }
    }
  });
}

function renderPieChart(canvasId, oldChart, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return oldChart;

  if (oldChart) oldChart.destroy();

  const realValues = values.map((value) => Number(value) || 0);
  const maxValue = Math.max(...realValues);

  const displayValues = realValues.map((value) => {
    if (value > 0 && value < maxValue * 0.05) {
      return maxValue * 0.05;
    }
    return value;
  });

  return new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: displayValues,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 4,
          borderColor: "#FFFFFF",
          hoverOffset: 10,
          spacing: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#11313B",
          titleColor: "#FFFFFF",
          bodyColor: "#FFFFFF",
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context) {
              const label = labels[context.dataIndex] || "";
              const realValue = realValues[context.dataIndex] || 0;
              return `${label}: $${realValue.toLocaleString()}`;
            }
          }
        }
      }
    }
  });
}

function setDashboardNumber(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = Number(value || 0).toLocaleString();
}

function setDashboardText(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
}

function formatDashboardMoney(value) {
  const amount = Number(value || 0);

  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

fetchDashboardAnalytics();
/*============================= END OF DASHBOARD SECTION =============================*/

/*===================================DRIVER SECTION===========================================*/
/* =========================
   FETCH DRIVERS FROM API
========================= */
let currentDriverPagination = null;

async function fetchDrivers(customUrl = null) {
  showGlobalLoader();

  try {
    const url = customUrl || getDriversApiUrl();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to load drivers");
    }

    allDrivers = result.data || [];
    filteredDrivers = [...allDrivers];

    currentDriverPagination = result.pagination || null;

    if (currentDriverPagination) {
      currentPage = currentDriverPagination.current_page || currentPage;
      ROWS_PER_PAGE = currentDriverPagination.per_page || 5;
    }

    await loadDriverStats();

    renderDriverTable(filteredDrivers);
    renderBackendDriverPagination(currentDriverPagination);
    updateBackendDriverSelectionText(currentDriverPagination);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    showActionPopupMessage(error.message || "Unable to load drivers.", "error");
  } finally {
    hideGlobalLoader();
  }
}

function getDriversApiUrl() {
  const params = new URLSearchParams();

  params.set("page", currentPage);
  params.set("per_page", ROWS_PER_PAGE || 5);

  if (currentSearchTerm && currentSearchTerm.trim() !== "") {
    params.set("search", currentSearchTerm.trim());
  }

  if (currentStatusFilter === "active") {
    params.set("approval_status", "approved");
  }

  if (currentStatusFilter === "pending") {
    params.set("approval_status", "pending");
  }
  if (currentStatusFilter === "rejected") {
    params.set("approval_status", "rejected");
  }
  if (currentStatusFilter === "suspended") {
    params.set("approval_status", "suspended");
  }

  return `${API_BASE_URL}/admin/drivers?${params.toString()}`;
}

async function loadDriversFromApi() {
  await fetchDrivers(getDriversApiUrl());
}


/* =========================
   SETUP SEARCH INPUT
========================= */
function setupSearch() {
  const searchInput = document.getElementById("driverSearchInput");
  const searchBtn = document.getElementById("driverSearchBtn");

  if (!searchInput || !searchBtn) return;

  searchBtn.addEventListener("click", function () {
    currentSearchTerm = searchInput.value.trim();
    currentPage = 1;
    loadDriversFromApi();
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      currentSearchTerm = searchInput.value.trim();
      currentPage = 1;
      loadDriversFromApi();
    }
  });

  searchInput.addEventListener("input", function () {
    if (this.value.trim() === "") {
      currentSearchTerm = "";
      currentPage = 1;
      loadDriversFromApi();
    }
  });
}


/* =========================
   SETUP STATUS FILTER
========================= */
function setupStatusFilter() {
  const filterBtn = document.getElementById("driverStatusFilterBtn");
  const filterText = document.getElementById("driverStatusFilterText");
  const dropdownMenu = document.getElementById("driverStatusDropdownMenu");

  if (!filterBtn || !filterText || !dropdownMenu) return;

  filterBtn.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  };

  document.querySelectorAll(".driverStatusOption").forEach((option) => {
    option.onclick = async function (e) {
      e.preventDefault();
      e.stopPropagation();

      currentStatusFilter = this.dataset.status || "all";
      currentPage = 1;

      filterText.textContent = this.textContent.trim();
      dropdownMenu.classList.add("hidden");

      await fetchDrivers();
    };
  });

  document.onclick = function (e) {
    if (!e.target.closest("#driverStatusFilterWrap")) {
      dropdownMenu.classList.add("hidden");
    }
  };
}
document.addEventListener("DOMContentLoaded", function () {
  setupSearch();
  setupStatusFilter();
} );

/* =========================
   RENDER CURRENT PAGE
========================= */
function renderCurrentPage() {
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;

  const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex);

  renderDriverTable(paginatedDrivers);
  updateSelectionText(startIndex, paginatedDrivers.length);
  renderPaginationNumbers();
  updatePrevNextButtons();
}

/* =========================
   UPDATE FOOTER TEXT
========================= */
function updateSelectionText(startIndex, currentPageCount) {
  const selectionText = document.getElementById("driverDirectorySelectionText");
  if (!selectionText) return;

  const totalFiltered = filteredDrivers.length;

  if (totalFiltered === 0) {
    selectionText.textContent = "0 of 0 row(s) selected";
    return;
  }

  const endRow = startIndex + currentPageCount;
  selectionText.textContent = `${endRow} of ${totalFiltered} row(s) selected`;
}

/* =========================
   SETUP PAGINATION BUTTONS
========================= */
function setupPagination() {
  const prevBtn = document.getElementById("paginationPrev");
  const nextBtn = document.getElementById("paginationNext");

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        renderCurrentPage();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      const totalPages = Math.ceil(filteredDrivers.length / ROWS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderCurrentPage();
      }
    });
  }
}

/* =========================
   RENDER PAGINATION NUMBERS
========================= */
function renderPaginationNumbers() {
  const paginationNumbers = document.getElementById("paginationNumbers");
  if (!paginationNumbers) return;

  paginationNumbers.innerHTML = "";

  const totalPages = Math.ceil(filteredDrivers.length / ROWS_PER_PAGE);

  if (totalPages === 0) return;

  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      paginationNumbers.appendChild(createPageButton(i, i === currentPage));
    }
    return;
  }

  if (currentPage <= 2) {
    paginationNumbers.appendChild(createPageButton(1, currentPage === 1));
    paginationNumbers.appendChild(createPageButton(2, currentPage === 2));
    paginationNumbers.appendChild(createDots());
    paginationNumbers.appendChild(createPageButton(totalPages - 1, false));
    paginationNumbers.appendChild(createPageButton(totalPages, currentPage === totalPages));
    return;
  }

  if (currentPage >= totalPages - 1) {
    paginationNumbers.appendChild(createPageButton(1, currentPage === 1));
    paginationNumbers.appendChild(createPageButton(2, false));
    paginationNumbers.appendChild(createDots());
    paginationNumbers.appendChild(createPageButton(totalPages - 1, currentPage === totalPages - 1));
    paginationNumbers.appendChild(createPageButton(totalPages, currentPage === totalPages));
    return;
  }

  paginationNumbers.appendChild(createPageButton(1, false));
  paginationNumbers.appendChild(createDots());
  paginationNumbers.appendChild(createPageButton(currentPage, true));
  paginationNumbers.appendChild(createDots());
  paginationNumbers.appendChild(createPageButton(totalPages, false));
}

/* =========================
   CREATE PAGE BUTTON
========================= */
function createPageButton(pageNumber, isActive) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = pageNumber;

  if (isActive) {
    btn.className = "w-[24px] h-[24px] cursor-pointer rounded-[4px] border border-[#30BBC7] text-[#30BBC7] text-[12px]";
  } else {
    btn.className = "w-[24px] h-[24px] cursor-pointer rounded-[4px] border border-[#D0D5DD] text-[#11313B] text-[12px]";
  }

  btn.addEventListener("click", function () {
    currentPage = pageNumber;
    renderCurrentPage();
  });

  return btn;
}

/* =========================
   CREATE PAGINATION DOTS
========================= */
function createDots() {
  const span = document.createElement("span");
  span.textContent = "...";
  span.className = "text-[#7C8AA0] text-[12px]";
  return span;
}

/* =========================
   UPDATE PREV AND NEXT BUTTONS
========================= */
function updatePrevNextButtons() {
  const prevBtn = document.getElementById("paginationPrev");
  const nextBtn = document.getElementById("paginationNext");
  const totalPages = Math.ceil(filteredDrivers.length / ROWS_PER_PAGE);

  if (prevBtn) {
    prevBtn.disabled = currentPage === 1 || totalPages === 0;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  }
}

/* =========================
   RENDER DRIVER STATS
========================= */
async function fetchDriverStats() {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load driver stats");
  }

  return result.data;
}

function renderDriverStats(stats = {}) {
  const totalEl = document.getElementById("totalDriversValue");
  const pendingEl = document.getElementById("pendingDriversValue");
  const approvedEl = document.getElementById("approvedDriversValue");
  const suspendedEl = document.getElementById("suspendedDriversValue");
  const rejectedEl = document.getElementById("rejectedDriversValue");
  const ratingEl = document.getElementById("avgRatingValue");

  if (totalEl) totalEl.textContent = Number(stats.total_drivers || 0).toLocaleString();
  if (pendingEl) pendingEl.textContent = Number(stats.awaiting_approval || 0).toLocaleString();
  if (approvedEl) approvedEl.textContent = Number(stats.approved_drivers || 0).toLocaleString();
  if (suspendedEl) suspendedEl.textContent = Number(stats.suspended || 0).toLocaleString();
  if (rejectedEl) rejectedEl.textContent = Number(stats.rejected || 0).toLocaleString();
  if (ratingEl) ratingEl.textContent = Number(stats.average_ratings || 0).toFixed(1);
}

async function loadDriverStats() {
  try {
    const stats = await fetchDriverStats();
    renderDriverStats(stats);
  } catch (error) {
    console.error("Driver stats error:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadDriverStats();
});

function updateBackendDriverSelectionText(pagination) {
  const selectionText = document.getElementById("driverDirectorySelectionText");
  if (!selectionText || !pagination) return;

  selectionText.textContent =
    `${pagination.from || 0}-${pagination.to || 0} of ${pagination.total || 0} row(s) selected`;
}

function updateDriverPageUrl(page) {
  window.history.pushState(
    null,
    "",
    `#drivers?page=${page}`
  );
}

function renderBackendDriverPagination(pagination) {
  const paginationNumbers = document.getElementById("paginationNumbers");
  const prevBtn = document.getElementById("paginationPrev");
  const nextBtn = document.getElementById("paginationNext");

  if (!paginationNumbers || !pagination) return;

  paginationNumbers.innerHTML = "";

  const activePage = pagination.current_page || 1;
  const lastPage = pagination.last_page || 1;
  const maxVisiblePages = 10;

  const currentGroup = Math.ceil(activePage / maxVisiblePages);
  const startPage = (currentGroup - 1) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, lastPage);

  const arrowClass =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  const activePageClass =
    "w-[28px] h-[28px] rounded-[6px] cursor-pointer border border-[#30BBC7] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-semibold";

  const normalPageClass =
    "w-[28px] h-[28px] rounded-[6px] cursor-pointer text-[#11313B] text-[13px] font-medium";

  if (prevBtn) {
    prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left text-[11px]"></i>`;
    prevBtn.className = arrowClass;
    prevBtn.disabled = activePage <= 1;

    prevBtn.onclick = function () {
      if (activePage <= 1) return;

      currentPage = activePage - 1;
      updateDriverPageUrl(currentPage);
      fetchDrivers(getDriversApiUrl());
    };
  }

  for (let page = startPage; page <= endPage; page++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = page;
    btn.className = page === activePage ? activePageClass : normalPageClass;

    btn.onclick = function () {
      currentPage = page;
      updateDriverPageUrl(page);
      fetchDrivers(getDriversApiUrl());
    };

    paginationNumbers.appendChild(btn);
  }

  if (nextBtn) {
    nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right text-[11px]"></i>`;
    nextBtn.className = arrowClass;
    nextBtn.disabled = activePage >= lastPage;

    nextBtn.onclick = function () {
      if (activePage >= lastPage) return;

      currentPage = activePage + 1;
      updateDriverPageUrl(currentPage);
      fetchDrivers(getDriversApiUrl());
    };
  }
}

/* =========================
   RENDER DRIVER TABLE
========================= */
function renderDriverTable(drivers) {
  const tableBody = document.getElementById("driverDirectoryTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  tableBody.classList.add("min-h-[360px]");

  drivers.forEach((driver, index) => {
    const row = document.createElement("div");
    row.className = `w-full min-h-[56px] flex items-center ${index !== drivers.length - 1 ? "border-b border-black/5" : ""}`;

    const address = driver.address || "No address";
    const rating = Number(driver.average_rating || 0).toFixed(1);
    const deliveries = driver.total_deliveries ?? 0;
    const earnings = formatCurrency(driver.total_earnings || 0);
    const licenseExpiry = formatDate(driver.license_expiry);
    const approvalBadge = getDriverApprovalBadge(driver);
    const ratingBarWidth = getRatingBarWidth(driver.average_rating || 0);

    const driverProfileId =
      driver.driver_profile_id ||
      driver.profile_id ||
      driver.id;

    row.innerHTML = `
      <div class="w-[115px] px-[8px] py-[10px] text-[#11313B] text-[12px] leading-[16px] font-medium break-words">${escapeHTML(driver.name || "No Name")}</div>

      <div class="w-[115px] px-[8px] py-[10px] text-[#11313B] text-[12px] leading-[16px] font-medium break-words">${escapeHTML(driver.email || "No Email")}</div>

      <div class="w-[160px] px-[8px] py-[10px] text-[#11313B] text-[12px] leading-[16px] font-medium break-words">${escapeHTML(address)}</div>

      <div class="w-[88px] px-[8px] py-[10px] flex flex-col gap-[4px]">
        <span class="w-[61px] h-[2px] rounded-[10px] bg-[#E5E7EB] overflow-hidden">
          <span class="block h-full rounded-[10px] bg-[#30BBC7]" style="width: ${ratingBarWidth};"></span>
        </span>
        <span class="text-[#11313B] text-[12px] leading-[16px] font-medium">${rating}</span>
      </div>

      <div class="w-[92px] px-[8px] py-[10px] text-[#11313B] text-[12px]">${deliveries}</div>

      <div class="w-[96px] px-[8px] py-[10px] text-[#11313B] text-[12px]">${earnings}</div>

      <div class="w-[132px] px-[8px] py-[10px]">${approvalBadge}</div>

      <div class="w-[108px] px-[8px] py-[10px] text-[#11313B] text-[12px]">${licenseExpiry}</div>

      <div class="w-[95px] px-[8px] py-[10px]">
        <button
          type="button"
          class="viewDriverBtn inline-flex items-center cursor-pointer gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#EAFBFD] text-[#30BBC7] text-[12px] font-medium"
          data-driver-id="${escapeHTML(driverProfileId)}"
        >
          <i class="fa-solid fa-eye text-[11px] "></i>
          View
        </button>
      </div>
    `;

    tableBody.appendChild(row);
  });

  attachViewButtonEvents();
}

/* =========================
   GET STATUS BADGE
========================= */

function getDriverApprovalBadge(driver) {
  const isApproved = driver?.all_steps_approved === true;

  if (isApproved) {
    return `
      <span class="inline-flex items-center gap-[6px] px-[8px] h-[24px] rounded-full bg-[#EAF8F1] text-[#3BB273] text-[12px] leading-[16px] font-medium">
        <span class="w-[18px] h-[18px] rounded-full bg-[#3BB273] text-white flex items-center justify-center text-[10px]">✓</span>
        Approved
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center gap-[6px] px-[8px] h-[24px] rounded-full bg-[#FDECEF] text-[#E57373] text-[12px] leading-[16px] font-medium">
      <span class="w-[18px] h-[18px] rounded-full bg-[#E57373] text-white flex items-center justify-center text-[10px]">×</span>
      Not Approved
    </span>
  `;
}

/* =========================
   GET DOCUMENT BADGE
========================= */
function getDocumentBadge(isVerified) {
  if (isVerified) {
    return `
      <span class="inline-flex items-center gap-[6px] px-[8px] h-[24px] rounded-full bg-[#EAF8F1] text-[#3BB273] text-[12px] leading-[16px] font-medium">
        <span class="w-[18px] h-[18px] rounded-full bg-[#3BB273] text-white flex items-center justify-center text-[10px]">✓</span>
        Verified
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center gap-[6px] px-[8px] h-[24px] rounded-full bg-[#FFF8EE] text-[#F2B66D] text-[12px] leading-[16px] font-medium">
      <span class="w-[18px] h-[18px] rounded-full border border-[#F2B66D] flex items-center justify-center text-[10px]">↻</span>
      Pending
    </span>
  `;
}

/* =========================
   GET RATING BAR WIDTH
========================= */
function getRatingBarWidth(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${(safeRating / 5) * 100}%`;
}

/* =========================
   FORMAT CURRENCY
========================= */
function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

/* =========================
   FORMAT DATE
========================= */
function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/* =========================
   ESCAPE HTML
========================= */
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   SET CURRENT YEAR IN FOOTER
========================= */
function setCurrentYear() {
  const yearEl = document.getElementById("footerCurrentYear");
  if (!yearEl) return;

  const currentYear = new Date().getFullYear();
  yearEl.textContent = currentYear;
}

/* =========================
   RUN ON LOAD
========================= */
setCurrentYear();
/* =========================
   START APP
========================= */
fetchDrivers();

// ** ========================= DRIVER DETAILS =======================================**/

// const APP_BASE_URL = API_BASE_URL.replace("/api", "");

let pendingDriverProfiles = [];
let pendingDocuments = [];
let selectedDriverProfile = null;



async function fetchDriverDetailsById(driverId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Driver details failed: ${response.status}`);
    }

    if (!result.success || !result.data) {
      throw new Error(result.message || "Driver details returned no data");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching driver details:", error);
    showActionPopupMessage(error.message || "Unable to load driver details.", "error");
    return null;
  }
}

/* ================= UPDATE DRIVERS DETAILS  ================= */

let allDocuments = [];

/* ================= OPEN DRIVER DETAILS ================= */
async function openDriverDetails(driverProfileId, updateUrl = true) {
    showGlobalLoader();
  const profile = await fetchDriverDetailsById(driverProfileId);

  if (!profile) return;

  selectedDriverProfile = profile;
  selectedDriverProfile.was_driver_approved_before =
  profile.approval_status === "approved";

  renderDriverInformation(profile);
  renderDriverPerformance(profile);
  renderDriverKycReview(profile);
  renderDriverDocumentsFromProfile(profile);

  updatePersonalInfoButtonsState();
  updateVehicleInfoButtonsState();

  showDashboardSection("driverDetailsSection", false);

  resetSidebarMenuStyles();
  activateSidebarMenu(
    "sidebarDriversLink",
    "sidebarDriversIcon",
    "sidebarDriversText"
  );

  if (updateUrl) {
    window.location.hash = `drivers/details/${driverProfileId}`;
  }
  hideGlobalLoader();
}
/* ================= RENDER DRIVER INFORMATION CARD ================= */
function renderDriverInformation(profile) {
  const user = profile.user || {};

  const name =
    profile.legal_name ||
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") ||
    "No Name";

  const joinedDate = user.created_at ? formatDate(user.created_at) : "N/A";
  const phone = user.phone || "N/A";
  const email = user.email || "N/A";
  const address = buildFullAddress(user);
  const documentStatusText = getOverallDocumentStatus(profile);
  const avatar =
  profile.selfie_photo_url ||
  user.driver_profile?.selfie_photo_url ||
  user.profile_photo_url ||
  user.profile_image_url ||
  user.profile_photo ||
  "assets/images/profile icon.png";

  const nameEl = document.getElementById("driverInformationName");
  const memberSinceEl = document.getElementById("driverInformationMemberSince");
  const phoneEl = document.getElementById("driverInformationPhoneText");
  const emailEl = document.getElementById("driverInformationEmailText");
  const addressEl = document.getElementById("driverInformationAddressText");
  const avatarEl = document.getElementById("driverInformationAvatar");

  if (nameEl) nameEl.textContent = name;
  if (memberSinceEl) memberSinceEl.textContent = `Member Since: ${joinedDate}`;
  if (phoneEl) phoneEl.textContent = phone;
  if (emailEl) emailEl.textContent = email;
  if (addressEl) addressEl.textContent = address;
  if (avatarEl) avatarEl.src = avatar;

  updateBadge(
    document.getElementById("driverInformationStatus"),
    mapApprovalStatus(profile.approval_status)
  );

  updateBadge(
    document.getElementById("driverInformationDocumentStatusValue"),
    documentStatusText
  );

  const reasonCard = document.getElementById("driverDeactivationReasonCard");
  const reasonText = document.getElementById("driverDeactivationReasonText");

  if (profile.deactivation_reason) {
    if (reasonCard) reasonCard.classList.remove("hidden");
    if (reasonText) reasonText.textContent = profile.deactivation_reason;
  } else {
    if (reasonCard) reasonCard.classList.add("hidden");
    if (reasonText) reasonText.textContent = "--";
  }
  renderDriverTopStatus(profile);
  setupAddressSeeMore();
  renderDriverPerformance(profile);
}
/* ================= BUILD FULL ADDRESS ================= */
function setupAddressSeeMore() {
  const addressText = document.getElementById("driverInformationAddressText");
  const btn = document.getElementById("driverAddressSeeMoreBtn");

  if (!addressText || !btn) return;

  setTimeout(() => {
    const isOverflowing = addressText.scrollHeight > addressText.clientHeight;

    if (isOverflowing) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  }, 50);

  btn.onclick = function () {
    addressText.classList.toggle("line-clamp-2");
    btn.textContent = addressText.classList.contains("line-clamp-2")
      ? "See more"
      : "See less";
  };
}

/* ================= DRIVER STATUS BADGE ADDRESS ================= */
function renderDriverTopStatus(profile) {
  const badge = document.getElementById("driverDetailsTopStatusBadge");
  if (!badge) return;

  const kycState = getDriverApprovalState(profile);

  const isApproved =
    profile?.is_approved === true &&
    String(profile?.approval_status || "").toLowerCase() === "approved" &&
    kycState.isApproved &&
    !kycState.isRejected;

  if (isApproved) {
    badge.className =
      "inline-flex items-center gap-[8px] h-[38px] px-[16px] rounded-[999px] bg-[#EAF8F1] text-[#3BB273] text-[15px] font-bold";
    badge.innerHTML = `<i class="fa-solid fa-circle-check text-[14px]"></i> Approved`;
    return;
  }

  badge.className =
    "inline-flex items-center gap-[8px] h-[38px] px-[16px] rounded-[999px] bg-[#FDECEF] text-[#E57373] text-[15px] font-bold";
  badge.innerHTML = `<i class="fa-solid fa-circle-xmark text-[14px]"></i> Not Approved`;
}

function getDriverApprovalState(profile) {
  const approvedStatuses = ["approved", "verified", "completed"];
  const rejectedStatuses = ["rejected", "failed"];

  const personalStatus = String(
    profile?.kyc_review?.personal_info?.status || "pending"
  ).toLowerCase();

  const vehicleStatus = String(
    profile?.kyc_review?.vehicle_info?.status || "pending"
  ).toLowerCase();

  const documentsData = profile?.kyc_review?.documents || {};
  const documentItems = documentsData.items || [];

  const personalApproved = approvedStatuses.includes(personalStatus);
  const vehicleApproved = approvedStatuses.includes(vehicleStatus);

  const documentsApproved =
    documentsData.all_verified === true ||
    (
      documentItems.length > 0 &&
      documentItems.every((doc) =>
        approvedStatuses.includes(String(doc.status || "").toLowerCase())
      )
    );

  const isRejected =
    rejectedStatuses.includes(personalStatus) ||
    rejectedStatuses.includes(vehicleStatus) ||
    documentItems.some((doc) =>
      rejectedStatuses.includes(String(doc.status || "").toLowerCase())
    );

  return {
    isApproved: personalApproved && vehicleApproved && documentsApproved,
    isRejected
  };
}

/* ================= RENDER PERFORMANCE CARD ================= */
function renderDriverPerformance(profile) {
  const earnings = profile?.earnings || {};

  const rawRating =
    profile?.rating || 0;

  const rawDeliveries =
    earnings?.total_deliveries || 0;

  const rawEarnings =
    earnings?.total_earnings || 0;

  const rawCompletedPayouts =
    earnings?.total_paid_out || 0;

  const ratingEl = document.getElementById("driverPerformanceRatingsValue");
  const deliveriesEl = document.getElementById("driverPerformanceDeliveriesValue");
  const earningsEl = document.getElementById("driverPerformanceEarningsValue");
  const completedPayoutsEl = document.getElementById("driverPerformanceSendersValue");

  if (ratingEl) {
    ratingEl.textContent = Number(rawRating || 0).toFixed(1);
  }

  if (deliveriesEl) {
    deliveriesEl.textContent = Number(rawDeliveries || 0).toLocaleString();
  }

  if (earningsEl) {
    earningsEl.textContent =
      `$${Number(rawEarnings || 0).toLocaleString()}`;
  }

  if (completedPayoutsEl) {
    completedPayoutsEl.textContent =
      `$${Number(rawCompletedPayouts || 0).toLocaleString()}`;
  }
}

/* ================= DOCUMENT VERIFICATION CARD ================= */
function renderDocumentVerificationCard(profile) {
  if (!profile) return;

  const approvedStatuses = ["approved", "verified", "completed"];
  const rejectedStatuses = ["rejected", "failed"];

  const personalStatus = (
    profile?.kyc_review?.personal_info?.status || "pending"
  ).toLowerCase();

  const vehicleStatus = (
    profile?.kyc_review?.vehicle_info?.status || "pending"
  ).toLowerCase();

  const documents = profile?.kyc_review?.documents?.items || [];

  const allDocumentsApproved =
    documents.length > 0 &&
    documents.every((doc) =>
      approvedStatuses.includes((doc.status || "").toLowerCase())
    );

  const anyDocumentRejected = documents.some((doc) =>
    rejectedStatuses.includes((doc.status || "").toLowerCase())
  );

  updateDocumentVerificationItem(
    "driverPersonalVerificationStatus",
    personalStatus
  );

  updateDocumentVerificationItem(
    "driverVehicleVerificationStatus",
    vehicleStatus
  );

  let complianceStatus = "pending";

  if (allDocumentsApproved) {
    complianceStatus = "approved";
  } else if (anyDocumentRejected) {
    complianceStatus = "rejected";
  }

  updateDocumentVerificationItem(
    "driverComplianceVerificationStatus",
    complianceStatus
  );

  const personalApproved = approvedStatuses.includes(personalStatus);
const vehicleApproved = approvedStatuses.includes(vehicleStatus);
const complianceApproved = approvedStatuses.includes(complianceStatus);

const allVerificationCompleted =
  personalApproved && vehicleApproved && complianceApproved;

const shouldNotifyDriver = !allVerificationCompleted;

updateNotifyDriverButton(shouldNotifyDriver);
}

/* ================= UPDATE DOCUMENT VERIFICATION ITEM ================= */
function updateDocumentVerificationItem(elementId, status) {
  const element = document.getElementById(elementId);

  if (!element) return;

  const safeStatus = (status || "pending").toLowerCase();

  const approvedStatuses = ["approved", "verified", "completed"];
  const rejectedStatuses = ["rejected", "failed"];

  if (approvedStatuses.includes(safeStatus)) {
    element.className =
      "inline-flex items-center gap-[5px] h-[28px] px-[10px] rounded-full bg-[#EAF8F1] text-[#3BB273] text-[12px] font-semibold shrink-0";

    element.innerHTML = `
      <i class="fa-solid fa-circle-check text-[13px]"></i>
      Verified
    `;

    return;
  }

  if (rejectedStatuses.includes(safeStatus)) {
    element.className =
      "inline-flex items-center gap-[5px] h-[28px] px-[10px] rounded-full bg-[#FDECEF] text-[#E57373] text-[12px] font-semibold shrink-0";

    element.innerHTML = `
      <i class="fa-solid fa-circle-xmark text-[13px]"></i>
      Rejected
    `;

    return;
  }

  element.className =
    "inline-flex items-center gap-[5px] h-[28px] px-[10px] rounded-full bg-[#FFF8EE] text-[#F2B66D] text-[12px] font-semibold shrink-0";

  element.innerHTML = `
    <i class="fa-solid fa-clock text-[13px]"></i>
    Pending
  `;
}

/* ================= UPDATE NOTIFY DRIVER BUTTON ================= */
function updateNotifyDriverButton(shouldNotifyDriver) {
  const notifyBtn = document.getElementById("notifyDriverComplianceBtn");
  const itemsWrap = document.getElementById("driverVerificationItems");

  if (!notifyBtn || !itemsWrap) return;

  if (shouldNotifyDriver) {
    notifyBtn.style.display = "block";

    itemsWrap.classList.remove("gap-[30px]");
    itemsWrap.classList.add("gap-[14px]");

  } else {
    notifyBtn.style.display = "none";

    itemsWrap.classList.remove("gap-[14px]");
    itemsWrap.classList.add("gap-[30px]");
  }
}

function renderDriverKycReview(profile) {
  const kycLevelEl = document.getElementById("driverKycLevelBadge");

  if (kycLevelEl) {
    kycLevelEl.textContent = `KYC Level ${profile.kyc_level ?? 0}`;
  }

  renderPersonalInformationRow(profile);
  renderVehicleInformationRow(profile);
  renderDocumentVerificationCard(profile);
}

/* ================= RENDER DOCUMENTS LIST ================= */
function renderDriverDocuments(driverProfileId) {
  const documentsList = document.getElementById("reviewDocumentsList");
  const emptyState = document.getElementById("reviewDocumentsEmptyState");

  if (!documentsList) return;

  documentsList.innerHTML = "";

  const driverDocs = allDocuments.filter((doc) => doc.driver_profile_id === driverProfileId);

  const documentOrder = [
    "license_front",
    "license_back",
    "selfie_photo",
    "vehicle_registration",
    "insurance_proof",
    "background_check"
  ];

  const sortedDocuments = [...driverDocs].sort((a, b) => {
    const aIndex = documentOrder.indexOf(a.document_type);
    const bIndex = documentOrder.indexOf(b.document_type);
    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;
    return safeA - safeB;
  });

  if (!sortedDocuments.length) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  sortedDocuments.forEach((doc) => {
    documentsList.appendChild(createSingleDocumentRow(doc));
  });

  attachDocumentViewEvents();
  attachSingleDocumentActionEvents();
}

/* ================= CREATE SINGLE DOCUMENT ROW ================= */
function createSingleDocumentRow(doc) {
  const fileUrl = getDocumentUrl(doc.file_path);
  const status = (doc.verification_status || "pending").toLowerCase();
  const isApproved = status === "approved" || status === "verified" || status === "completed";
  const isRejected = status === "rejected" || status === "failed";

  const row = document.createElement("div");
  row.className = "documentRow w-full rounded-[12px] border border-[#E5E7EB] p-[14px] flex items-center justify-between gap-[16px]";

  row.innerHTML = `
    <div class="flex items-center gap-[14px] min-w-0 flex-1">
      <div class="w-[92px] h-[92px] rounded-[10px] overflow-hidden bg-[#F1F5F8] border border-[#E5E7EB] shrink-0 flex items-center justify-center">
        ${buildDocumentPreviewContent(doc)}
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-[#11313B] text-[15px] leading-[22px] font-semibold break-words">
          ${escapeHTML(formatDocumentType(doc.document_type))}
        </p>

        <p class="mt-[4px] text-[#7C8AA0] text-[13px] leading-[18px] font-medium break-all">
          ${escapeHTML(doc.file_name || "No file name")}
        </p>

        <div class="mt-[6px] flex flex-wrap items-center gap-[10px] text-[#7C8AA0] text-[12px] leading-[16px] font-medium">
          <span>${escapeHTML((doc.mime_type || "").toUpperCase() || "FILE")}</span>
          <span>${formatFileSize(doc.file_size)}</span>
          <span>Expiry: ${formatDate(doc.expiry_date)}</span>
        </div>

        <div class="mt-[10px]">
          <button
            type="button"
            class="documentViewBtn cursor-pointer h-[34px] px-[14px] rounded-[8px] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-medium"
            data-file-url="${escapeHTML(fileUrl)}"
            data-doc-title="${escapeHTML(formatDocumentType(doc.document_type))}"
          >
            View
          </button>
        </div>
      </div>
    </div>

    <div class="shrink-0 flex items-center gap-[10px]">
      <span class="documentStatusBadge ${getDocumentStatusClass(status)}">
        ${escapeHTML(capitalize(status))}
      </span>

      <button
        type="button"
        class="documentApproveBtn h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
          isApproved
            ? "bg-[#3BB273] text-white cursor-not-allowed opacity-80"
            : isRejected
            ? "bg-[#F3F4F6] text-[#98A2B3] cursor-not-allowed"
            : "bg-[#EAF8F1] text-[#3BB273] cursor-pointer"
        }"
        data-document-id="${escapeHTML(doc.id)}"
        ${isApproved || isRejected ? "disabled" : ""}
      >
        ${isApproved ? "Approved" : "Approve"}
      </button>

      <button
        type="button"
        class="documentRejectBtn h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
          isRejected
            ? "bg-[#E57373] text-white cursor-not-allowed opacity-80"
            : isApproved
            ? "bg-[#F3F4F6] text-[#98A2B3] cursor-not-allowed"
            : "bg-[#FDECEF] text-[#E57373] cursor-pointer"
        }"
        data-document-id="${escapeHTML(doc.id)}"
        ${isApproved || isRejected ? "disabled" : ""}
      >
        ${isRejected ? "Rejected" : "Reject"}
      </button>
    </div>
  `;

  return row;
}

/* ================= BUILD DOCUMENT PREVIEW CONTENT ================= */
function buildDocumentPreviewContent(doc) {
  const fileUrl = getDocumentUrl(doc.file_path);
  const mime = (doc.mime_type || "").toLowerCase();
  const fallbackImage = getDocumentPreviewImage(doc.document_type);

  if (mime.includes("image")) {
    return `
      <img
        src="${escapeHTML(fileUrl)}"
        alt="${escapeHTML(formatDocumentType(doc.document_type))}"
        class="w-full h-full object-cover"
      />
    `;
  }

  return `
    <img
      src="${escapeHTML(fallbackImage)}"
      alt="${escapeHTML(formatDocumentType(doc.document_type))}"
      class="w-full h-full object-cover"
    />
  `;
}

/* ================= GET DOCUMENT PREVIEW IMAGE ================= */
function getDocumentPreviewImage(documentType) {
  const type = (documentType || "").toLowerCase();

  if (type === "selfie_photo") return "assets/images/profile icon.png";
  if (type === "license_front") return "assets/images/driver-lincence-front.png";
  if (type === "license_back") return "assets/images/driver-lincence-back.png";
  if (type === "vehicle_registration") return "assets/images/vehicle-registration.png";
  if (type === "insurance_proof") return "assets/images/vehicle-insurance.png";
  if (type === "background_check") return "assets/images/document-placeholder.png";

  return "assets/images/document-placeholder.png";
}


/* ================= ATTACH VIEW BUTTON EVENTS FROM DRIVER LIST ================= */
function attachViewButtonEvents() {
  const viewButtons = document.querySelectorAll(".viewDriverBtn");

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const driverId = (btn.dataset.driverId || "").trim();

      if (!driverId) {
        showActionPopupMessage("Driver ID is missing.", "error");
        return;
      }

      await openDriverDetails(driverId);
    });
  });
}

/* ================= ATTACH DOCUMENT VIEW EVENTS ================= */
let documentPreviewImages = [];
let currentDocumentPreviewIndex = 0;

function attachDocumentViewEvents() {
  const viewButtons = document.querySelectorAll(".documentViewBtn");

  viewButtons.forEach((btn) => {
    btn.onclick = function () {
      const title = this.dataset.docTitle || "Document Preview";

      const images = [];

      const frontUrl = this.dataset.frontUrl || "";
      const backUrl = this.dataset.backUrl || "";
      const fileUrl = this.dataset.fileUrl || "";

      if (frontUrl) {
        images.push({
          url: frontUrl,
          title: "License Front"
        });
      }

      if (backUrl) {
        images.push({
          url: backUrl,
          title: "License Back"
        });
      }

      if (!frontUrl && !backUrl && fileUrl) {
        images.push({
          url: fileUrl,
          title
        });
      }



      if (!images.length) {
        showActionPopupMessage("No file URL available yet for this document.", "error");
        return;
      }

      openDocumentPreview(images, title);
    };
  });
}

/* ================= OPEN DOCUMENT PREVIEW MODAL, OPTIONAL ================= */
function openDocumentPreview(images, title = "Document Preview") {
  const overlay = document.getElementById("documentPreviewOverlay");
  const titleEl = document.getElementById("documentPreviewTitle");

  if (!overlay || !titleEl) return;

  documentPreviewImages = images;
  currentDocumentPreviewIndex = 0;

  titleEl.textContent = title;

  renderCurrentDocumentPreviewImage();
  overlay.classList.remove("hidden");
}

function renderCurrentDocumentPreviewImage() {
  const content = document.getElementById("documentPreviewContent");
  const counter = document.getElementById("documentPreviewCounter");
  const titleEl = document.getElementById("documentPreviewTitle");

  if (!content) return;

  const currentItem = documentPreviewImages[currentDocumentPreviewIndex];

  if (!currentItem?.url) return;

  if (titleEl) {
    titleEl.textContent = currentItem.title || "Document Preview";
  }

  if (counter) {
    counter.textContent = `${currentDocumentPreviewIndex + 1} of ${documentPreviewImages.length}`;
  }

  const showArrows = documentPreviewImages.length > 1;

 content.innerHTML = `
  <div class="w-full min-h-[500px] flex items-center justify-between gap-[24px]">
    <button
      type="button"
      id="inlinePreviewPrevBtn"
      class="${documentPreviewImages.length <= 1 ? "hidden" : "flex"} w-[44px] h-[44px] shrink-0 rounded-full bg-white shadow text-[#11313B] items-center justify-center cursor-pointer"
    >
      <i class="fa-solid fa-chevron-left"></i>
    </button>

    <div class="flex-1 flex items-center justify-center">
      <img
        src="${escapeHTML(currentItem.url)}"
        alt="${escapeHTML(currentItem.title || "Document")}"
        class="max-w-full max-h-[70vh] object-contain rounded-[12px]"
      />
    </div>

    <button
      type="button"
      id="inlinePreviewNextBtn"
      class="${documentPreviewImages.length <= 1 ? "hidden" : "flex"} w-[44px] h-[44px] shrink-0 rounded-full bg-white shadow text-[#11313B] items-center justify-center cursor-pointer"
    >
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
`;

const inlinePrevBtn = document.getElementById("inlinePreviewPrevBtn");
const inlineNextBtn = document.getElementById("inlinePreviewNextBtn");

if (inlinePrevBtn) {
  inlinePrevBtn.onclick = function () {
    currentDocumentPreviewIndex =
      currentDocumentPreviewIndex === 0
        ? documentPreviewImages.length - 1
        : currentDocumentPreviewIndex - 1;

    renderCurrentDocumentPreviewImage();
  };
}

if (inlineNextBtn) {
  inlineNextBtn.onclick = function () {
    currentDocumentPreviewIndex =
      currentDocumentPreviewIndex === documentPreviewImages.length - 1
        ? 0
        : currentDocumentPreviewIndex + 1;

    renderCurrentDocumentPreviewImage();
  };
}
}
//* ================= CLOSE DOCUMENT PREVIEW MODAL ================= */
function closeDocumentPreview() {
  const overlay = document.getElementById("documentPreviewOverlay");
  if (overlay) overlay.classList.add("hidden");

  documentPreviewImages = [];
  currentDocumentPreviewIndex = 0;
}

/* ================= ATTACH SINGLE DOCUMENT ACTION EVENTS ================= */
function attachSingleDocumentActionEvents() {
  const approveButtons = document.querySelectorAll(".documentApproveBtn");
  const rejectButtons = document.querySelectorAll(".documentRejectBtn");

  approveButtons.forEach((btn) => {
    btn.addEventListener("click", async function () {
      if (this.disabled) return;

      const documentId = this.dataset.documentId;
      await handleApproveSingleDocument(documentId, this);
    });
  });

  rejectButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (this.disabled) return;

      const documentId = this.dataset.documentId;
      handleRejectSingleDocument(documentId, this);
    });
  });
}
function renderDriverDocumentsFromProfile(profile) {
  const documentsList = document.getElementById("reviewDocumentsList");
  const emptyState = document.getElementById("reviewDocumentsEmptyState");

  if (!documentsList) return;

  documentsList.innerHTML = "";

  const documents = (profile?.kyc_review?.documents?.items || []).filter(Boolean);

  if (!documents.length) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  const licenseFront = documents.find((doc) => doc.type === "license_front");
  const licenseBack = documents.find((doc) => doc.type === "license_back");

  if (licenseFront || licenseBack) {
    documentsList.appendChild(createLicenseDocumentRow(licenseFront, licenseBack, profile));
  }

  documents
    .filter((doc) => doc.type !== "license_front" && doc.type !== "license_back")
    .forEach((doc) => {
      documentsList.appendChild(createDriverKycDocumentRow(doc, profile));
    });

  attachDocumentViewEvents();
  attachSingleDocumentActionEvents();
}


function createLicenseDocumentRow(licenseFront, licenseBack, profile) {
  const frontUrl = licenseFront
    ? getProfileDocumentUrl("license_front", profile, licenseFront)
    : "";

  const backUrl =
  licenseFront?.resource_file?.back ||
  licenseBack?.resource_file?.back ||
  (licenseBack ? getProfileDocumentUrl("license_back", profile, licenseBack) : "");

  const licenseStatus = (licenseFront?.status || "pending").toLowerCase();

const licenseApproved = ["approved", "verified", "completed"].includes(licenseStatus);
const licenseRejected = ["rejected", "failed"].includes(licenseStatus);

  const row = document.createElement("div");
  row.className =
    "documentRow w-full rounded-[12px] border border-[#E5E7EB] p-[14px] flex items-center justify-between gap-[16px]";

  row.innerHTML = `
    <div class="flex items-center gap-[16px] min-w-0 flex-1">
      <div class="grid grid-cols-2 gap-[10px] shrink-0">
        <div class="w-[92px] h-[92px] rounded-[10px] overflow-hidden bg-[#F1F5F8] border border-[#E5E7EB]">
          <img
            src="${escapeHTML(frontUrl || getDocumentPreviewImage("license_front"))}"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="w-[92px] h-[92px] rounded-[10px] overflow-hidden bg-[#F1F5F8] border border-[#E5E7EB]">
          <img
            src="${escapeHTML(backUrl || getDocumentPreviewImage("license_back"))}"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-[#11313B] text-[15px] leading-[22px] font-semibold">
          License
        </p>

        <p class="mt-[4px] text-[#7C8AA0] text-[13px] leading-[18px] font-medium">
          Front and back of driver's license
        </p>

        <div class="mt-[8px] flex flex-wrap gap-[8px]">
        <button
  type="button"
  class="documentViewBtn h-[34px] px-[14px] cursor-pointer rounded-[8px] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-medium"
  data-front-url="${escapeHTML(frontUrl || "")}"
  data-back-url="${escapeHTML(backUrl || "")}"
  data-doc-title="Driver License"
>
  View
</button>
        </div>
      </div>
    </div>

    <div class="shrink-0 flex items-center gap-[10px]">
      <span class="documentStatusBadge ${
        licenseApproved
          ? "inline-flex items-center justify-center px-[10px] h-[28px] rounded-full bg-[#EAF8F1] text-[#3BB273] text-[12px] leading-[16px] font-medium"
          : licenseRejected
          ? "inline-flex items-center justify-center px-[10px] h-[28px] rounded-full bg-[#FDECEF] text-[#E57373] text-[12px] leading-[16px] font-medium"
          : "inline-flex items-center justify-center px-[10px] h-[28px] rounded-full bg-[#FFF8EE] text-[#F2B66D] text-[12px] leading-[16px] font-medium"
      }">
        ${licenseApproved ? "Approved" : licenseRejected ? "Rejected" : "Pending"}
      </span>

      <button
  type="button"
  class="documentApproveBtn h-[38px] cursor-pointer px-[14px] rounded-[8px] text-[13px] font-medium ${
    licenseApproved
      ? "bg-[#3BB273] text-white cursor-not-allowed opacity-80"
      : "bg-[#EAF8F1] text-[#3BB273] cursor-pointer"
  }"
  data-document-id="${escapeHTML(licenseFront?.id || "")}"
  ${licenseApproved ? "disabled" : ""}
>
  ${licenseApproved ? "Approved" : "Approve"}
</button>

<button
  type="button"
  class="documentRejectBtn h-[38px] cursor-pointer px-[14px] rounded-[8px] text-[13px] font-medium ${
    licenseRejected
      ? "bg-[#E57373] text-white cursor-not-allowed opacity-80"
      : "bg-[#FDECEF] text-[#E57373] cursor-pointer"
  }"
  data-document-id="${escapeHTML(licenseFront?.id || "")}"
  ${licenseRejected ? "disabled" : ""}
>
  ${licenseRejected ? "Rejected" : "Reject"}
</button>
    </div>
  `;

  return row;
}


function createDriverKycDocumentRow(doc, profile) {
    
  const status = (doc.status || "pending").toLowerCase();

  const fileUrl =
    doc.resource_file ||
    doc.file_url ||
    doc.url ||
    getProfileDocumentUrl(doc.type, profile, doc);

  const isUploaded = doc.uploaded === true;
  const documentId = doc.id || "";

  const isApproved =
    status === "approved" ||
    status === "verified" ||
    status === "completed";

  const isRejected =
    status === "rejected" ||
    status === "failed";

  const row = document.createElement("div");
  row.className =
    "documentRow w-full rounded-[12px] border border-[#E5E7EB] p-[14px] flex items-center justify-between gap-[16px]";

  row.innerHTML = `
    <div class="flex items-center gap-[14px] min-w-0 flex-1">
      <div class="w-[92px] h-[92px] rounded-[10px] overflow-hidden bg-[#F1F5F8] border border-[#E5E7EB] shrink-0 flex items-center justify-center">
        ${
          fileUrl
            ? `<img src="${escapeHTML(fileUrl)}" alt="${escapeHTML(doc.name || "Document")}" class="w-full h-full object-cover" />`
            : `<img src="${escapeHTML(getDocumentPreviewImage(doc.type))}" alt="${escapeHTML(doc.name || "Document")}" class="w-full h-full object-cover" />`
        }
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-[#11313B] text-[15px] leading-[22px] font-semibold break-words">
          ${escapeHTML(doc.name || formatDocumentType(doc.type))}
        </p>

        <p class="mt-[4px] text-[#7C8AA0] text-[13px] leading-[18px] font-medium break-words">
          ${escapeHTML(doc.description || "No description")}
        </p>

        <div class="mt-[6px] flex flex-wrap items-center gap-[10px] text-[#7C8AA0] text-[12px] leading-[16px] font-medium">
          <span>Uploaded: ${isUploaded ? "Yes" : "No"}</span>
          <span>Uploaded at: ${doc.uploaded_at || "N/A"}</span>
        </div>

        <div class="mt-[10px]">
          <button
            type="button"
            class="documentViewBtn h-[34px] px-[14px] rounded-[8px] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-medium ${fileUrl ? "cursor-pointer" : "cursor-not-allowed opacity-60"}"
            data-file-url="${escapeHTML(fileUrl || "")}"
            data-doc-title="${escapeHTML(doc.name || formatDocumentType(doc.type))}"
            ${!fileUrl ? "disabled" : ""}
          >
            View
          </button>
        </div>
      </div>
    </div>

    <div class="shrink-0 flex items-center gap-[10px]">
      <span class="documentStatusBadge ${getDocumentStatusClass(status)}">
        ${escapeHTML(capitalize(status))}
      </span>

      <button
  type="button"
  class="documentApproveBtn h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
    isApproved
      ? "bg-[#3BB273] text-white cursor-not-allowed opacity-80"
      : "bg-[#EAF8F1] text-[#3BB273] cursor-pointer"
  }"
  data-document-id="${escapeHTML(documentId)}"
  ${isApproved ? "disabled" : ""}
>
  ${isApproved ? "Approved" : "Approve"}
</button>

<button
  type="button"
  class="documentRejectBtn h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
    isRejected
      ? "bg-[#E57373] text-white cursor-not-allowed opacity-80"
      : "bg-[#FDECEF] text-[#E57373] cursor-pointer"
  }"
  data-document-id="${escapeHTML(documentId)}"
  ${isRejected ? "disabled" : ""}
>
  ${isRejected ? "Rejected" : "Reject"}
</button>
    </div>
  `;

  return row;
}


function getProfileDocumentUrl(type, profile, doc = {}) {
  const safeType = String(type || "").toLowerCase();

  const resourceFile = doc?.resource_file;

  if (resourceFile && typeof resourceFile === "object") {
    if (safeType === "license_front") {
      return resourceFile.front || "";
    }

    if (safeType === "license_back") {
      return resourceFile.back || "";
    }

    return resourceFile.url || "";
  }

  const resourceString = resourceFile ? String(resourceFile) : "";

  if (resourceString && !resourceString.includes("placehold.net")) {
    return resourceString;
  }

  if (safeType === "selfie_photo") {
    return (
      profile.selfie_photo_url ||
      profile.user?.driver_profile?.selfie_photo_url ||
      ""
    );
  }

  if (safeType === "license_front") {
    return (
      profile.drivers_license_image_url ||
      profile.user?.driver_profile?.drivers_license_image_url ||
      resourceString ||
      ""
    );
  }

  if (safeType === "license_back") {
    return (
      profile.license_back_url ||
      profile.user?.driver_profile?.license_back_url ||
      resourceString ||
      ""
    );
  }

  if (safeType === "vehicle_registration") {
    return (
      profile.vehicle_registration_url ||
      profile.user?.driver_profile?.vehicle_registration_url ||
      resourceString ||
      ""
    );
  }

  if (safeType === "insurance_proof") {
    return (
      profile.insurance_url ||
      profile.user?.driver_profile?.insurance_url ||
      resourceString ||
      ""
    );
  }

  return resourceString || "";
}
/* ================= APPROVE SINGLE DOCUMENT API ================= */
async function approveSingleDocument(documentId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/documents/${documentId}/approve`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Approve document failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error approving document:", error);
    throw error;
  }
}

/* ================= REJECT SINGLE DOCUMENT API ================= */
async function rejectSingleDocument(documentId, rejectionReason) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/documents/${documentId}/reject`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason
        })
      }
    );

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Reject document failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error rejecting document:", error);
    throw error;
  }
}


let approvedDriverHistory = new Set();

/* ================= HANDLE APPROVE SINGLE DOCUMENT ================= */
async function handleApproveSingleDocument(documentId, clickedButton) {
  if (!documentId) {
    showActionPopupMessage("Document ID is missing.", "error");
    return;
  }

  const row = clickedButton.closest(".documentRow");
  if (!row) {
    showActionPopupMessage("Document row not found.", "error");
    return;
  }

  const approveBtn = row.querySelector(".documentApproveBtn");
  const rejectBtn = row.querySelector(".documentRejectBtn");

  try {
    if (approveBtn) {
      approveBtn.disabled = true;
      approveBtn.textContent = "Approving...";
    }

    if (rejectBtn) {
      rejectBtn.disabled = true;
    }

    await approveSingleDocument(documentId);

    await refreshSelectedDriverAfterKycChange(
      "Document has been approved."
    );
  } catch (error) {
    if (approveBtn) {
      approveBtn.disabled = false;
      approveBtn.textContent = "Approve";
    }

    if (rejectBtn) {
      rejectBtn.disabled = false;
    }

    showActionPopupMessage(error.message || "Failed to approve document.", "error");
  }
}

/* ================= HANDLE OPEN DOCUMENT REJECT MODAL ================= */
function handleRejectSingleDocument(documentId, clickedButton) {
  if (!documentId) {
    showActionPopupMessage("Document ID is missing.", "error");
    return;
  }

  openRejectReasonModal("document", clickedButton, documentId);
}

/* ================= SUBMIT DOCUMENT REJECT ================= */
async function submitDocumentReject(reason) {
  const documentId = rejectModalContext.documentId;
  const triggerButton = rejectModalContext.triggerButton;

  if (!documentId) {
    showActionPopupMessage("Document ID is missing.", "error");
    return;
  }

  const row = triggerButton ? triggerButton.closest(".documentRow") : null;

  if (!row) {
    showActionPopupMessage("Document row not found.", "error");
    return;
  }

  const submitBtn = document.getElementById("submitRejectReasonBtn");
  const rejectBtn = row.querySelector(".documentRejectBtn");
  const approveBtn = row.querySelector(".documentApproveBtn");

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    if (rejectBtn) {
      rejectBtn.disabled = true;
      rejectBtn.textContent = "Rejecting...";
    }

    if (approveBtn) {
      approveBtn.disabled = true;
    }

    await rejectSingleDocument(documentId, reason);

    closeRejectReasonModal();

    await refreshSelectedDriverAfterKycChange(
      "Document has been rejected.", "reject"
    );
  } catch (error) {
    if (approveBtn) {
      approveBtn.disabled = false;
    }

    if (rejectBtn) {
      rejectBtn.disabled = false;
      rejectBtn.textContent = "Reject";
    }

    showActionPopupMessage(error.message || "Failed to reject document.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Rejection";
    }
  }
}


/* ================= SET DRIVER DETAILS BACK BUTTON ================= */
function getDriverPageFromUrl() {
  const fullHash = window.location.hash || "#drivers";
  const queryString = fullHash.includes("?") ? fullHash.split("?")[1] : "";
  const params = new URLSearchParams(queryString);

  return params.get("page") || 1;
}

function setupDriverDetailsBackButton() {
  const backBtn = document.getElementById("driverDetailsBackBtn");

  if (!backBtn) return;

  backBtn.onclick = async function () {
    showGlobalLoader();

    try {
      showDashboardSection("driversManagementSection", false);

      resetSidebarMenuStyles();
      activateSidebarMenu(
        "sidebarDriversLink",
        "sidebarDriversIcon",
        "sidebarDriversText"
      );

      window.history.pushState(null, "", `#drivers?page=${currentPage}`);

      await fetchDrivers(getDriversApiUrl());
    } catch (error) {
      console.error("Back to drivers error:", error);
      showActionPopupMessage("Unable to refresh drivers list.", "error");
    } finally {
      hideGlobalLoader();
    }
  };
}

async function openDriverDetails(driverProfileId, updateUrl = true) {
  const profile = await fetchDriverDetailsById(driverProfileId);

  if (!profile) return;

  selectedDriverProfile = profile;

  renderDriverInformation(profile);
  renderDriverPerformance(profile);
  renderDriverKycReview(profile);
  renderDriverDocumentsFromProfile(profile);

  updatePersonalInfoButtonsState();
  updateVehicleInfoButtonsState();

  showDashboardSection("driverDetailsSection", false);

  resetSidebarMenuStyles();
  activateSidebarMenu(
    "sidebarDriversLink",
    "sidebarDriversIcon",
    "sidebarDriversText"
  );

  if (updateUrl) {
  const currentPage = getDriverPageFromUrl();
  window.history.pushState(
    null,
    "",
    `#drivers/details/${driverProfileId}?page=${currentPage}`
  );
}
}
document.addEventListener("DOMContentLoaded", setupDriverDetailsBackButton);


/* ================= SET DOCUMENT PREVIEW CLOSE BUTTON ================= */
function setupDocumentPreviewClose() {
  const closeBtn = document.getElementById("closeDocumentPreviewBtn");
  const overlay = document.getElementById("documentPreviewOverlay");
  const prevBtn = document.getElementById("documentPreviewPrevBtn");
  const nextBtn = document.getElementById("documentPreviewNextBtn");

  if (closeBtn) {
    closeBtn.onclick = closeDocumentPreview;
  }

  if (overlay) {
    overlay.onclick = function (event) {
      if (event.target === overlay) {
        closeDocumentPreview();
      }
    };
  }

  if (prevBtn) {
    prevBtn.onclick = function () {
      if (currentDocumentPreviewIndex > 0) {
        currentDocumentPreviewIndex--;
      } else {
        currentDocumentPreviewIndex = documentPreviewImages.length - 1;
      }

      renderCurrentDocumentPreviewImage();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = function () {
      if (currentDocumentPreviewIndex < documentPreviewImages.length - 1) {
        currentDocumentPreviewIndex++;
      } else {
        currentDocumentPreviewIndex = 0;
      }

      renderCurrentDocumentPreviewImage();
    };
  }
}

/* ================= BUILD FULL ADDRESS ================= */
function buildFullAddress(user) {
  const addressParts = [
    user.address1,
    user.address2,
    user.city,
    user.state,
    user.zip_code
  ].filter(Boolean);

  return addressParts.length ? addressParts.join(", ") : "No address";
}

/* ================= BUILD VEHICLE TEXT ================= */
function buildVehicleText(profile) {
  const vehicleParts = [
    capitalize(profile.vehicle_type),
    profile.vehicle_year,
    capitalize(profile.vehicle_make),
    capitalize(profile.vehicle_model)
  ].filter(Boolean);

  return vehicleParts.length ? vehicleParts.join(" ") : "No vehicle information";
}

/* ================= MAP APPROVAL STATUS ================= */
function mapApprovalStatus(status) {
  const safe = (status || "").toLowerCase();

  if (safe === "approved") return "Approved";
  if (safe === "rejected") return "Rejected";
  if (safe === "disabled") return "Disabled";
  if (safe === "deactivated") return "Deactivated";

  return "Pending";
}

/* ================= GET OVERALL DOCUMENT STATUS ================= */
function getOverallDocumentStatus(profile) {
  const documents = profile?.kyc_review?.documents || {};
  const documentItems = documents.items || [];

  const hasRejectedDocument = documentItems.some((doc) =>
    ["rejected", "failed"].includes(String(doc.status || "").toLowerCase())
  );

  if (hasRejectedDocument) return "Rejected";

  if (documents.all_verified === true) return "Verified";

  if (documentItems.length > 0) return "Pending";

  return "Not Submitted";
}

/* ================= UPDATE BADGE STYLES ================= */
function updateBadge(element, statusText) {
  if (!element) return;

  element.textContent = statusText;
  element.className = "inline-flex items-center justify-center px-[8px] h-[24px] rounded-full text-[12px] leading-[16px] font-medium";

  const safe = (statusText || "").toLowerCase();

  if (safe === "approved" || safe === "verified" || safe === "active") {
    element.classList.add("bg-[#EAF8F1]", "text-[#3BB273]");
    return;
  }

  if (safe === "rejected" || safe === "deactivated" || safe === "disabled" || safe === "not submitted") {
    element.classList.add("bg-[#FDECEF]", "text-[#E57373]");
    return;
  }

  element.classList.add("bg-[#FFF8EE]", "text-[#F2B66D]");
}

/* ================= GET DOCUMENT STATUS CLASS ================= */
function getDocumentStatusClass(status) {
  const safe = (status || "").toLowerCase();

  if (safe === "approved" || safe === "verified" || safe === "completed") {
    return "inline-flex items-center justify-center px-[10px] h-[28px] rounded-full bg-[#EAF8F1] text-[#3BB273] text-[12px] leading-[16px] font-medium";
  }

  if (safe === "rejected" || safe === "failed") {
    return "inline-flex items-center justify-center px-[10px] h-[28px] rounded-full bg-[#FDECEF] text-[#E57373] text-[12px] leading-[16px] font-medium";
  }

  return "inline-flex items-center justify-center px-[10px] h-[28px] rounded-full bg-[#FFF8EE] text-[#F2B66D] text-[12px] leading-[16px] font-medium";
}

/* ================= SET PERFORMANCE METRIC ================= */
function setMetric(barId, textId, value) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);

  if (bar) bar.style.width = `${safeValue}%`;
  if (text) text.textContent = `${safeValue}%`;
}

/* ================= FORMAT DOCUMENT TYPE ================= */
function formatDocumentType(type) {
  const map = {
    license_front: "License Front",
    license_back: "License Back",
    selfie_photo: "Selfie Photo",
    vehicle_registration: "Vehicle Registration",
    insurance_proof: "Insurance Proof",
    background_check: "Background Check"
  };

  return map[type] || capitalize(String(type || "").replaceAll("_", " "));
}

/* ================= GET DOCUMENT URL ================= */
function getDocumentUrl(filePath) {
  if (!filePath) return "";
  return `${APP_BASE_URL}/storage/${filePath}`;
}

/* ================= FORMAT DATE ================= */
function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/* ================= FORMAT CURRENCY ================= */
function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

/* ================= FORMAT FILE SIZE ================= */
function formatFileSize(bytes) {
  const value = Number(bytes) || 0;

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/* ================= CAPITALIZE TEXT ================= */
function capitalize(value) {
  if (!value) return "";
  return String(value)
    .split(" ")
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : "")
    .join(" ");
}

/* ================= ESCAPE HTML ================= */
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= SHOW ACTION POPUP MESSAGE ================= */
function showActionPopupMessage(message, type = "success") {
  let popup = document.getElementById("driverActionPopupMessage");

  const baseClass =
    "fixed top-[24px] right-[24px] z-[3000] min-w-[260px] max-w-[360px] px-[16px] py-[14px] rounded-[10px] shadow-[0_12px_30px_rgba(0,0,0,0.12)] text-[14px] leading-[20px] font-medium transition-opacity duration-300";

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "driverActionPopupMessage";
    document.body.appendChild(popup);
  }

  if (type === "error" || type === "reject") {
    popup.className = `${baseClass} bg-[#FDECEF] text-[#E57373]`;
  } else {
    popup.className = `${baseClass} bg-[#EAF8F1] text-[#3BB273]`;
  }

  popup.textContent = message;
  popup.classList.remove("hidden");
  popup.style.opacity = "1";

  clearTimeout(popup._hideTimer);

  popup._hideTimer = setTimeout(() => {
    popup.style.opacity = "0";

    setTimeout(() => {
      popup.classList.add("hidden");
    }, 300);
  }, 2500);
}
/* ================= PERSONAL INFO APPROVE / REJECT ================= */

function renderPersonalInformationRow(profile) {
  const container = document.getElementById("reviewPersonalInfoContainer");
  if (!container) return;

  const user = profile.user || {};

  const name =
    profile.legal_name ||
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") ||
    "No Name";

  const status = (profile?.kyc_review?.personal_info?.status || "pending").toLowerCase();
  const isApproved = ["approved", "verified", "completed"].includes(status);
  const isRejected = ["rejected", "failed"].includes(status);

  container.innerHTML = `
    <div class="w-full rounded-[12px] border border-[#E5E7EB] p-[16px] flex items-start justify-between gap-[20px]">
      <div class="flex-1">
        <div class="grid grid-cols-2 gap-x-[30px] gap-y-[12px]">
          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">Legal Name</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-words">${escapeHTML(name)}</p>
          </div>

          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">Phone Number</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-all">${escapeHTML(user.phone || "N/A")}</p>
          </div>

          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">Email</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-all">${escapeHTML(user.email || "N/A")}</p>
          </div>

          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">Driver ID</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-all">${escapeHTML(profile.id || "N/A")}</p>
          </div>
        </div>
      </div>

      <div class="shrink-0 flex items-center gap-[10px]">
        <span class="${getDocumentStatusClass(status)}">${escapeHTML(capitalize(status))}</span>

        <button
          id="approvePersonalInfoBtn"
          type="button"
          class="h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
            isApproved
              ? "bg-[#3BB273] text-white cursor-not-allowed opacity-80"
              : "bg-[#EAF8F1] text-[#3BB273] cursor-pointer"
          }"
          ${isApproved ? "disabled" : ""}
        >
          ${isApproved ? "Approved" : "Approve"}
        </button>

        <button
          id="rejectPersonalInfoBtn"
          type="button"
          class="h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
            isRejected
              ? "bg-[#E57373] text-white cursor-not-allowed opacity-80"
              : "bg-[#FDECEF] text-[#E57373] cursor-pointer"
          }"
          ${isRejected ? "disabled" : ""}
        >
          ${isRejected ? "Rejected" : "Reject"}
        </button>
      </div>
    </div>
  `;

  setupPersonalInfoActionButtons();
}


async function approvePersonalInformation(driverProfileId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/drivers/${driverProfileId}/kyc/personal-info/approve`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Approve personal info failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error approving personal information:", error);
    throw error;
  }
}

async function rejectPersonalInformation(driverProfileId, reason) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/drivers/${driverProfileId}/kyc/personal-info/reject`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({ reason })
      }
    );

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Reject personal info failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error rejecting personal information:", error);
    throw error;
  }
}

function updatePersonalInfoStateLocally(status, rejectionReason = null) {
  if (!selectedDriverProfile) return;

  selectedDriverProfile.personal_info_status = status;
  selectedDriverProfile.personal_info_rejection_reason = rejectionReason;

  const profileIndex = pendingDriverProfiles.findIndex(
    item => item.id === selectedDriverProfile.id
  );

  if (profileIndex !== -1) {
    pendingDriverProfiles[profileIndex].personal_info_status = status;
    pendingDriverProfiles[profileIndex].personal_info_rejection_reason = rejectionReason;
  }
}

function refreshPersonalInfoUI() {
  if (!selectedDriverProfile) return;
  renderDriverInformation(selectedDriverProfile);
  renderDriverKycReview(selectedDriverProfile);
  updatePersonalInfoButtonsState();
}

function updatePersonalInfoButtonsState() {
  if (!selectedDriverProfile) return;

  const approveBtn = document.getElementById("approvePersonalInfoBtn");
  const rejectBtn = document.getElementById("rejectPersonalInfoBtn");

  const status = (
    selectedDriverProfile?.kyc_review?.personal_info?.status || "pending"
  ).toLowerCase();

  if (!approveBtn || !rejectBtn) return;

  approveBtn.disabled = false;
  rejectBtn.disabled = false;

  approveBtn.textContent = "Approve";
  rejectBtn.textContent = "Reject";

  approveBtn.className =
    "h-[38px] px-[14px] rounded-[8px] bg-[#EAF8F1] text-[#3BB273] text-[13px] font-medium cursor-pointer";

  rejectBtn.className =
    "h-[38px] px-[14px] rounded-[8px] bg-[#FDECEF] text-[#E57373] text-[13px] font-medium cursor-pointer";

  if (status === "approved") {
    approveBtn.textContent = "Approved";
    approveBtn.disabled = true;

    approveBtn.className =
      "h-[38px] px-[14px] rounded-[8px] bg-[#3BB273] text-white text-[13px] font-medium cursor-not-allowed opacity-80";

    rejectBtn.disabled = false;
  }

  if (status === "rejected") {
    rejectBtn.textContent = "Rejected";
    rejectBtn.disabled = true;

    rejectBtn.className =
      "h-[38px] px-[14px] rounded-[8px] bg-[#E57373] text-white text-[13px] font-medium cursor-not-allowed opacity-80";

    approveBtn.disabled = false;
  }
}

async function handleApprovePersonalInfo() {
  const driverProfileId = selectedDriverProfile?.id;

  if (!driverProfileId) {
    showActionPopupMessage("Driver profile ID is missing.", "error");
    return;
  }

  const approveBtn = document.getElementById("approvePersonalInfoBtn");
  const rejectBtn = document.getElementById("rejectPersonalInfoBtn");

  try {
    if (approveBtn) {
      approveBtn.disabled = true;
      approveBtn.textContent = "Approving...";
    }

    if (rejectBtn) rejectBtn.disabled = true;

    await approvePersonalInformation(driverProfileId);

    await refreshSelectedDriverAfterKycChange(
  "Personal information has been approved."
);

    refreshPersonalInfoUI();
    showActionPopupMessage("Personal information has been approved.");
  } catch (error) {
    if (approveBtn) {
      approveBtn.disabled = false;
      approveBtn.textContent = "Approve";
    }

    if (rejectBtn) rejectBtn.disabled = false;

    showActionPopupMessage(error.message || "Failed to approve personal information.", "error");
  }
}

function handleRejectPersonalInfo() {
  if (!selectedDriverProfile || !selectedDriverProfile.id) {
    showActionPopupMessage("No driver profile selected.", "error");
    return;
  }

  openRejectReasonModal("personal");
}

function handleRejectPersonalInfo() {
  if (!selectedDriverProfile || !selectedDriverProfile.id) {
    showActionPopupMessage("No driver profile selected.", "error");
    return;
  }

  openRejectReasonModal("personal");
}

async function submitPersonalReject(reason) {
  const driverProfileId = selectedDriverProfile?.id;

  if (!driverProfileId) {
    showActionPopupMessage("Driver profile ID is missing.", "error");
    return;
  }

  const submitBtn = document.getElementById("submitRejectReasonBtn");

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    await rejectPersonalInformation(driverProfileId, reason);
    await refreshSelectedDriverAfterKycChange();

    selectedDriverProfile.kyc_review.personal_info.status = "rejected";
    selectedDriverProfile.kyc_review.personal_info.rejection_reason = reason;

    refreshPersonalInfoUI();
    closeRejectReasonModal();
    showActionPopupMessage("Personal information has been rejected.", "reject");
  } catch (error) {
    showActionPopupMessage(error.message || "Failed to reject personal information.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Rejection";
    }
  }
}

function setupPersonalInfoActionButtons() {
  const approveBtn = document.getElementById("approvePersonalInfoBtn");
  const rejectBtn = document.getElementById("rejectPersonalInfoBtn");

  if (approveBtn) approveBtn.addEventListener("click", handleApprovePersonalInfo);
  if (rejectBtn) rejectBtn.addEventListener("click", handleRejectPersonalInfo);
}

/* ================= VEHICLE INFO APPROVE / REJECT ================= */
function renderVehicleInformationRow(profile) {
  const container = document.getElementById("reviewVehicleInfoContainer");
  if (!container) return;

  const status = (profile?.kyc_review?.vehicle_info?.status || "pending").toLowerCase();
  const isApproved = ["approved", "verified", "completed"].includes(status);
  const isRejected = ["rejected", "failed"].includes(status);

  container.innerHTML = `
    <div class="w-full rounded-[12px] border border-[#E5E7EB] p-[16px] flex items-start justify-between gap-[20px]">
      <div class="flex-1">
        <div class="grid grid-cols-2 gap-x-[30px] gap-y-[12px]">
          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">Vehicle Type</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-words">${escapeHTML(buildVehicleText(profile))}</p>
          </div>

          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">License Plate</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-words">${escapeHTML(profile.vehicle_plate_number || "N/A")}</p>
          </div>

          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">Driver's License Number</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-words">${escapeHTML(profile.drivers_license_number || "N/A")}</p>
          </div>

          <div>
            <p class="text-[#7C8AA0] text-[12px] font-medium">License Expiry</p>
            <p class="mt-[4px] text-[#11313B] text-[14px] font-medium break-words">${escapeHTML(formatDate(profile.drivers_license_expiry))}</p>
          </div>
        </div>
      </div>

      <div class="shrink-0 flex items-center gap-[10px]">
        <span class="${getDocumentStatusClass(status)}">${escapeHTML(capitalize(status))}</span>

        <button
  id="approveVehicleInfoBtn"
  type="button"
  class="h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
    isApproved
      ? "bg-[#3BB273] text-white cursor-not-allowed opacity-80"
      : "bg-[#EAF8F1] text-[#3BB273] cursor-pointer"
  }"
  ${isApproved ? "disabled" : ""}
>
  ${isApproved ? "Approved" : "Approve"}
</button>

<button
  id="rejectVehicleInfoBtn"
  type="button"
  class="h-[38px] px-[14px] rounded-[8px] text-[13px] font-medium ${
    isRejected
      ? "bg-[#E57373] text-white cursor-not-allowed opacity-80"
      : "bg-[#FDECEF] text-[#E57373] cursor-pointer"
  }"
  ${isRejected ? "disabled" : ""}
>
  ${isRejected ? "Rejected" : "Reject"}
</button>
      </div>
    </div>
  `;

  setupVehicleInfoActionButtons();
}
async function approveVehicleInformation(driverProfileId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/drivers/${driverProfileId}/kyc/vehicle-info/approve`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Approve vehicle info failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error approving vehicle information:", error);
    throw error;
  }
}

async function rejectVehicleInformation(driverProfileId, reason) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/drivers/${driverProfileId}/kyc/vehicle-info/reject`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({ reason })
      }
    );

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Reject vehicle info failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error rejecting vehicle information:", error);
    throw error;
  }
}

function updateVehicleInfoStateLocally(status, rejectionReason = null) {
  if (!selectedDriverProfile) return;

  selectedDriverProfile.vehicle_info_status = status;
  selectedDriverProfile.vehicle_info_rejection_reason = rejectionReason;

  const profileIndex = pendingDriverProfiles.findIndex(
    item => item.id === selectedDriverProfile.id
  );

  if (profileIndex !== -1) {
    pendingDriverProfiles[profileIndex].vehicle_info_status = status;
    pendingDriverProfiles[profileIndex].vehicle_info_rejection_reason = rejectionReason;
  }
}

function refreshVehicleInfoUI() {
  if (!selectedDriverProfile) return;
  renderDriverInformation(selectedDriverProfile);
  renderDriverKycReview(selectedDriverProfile);
  updateVehicleInfoButtonsState();
}

function updateVehicleInfoButtonsState() {
  if (!selectedDriverProfile) return;

  const approveBtn = document.getElementById("approveVehicleInfoBtn");
  const rejectBtn = document.getElementById("rejectVehicleInfoBtn");

  const status = (
    selectedDriverProfile?.kyc_review?.vehicle_info?.status || "pending"
  ).toLowerCase();

  if (!approveBtn || !rejectBtn) return;

  approveBtn.disabled = false;
  rejectBtn.disabled = false;

  approveBtn.textContent = "Approve";
  rejectBtn.textContent = "Reject";

  approveBtn.className =
    "h-[38px] px-[14px] rounded-[8px] bg-[#EAF8F1] text-[#3BB273] text-[13px] font-medium cursor-pointer";

  rejectBtn.className =
    "h-[38px] px-[14px] rounded-[8px] bg-[#FDECEF] text-[#E57373] text-[13px] font-medium cursor-pointer";

  if (status === "approved" || status === "verified" || status === "completed") {
    approveBtn.textContent = "Approved";
    approveBtn.disabled = true;

    rejectBtn.textContent = "Reject";
    rejectBtn.disabled = false;

    approveBtn.className =
      "h-[38px] px-[14px] rounded-[8px] bg-[#3BB273] text-white text-[13px] font-medium cursor-not-allowed opacity-80";

    rejectBtn.className =
      "h-[38px] px-[14px] rounded-[8px] bg-[#FDECEF] text-[#E57373] text-[13px] font-medium cursor-pointer";
  }

  if (status === "rejected" || status === "failed") {
    rejectBtn.textContent = "Rejected";
    rejectBtn.disabled = true;

    approveBtn.textContent = "Approve";
    approveBtn.disabled = false;

    rejectBtn.className =
      "h-[38px] px-[14px] rounded-[8px] bg-[#E57373] text-white text-[13px] font-medium cursor-not-allowed opacity-80";

    approveBtn.className =
      "h-[38px] px-[14px] rounded-[8px] bg-[#EAF8F1] text-[#3BB273] text-[13px] font-medium cursor-pointer";
  }
}

async function handleApproveVehicleInfo() {
  const driverProfileId = selectedDriverProfile?.id;

  if (!driverProfileId) {
    showActionPopupMessage("Driver profile ID is missing.", "error");
    return;
  }

  const approveBtn = document.getElementById("approveVehicleInfoBtn");
  const rejectBtn = document.getElementById("rejectVehicleInfoBtn");

  try {
    if (approveBtn) {
      approveBtn.disabled = true;
      approveBtn.textContent = "Approving...";
    }

    if (rejectBtn) rejectBtn.disabled = true;

    await approveVehicleInformation(driverProfileId);

    await refreshSelectedDriverAfterKycChange(
  "Vehicle information has been approved."
);
    refreshVehicleInfoUI();
    showActionPopupMessage("Vehicle information has been approved.");
  } catch (error) {
    if (approveBtn) {
      approveBtn.disabled = false;
      approveBtn.textContent = "Approve";
    }

    if (rejectBtn) rejectBtn.disabled = false;

    showActionPopupMessage(error.message || "Failed to approve vehicle information.", "error");
  }
}

function handleRejectVehicleInfo() {
  if (!selectedDriverProfile || !selectedDriverProfile.id) {
    showActionPopupMessage("No driver profile selected.", "error");
    return;
  }

  openRejectReasonModal("vehicle");
}

async function submitVehicleReject(reason) {
  const driverProfileId = selectedDriverProfile?.id;

  if (!driverProfileId) {
    showActionPopupMessage("Driver profile ID is missing.", "error");
    return;
  }

  const submitBtn = document.getElementById("submitRejectReasonBtn");

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    await rejectVehicleInformation(driverProfileId, reason);
    await refreshSelectedDriverAfterKycChange();

    selectedDriverProfile.kyc_review.vehicle_info.status = "rejected";
    selectedDriverProfile.kyc_review.vehicle_info.rejection_reason = reason;

    refreshVehicleInfoUI();
    closeRejectReasonModal();
    showActionPopupMessage("Vehicle information has been rejected.", "reject");
  } catch (error) {
    showActionPopupMessage(error.message || "Failed to reject vehicle information.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Rejection";
    }
  }
}

function setupVehicleInfoActionButtons() {
  const approveBtn = document.getElementById("approveVehicleInfoBtn");
  const rejectBtn = document.getElementById("rejectVehicleInfoBtn");

  if (approveBtn) approveBtn.addEventListener("click", handleApproveVehicleInfo);
  if (rejectBtn) rejectBtn.addEventListener("click", handleRejectVehicleInfo);
}


/* ================= REJECT MODAL STATE ================= */
let rejectModalContext = {
  type: null, // personal | vehicle | document
  documentId: null,
  triggerButton: null
};

/* ================= REJECTION REASONS ================= */
const REJECTION_REASON_OPTIONS = {
  personal: [
    "Name does not match submitted information",
    "Phone number is invalid or missing",
    "Email address is invalid",
    "Address information is incomplete",
    "Personal information is inconsistent"
  ],
  vehicle: [
    "Vehicle type information is invalid",
    "Plate number is invalid or missing",
    "Driver's license number is invalid",
    "License expiry date is invalid",
    "Vehicle information is inconsistent"
  ],
  document: [
    "Document is blurry or unreadable",
    "Wrong document uploaded",
    "Document is expired",
    "Document details do not match profile",
    "Document is incomplete or cropped"
  ],
  driverStatus: [
  "Incomplete verification documents",
  "Driver information does not match submitted documents",
  "Vehicle information is invalid",
  "Failed compliance review",
  "Account does not meet approval requirements"
]
};

/* ================= OPEN REJECT REASON MODAL ================= */
function openRejectReasonModal(type, triggerButton = null, documentId = null) {
  rejectModalContext = {
    type,
    documentId,
    triggerButton
  };

  const overlay = document.getElementById("rejectReasonOverlay");
  const title = document.getElementById("rejectReasonModalTitle");
  const subtitle = document.getElementById("rejectReasonModalSubtitle");
  const select = document.getElementById("rejectReasonSelect");
  const extraNote = document.getElementById("rejectReasonExtraNote");

  if (!overlay || !title || !subtitle || !select || !extraNote) return;

  select.innerHTML = `<option value="">Select reason</option>`;
  extraNote.value = "";

  let readableType = "Item";

  if (type === "personal") readableType = "Personal Information";
  if (type === "vehicle") readableType = "Vehicle Information";
  if (type === "document") readableType = "Document";

  title.textContent = `Reject ${readableType}`;
  subtitle.textContent = `Select a reason for rejecting this ${readableType.toLowerCase()}.`;

  const options = REJECTION_REASON_OPTIONS[type] || [];

  options.forEach((reason) => {
    const option = document.createElement("option");
    option.value = reason;
    option.textContent = reason;
    select.appendChild(option);
  });

  overlay.classList.remove("hidden");
}

/* ================= CLOSE REJECT REASON MODAL ================= */
function closeRejectReasonModal() {
  const overlay = document.getElementById("rejectReasonOverlay");
  const select = document.getElementById("rejectReasonSelect");
  const extraNote = document.getElementById("rejectReasonExtraNote");

  if (overlay) overlay.classList.add("hidden");
  if (select) select.value = "";
  if (extraNote) extraNote.value = "";

  rejectModalContext = {
    type: null,
    documentId: null,
    triggerButton: null
  };
}

/* ================= BUILD FINAL REJECTION REASON ================= */
function buildFinalRejectionReason() {
  const select = document.getElementById("rejectReasonSelect");
  const extraNote = document.getElementById("rejectReasonExtraNote");

  const selectedReason = (select?.value || "").trim();
  const note = (extraNote?.value || "").trim();

  if (!selectedReason) return "";

  if (!note) return selectedReason;

  return `${selectedReason}. ${note}`;
}

/* ================= SETUP REJECT REASON MODAL ================= */
function setupRejectReasonModal() {
  const closeBtn = document.getElementById("closeRejectReasonModalBtn");
  const cancelBtn = document.getElementById("cancelRejectReasonBtn");
  const submitBtn = document.getElementById("submitRejectReasonBtn");
  const overlay = document.getElementById("rejectReasonOverlay");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeRejectReasonModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeRejectReasonModal);
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeRejectReasonModal();
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const finalReason = buildFinalRejectionReason();

      if (!finalReason) {
        showActionPopupMessage("Please select a rejection reason.", "error");
        return;
      }

      if (rejectModalContext.type === "personal") {
        await submitPersonalReject(finalReason);
        return;
      }

      if (rejectModalContext.type === "vehicle") {
        await submitVehicleReject(finalReason);
        return;
      }
      if (rejectModalContext.type === "driverStatus") {
  await submitDriverStatusReject(finalReason);
  return;
}

      if (rejectModalContext.type === "document") {
        await submitDocumentReject(finalReason);
        return;
      }
    });
  }
}

async function approveDriverProfile(driverId) {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}/approve`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to approve driver");
  }

  return result;
}

async function rejectDriverProfile(driverId, reason) {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}/reject`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({ reason })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to reject driver");
  }

  return result;
}

async function submitDriverStatusReject(reason) {
  if (!selectedDriverProfile?.id) {
    showActionPopupMessage("No driver selected.", "error");
    return;
  }

  try {
    await rejectDriverProfile(selectedDriverProfile.id, reason);

    syncDriverStatusEverywhere(
      "rejected",
      "inactive",
      reason
    );

    const freshProfile = await fetchDriverDetailsById(
      selectedDriverProfile.id
    );

    if (freshProfile) {
      selectedDriverProfile = freshProfile;

      renderDriverInformation(freshProfile);
      renderDriverPerformance(freshProfile);
      renderDriverKycReview(freshProfile);
      renderDriverDocumentsFromProfile(freshProfile);
      renderDriverTopStatus(freshProfile);

      updatePersonalInfoButtonsState();
      updateVehicleInfoButtonsState();
      updateDriverStatusActionButtons();
    }

    closeRejectReasonModal();

    showActionPopupMessage(
      "Driver rejected successfully.",
      "reject"
    );
  } catch (error) {
    showActionPopupMessage(
      error.message || "Failed to reject driver.",
      "error"
    );
  }
}


/*==================UPDATE DRIVER STATUS============*/

function renderDriverDocumentVerificationCard(profile) {
  const personalWrap = document.getElementById("driverPersonalVerificationStatus");
  const vehicleWrap = document.getElementById("driverVehicleVerificationStatus");
  const complianceWrap = document.getElementById("driverComplianceVerificationStatus");

  if (!personalWrap || !vehicleWrap || !complianceWrap) return;

  const personalStatus =
    profile?.kyc_review?.personal_info?.status || "pending";

  const vehicleStatus =
    profile?.kyc_review?.vehicle_info?.status || "pending";

  const documents = profile?.kyc_review?.documents || {};
  const documentItems = documents.items || [];

  const hasRejectedDocument = documentItems.some((doc) => {
    const status = String(doc.status || "").toLowerCase();
    return status === "rejected" || status === "failed";
  });

  const allDocumentsVerified =
    documents.all_verified === true ||
    (
      documentItems.length > 0 &&
      documentItems.every((doc) => {
        const status = String(doc.status || "").toLowerCase();
        return status === "approved" || status === "verified" || status === "completed";
      })
    );

  const complianceStatus = hasRejectedDocument
    ? "rejected"
    : allDocumentsVerified
      ? "approved"
      : "pending";

  personalWrap.innerHTML = getMiniVerificationBadge(personalStatus);
  vehicleWrap.innerHTML = getMiniVerificationBadge(vehicleStatus);
  complianceWrap.innerHTML = getMiniVerificationBadge(complianceStatus);
}

function getMiniVerificationBadge(status) {
  const value = String(status || "").toLowerCase();

  if (value === "approved" || value === "verified" || value === "completed") {
    return `
      <span class="inline-flex items-center gap-[6px] h-[28px] px-[10px] rounded-full bg-[#EAF8F1] text-[#3BB273] text-[12px] font-semibold">
        <i class="fa-solid fa-check"></i>
        Verified
      </span>
    `;
  }

  if (value === "rejected" || value === "failed") {
    return `
      <span class="inline-flex items-center gap-[6px] h-[28px] px-[10px] rounded-full bg-[#FDECEF] text-[#E57373] text-[12px] font-semibold">
        <i class="fa-solid fa-xmark"></i>
        Failed
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center gap-[6px] h-[28px] px-[10px] rounded-full bg-[#FFF8EE] text-[#F2B66D] text-[12px] font-semibold">
      <i class="fa-solid fa-clock"></i>
      Pending
    </span>
  `;
}

async function refreshSelectedDriverAfterKycChange(successMessage = "", messageType = "success") {
  showGlobalLoader();

  try {
    const freshProfile = await fetchDriverDetailsById(selectedDriverProfile.id);

    if (!freshProfile) return;

    selectedDriverProfile = freshProfile;

   renderDriverInformation(freshProfile);
renderDriverPerformance(freshProfile);
renderDriverKycReview(freshProfile);
renderDriverDocumentsFromProfile(freshProfile);
renderDriverTopStatus(freshProfile);
renderDriverDocumentVerificationCard(freshProfile);

updatePersonalInfoButtonsState();
updateVehicleInfoButtonsState();
updateDriverStatusActionButtons();

    if (successMessage) {
      showActionPopupMessage(successMessage, messageType);
    }
  } finally {
    hideGlobalLoader();
  }
}

function syncDriverStatusEverywhere(newApprovalStatus, newStatus, reason = null) {
  if (!selectedDriverProfile?.id) return;

  selectedDriverProfile.approval_status = newApprovalStatus;
  selectedDriverProfile.status = newStatus;

  if (newApprovalStatus === "approved") {
    selectedDriverProfile.kyc_review = selectedDriverProfile.kyc_review || {};
    selectedDriverProfile.kyc_review.all_steps_approved = true;
  }

  if (reason) {
    selectedDriverProfile.rejection_reason = reason;
    selectedDriverProfile.deactivation_reason = reason;
  }

  const driverIndex = allDrivers.findIndex((item) => {
    const itemId = item.driver_profile_id || item.profile_id || item.id;
    return itemId === selectedDriverProfile.id;
  });

  if (driverIndex !== -1) {
  const existingDriver = allDrivers[driverIndex];

  allDrivers[driverIndex] = {
    ...existingDriver,

    approval_status: newApprovalStatus,
    status: newStatus,
    is_active: newStatus === "active",

    rejection_reason: reason || null,
    deactivation_reason: reason || null,

    kyc_review: {
      ...(existingDriver.kyc_review || {}),
      all_steps_approved: newApprovalStatus === "approved"
    }
  };
}

  renderDriverInformation(selectedDriverProfile);
  renderDriverTopStatus(selectedDriverProfile);
  updateDriverStatusActionButtons();

  // applyFiltersAndRender();
  renderDriverStats(allDrivers);
}

function setupDriverStatusUpdateButtons() {
  const openBtn = document.getElementById("driverDetailsUpdateStatusBtn");
  const overlay = document.getElementById("updateDriverStatusOverlay");
  const closeBtn = document.getElementById("closeUpdateDriverStatusModalBtn");
  const approveBtn = document.getElementById("approveDriverStatusBtn");
  const rejectBtn = document.getElementById("rejectDriverStatusBtn");

  if (!openBtn || !overlay) return;

  openBtn.onclick = function () {
    updateDriverStatusActionButtons();
    overlay.classList.remove("hidden");
  };

  if (closeBtn) {
    closeBtn.onclick = function () {
      overlay.classList.add("hidden");
    };
  }

  if (approveBtn) {
    approveBtn.onclick = async function () {
      if (!selectedDriverProfile?.id) {
        showActionPopupMessage("No driver selected.", "error");
        return;
      }

      try {
        approveBtn.disabled = true;
        approveBtn.textContent = "Approving...";

        const freshProfile = await fetchDriverDetailsById(selectedDriverProfile.id);

        if (!freshProfile) {
          throw new Error("Unable to fetch latest driver details.");
        }

        const personalApproved =
          freshProfile?.kyc_review?.personal_info?.status === "approved";

        const vehicleApproved =
          freshProfile?.kyc_review?.vehicle_info?.status === "approved";

        const documentsApproved =
          freshProfile?.kyc_review?.documents?.all_verified === true;

        if (!personalApproved || !vehicleApproved || !documentsApproved) {
          showActionPopupMessage(
            "All KYC steps must be approved before final driver approval",
            "error"
          );
          return;
        }

        await approveDriverProfile(freshProfile.id);

        syncDriverStatusEverywhere("approved", "active");

        const approvedProfile = await fetchDriverDetailsById(freshProfile.id);

        if (approvedProfile) {
          selectedDriverProfile = approvedProfile;

          renderDriverInformation(approvedProfile);
          renderDriverPerformance(approvedProfile);
          renderDriverKycReview(approvedProfile);
          renderDriverDocumentsFromProfile(approvedProfile);
          renderDriverTopStatus(approvedProfile);

          updatePersonalInfoButtonsState();
          updateVehicleInfoButtonsState();
          updateDriverStatusActionButtons();
        }

        overlay.classList.add("hidden");
        showActionPopupMessage("Driver approved successfully.", "success");
      } catch (error) {
        showActionPopupMessage(error.message || "Failed to approve driver.", "error");
      } finally {
        approveBtn.disabled = false;
        approveBtn.textContent = "Approve";
      }
    };
  }

  if (rejectBtn) {
    rejectBtn.onclick = function () {
      overlay.classList.add("hidden");
      openRejectReasonModal("driverStatus");
    };
  }
}

function updateDriverStatusActionButtons() {
  const approveBtn = document.getElementById("approveDriverStatusBtn");
  const rejectBtn = document.getElementById("rejectDriverStatusBtn");

  if (!approveBtn || !rejectBtn || !selectedDriverProfile) return;

  const kycState = getDriverApprovalState(selectedDriverProfile);

  const realApprovalStatus = (
    selectedDriverProfile.approval_status || "pending"
  ).toLowerCase();

  approveBtn.disabled = false;
  rejectBtn.disabled = false;

  approveBtn.textContent = "Approve";
  rejectBtn.textContent = "Reject";

  approveBtn.className =
    "w-full h-[42px] rounded-[8px] bg-[#EAF8F1] text-[#3BB273] text-[14px] font-medium cursor-pointer";

  rejectBtn.className =
    "w-full h-[42px] rounded-[8px] bg-[#FDECEF] text-[#E57373] text-[14px] font-medium cursor-pointer";

  if (!kycState.isApproved || kycState.isRejected) {
    approveBtn.disabled = true;
    approveBtn.className =
      "w-full h-[42px] rounded-[8px] bg-[#F3F4F6] text-[#98A2B3] text-[14px] font-medium cursor-not-allowed";
  }

  if (realApprovalStatus === "approved") {
    approveBtn.disabled = true;
    approveBtn.textContent = "Approved";

    approveBtn.className =
      "w-full h-[42px] rounded-[8px] bg-[#3BB273] text-white text-[14px] font-medium cursor-not-allowed opacity-80";

    rejectBtn.disabled = false;
  }

  if (realApprovalStatus === "rejected") {
    rejectBtn.disabled = true;
    rejectBtn.textContent = "Rejected";

    rejectBtn.className =
      "w-full h-[42px] rounded-[8px] bg-[#E57373] text-white text-[14px] font-medium cursor-not-allowed opacity-80";

    approveBtn.disabled = !kycState.isApproved || kycState.isRejected;
  }
}



/* ================= INITIALIZE DRIVER DETAILS PAGE ================= */
async function initializeDriverDetailsPage() {
//   await loadDriverDetailsData();
  setupDriverDetailsBackButton();
  setupDocumentPreviewClose();
  setupPersonalInfoActionButtons();
  setupVehicleInfoActionButtons();
  setupRejectReasonModal();
  setupDriverStatusUpdateButtons();
 
}
initializeDashboardSections();
initializeDriverDetailsPage();
/*=========================END OF DRIVER SECTION=======================*/


/* ================= SENDERS/CUSTOMERS SECTION ============================================ */
let senders = [];
let currentSenderPage = 1;
let currentSenderPagination = null;

function normalizeSenderImage(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const baseUrl = API_BASE_URL.replace("/api", "");

  return `${baseUrl}/storage/${url}`;
}

function getUserImage(user) {
  return normalizeSenderImage(
    user.profile_photo_url ||
    user.profile_photo ||
    user.profile_image_url
  );
}

async function loadSendersFromAPI(page = 1) {
  showGlobalLoader();

  try {
    const searchValue =
      document.getElementById("senderSearchInput")?.value.trim() || "";

    const params = new URLSearchParams();

    params.set("page", page);
    params.set("per_page", 5);

    if (searchValue) {
      params.set("search", searchValue);
    }

    const result = await fetchJSON(
      `${API_BASE_URL}/admin/users?${params.toString()}`
    );

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.message || "Failed to load users");
    }

    senders = result.data.map(mapApiUserToSender);

    currentSenderPagination = result.pagination || null;
    currentSenderPage = currentSenderPagination?.current_page || page;

    renderSenders(senders);
    renderSenderPagination(currentSenderPagination);
  } catch (error) {
    console.error("Users error:", error);
    showActionPopupMessage(error.message || "Unable to load users.", "error");
  } finally {
    hideGlobalLoader();
  }
}


function setupSenderSearch() {
  const input = document.getElementById("senderSearchInput");
  const searchBtn = document.getElementById("senderSearchBtn");

  if (!input || !searchBtn) return;

  searchBtn.addEventListener("click", function () {
    loadSendersFromAPI(1);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      loadSendersFromAPI(1);
    }
  });

  input.addEventListener("input", function () {
    if (this.value.trim() === "") {
      loadSendersFromAPI(1);
    }
  });
}


async function loadSendersFromURL(url) {
    showGlobalLoader();
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to load users");
    }

    senders = (result.data || []).map(mapApiUserToSender);
    currentSenderPagination = result.pagination || null;
    currentSenderPage = currentSenderPagination?.current_page || 1;

    renderSenders(senders);
    renderSenderPagination(currentSenderPagination);
  } catch (error) {
    console.error("Error loading users:", error);
  }
    hideGlobalLoader();
}

function getSenderInitials(firstName, lastName, email) {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();

  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  return (email || "U").charAt(0).toUpperCase();
}
function mapApiUserToSender(user) {
  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || user.email || "No Name";

  return {
    id: user.id,
    firstName,
    lastName,
    name: fullName,
    email: user.email || "N/A",
    phone: user.phone || "N/A",
    address: buildSenderAddress(user),
    status: user.is_active ? "Active" : "Disabled",
    joinDate: formatSenderDate(user.created_at),
    lastActivity: formatSenderDate(user.last_login_at),
    orders: 0,
    role: user.role || "user",
  profileImage: getUserImage(user),
initials: getSenderInitials(firstName, lastName, user.email),
    governmentId: "assets/images/id-card-placeholder.png"
  };
}

function buildSenderAddress(user) {
  return [user.address1, user.address2, user.city, user.state, user.zip_code]
    .filter(Boolean)
    .join(", ") || "No address";
}

function formatSenderDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function getSenderStatusBadge(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") {
    return `<span class="inline-flex items-center justify-center h-[26px] px-[10px] rounded-[6px] bg-[#EAF8F1] text-[#3BB273] text-[12px] font-medium">Active</span>`;
  }

  return `<span class="inline-flex items-center justify-center h-[26px] px-[10px] rounded-[6px] bg-[#FDECEF] text-[#E57373] text-[12px] font-medium">Disabled</span>`;
}

async function loadSenderStats() {
    showGlobalLoader
  try {
    const overviewResponse = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const overviewResult = await overviewResponse.json();

    if (!overviewResponse.ok || overviewResult.success === false) {
      throw new Error(overviewResult.message || "Failed to load overview stats");
    }

    const usersStats = overviewResult.data?.users || {};
    const totalCustomers = Number(usersStats.total_customers || 0);
    const newThisMonth = Number(usersStats.new_users_this_month || 0);

    const customersResponse = await fetch(
      `${API_BASE_URL}/admin/users?role=customer&per_page=1000`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    const customersResult = await customersResponse.json();

    if (!customersResponse.ok || customersResult.success === false) {
      throw new Error(customersResult.message || "Failed to load customer stats");
    }

    const customers = customersResult.data || [];

    const activeCustomers = customers.filter((user) => user.is_active === true).length;
    const disabledCustomers = Math.max(totalCustomers - activeCustomers, 0);

    renderSenderStats({
      totalCustomers,
      activeCustomers,
      disabledCustomers,
      newThisMonth
    });
  } catch (error) {
    console.error("Error loading sender stats:", error);
  }
    hideGlobalLoader();
}

function renderSenders(list = senders) {
  const body = document.getElementById("senderTableBody");
  const countText = document.getElementById("senderCountText");

  if (!body) return;

  body.innerHTML = "";

  list.forEach((sender) => {
    const row = document.createElement("div");

    row.className =
      "w-full h-[58px] flex items-center border-t border-[#E5E7EB] text-[#11313B] text-[12px] overflow-hidden";

    row.innerHTML = `
      <div class="w-[170px] px-[10px] font-semibold flex items-center gap-[8px] min-w-0">
      ${
  sender.profileImage
    ? `
      <img
        src="${sender.profileImage}"
        onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden'); this.nextElementSibling.classList.add('flex');"
        class="w-[28px] h-[28px] rounded-full object-cover shrink-0"
      />

      <div class="hidden w-[28px] h-[28px] rounded-full bg-[#EAFBFD] text-[#30BBC7] items-center justify-center text-[11px] font-bold shrink-0">
        ${sender.initials || "U"}
      </div>
    `
    : `
      <div class="w-[28px] h-[28px] rounded-full bg-[#EAFBFD] text-[#30BBC7] flex items-center justify-center text-[11px] font-bold shrink-0">
        ${sender.initials || "U"}
      </div>
    `
}
        <span class="truncate block">${sender.name}</span>
      </div>

      <div class="w-[190px] px-[10px] min-w-0">
        <p class="truncate">${sender.email}</p>
      </div>

      <div class="w-[230px] px-[10px] min-w-0">
        <p class="line-clamp-2 leading-[16px]">${sender.address}</p>
      </div>

      <div class="w-[120px] px-[10px]">
        ${getSenderStatusBadge(sender.status)}
      </div>

      <div class="w-[130px] px-[10px] whitespace-nowrap">
        ${sender.joinDate}
      </div>

      <div class="w-[140px] px-[10px] whitespace-nowrap">
        ${sender.lastActivity}
      </div>

      <div class="w-[80px] px-[10px]">
        ${sender.orders}
      </div>

      <div class="w-[80px] px-[10px]">
        <button
          type="button"
          class="viewSenderBtn inline-flex items-center cursor-pointer gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#EAFBFD] text-[#30BBC7] text-[12px] font-medium"
          data-id="${sender.id}"
        >
          <i class="fa-solid fa-eye text-[11px] cursor-pointer"></i>
          View
        </button>
      </div>
    `;

    body.appendChild(row);
  });

  if (countText && currentSenderPagination) {
    countText.textContent =
      `${currentSenderPagination.from || 0}-${currentSenderPagination.to || 0} of ${currentSenderPagination.total || list.length} row(s) selected`;
  }

  attachSenderViewEvents();
}

function updateSenderPageUrl(page) {
  window.history.pushState(null, "", `#customers?page=${page}`);
}


function renderSenderPagination(pagination) {
  const paginationWrap = document.getElementById("senderPagination");
  if (!paginationWrap || !pagination) return;

  paginationWrap.innerHTML = "";

  const activePage = pagination.current_page || 1;
  const lastPage = pagination.last_page || 1;
  const maxVisiblePages = 10;

  const currentGroup = Math.ceil(activePage / maxVisiblePages);
  const startPage = (currentGroup - 1) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, lastPage);

  const prevBtn = document.createElement("button");

prevBtn.innerHTML = `
  <i class="fa-solid fa-chevron-left text-[11px]"></i>
`;

prevBtn.disabled = activePage <= 1;

prevBtn.className =
  "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  prevBtn.addEventListener("click", function () {
    if (activePage <= 1) return;

    const page = activePage - 1;
    updateSenderPageUrl(page);
    loadSendersFromAPI(page);
  });

  paginationWrap.appendChild(prevBtn);

  for (let page = startPage; page <= endPage; page++) {
    const pageBtn = document.createElement("button");
    pageBtn.type = "button";
    pageBtn.textContent = page;

    pageBtn.className =
      page === activePage
        ? "w-[28px] h-[28px] rounded-[6px] cursor-pointer border border-[#30BBC7] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-semibold"
        : "w-[28px] h-[28px] rounded-[6px] cursor-pointer text-[#11313B] text-[13px] font-medium";

    pageBtn.addEventListener("click", function () {
      updateSenderPageUrl(page);
      loadSendersFromAPI(page);
    });

    paginationWrap.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");

nextBtn.innerHTML = `
  <i class="fa-solid fa-chevron-right text-[11px]"></i>
`;

nextBtn.disabled = activePage >= lastPage;

nextBtn.className =
  "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  nextBtn.addEventListener("click", function () {
    if (activePage >= lastPage) return;

    const page = activePage + 1;
    updateSenderPageUrl(page);
    loadSendersFromAPI(page);
  });

  paginationWrap.appendChild(nextBtn);
}

function renderSenderStats(stats) {
  const totalUsers = document.getElementById("senderTotalUsers");
  const activeUsers = document.getElementById("senderActiveUsers");
  const disabledUsers = document.getElementById("senderDisabledUsers");
  const newThisMonth = document.getElementById("senderNewThisMonth");

  if (totalUsers) totalUsers.textContent = stats.totalCustomers || 0;
  if (activeUsers) activeUsers.textContent = stats.activeCustomers || 0;
  if (disabledUsers) disabledUsers.textContent = stats.disabledCustomers || 0;
  if (newThisMonth) newThisMonth.textContent = stats.newThisMonth || 0;
}



function attachSenderViewEvents() {
  document.querySelectorAll(".viewSenderBtn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = this.dataset.id;

      if (!id) {
        showActionPopupMessage("Sender ID is missing.", "error");
        return;
      }

      window.location.hash = `customers/${id}`;
      await openSenderDetailsById(id);
    });
  });
}


function openSenderDetails(sender) {
  const listView = document.querySelector("#customersSection > div:first-child");
  const detailsView = document.getElementById("senderDetailsView");

  if (listView) listView.classList.add("hidden");
  if (detailsView) detailsView.classList.remove("hidden");

  const imageWrap = document.getElementById("senderDetailsImageWrap");

  if (imageWrap) {
    imageWrap.innerHTML = "";

    if (sender.profileImage) {
      imageWrap.innerHTML = `
        <img
          src="${sender.profileImage}"
          class="w-[96px] h-[96px] rounded-full object-cover"
        />
      `;
    } else {
      imageWrap.innerHTML = `
        <div class="w-[96px] h-[96px] rounded-full bg-[#EAFBFD] text-[#30BBC7] flex items-center justify-center text-[28px] font-bold">
          ${sender.initials || "U"}
        </div>
      `;
    }
  }

  document.getElementById("senderFirstName").textContent = sender.firstName || "N/A";
  document.getElementById("senderLastName").textContent = sender.lastName || "N/A";
  document.getElementById("senderPhone").textContent = sender.phone || "N/A";
  document.getElementById("senderEmail").textContent = sender.email || "N/A";
  document.getElementById("senderAddress").textContent = sender.address || "No address";
}


async function openSenderDetailsById(senderId) {
    showGlobalLoader();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${senderId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    });

    const result = await response.json();

    if (!response.ok || result.success === false || !result.data) {
      throw new Error(result.message || "Failed to load sender details");
    }

    const sender = mapApiUserToSender(result.data);
    openSenderDetails(sender);
  } catch (error) {
    console.error("Error loading sender details:", error);
    showActionPopupMessage(error.message || "Unable to load sender details.", "error");
  }
    hideGlobalLoader();
}

function closeSenderDetails() {
  const listView = document.querySelector("#customersSection > div:first-child");
  const detailsView = document.getElementById("senderDetailsView");

  if (detailsView) detailsView.classList.add("hidden");
  if (listView) listView.classList.remove("hidden");

  
  window.location.hash = "customers";
}

document.addEventListener("DOMContentLoaded", () => {
  loadSendersFromAPI(1);
  loadSenderStats();
  setupSenderSearch();

  document
    .getElementById("closeSenderDetailsBtn")
    ?.addEventListener("click", closeSenderDetails);

  document
    .getElementById("senderDetailsCloseBottomBtn")
    ?.addEventListener("click", closeSenderDetails);
});
/* ================= END OF SENDERS SECTION ===================================== */


/* ================= DELIVERIES SECTION ============================================ */

function deliveryAuthHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${AUTH_TOKEN}`
  };
}

function getDeliveryStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (s === "pending") {
    return `<span class="px-[12px] py-[4px] rounded-full bg-[#FEF3C7] text-[#92400E] text-[12px] font-semibold">Pending</span>`;
  }

  if (s === "in_transit") {
    return `<span class="px-[12px] py-[4px] rounded-full bg-[#E0F2FE] text-[#075985] text-[12px] font-semibold">In Transit</span>`;
  }

  if (s === "delivered") {
    return `<span class="px-[12px] py-[4px] rounded-full bg-[#DCFCE7] text-[#166534] text-[12px] font-semibold">Delivered</span>`;
  }

  if (s === "arrived") {
    return `<span class="px-[12px] py-[4px] rounded-full bg-[#EDE9FE] text-[#5B21B6] text-[12px] font-semibold">Arrived</span>`;
  }

  if (s === "failed") {
    return `<span class="px-[12px] py-[4px] rounded-full bg-[#FEE2E2] text-[#991B1B] text-[12px] font-semibold">Failed</span>`;
  }

  return `<span class="px-[12px] py-[4px] rounded-full bg-gray-200 text-[12px] font-semibold">${status || "N/A"}</span>`;
}

async function fetchJSON(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: deliveryAuthHeaders()
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    
    throw new Error("Invalid API response. Check endpoint or backend error.");
  }
}

async function loadDeliveryStats() {
  try {
    const result = await fetchJSON(`${API_BASE_URL}/admin/tags/stats`);

    if (!result.success) {
      throw new Error(result.message || "Failed to load delivery stats");
    }

    const summary = result.data?.summary || {};

    document.getElementById("activeRequests").textContent =
      summary.active_requests ?? 0;

    document.getElementById("inTransit").textContent =
      summary.in_transit_requests ?? 0;

    document.getElementById("pendingRequests").textContent =
      summary.pending_requests ?? 0;

    document.getElementById("failedRequests").textContent =
      summary.failed_requests ?? 0;
  } catch (error) {
    
  }
}

let allDeliveries = [];
let filteredDeliveries = [];
let currentDeliveryPage = 1;
const deliveryRowsPerPage = 20;
let currentTagFilters = {
  orderNumber: ""
};

async function renderDeliveries(page = 1, updateUrl = true) {
  showGlobalLoader();

  const body = document.getElementById("deliveryTableBody");
  if (!body) {
    hideGlobalLoader();
    return;
  }

  if (updateUrl) {
    window.history.pushState(null, "", `#tags?page=${page}`);
  }

  body.innerHTML = `<p class="p-4 text-sm text-[#7C8AA0]">Loading tags...</p>`;

  try {
    const params = new URLSearchParams();
    const statusFilter = document.getElementById("statusFilter")?.value || "all";

    params.set("page", page);
    params.set("per_page", 5);

    if (statusFilter !== "all" && statusFilter !== "") {
      params.set("status_group", statusFilter);
    }

    if (currentTagFilters.orderNumber) {
      params.set("order_number", currentTagFilters.orderNumber);
    }

    const result = await fetchJSON(
      `${API_BASE_URL}/admin/tags?${params.toString()}`
    );

    if (!result.success || !Array.isArray(result.data)) {
      body.innerHTML = `<p class="p-4 text-red-500">Failed to load tags</p>`;
      return;
    }

    allDeliveries = result.data;
    filteredDeliveries = [...allDeliveries];

    currentDeliveryPagination = result.pagination || null;
    currentDeliveryPage = currentDeliveryPagination?.current_page || page;

    renderDeliveryPage();
  } catch (error) {
    
    body.innerHTML = `<p class="p-4 text-red-500">Error loading tags</p>`;
  } finally {
    hideGlobalLoader();
  }
}

function renderDeliveryPage() {
  const body = document.getElementById("deliveryTableBody");
  const countText = document.getElementById("deliveryCountText");

  if (!body) return;

  body.innerHTML = "";

  if (!filteredDeliveries.length) {
    body.innerHTML = `<p class="p-4 text-sm text-[#7C8AA0]">No deliveries found.</p>`;

    if (countText) {
      countText.textContent = "0 of 0 row(s) selected";
    }

    renderDeliveryPagination();
    return;
  }

  filteredDeliveries.forEach((item) => {
    const row = document.createElement("div");

    row.className =
      "flex w-full min-h-[70px] border-t border-[#E5E7EB] text-[#11313B] text-[12px]";

    row.innerHTML = `
  <div class="w-[130px] px-[8px] py-[12px] font-medium">
    ${item.order_number || "N/A"}
  </div>

  <div class="w-[220px] pl-[18px] pr-[8px] py-[12px] min-w-0">
    <p class="font-medium truncate">
      ${item.customer?.full_name || "N/A"}
    </p>

    <p class="mt-[4px] text-[#7C8AA0] truncate">
      ${item.customer?.phone || "N/A"}
    </p>
  </div>

  <div class="flex-1 px-[8px] py-[12px] min-w-0">
    <p class="line-clamp-2 leading-[16px]">
      ${item.pickup_address || "N/A"}
    </p>
  </div>

  <div class="flex-1 px-[8px] py-[12px] min-w-0">
    <p class="line-clamp-2 leading-[16px]">
      ${item.dropoff_address || "N/A"}
    </p>

    <div class="mt-[6px]">
      ${getDeliveryStatusBadge(item.status)}
    </div>
  </div>

  <div class="w-[90px] px-[10px] flex items-center">
    <button
      type="button"
      class="viewTagBtn inline-flex items-center gap-[5px] cursor-pointer h-[26px] px-[10px] rounded-[6px] bg-[#EAFBFD] text-[#30BBC7] text-[12px] font-medium"
      data-tag-id="${item.id}"
    >
      <i class="fa-solid fa-eye text-[11px] cursor-pointer"></i>
      View
    </button>
  </div>
`;

    body.appendChild(row);
  });

  if (countText && currentDeliveryPagination) {
    const from = currentDeliveryPagination.from || 0;
    const to = currentDeliveryPagination.to || filteredDeliveries.length;
    const total = currentDeliveryPagination.total || filteredDeliveries.length;

    countText.textContent = `${from}-${to} of ${total} row(s) selected`;
  }

  renderDeliveryPagination();
  attachTagViewEvents();
}

function getTagPageFromUrl() {
  const hash = window.location.hash || "";
  const match = hash.match(/#tags\?page=(\d+)/);

  return match ? Number(match[1]) : 1;
}

function renderDeliveryPagination() {
  const pagination = document.getElementById("deliveryPagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  if (!currentDeliveryPagination) return;

  const currentPage = currentDeliveryPagination.current_page || 1;
  const lastPage = currentDeliveryPagination.last_page || 1;
  const maxVisiblePages = 10;

  const currentGroup = Math.ceil(currentPage / maxVisiblePages);
  const startPage = (currentGroup - 1) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, lastPage);

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left text-[11px]"></i>`;
  prevBtn.disabled = currentPage <= 1;
  prevBtn.className =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  prevBtn.onclick = function () {
    if (currentPage <= 1) return;

    renderDeliveries(currentPage - 1, true);
  };

  pagination.appendChild(prevBtn);

  for (let page = startPage; page <= endPage; page++) {
    const pageBtn = document.createElement("button");
    pageBtn.type = "button";
    pageBtn.textContent = page;

    pageBtn.className =
      page === currentPage
        ? "w-[28px] h-[28px] rounded-[6px] cursor-pointer border border-[#30BBC7] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-semibold"
        : "w-[28px] h-[28px] rounded-[6px] cursor-pointer text-[#11313B] text-[13px] font-medium";

    pageBtn.onclick = function () {
      renderDeliveries(page, true);
    };

    pagination.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right text-[11px]"></i>`;
  nextBtn.disabled = currentPage >= lastPage;
  nextBtn.className =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  nextBtn.onclick = function () {
    if (currentPage >= lastPage) return;

    renderDeliveries(currentPage + 1, true);
  };

  pagination.appendChild(nextBtn);
}

function attachTagViewEvents() {
  document.querySelectorAll(".viewTagBtn").forEach((btn) => {
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();

      const tagId = this.dataset.tagId;
      if (!tagId) return;

      viewTag(tagId, true);
    };
  });
}


async function viewTag(id, updateUrl = true) {
  showGlobalLoader();

  if (!id) {
    hideGlobalLoader();
    return;
  }

  try {
    showDashboardSection("deliveriesSection", false);

    document.getElementById("deliveriesListView")?.classList.add("hidden");
    document.getElementById("tagDetailsView")?.classList.remove("hidden");

    resetSidebarMenuStyles();
    activateSidebarMenu(
      "sidebarDeliveriesLink",
      "sidebarDeliveriesIcon",
      "sidebarDeliveriesText"
    );

    if (updateUrl) {
      window.history.pushState(null, "", `#tags/details/${id}`);
    }

    const result = await fetchJSON(`${API_BASE_URL}/admin/tags/${id}`);

    if (!result.success) {
      alert("Failed to load tag");
      return;
    }

    const data = result.data;

    document.getElementById("tagDetailsOrderNumber").textContent = `#${data.order_number || "N/A"}`;
    document.getElementById("tagDetailsStatus").innerHTML = getDeliveryStatusBadge(data.status);
    document.getElementById("tagDetailsPrice").textContent = `$${Number(data.total_price || 0).toLocaleString()}`;
    document.getElementById("tagDetailsDuration").textContent = `${data.estimated_duration_minutes || 0} mins`;

    document.getElementById("tagCustomerName").textContent = data.customer?.full_name || "N/A";
    document.getElementById("tagCustomerEmail").textContent = data.customer?.email || "N/A";
    document.getElementById("tagCustomerPhone").textContent = data.customer?.phone || "N/A";

    document.getElementById("tagRecipientName").textContent =
      `${data.recipient_firstname || ""} ${data.recipient_lastname || ""}`.trim() || "N/A";

    document.getElementById("tagRecipientPhone").textContent = data.recipient_phone || "N/A";
    document.getElementById("tagVehiclePreference").textContent = data.vehicle_preference || "N/A";

    document.getElementById("tagPickupAddress").textContent = data.pickup_address || "N/A";
    document.getElementById("tagDropoffAddress").textContent = data.dropoff_address || "N/A";

    document.getElementById("tagPackageType").textContent = data.package?.type || "N/A";
    document.getElementById("tagPackageSize").textContent = data.package?.size || "N/A";
    document.getElementById("tagPackageWeight").textContent = `${data.package?.weight_kg || "0"} kg`;
    document.getElementById("tagDistance").textContent = `${data.distance_km || "0"} km`;
    document.getElementById("tagPackageDescription").textContent = data.package?.description || "No description";
    const imagesWrap = document.getElementById("tagPackageImages");

if (imagesWrap) {
  imagesWrap.innerHTML = "";

  const images = Array.isArray(data.package_photos)
    ? data.package_photos
    : [];

  if (!images.length && data.package_photo_url) {
    images.push({
      url: data.package_photo_url,
      file_name: "Package image"
    });
  }

  if (!images.length) {
    imagesWrap.innerHTML = `
      <p class="text-[#7C8AA0] text-[13px]">
        No package images uploaded.
      </p>
    `;
  } else {
    const imageUrls = images
  .map((img) => img.url)
  .filter(Boolean);

imagesWrap.innerHTML = imageUrls
  .map((url, index) => `
    <img
      src="${url}"
      alt="Package image"
      class="w-[120px] h-[120px] rounded-[12px] object-cover border border-[#E5E7EB] cursor-pointer tagPreviewImage"
      data-index="${index}"
    />
  `)
  .join("");

imagesWrap.querySelectorAll(".tagPreviewImage").forEach((img) => {
  img.addEventListener("click", function () {
    openImagePreview(
      imageUrls,
      Number(this.dataset.index)
    );
  });
});
  }
}

  } catch (error) {
    
    alert("Error loading tag");
  } finally {
    hideGlobalLoader();
  }
}

function applyDeliveryFilters() {
  const search = document.getElementById("deliverySearch").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const sort = document.getElementById("sortFilter").value;

  filteredDeliveries = allDeliveries.filter((item) => {
    const order = item.order_number?.toLowerCase() || "";
    const name = item.customer?.full_name?.toLowerCase() || "";
    const phone = item.customer?.phone?.toLowerCase() || "";
    const pickup = item.pickup_address?.toLowerCase() || "";
    const dropoff = item.dropoff_address?.toLowerCase() || "";
    const itemStatus = item.status?.toLowerCase() || "";

    const matchesSearch =
      order.includes(search) ||
      name.includes(search) ||
      phone.includes(search) ||
      pickup.includes(search) ||
      dropoff.includes(search);

    const matchesStatus = status ? itemStatus === status : true;

    return matchesSearch && matchesStatus;
  });

  // SORT
  if (sort === "newest") {
    filteredDeliveries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (sort === "oldest") {
    filteredDeliveries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  currentDeliveryPage = 1;
  renderDeliveryPage();
}

function setupTagSearch() {
  const searchInput = document.getElementById("deliverySearch");
  const searchBtn = document.getElementById("deliverySearchBtn");

  function applyTagSearch() {
    currentTagFilters.orderNumber = searchInput?.value.trim() || "";
    renderDeliveries(1, true);
  }

  searchBtn?.addEventListener("click", applyTagSearch);

  searchInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      applyTagSearch();
    }
  });

  searchInput?.addEventListener("input", function () {
    if (this.value.trim() === "") {
      currentTagFilters.orderNumber = "";
      renderDeliveries(1, true);
    }
  });
}

function setupDeliveriesSection() {
  loadDeliveryStats();

  const pageFromUrl = getTagPageFromUrl();
  renderDeliveries(pageFromUrl, false);

  setupTagSearch();

  document.getElementById("statusFilter")?.addEventListener("change", function () {
    renderDeliveries(1, true);
  });

  document.getElementById("sortFilter")?.addEventListener("change", applyDeliveryFilters);
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("backToDeliveriesFromTagBtn")?.addEventListener("click", function () {
    hideAllDashboardSections();

    document.getElementById("deliveriesSection")?.classList.remove("hidden");
    document.getElementById("tagDetailsView")?.classList.add("hidden");
    document.getElementById("deliveriesListView")?.classList.remove("hidden");

    resetSidebarMenuStyles();
    activateSidebarMenu(
      "sidebarDeliveriesLink",
      "sidebarDeliveriesIcon",
      "sidebarDeliveriesText"
    );

    window.location.hash = "tags";
  });
});
document.addEventListener("DOMContentLoaded", setupDeliveriesSection);

/* ================= END OF DELIVERIES SECTION ===================================== */


/* ================= PAYMENT SECTION =========================================== */

let previewImages = [];
let currentPreviewIndex = 0;

function openImagePreview(images, startIndex = 0) {
  previewImages = images.filter(Boolean);
  currentPreviewIndex = startIndex;

  if (!previewImages.length) return;

  document.getElementById("imagePreviewOverlay")?.classList.remove("hidden");

  renderImagePreview();
}

function renderImagePreview() {
  const img = document.getElementById("imagePreviewMain");
  const counter = document.getElementById("imagePreviewCounter");
  const prevBtn = document.getElementById("prevImagePreviewBtn");
  const nextBtn = document.getElementById("nextImagePreviewBtn");

  if (!img) return;

  img.src = previewImages[currentPreviewIndex];

  if (counter) {
    counter.textContent = `${currentPreviewIndex + 1} of ${previewImages.length}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPreviewIndex === 0;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPreviewIndex === previewImages.length - 1;
  }
}

function setupImagePreviewModal() {
  document.getElementById("closeImagePreviewBtn")?.addEventListener("click", function () {
    document.getElementById("imagePreviewOverlay")?.classList.add("hidden");
  });

  document.getElementById("prevImagePreviewBtn")?.addEventListener("click", function () {
    if (currentPreviewIndex > 0) {
      currentPreviewIndex--;
      renderImagePreview();
    }
  });

  document.getElementById("nextImagePreviewBtn")?.addEventListener("click", function () {
    if (currentPreviewIndex < previewImages.length - 1) {
      currentPreviewIndex++;
      renderImagePreview();
    }
  });
}

document.addEventListener("DOMContentLoaded", setupImagePreviewModal);


function renderClickableImages(imageUrls = []) {
  if (!imageUrls.length) return "";

  return `
    <div class="mt-[14px] flex flex-wrap gap-[10px]">
      ${imageUrls
        .map((url, index) => `
          <img
            src="${url}"
            class="w-[120px] h-[120px] object-cover rounded-[10px] border border-[#E5E7EB] cursor-pointer hover:opacity-80 payoutPreviewImage"
            data-index="${index}"
          />
        `)
        .join("")}
    </div>
  `;
}

async function fetchPaymentStats() {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load payment stats");
  }

  return result.data;
}

function renderPaymentStats(stats) {
  document.getElementById("paymentTotalStats").textContent =
    stats.total || 0;

  document.getElementById("paymentPendingStats").textContent =
    stats.pending || 0;

  document.getElementById("paymentApprovedStats").textContent =
    stats.approved || 0;

  document.getElementById("paymentFailedStats").textContent =
    stats.rejected || 0;

    document.getElementById("paymentCompletedStats").textContent =
    stats.completed || 0;

  document.getElementById("paymentPendingAmountStats").textContent =
    formatPaymentAmount(stats.total_amount_pending || 0);

  document.getElementById("paymentCompletedAmountStats").textContent =
    formatPaymentAmount(stats.total_amount_completed || 0);

  document.getElementById("paymentRejectedAmountStats").textContent =
    formatPaymentAmount(stats.total_amount_rejected || 0);
}

async function loadPaymentStats() {
    showGlobalLoader();
  try {
    const stats = await fetchPaymentStats();
    renderPaymentStats(stats);
  } catch (error) {
    console.error("Payment stats error:", error);
  }
    hideGlobalLoader();
}

function getDriverFullName(driver) {
  if (!driver) return "N/A";

  return [driver.first_name, driver.middle_name, driver.last_name]
    .filter(Boolean)
    .join(" ") || driver.email || "N/A";
}

function formatPaymentDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "N/A";

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatPaymentAmount(amount) {
  const value = Number(amount) || 0;

  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}



async function fetchPayouts(customUrl = null) {
  let url = customUrl;

  if (!url) {
    const query = new URLSearchParams();

    query.append("per_page", 5);

    if (currentPaymentFilters.search) {
      query.append("search", currentPaymentFilters.search);
    }

    if (currentPaymentFilters.status !== "all") {
      query.append("status", currentPaymentFilters.status);
    }

    url = `${API_BASE_URL}/admin/payouts?${query.toString()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load payouts");
  }

  return result;
}



async function loadPayments(customUrl = null) {
  showGlobalLoader();

  try {
    const result = await fetchPayouts(customUrl);

    payments = result.data || [];
    currentPaymentPagination = result.pagination || null;

    renderPayments(payments);
    renderPaymentPagination(currentPaymentPagination);
    updatePaymentCountText(currentPaymentPagination);
  } catch (error) {
    console.error("Payment list error:", error);
  } finally {
    hideGlobalLoader();
  }
}

function updatePaymentPageUrl(page) {
  window.history.pushState(null, "", `#payout?page=${page}`);
}

function loadPaymentsFromUrl() {
  const fullHash = window.location.hash || "#payout";
  const queryString = fullHash.includes("?") ? fullHash.split("?")[1] : "";
  const params = new URLSearchParams(queryString);

  const page = params.get("page") || 1;

  const query = new URLSearchParams();
  query.append("page", page);
  query.append("per_page", 5);

  if (currentPaymentFilters.search) {
    query.append("search", currentPaymentFilters.search);
  }

  if (currentPaymentFilters.status && currentPaymentFilters.status !== "all") {
    query.append("status", currentPaymentFilters.status);
  }

  loadPayments(`${API_BASE_URL}/admin/payouts?${query.toString()}`);
}

function updatePaymentCountText(pagination) {
  const countText = document.getElementById("paymentCountText");
  if (!countText || !pagination) return;

  countText.textContent =
    `${pagination.from || 0}-${pagination.to || 0} of ${pagination.total || 0} row(s) selected`;
}

function renderPaymentPagination(pagination) {
  const wrap = document.getElementById("paymentPagination");
  if (!wrap || !pagination) return;

  wrap.innerHTML = "";

  const activePage = pagination.current_page || 1;
  const lastPage = pagination.last_page || 1;
  const maxVisiblePages = 10;

  const currentGroup = Math.ceil(activePage / maxVisiblePages);
  const startPage = (currentGroup - 1) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, lastPage);

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left text-[11px]"></i>`;
  prevBtn.disabled = activePage <= 1;
  prevBtn.className =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  prevBtn.onclick = function () {
    if (activePage <= 1) return;

    const page = activePage - 1;
    updatePaymentPageUrl(page);

    const query = buildPaymentPaginationQuery(page);
    loadPayments(`${API_BASE_URL}/admin/payouts?${query.toString()}`);
  };

  wrap.appendChild(prevBtn);

  for (let page = startPage; page <= endPage; page++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = page;

    btn.className =
      page === activePage
        ? "w-[30px] h-[30px] rounded-[6px] cursor-pointer border border-[#30BBC7] bg-[#EAFBFD] text-[#30BBC7] text-[14px] font-semibold"
        : "w-[30px] h-[30px] rounded-[6px] cursor-pointer text-[#11313B] text-[14px] font-medium";

    btn.onclick = function () {
      updatePaymentPageUrl(page);

      const query = buildPaymentPaginationQuery(page);
      loadPayments(`${API_BASE_URL}/admin/payouts?${query.toString()}`);
    };

    wrap.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right text-[11px]"></i>`;
  nextBtn.disabled = activePage >= lastPage;
  nextBtn.className =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  nextBtn.onclick = function () {
    if (activePage >= lastPage) return;

    const page = activePage + 1;
    updatePaymentPageUrl(page);

    const query = buildPaymentPaginationQuery(page);
    loadPayments(`${API_BASE_URL}/admin/payouts?${query.toString()}`);
  };

  wrap.appendChild(nextBtn);
}

function buildPaymentPaginationQuery(page) {
  const query = new URLSearchParams();

  query.append("page", page);
  query.append("per_page", 5);

  if (currentPaymentFilters.search) {
    query.append("search", currentPaymentFilters.search);
  }

  if (currentPaymentFilters.status && currentPaymentFilters.status !== "all") {
    query.append("status", currentPaymentFilters.status);
  }

  return query;
}

function getPaymentStatusBadge(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") {
    return `
      <span class="inline-flex items-center gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#EAF8F1] text-[#3BB273] text-[12px] font-medium">
        <i class="fa-solid fa-check"></i>
        Completed
      </span>
    `;
  }

  if (value === "approved") {
    return `
      <span class="inline-flex items-center gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#EAFBFD] text-[#30BBC7] text-[12px] font-medium">
        <i class="fa-solid fa-circle-check"></i>
        Approved
      </span>
    `;
  }

  if (value === "rejected" || value === "failed") {
    return `
      <span class="inline-flex items-center gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#FDECEF] text-[#E57373] text-[12px] font-medium">
        <i class="fa-solid fa-xmark"></i>
        ${value === "failed" ? "Failed" : "Rejected"}
      </span>
    `;
  }

  if (value === "processing") {
    return `
      <span class="inline-flex items-center gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#EEF4FF] text-[#2F80ED] text-[12px] font-medium">
        <i class="fa-solid fa-spinner text-[11px]"></i>
        Processing
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#FFF4E8] text-[#C76A3A] text-[12px] font-medium">
      <i class="fa-solid fa-clock text-[11px]"></i>
      Pending
    </span>
  `;
}

function renderPayments(list = payments) {
  const body = document.getElementById("paymentTableBody");
  if (!body) return;

  body.innerHTML = "";

  list.forEach((payment) => {
    const row = document.createElement("div");
    const status = String(payment.status || "").toLowerCase();
    const isApproved = status === "approved";
  const isPending =
  status === "pending" ||
  status === "awaiting_review";

const isRejected =
  status === "rejected" ||
  status === "failed";

const isCompleted =
  status === "completed";
    row.className =
      "w-full min-h-[56px] flex items-center border-t border-[#E5E7EB] text-[#11313B] text-[12px] relative";

    row.innerHTML = `
      <div class="w-[160px] px-[10px] font-medium">
        ${payment.payout_number || payment.id || "N/A"}
      </div>

      <div class="w-[190px] px-[10px]">
        ${getDriverFullName(payment.driver)}
      </div>

      <div class="w-[130px] px-[10px]">
        ${formatPaymentAmount(payment.amount)}
      </div>

      <div class="w-[140px] px-[10px]">
        ${formatPaymentDate(payment.created_at)}
      </div>

      <div class="w-[140px] px-[10px]">
        ${formatPaymentDate(payment.reviewed_at || payment.completed_at)}
      </div>

      <div class="w-[140px] px-[10px]">
        ${getPaymentStatusBadge(payment.status)}
      </div>

     <div class="w-[150px] px-[10px] relative">

  <button
    type="button"
    class="updatePayoutStatusBtn inline-flex cursor-pointer items-center gap-[6px] h-[30px] px-[10px] rounded-[6px] bg-[#EAFBFD] text-[#30BBC7] text-[12px] font-medium whitespace-nowrap"
    data-id="${payment.id}"
  >
    View Details
    <i class="fa-solid fa-chevron-down text-[10px]"></i>
  </button>

  <div
    class="payoutStatusDropdown hidden absolute right-[10px] bottom-[38px] z-[100] w-[170px] rounded-[10px] border border-[#E5E7EB] bg-white shadow-lg overflow-hidden"
  >

    <!-- VIEW DETAILS -->
    <button
      type="button"
      class="viewPayoutDetailsBtn w-full h-[38px] px-[14px] cursor-pointer text-left text-[12px] text-[#30BBC7] hover:bg-[#F1F5F8]"
      data-id="${payment.id}"
    >
      <i class="fa-solid fa-eye mr-[8px] text-[11px]"></i>
      View Details
    </button>

    ${
      isPending
        ? `
          <button
            type="button"
            class="approvePayoutBtn w-full h-[38px] px-[14px] cursor-pointer text-left text-[12px] text-[#3BB273] hover:bg-[#EAF8F1]"
            data-id="${payment.id}"
          >
            <i class="fa-solid fa-check mr-[8px] text-[11px]"></i>
            Approve
          </button>

          <button
            type="button"
            class="rejectPayoutBtn w-full h-[38px] px-[14px] cursor-pointer text-left text-[12px] text-[#E57373] hover:bg-[#FDECEF]"
            data-id="${payment.id}"
          >
            <i class="fa-solid fa-xmark mr-[8px] text-[11px]"></i>
            Reject
          </button>
        `
        : ""
    }

    ${
      isApproved
        ? `
          <button
            type="button"
            class="markPayoutCompletedBtn w-full h-[38px] px-[14px] cursor-pointer text-left text-[12px] text-[#3BB273] hover:bg-[#EAF8F1]"
            data-id="${payment.id}"
          >
            <i class="fa-solid fa-circle-check mr-[8px] text-[11px]"></i>
            Mark as Completed
          </button>
        `
        : ""
    }

  </div>
</div>
    `;

    body.appendChild(row);
  });

  attachPayoutStatusEvents();
}

function attachPayoutStatusEvents() {
  document.querySelectorAll(".updatePayoutStatusBtn").forEach((btn) => {
    btn.onclick = function (event) {
      event.stopPropagation();

      document.querySelectorAll(".payoutStatusDropdown").forEach((dropdown) => {
        if (dropdown !== this.nextElementSibling) {
          dropdown.classList.add("hidden");
        }
      });

      this.nextElementSibling.classList.toggle("hidden");
    };
  });

  document.querySelectorAll(".viewPayoutDetailsBtn").forEach((btn) => {
    btn.onclick = function (event) {
      event.stopPropagation();
      openPayoutDetailsPage(this.dataset.id);
    };
  });

  document.querySelectorAll(".approvePayoutBtn").forEach((btn) => {
    btn.onclick = function (event) {
      event.stopPropagation();
      approvePayout(this.dataset.id, this);
    };
  });

  document.querySelectorAll(".rejectPayoutBtn").forEach((btn) => {
    btn.onclick = function (event) {
      event.stopPropagation();
      openRejectPayoutModal(this.dataset.id);
    };
  });

  document.querySelectorAll(".markPayoutCompletedBtn").forEach((btn) => {
    btn.onclick = function () {
      markPayoutCompleted(this.dataset.id);
    };
  });

  document.addEventListener("click", function () {
    document.querySelectorAll(".payoutStatusDropdown").forEach((dropdown) => {
      dropdown.classList.add("hidden");
    });
  });
}

async function fetchPayoutDetails(payoutId) {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/${payoutId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load payout details");
  }

  return result.data;
}

async function openPayoutDetailsPage(payoutId, updateUrl = true) {
  if (!payoutId) return;

  try {
    showGlobalLoader();

    // SHOW PAYOUT SECTION FIRST
    showDashboardSection("paymentsSection", false);

    resetSidebarMenuStyles();

    activateSidebarMenu(
      "sidebarPaymentsLink",
      "sidebarPaymentsIcon",
      "sidebarPaymentsText"
    );

    // TOGGLE VIEWS
    document.getElementById("paymentsListView")?.classList.add("hidden");

    document.getElementById("payoutDetailsView")?.classList.remove("hidden");

    // UPDATE URL
    if (updateUrl) {
      window.history.pushState(
        null,
        "",
        `#payout/details/${payoutId}`
      );
    }

    // FETCH DATA
    const payout = await fetchPayoutDetails(payoutId);

    document.getElementById("payoutDetailsNumber").textContent =
      payout.payout_number || "N/A";

    document.getElementById("payoutDetailsDriver").textContent =
      getDriverFullName(payout.driver);

    document.getElementById("payoutDetailsEmail").textContent =
      payout.driver?.email || "N/A";

    document.getElementById("payoutDetailsAmount").textContent =
      formatPaymentAmount(payout.amount);

    document.getElementById("payoutDetailsMethod").textContent =
      payout.method_label || payout.method || "N/A";

    document.getElementById("payoutDetailsStatus").innerHTML =
      getPaymentStatusBadge(payout.status);

    document.getElementById("payoutDetailsRequestedDate").textContent =
      formatPaymentDate(payout.created_at);

    document.getElementById("payoutDetailsProcessedDate").textContent =
      formatPaymentDate(
        payout.reviewed_at || payout.completed_at
      );

  document.getElementById("payoutDetailsTransactionId").textContent =
  payout.stripe_transfer_id || "N/A";

    document.getElementById("payoutDetailsBankName").textContent =
      payout.bank_account?.bank_name || "N/A";

    document.getElementById("payoutDetailsAccountName").textContent =
      payout.bank_account?.account_name || "N/A";

    document.getElementById("payoutDetailsAccountType").textContent =
      payout.bank_account?.account_type || "N/A";

    document.getElementById("payoutDetailsMaskedAccount").textContent =
      payout.bank_account?.account_number || "N/A";

    document.getElementById("payoutDetailsAdminNotes").textContent =
      payout.admin_notes || "No admin notes";

    document.getElementById("payoutDetailsRejectionReason").textContent =
      payout.rejection_reason || "N/A";

    const actionWrap =
      document.getElementById("payoutDetailsActionWrap");

    if (actionWrap) {
      actionWrap.innerHTML = "";

      const payoutStatus = String(
        payout.status || ""
      ).toLowerCase();

      const isPending =
        payoutStatus === "pending" ||
        payoutStatus === "awaiting_review";

      const isApproved =
        payoutStatus === "approved";

      if (isPending) {
        actionWrap.innerHTML = `
          <button
            type="button"
            id="detailsRejectPayoutBtn"
            class="h-[42px] px-[18px] rounded-[10px] bg-[#FDECEF] text-[#E57373] text-[13px] font-semibold cursor-pointer mr-[10px]"
          >
            Reject Payout
          </button>

          <button
            type="button"
            id="detailsApprovePayoutBtn"
            class="h-[42px] px-[18px] rounded-[10px] bg-[#30BBC7] text-white text-[13px] font-semibold cursor-pointer"
          >
            Approve Payout
          </button>
        `;

        document
          .getElementById("detailsApprovePayoutBtn")
          ?.addEventListener("click", async function () {

            await approvePayout(payout.id, this);

            await openPayoutDetailsPage(
              payout.id,
              false
            );
          });

        document
          .getElementById("detailsRejectPayoutBtn")
          ?.addEventListener("click", function () {

            openRejectPayoutModal(payout.id);
          });
      }

      if (isApproved) {
        actionWrap.innerHTML = `
          <button
            type="button"
            id="detailsCompletePayoutBtn"
            class="h-[42px] px-[18px] rounded-[10px] bg-[#3BB273] text-white text-[13px] font-semibold cursor-pointer"
          >
            Mark as Completed
          </button>
        `;

        document
          .getElementById("detailsCompletePayoutBtn")
          ?.addEventListener("click", function () {

            markPayoutCompleted(payout.id);
          });
      }
    }

  } catch (error) {

    showActionPopupMessage(
      error.message || "Unable to load payout details.",
      "error"
    );

  } finally {

    hideGlobalLoader();
  }
}

function closePayoutDetailsPage() {
  document.getElementById("payoutDetailsView")?.classList.add("hidden");
  document.getElementById("paymentsListView")?.classList.remove("hidden");

  window.history.pushState(null, "", "#payout");
}

async function completePayout(payoutId, stripeTransferId) {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/${payoutId}/complete`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({
      stripe_transfer_id: stripeTransferId
    })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to complete payout");
  }

  return result;
}

function markPayoutCompleted(payoutId) {
  selectedPayoutToComplete = payoutId;

  const modal = document.getElementById("completePayoutModal");
  const input = document.getElementById("completePayoutTransactionInput");

  if (input) input.value = "";
  if (modal) modal.classList.remove("hidden");

  setTimeout(() => {
    input?.focus();
  }, 100);
}

function setupCompletePayoutModal() {
  const modal = document.getElementById("completePayoutModal");
  const input = document.getElementById("completePayoutTransactionInput");
  const closeBtn = document.getElementById("closeCompletePayoutModal");
  const cancelBtn = document.getElementById("cancelCompletePayoutBtn");
  const submitBtn = document.getElementById("submitCompletePayoutBtn");

  function closeModal() {
    selectedPayoutToComplete = null;
    if (input) input.value = "";
    if (modal) modal.classList.add("hidden");
  }

  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  submitBtn?.addEventListener("click", async function () {
    const stripeTransferId = input?.value.trim();

    if (!stripeTransferId) {
      showActionPopupMessage("Stripe Transfer ID is required.", "error");
      return;
    }

    if (!selectedPayoutToComplete) {
      showActionPopupMessage("Payout ID is missing.", "error");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Completing...";

      await completePayout(selectedPayoutToComplete, stripeTransferId);

updatePayoutLocally(
  selectedPayoutToComplete,
  "completed"
);

const completedId = selectedPayoutToComplete;

closeModal();

await openPayoutDetailsPage(completedId);

showActionPopupMessage(
  "Payout marked as completed.",
  "success"
);
    } catch (error) {
      showActionPopupMessage(error.message || "Failed to complete payout.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Mark Completed";
    }
  });
}

let selectedRejectPayoutId = null;

async function reviewPayoutStatus(payoutId, action, rejectionReason = null, adminNotes = "") {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/${payoutId}/review`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({
      action,
      rejection_reason: rejectionReason,
      admin_notes: adminNotes
    })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to update payout status");
  }

  return result;
}

function updatePayoutLocally(payoutId, newStatus, reason = null) {
  payments = payments.map((payment) => {
    if (payment.id !== payoutId) {
      return payment;
    }

    return {
      ...payment,
      status: newStatus,
      status_label: newStatus,
      rejection_reason: reason,
      reviewed_at:
        newStatus === "approved" || newStatus === "rejected"
          ? new Date().toISOString()
          : payment.reviewed_at,

      completed_at:
        newStatus === "completed"
          ? new Date().toISOString()
          : payment.completed_at
    };
  });

  renderPayments(payments);
  loadPaymentStats();
}

function startPayoutButtonLoading(btn, loadingText) {
  if (!btn) return;

  btn.disabled = true;
  btn.dataset.originalHtml = btn.innerHTML;

  btn.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin mr-[6px]"></i>
    ${loadingText}
  `;

  btn.classList.add("opacity-70", "cursor-not-allowed");
}

function stopPayoutButtonLoading(btn) {
  if (!btn) return;

  btn.disabled = false;

  if (btn.dataset.originalHtml) {
    btn.innerHTML = btn.dataset.originalHtml;
  }

  btn.classList.remove("opacity-70", "cursor-not-allowed");
}

async function approvePayout(payoutId, btn = null) {
  try {

    startPayoutButtonLoading(btn, "Approving...");
    await reviewPayoutStatus(payoutId, "approve", null, "Approved by admin");
    updatePayoutLocally(payoutId, "approved");
    showActionPopupMessage("Payout approved successfully.", "success");
  } catch (error) {
    showActionPopupMessage(error.message || "Failed to approve payout.", "error");
  } finally {
    stopPayoutButtonLoading(btn); 
  }
}

function openRejectPayoutModal(payoutId) {
  selectedRejectPayoutId = payoutId;

  const overlay = document.getElementById("rejectPayoutOverlay");
  const input = document.getElementById("rejectPayoutReasonInput");

  if (input) input.value = "";
  if (overlay) overlay.classList.remove("hidden");
}

function closeRejectPayoutModal() {
  selectedRejectPayoutId = null;

  const overlay = document.getElementById("rejectPayoutOverlay");
  const input = document.getElementById("rejectPayoutReasonInput");

  if (input) input.value = "";
  if (overlay) overlay.classList.add("hidden");
}

async function submitRejectPayout() {
  const input = document.getElementById("rejectPayoutReasonInput");
  const reason = input?.value.trim();
  const submitBtn = document.getElementById("submitRejectPayoutBtn");

  if (!selectedRejectPayoutId) {
    showActionPopupMessage("Payout ID is missing.", "error");
    return;
  }

  if (!reason) {
    showActionPopupMessage("Please enter rejection reason.", "error");
    return;
  }

  try {
    startPayoutButtonLoading(submitBtn, "Rejecting...")
    await reviewPayoutStatus(selectedRejectPayoutId, "reject", reason, reason);
   updatePayoutLocally(
  selectedRejectPayoutId,
  "rejected",
  reason
);

const rejectedId = selectedRejectPayoutId;

closeRejectPayoutModal();

await openPayoutDetailsPage(rejectedId);

showActionPopupMessage(
  "Payout rejected successfully.",
  "success"
);
  } catch (error) {
    showActionPopupMessage(error.message || "Failed to reject payout.", "error");
  }
    finally {
      stopPayoutButtonLoading(submitBtn);
    }
}

function normalizePayoutStatus(status) {
  const value = String(status || "").toLowerCase().trim();

  if (
    value === "pending" ||
    value === "awaiting_review" ||
    value === "awaiting review"
  ) {
    return "pending";
  }

  if (
    value === "processing" ||
    value === "in_progress" ||
    value === "in progress"
  ) {
    return "processing";
  }

  return value;
}

function setupPaymentSearchAndFilter() {
  const searchInput = document.getElementById("paymentSearchInput");
  const searchBtn = document.getElementById("paymentSearchBtn");
  const statusFilter = document.getElementById("paymentStatusFilter");

  async function applyPaymentFilters() {
    currentPaymentFilters.search =
      String(searchInput?.value || "").trim();

    currentPaymentFilters.status = normalizePayoutStatus(
      statusFilter?.value || "all"
    );

    updatePaymentPageUrl(1);

    await loadPayments();
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      applyPaymentFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        applyPaymentFilters();
      }
    });

    searchInput.addEventListener("input", function () {
      if (this.value.trim() === "") {
        currentPaymentFilters.search = "";
        updatePaymentPageUrl(1);
        loadPayments();
      }
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      applyPaymentFilters();
    });
  }
}


document.addEventListener("DOMContentLoaded", () => {
    loadPaymentStats();
  loadPayments();
  setupPaymentSearchAndFilter();
    setupCompletePayoutModal();

  
});

/* ================= END OF PAYMENT SECTION ===================================== */


/* ================= SUPPORT REQUESTS SECTION ================= */
let allSupportTickets = [];
let supportTickets = [];
let filteredSupportTickets = [];
let selectedSupportTicket = null;
let currentSupportPagination = null;
let readSupportTicketIds = new Set();
let renderedSupportReplyIds = new Set();

function supportAuthHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${AUTH_TOKEN}`
  };
}


function initSupportPusher() {
  if (supportPusher) return supportPusher;

  Pusher.logToConsole = true;

  supportPusher = new Pusher(
    "bf408172293e0919f511",
    {
      cluster: "eu"
    }
  );

  return supportPusher;
}

function subscribeToSupportTicketList() {
  const pusher = initSupportPusher();

  const channelName = "support-ticket";


  const channel = pusher.subscribe(channelName);

  channel.bind("pusher:subscription_succeeded", function () {
    
  });

  channel.bind("ticket.created", function (data) {
   

    loadSupportTickets(null, false);
  });

  return channel;
}

function subscribeToSupportTicket(ticketId) {
  if (!ticketId) return;

  const pusher = initSupportPusher();

  if (currentSupportChannel) {
    pusher.unsubscribe(currentSupportChannel.name);
    currentSupportChannel = null;
  }

  const channelName = `support-ticket.${ticketId}`;
  

  currentSupportChannel = pusher.subscribe(channelName);

  currentSupportChannel.bind("pusher:subscription_succeeded", function () {
    
  });

  currentSupportChannel.bind("ticket.replied", function (data) {
    

    const reply = data.reply || data.data?.reply || data.data || data;
    const sender = data.sender || data.data?.sender || reply.sender || reply.user || {};
    const role = String(sender.role || "").toLowerCase();

    if (role === "admin") return;

    if (
      selectedSupportTicket &&
      String(selectedSupportTicket.id) === String(ticketId)
    ) {
      renderOneSupportReply(
        {
          ...reply,
          user: {
            role: "customer"
          }
        },
        false
      );

      moveTicketToTop(ticketId);
      return;
    }

    loadSupportTickets();
  });
}

async function fetchSupportTickets(params = {}, customUrl = null) {
  let url = customUrl;

  if (!url) {
    const query = new URLSearchParams();

    query.append("per_page", 5);

    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.priority && params.priority !== "all") query.append("priority", params.priority);
    if (params.unassigned) query.append("unassigned", params.unassigned);
    if (params.search) query.append("search", params.search);

    url = `${API_BASE_URL}/admin/support-tickets?${query.toString()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: supportAuthHeaders()
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load support tickets");
  }

  return result;
}
function getTicketFullName(ticket) {
  const user = ticket.user || {};
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Unknown User";
}

function getSupportInitials(name) {
  return String(name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatSupportTime(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatSupportListDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(String(dateString).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }) + " • " +
  date.toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function getSupportStatusBadge(status) {
  const value = String(status || "").toLowerCase();

  if (value === "open") return "bg-[#FFF8EE] text-[#F2B66D]";
  if (value === "in_progress") return "bg-[#FFF4ED] text-[#EC5300]";
  if (value === "resolved") return "bg-[#EAF8F1] text-[#3BB273]";

  return "bg-[#F1F5F8] text-[#7C8AA0]";
}

function getSupportMetaBadge(type, value) {
  const safe = String(value || "").toLowerCase();

 if (type === "status") {
  if (safe === "open") {
    return "bg-[#FFF4ED] text-[#EC5300]";
  }

  if (safe === "pending") {
    return "bg-[#FFF4ED] text-[#EC5300]";
  }

  if (safe === "in_progress") {
    return "bg-[#FFF4ED] text-[#EC5300]";
  }

  if (safe === "resolved") {
    return "bg-[#EAF8F1] text-[#3BB273]";
  }

  if (safe === "closed") {
    return "bg-[#F3F4F6] text-[#667085]";
  }
}

  if (type === "priority") {
    if (safe === "urgent" || safe === "high") return "bg-[#FDECEF] text-[#E57373]";
    if (safe === "medium") return "bg-[#FFF8EE] text-[#C76A3A]";
    if (safe === "low") return "bg-[#EAF8F1] text-[#3BB273]";
  }

  if (type === "category") {
    return "bg-[#EEF4FF] text-[#2F80ED]";
  }

  return "bg-[#F1F5F8] text-[#7C8AA0]";
}

async function fetchSupportStats() {
  const response = await fetch(`${API_BASE_URL}/admin/support-tickets/stats`, {
    method: "GET",
    headers: supportAuthHeaders()
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load support stats");
  }

  return result.data;
}


function renderSupportStats(stats = {}) {
  document.getElementById("supportTotalTickets").textContent =
    stats.total || 0;

  document.getElementById("supportUrgentTickets").textContent =
    stats.open || 0;

  document.getElementById("supportCompletedTickets").textContent =
    stats.resolved || 0;

  document.getElementById("supportOpenTickets").textContent =
    stats.in_progress || 0;
}

function getTicketReplies(ticket) {
  return Array.isArray(ticket.replies) ? ticket.replies : [];
}

function getTicketLastReply(ticket) {
  const replies = getTicketReplies(ticket);

  if (!replies.length) return null;

  return replies[replies.length - 1];
}

function getTicketLastMessage(ticket) {
  const lastReply = getTicketLastReply(ticket);

  if (lastReply) {
    return (
      lastReply.message ||
      lastReply.body ||
      lastReply.reply ||
      "Attachment"
    );
  }

  return ticket.description || ticket.subject || "No message";
}

function getTicketLastTime(ticket) {
  const lastReply = getTicketLastReply(ticket);

  if (lastReply) {
    return lastReply.created_at || ticket.created_at;
  }

  return ticket.created_at;
}

function isLastMessageFromCustomer(ticket) {
  if (readSupportTicketIds.has(ticket.id)) return false;

  const lastReply = getTicketLastReply(ticket);

  return (
    lastReply &&
    lastReply.user &&
    lastReply.user.role === "customer"
  );
}

function sortTicketsByLatestMessage(tickets) {
  return [...tickets].sort((a, b) => {
    const timeA =
      a.last_message_at ||
      a.last_reply_at ||
      getTicketLastTime(a) ||
      a.created_at;

    const timeB =
      b.last_message_at ||
      b.last_reply_at ||
      getTicketLastTime(b) ||
      b.created_at;

    const dateA = new Date(String(timeA).replace(" ", "T"));
    const dateB = new Date(String(timeB).replace(" ", "T"));

    return dateB - dateA;
  });
}

function renderSupportTicketList(list = filteredSupportTickets) {
  const container = document.getElementById("supportTicketList");
  if (!container) return;

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `
      <div class="p-[20px] text-[#98A2B3] text-[13px]">
        No support tickets found.
      </div>
    `;
    return;
  }

  list.forEach((ticket) => {
    const name = getTicketFullName(ticket);
    const isActive = selectedSupportTicket?.id === ticket.id;

    const ticketStatus =
      ticket.status_label ||
      ticket.status ||
      "N/A";

    const item = document.createElement("button");
    item.type = "button";
    item.className = `
      w-full min-h-[72px] px-[14px] py-[12px] flex items-center gap-[12px]
      border-b border-[#E5E7EB] text-left cursor-pointer
      ${isActive ? "bg-white" : "bg-transparent hover:bg-white"}
    `;

    item.innerHTML = `
      <div class="relative shrink-0">
        <div class="w-[38px] h-[38px] rounded-full bg-[#EAFBFD] text-[#30BBC7] flex items-center justify-center text-[13px] font-bold">
          ${getSupportInitials(name)}
        </div>
        <span class="absolute bottom-[2px] right-[2px] w-[9px] h-[9px] rounded-full bg-[#3BB273] border border-white"></span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-[8px]">
          <p class="text-[#11313B] text-[13px] font-semibold truncate">
            ${name}
          </p>

          <div class="shrink-0 flex flex-col items-end gap-[4px]">
            <span class="text-[#7C8AA0] text-[11px]">
              ${formatSupportListDate(getTicketLastTime(ticket))}
            </span>

            ${
              isLastMessageFromCustomer(ticket)
                ? `
                  <span class="min-w-[18px] h-[18px] px-[5px] rounded-full bg-[#E53935] text-white text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                `
                : ""
            }
          </div>
        </div>

        <p class="mt-[5px] text-[#7C8AA0] text-[12px] truncate">
          ${getTicketLastMessage(ticket)}
        </p>

        <div class="mt-[6px] flex items-center gap-[6px] flex-wrap">
  <span class="text-[#30BBC7] text-[11px] font-semibold">
    ${ticket.ticket_number || "N/A"}
  </span>

  <span class="text-[#98A2B3] text-[11px]">•</span>

  <span class="inline-flex items-center h-[22px] px-[8px] rounded-full text-[11px] font-bold ${getSupportMetaBadge("category", ticket.category)}">
    ${ticket.category_label || ticket.category || "N/A"}
  </span>



  <span class="inline-flex items-center h-[22px] px-[8px] rounded-full text-[11px]  font-bold ${getSupportMetaBadge("status", ticket.status)}">
    ${ticketStatus}
  </span>
</div>
      </div>
    `;

    item.addEventListener("click", function () {
      openSupportTicketFromAPI(ticket.id);
    });

    container.appendChild(item);
  });
}

async function loadSupportTicketsSilently() {
  const result = await fetchSupportTickets();

  allSupportTickets = sortTicketsByLatestMessage(result.data || []);
  supportTickets = [...allSupportTickets];
  filteredSupportTickets = [...supportTickets];

  currentSupportPagination = result.pagination || null;

  renderSupportTicketList(filteredSupportTickets);
  renderSupportPagination(currentSupportPagination);
}

async function loadSupportTickets(customUrl = null, showLoader = true) {
  if (showLoader) showGlobalLoader();

  const container = document.getElementById("supportTicketList");

  if (container && showLoader) {
    container.innerHTML = `
      <div class="p-[20px] text-[#98A2B3] text-[13px]">
        Loading tickets...
      </div>
    `;
  }

  try {
    const result = await fetchSupportTickets({}, customUrl);

    allSupportTickets = sortTicketsByLatestMessage(result.data || []);
    supportTickets = [...allSupportTickets];
    filteredSupportTickets = [...supportTickets];

    currentSupportPagination = result.pagination || null;

    const stats = await fetchSupportStats();
    renderSupportStats(stats);

    renderSupportTicketList(filteredSupportTickets);
    renderSupportPagination(currentSupportPagination);
  } catch (error) {
    console.error("Support tickets error:", error);

    if (container) {
      container.innerHTML = `
        <div class="p-[20px] text-[#E57373] text-[13px]">
          ${error.message || "Unable to load tickets."}
        </div>
      `;
    }
  } finally {
    if (showLoader) hideGlobalLoader();
  }
}

function renderSupportPagination(pagination) {
  const paginationWrap = document.getElementById("supportTicketPagination");
  if (!paginationWrap || !pagination) return;

  paginationWrap.innerHTML = "";

  function updateSupportPageUrl(page) {
    window.history.pushState(
      null,
      "",
      `#support-requests?page=${page}`
    );
  }

  const activePage = pagination.current_page || 1;
  const lastPage = pagination.last_page || 1;
  const maxVisiblePages = 10;

  const currentGroup = Math.ceil(activePage / maxVisiblePages);
  const startPage = (currentGroup - 1) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, lastPage);

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left text-[11px]"></i>`;
  prevBtn.disabled = activePage <= 1;
  prevBtn.className =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  prevBtn.addEventListener("click", function () {
    if (activePage <= 1) return;

    const prevPage = activePage - 1;
    updateSupportPageUrl(prevPage);
    loadSupportTicketsWithFilters(prevPage);
  });

  paginationWrap.appendChild(prevBtn);

  for (let page = startPage; page <= endPage; page++) {
    const pageBtn = document.createElement("button");
    pageBtn.type = "button";
    pageBtn.textContent = page;

    pageBtn.className =
      page === activePage
        ? "w-[28px] h-[28px] rounded-[6px] cursor-pointer border border-[#30BBC7] bg-[#EAFBFD] text-[#30BBC7] text-[13px] font-semibold"
        : "w-[28px] h-[28px] rounded-[6px] cursor-pointer text-[#11313B] text-[13px] font-medium";

    pageBtn.addEventListener("click", function () {
      updateSupportPageUrl(page);
      loadSupportTicketsWithFilters(page);
    });

    paginationWrap.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right text-[11px]"></i>`;
  nextBtn.disabled = activePage >= lastPage;
  nextBtn.className =
    "w-[32px] h-[32px] rounded-[6px] border border-[#D0D5DD] bg-white text-[#667085] flex items-center justify-center cursor-pointer hover:border-[#30BBC7] hover:text-[#30BBC7] disabled:opacity-40 disabled:cursor-not-allowed";

  nextBtn.addEventListener("click", function () {
    if (activePage >= lastPage) return;

    const nextPage = activePage + 1;
    updateSupportPageUrl(nextPage);
    loadSupportTicketsWithFilters(nextPage);
  });

  paginationWrap.appendChild(nextBtn);
}

let currentSupportFilters = {
  search: "",
  status: "all",
  priority: "all",
  unassigned: ""
};

async function loadSupportTicketsWithFilters(page = 1) {
  const query = new URLSearchParams();

  query.append("page", page);
  query.append("per_page", 5);

  if (currentSupportFilters.status !== "all") {
    query.append("status", currentSupportFilters.status);
  }

  if (currentSupportFilters.priority !== "all") {
    query.append("priority", currentSupportFilters.priority);
  }

  if (currentSupportFilters.unassigned) {
    query.append("unassigned", 1);
  }

  if (currentSupportFilters.search) {
    query.append("search", currentSupportFilters.search);
  }

  await loadSupportTickets(
    `${API_BASE_URL}/admin/support-tickets?${query.toString()}`
  );
}

function setupSupportSearch() {
  const input = document.getElementById("supportTicketSearchInput");
  if (!input) return;

  let searchTimer = null;

  input.addEventListener("input", function () {
    const value = this.value.trim();

    clearTimeout(searchTimer);

    currentSupportFilters.search = value;

    // Reset search
    if (!value) {
      loadSupportTicketsWithFilters(1);
      return;
    }

    // Wait until at least 4 characters
    if (value.length < 4) {
      return;
    }

    searchTimer = setTimeout(() => {
      loadSupportTicketsWithFilters(1);
    }, 500);
  });
}

function setupSupportFilterButton() {
  const filterBtn = document.getElementById("supportFilterBtn");
  const dropdown = document.getElementById("supportFilterDropdown");

  const applyBtn = document.getElementById("applySupportFilterBtn");
  const resetBtn = document.getElementById("resetSupportFilterBtn");

  const statusInput = document.getElementById("supportStatusFilter");
  const priorityInput = document.getElementById("supportPriorityFilter");
  const unassignedInput = document.getElementById("supportUnassignedFilter");

  if (!filterBtn || !dropdown) return;

  filterBtn.onclick = function (event) {
    event.stopPropagation();
    dropdown.classList.toggle("hidden");
  };

  dropdown.onclick = function (event) {
    event.stopPropagation();
  };

  document.addEventListener("click", function () {
    dropdown.classList.add("hidden");
  });

  if (applyBtn) {
    applyBtn.onclick = async function () {
      currentSupportFilters.status = statusInput?.value || "all";
      currentSupportFilters.priority = priorityInput?.value || "all";
      currentSupportFilters.unassigned = unassignedInput?.checked ? 1 : "";

      await loadSupportTicketsWithFilters(1);

      dropdown.classList.add("hidden");
    };
  }

  if (resetBtn) {
    resetBtn.onclick = async function () {
      if (statusInput) statusInput.value = "all";
      if (priorityInput) priorityInput.value = "all";
      if (unassignedInput) unassignedInput.checked = false;

      currentSupportFilters = {
        search: "",
        status: "all",
        priority: "all",
        unassigned: ""
      };

      const searchInput = document.getElementById("supportTicketSearchInput");
      if (searchInput) searchInput.value = "";

      await loadSupportTicketsWithFilters(1);

      dropdown.classList.add("hidden");
    };
  }
}

function formatSupportChatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(String(dateString).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getSupportDateBadge(dateString) {
  const label = formatSupportChatDate(dateString);

  if (!label) return "";

  return `
    <div class="w-full flex justify-center my-[14px]">
      <span class="px-[14px] py-[6px] rounded-full bg-[#E5E7EB] text-[#344054] text-[12px] font-semibold">
        ${label}
      </span>
    </div>
  `;
}

function updateTicketInList(updatedTicket) {
  if (!updatedTicket?.id) return;

  const index = supportTickets.findIndex(
    (ticket) => ticket.id === updatedTicket.id
  );

  if (index !== -1) {
    supportTickets[index] = {
      ...supportTickets[index],
      ...updatedTicket
    };
  } else {
    supportTickets.unshift(updatedTicket);
  }

  moveTicketToTop(updatedTicket.id);
}

function updateSupportChatUrl(ticketId) {
  if (!ticketId) return;

  window.history.pushState(
    null,
    "",
    `#support-requests/chat/${ticketId}`
  );
}

function setSupportReplyBoxVisible(isVisible) {
  const replyInput = document.getElementById("supportReplyInput");
  if (!replyInput) return;

  const replyBox = replyInput.parentElement;
  if (!replyBox) return;

  if (isVisible) {
    replyBox.classList.remove("hidden");
  } else {
    replyBox.classList.add("hidden");
  }
}

async function openSupportTicketFromAPI(ticketId) {


   
  updateSupportChatUrl(ticketId);


  if (!ticketId) return;

 

  try {
    const result = await fetch(
      `${API_BASE_URL}/admin/support-tickets/${ticketId}`,
      {
        method: "GET",
        headers: supportAuthHeaders()
      }
    ).then((res) => res.json());

    if (!result.success || !result.data) {
      showActionPopupMessage("Unable to load ticket details.", "error");
      return;
    }

    const ticket = result.data;

     setSupportReplyBoxVisible(
  ticket.can_be_replied_to !== false &&
  ticket.status !== "resolved" &&
  ticket.status !== "closed" &&
  ticket.is_resolved !== true
);

    selectedSupportTicket = ticket;
    subscribeToSupportTicket(ticket.id);

    readSupportTicketIds.add(ticket.id);

    updateTicketInList(ticket);

    const name = getTicketFullName(ticket);

    document.getElementById("supportChatAvatar").textContent =
      getSupportInitials(name);

    document.getElementById("supportChatName").textContent = name;

    document.getElementById("supportChatSubtitle").textContent =
      `${ticket.ticket_number || "N/A"} • ${ticket.category_label || ticket.category || "N/A"} • ${ticket.priority_label || ticket.priority || "N/A"}`;

    const status = document.getElementById("supportChatStatus");

const isResolved =
  ticket.status === "resolved" ||
  ticket.is_resolved === true;

status.className =
  `inline-flex h-[28px] px-[10px] rounded-full text-[12px] font-medium items-center justify-center whitespace-nowrap ${getSupportStatusBadge(ticket.status)}`;

status.textContent =
  ticket.status_label || ticket.status || "Open";

const originalParent = status.parentElement;

let actionWrap = document.getElementById("supportChatActionWrap");

if (!actionWrap) {
  actionWrap = document.createElement("div");

  actionWrap.id = "supportChatActionWrap";

  actionWrap.className =
    "flex items-center gap-[8px]";

  originalParent.appendChild(actionWrap);
}

actionWrap.innerHTML = "";

actionWrap.appendChild(status);

if (!isResolved) {
  const resolveBtn = document.createElement("button");

  resolveBtn.id = "markSupportResolvedBtn";

  resolveBtn.type = "button";

 resolveBtn.className =
  "inline-flex items-center justify-center h-[32px] px-[14px] rounded-[8px] bg-[#30BBC7] text-white text-[12px] font-bold shadow-sm hover:bg-[#27AAB5] whitespace-nowrap cursor-pointer";

 resolveBtn.innerHTML = `<i class="fa-solid fa-circle-check mr-[6px]"></i> Mark as Resolved`;

  resolveBtn.addEventListener("click", function () {
    markSupportTicketAsResolved(
      ticket.ticket_number || ticket.id
    );
  });

  actionWrap.appendChild(resolveBtn);
}

    const messagesBox =
      document.getElementById("supportChatMessages");

    let lastDateLabel = "";

    function addDateBadgeIfNeeded(dateString) {
      const currentDateLabel =
        formatSupportChatDate(dateString);

      if (
        currentDateLabel &&
        currentDateLabel !== lastDateLabel
      ) {
        lastDateLabel = currentDateLabel;

        return getSupportDateBadge(dateString);
      }

      return "";
    }

    messagesBox.innerHTML = `
      ${addDateBadgeIfNeeded(ticket.created_at)}

      <div class="w-full flex justify-start">
        <div class="max-w-[430px] rounded-[12px] bg-[#F3EFE6] border border-[#D6CDBF] px-[16px] py-[12px]">

          <p class="text-[#11313B] text-[13px] leading-[20px]">
            ${ticket.description || ticket.subject || "No message"}
          </p>

          ${
            Array.isArray(ticket.attachments) &&
            ticket.attachments.length
              ? `
                <div class="mt-[10px] flex flex-wrap gap-[8px]">
                  ${ticket.attachments
                    .map(
                      (file) => `
                    <a href="${file.url}" target="_blank" rel="noopener noreferrer">
                      <img
                        src="${file.url}"
                        class="w-[120px] h-[120px] object-cover rounded-[10px] border border-[#E5E7EB] cursor-pointer hover:opacity-80"
                      />
                    </a>
                  `
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          <p class="mt-[5px] text-[#7C8AA0] text-[11px]">
            ${formatSupportTime(ticket.created_at)}
          </p>

        </div>
      </div>
    `;

    if (
      Array.isArray(ticket.replies) &&
      ticket.replies.length
    ) {
      ticket.replies.forEach((reply) => {
        const isAdminReply =
          reply.user &&
          reply.user.role === "admin";

        messagesBox.innerHTML += `
          ${addDateBadgeIfNeeded(reply.created_at)}

          <div class="w-full flex ${
            isAdminReply
              ? "justify-end"
              : "justify-start"
          }">

            <div class="max-w-[430px] rounded-[12px] ${
              isAdminReply
                ? "bg-[#E8F5E9] border border-[#C8E6C9]"
                : "bg-[#F3EFE6] border border-[#D6CDBF]"
            } px-[16px] py-[12px]">

              ${
                Array.isArray(reply.attachments) &&
                reply.attachments.length
                  ? `
                    <div class="mb-[10px] flex flex-wrap gap-[8px]">
                      ${reply.attachments
                        .map(
                          (file) => `
                        <a href="${file.url}" target="_blank" rel="noopener noreferrer">
                          <img
                            src="${file.url}"
                            class="w-[120px] h-[120px] object-cover rounded-[10px] border border-[#E5E7EB] cursor-pointer hover:opacity-80"
                          />
                        </a>
                      `
                        )
                        .join("")}
                    </div>
                  `
                  : ""
              }

              <p class="text-[#11313B] text-[13px] leading-[20px]">
                ${reply.message ||
                reply.body ||
                reply.reply ||
                ""}
              </p>

              <p class="mt-[5px] text-[#7C8AA0] text-[11px] ${
                isAdminReply
                  ? "text-right"
                  : "text-left"
              }">
                ${formatSupportTime(reply.created_at)}
              </p>

            </div>
          </div>
        `;
      });
    }

    messagesBox.scrollTop =
      messagesBox.scrollHeight;

  } catch (error) {
    console.error(
      "Ticket details error:",
      error
    );

    showActionPopupMessage(
      "Error loading ticket details.",
      "error"
    );
  }
        
}

async function markSupportTicketAsResolved(ticketNumber) {
  if (!ticketNumber) {
    showActionPopupMessage(
      "Ticket number is missing.",
      "error"
    );

    return;
  }

  const btn =
    document.getElementById(
      "markSupportResolvedBtn"
    );

  try {
    if (btn) {
      btn.disabled = true;

      btn.textContent = "Resolving...";

      btn.className =
        "h-[30px] px-[12px] ml-[8px] rounded-[8px] bg-[#F3F4F6] text-[#98A2B3] text-[12px] font-semibold cursor-not-allowed";
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/support-tickets/${ticketNumber}/resolve`,
      {
        method: "PATCH",
        headers: {
          ...supportAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resolution_notes:
            "Ticket marked as resolved by admin"
        })
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      result.success === false
    ) {
      throw new Error(
        result.message ||
        "Failed to resolve ticket"
      );
    }

    showActionPopupMessage(
      "Ticket marked as resolved.",
      "success"
    );

    if (btn) {
      btn.remove();
    }

    await loadSupportTickets();

    await openSupportTicketFromAPI(
      selectedSupportTicket.id
    );

  } catch (error) {

    showActionPopupMessage(
      error.message ||
      "Unable to resolve ticket.",
      "error"
    );

    if (btn) {
      btn.disabled = false;

      btn.textContent =
        "Mark as Resolved";

      btn.className =
        "h-[30px] px-[12px] ml-[8px] rounded-[8px] bg-[#EAF8F1] text-[#3BB273] text-[12px] font-semibold";
    }
  }
}

function moveTicketToTop(ticketId) {
  const index = supportTickets.findIndex((ticket) => ticket.id === ticketId);

  if (index === -1) return;

  const ticket = supportTickets[index];

  supportTickets.splice(index, 1);
  supportTickets.unshift(ticket);

  filteredSupportTickets = [...supportTickets];
  allSupportTickets = [...supportTickets];

  renderSupportTicketList(filteredSupportTickets);
}

function renderOneSupportReply(reply, forceAdmin = null) {
  const messagesBox = document.getElementById("supportChatMessages");
  if (!messagesBox || !reply) return;

  const messageText = reply.message || reply.body || reply.reply || "";

  const replyId =
    reply.localId ||
    reply.id ||
    reply.reply_id ||
    `${messageText}-${reply.created_at || ""}`;

  if (replyId && renderedSupportReplyIds.has(replyId)) return;
  if (replyId) renderedSupportReplyIds.add(replyId);

  const role = String(
    reply.user?.role ||
    reply.sender?.role ||
    reply.role ||
    ""
  ).toLowerCase();

  const isAdminReply =
    forceAdmin !== null
      ? forceAdmin
      : role === "admin" || role === "super_admin" || role === "staff";

  const attachments = Array.isArray(reply.attachments) ? reply.attachments : [];

  const row = document.createElement("div");
  row.className = `w-full flex ${isAdminReply ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-[430px] rounded-[12px] ${
    isAdminReply
      ? "bg-[#E8F5E9] border border-[#C8E6C9]"
      : "bg-[#F3EFE6] border border-[#D6CDBF]"
  } px-[16px] py-[12px]`;

  if (attachments.length) {
    const imageWrap = document.createElement("div");
    imageWrap.className = "mb-[10px] flex flex-wrap gap-[8px]";

    attachments.forEach((file) => {
     let imageUrl = file.previewUrl || file.url || file.path;

if (imageUrl && !imageUrl.startsWith("blob:") && !imageUrl.startsWith("http")) {
  imageUrl = `${API_BASE_URL.replace("/api", "")}/${imageUrl.replace(/^\/+/, "")}`;
}
      if (!imageUrl) return;

      const img = document.createElement("img");
      img.src = imageUrl;
      img.className =
        "w-[120px] h-[120px] object-cover rounded-[10px] border border-[#E5E7EB]";

      imageWrap.appendChild(img);
    });

    bubble.appendChild(imageWrap);
  }

  if (messageText) {
    const text = document.createElement("p");
    text.className = "text-[#11313B] text-[13px] leading-[20px]";
    text.textContent = messageText;
    bubble.appendChild(text);
  }

  const time = document.createElement("p");
  time.className = `mt-[5px] text-[#7C8AA0] text-[11px] ${
    isAdminReply ? "text-right" : "text-left"
  }`;
  time.textContent = formatSupportTime(reply.created_at || new Date().toISOString());

  bubble.appendChild(time);
  row.appendChild(bubble);
  messagesBox.appendChild(row);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function sendSupportReply(replyMessage = null) {
  if (!selectedSupportTicket?.id) return;

  const input = document.getElementById("supportReplyInput");
  const attachmentInput = document.getElementById("supportAttachmentInput");
  const preview = document.getElementById("supportAttachmentPreview");

  const message =
    typeof replyMessage === "string"
      ? replyMessage.trim()
      : input.value.trim();

  const files = selectedSupportFiles.length
    ? selectedSupportFiles
    : attachmentInput
      ? Array.from(attachmentInput.files)
      : [];

  if (!message && !files.length) {
    showActionPopupMessage(
      "Please type a message or attach an image.",
      "error"
    );
    return;
  }

  const formData = new FormData();
  formData.append("message", message);

  files.forEach((file) => {
    formData.append("attachments[]", file);
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/support-tickets/${selectedSupportTicket.id}/reply`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: formData
      }
    );

   const result = await response.json();

if (!response.ok || result.success === false) {
  throw new Error(result.message || "Failed to send reply");
}

const localAttachments = files.map((file) => ({
  previewUrl: URL.createObjectURL(file)
}));

const newReply = result.data?.reply || result.data || {};

const replyToRender = {
  localId: `admin-${Date.now()}`,
  message: newReply.message || newReply.body || newReply.reply || message,
  attachments: localAttachments.length
  ? localAttachments
  : Array.isArray(newReply.attachments) && newReply.attachments.length
    ? newReply.attachments
    : [],
  created_at: newReply.created_at || new Date().toISOString(),
  user: {
    role: "admin"
  }
};

renderOneSupportReply(replyToRender, true);

const newStatus =
  newReply.ticket?.status ||
  result.data?.ticket?.status ||
  result.ticket?.status ||
  "in_progress";

const newStatusLabel =
  newReply.ticket?.status_label ||
  result.data?.ticket?.status_label ||
  result.ticket?.status_label ||
  "In Progress";

selectedSupportTicket = {
  ...selectedSupportTicket,
  status: newStatus,
  status_label: newStatusLabel,
  last_reply_at: newReply.created_at || new Date().toISOString(),
  last_message_at: newReply.created_at || new Date().toISOString(),
  replies: [
    ...(Array.isArray(selectedSupportTicket.replies)
      ? selectedSupportTicket.replies
      : []),
    replyToRender
  ]
};

const statusEl = document.getElementById("supportChatStatus");

if (statusEl) {
  statusEl.className =
    `inline-flex h-[28px] px-[10px] rounded-full text-[12px] font-medium items-center justify-center whitespace-nowrap ${getSupportStatusBadge(newStatus)}`;

  statusEl.textContent = newStatusLabel;
}

updateTicketInList(selectedSupportTicket);

input.value = "";
if (attachmentInput) attachmentInput.value = "";
if (preview) preview.innerHTML = "";
selectedSupportFiles = [];

if (supportAttachmentMessageInput) {
  supportAttachmentMessageInput.value = "";
}

if (supportAttachmentModal) {
  supportAttachmentModal.classList.add("hidden");
}

return;
  } catch (error) {
    console.error("Reply error:", error);

    showActionPopupMessage(
      error.message || "Unable to send reply.",
      "error"
    );
  }
}

const supportAttachmentInput = document.getElementById("supportAttachmentInput");
const supportAttachmentModal = document.getElementById("supportAttachmentModal");
const supportAttachmentPreview = document.getElementById("supportAttachmentPreview");
const closeSupportAttachmentPreview = document.getElementById("closeSupportAttachmentPreview");
const supportAttachmentMessageInput = document.getElementById("supportAttachmentMessageInput");
const sendSupportAttachmentBtn = document.getElementById("sendSupportAttachmentBtn");
const supportReplyInput = document.getElementById("supportReplyInput");

let selectedSupportFiles = [];

if (supportAttachmentInput && supportAttachmentModal && supportAttachmentPreview) {
  supportAttachmentInput.addEventListener("change", function () {
    const newFiles = Array.from(this.files);

    if (!newFiles.length) return;

    selectedSupportFiles = [...selectedSupportFiles, ...newFiles];

    renderSupportAttachmentPreview();

    if (supportAttachmentMessageInput && supportReplyInput) {
      supportAttachmentMessageInput.value = supportReplyInput.value;
    }

    supportAttachmentModal.classList.remove("hidden");

    this.value = "";
  });
}

function renderSupportAttachmentPreview() {
  if (!supportAttachmentPreview) return;

  supportAttachmentPreview.innerHTML = "";

  selectedSupportFiles.forEach((file, index) => {
    const imageUrl = URL.createObjectURL(file);

    supportAttachmentPreview.innerHTML += `
      <div class="relative">
        <img
          src="${imageUrl}"
          class="w-[120px] h-[120px] object-cover rounded-[12px] border border-[#E5E7EB]"
        />

        <button
          type="button"
          class="removeSupportImageBtn absolute top-[5px] right-[5px] w-[22px] h-[22px] cursor-pointer rounded-full bg-black/60 text-white text-[12px] flex items-center justify-center"
          data-index="${index}"
        >
          ×
        </button>
      </div>
    `;
  });

  supportAttachmentPreview.innerHTML += `
    <label
      for="supportAttachmentInput"
      class="w-[120px] h-[120px] rounded-[12px] border border-dashed border-[#30BBC7] bg-[#EAFBFD] text-[#30BBC7] flex items-center justify-center cursor-pointer"
    >
      <i class="fa-solid fa-plus text-[22px]"></i>
    </label>
  `;

  document.querySelectorAll(".removeSupportImageBtn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number(this.dataset.index);
      selectedSupportFiles.splice(index, 1);

      if (!selectedSupportFiles.length) {
        clearSupportAttachmentSelection();
        return;
      }

      renderSupportAttachmentPreview();
    });
  });
}

function clearSupportAttachmentSelection() {
  selectedSupportFiles = [];

  const attachmentInput = document.getElementById("supportAttachmentInput");
  const preview = document.getElementById("supportAttachmentPreview");

  if (attachmentInput) attachmentInput.value = "";
  if (preview) preview.innerHTML = "";

  if (supportAttachmentMessageInput) {
    supportAttachmentMessageInput.value = "";
  }

  if (supportAttachmentModal) {
    supportAttachmentModal.classList.add("hidden");
  }
}

if (closeSupportAttachmentPreview) {
  closeSupportAttachmentPreview.addEventListener("click", function () {
    clearSupportAttachmentSelection();
  });
}

if (sendSupportAttachmentBtn) {
  sendSupportAttachmentBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const modalMessage = supportAttachmentMessageInput
      ? supportAttachmentMessageInput.value
      : "";

    sendSupportReply(modalMessage);
  });
}

function getSupportTicketIdFromUrl() {
  const hash = window.location.hash || "";
  const match = hash.match(/support-requests\/chat\/([^?]+)/);

  return match ? match[1] : null;
}
function setupSupportRequestsSection() {
    setSupportReplyBoxVisible(false);
    subscribeToSupportTicketList();
  loadSupportTickets().then(() => {
    const ticketIdFromUrl = getSupportTicketIdFromUrl();

    if (ticketIdFromUrl) {
      openSupportTicketFromAPI(ticketIdFromUrl);
    }
  });

  setupSupportSearch();
  setupSupportFilterButton();

  document
    .getElementById("sendSupportReplyBtn")
    ?.addEventListener("click", sendSupportReply);

  document
    .getElementById("supportReplyInput")
    ?.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        sendSupportReply();
      }
    });
}

document.addEventListener("DOMContentLoaded", setupSupportRequestsSection);

/* ================= END SUPPORT REQUESTS SECTION ================= */



//=============================SETTINGS SECTION==================================================


let selectedProfilePhoto = null;

function renderSettingsProfile(user) {
  if (!user) return;

  const photoPreview = document.getElementById("settingsProfilePhotoPreview");
  const firstName = document.getElementById("settingsFirstName");
  const lastName = document.getElementById("settingsLastName");
  const email = document.getElementById("settingsEmail");
  const phone = document.getElementById("settingsPhone");

  if (photoPreview) {
    photoPreview.src =
      user.profile_photo_url ||
      user.profile_image_url ||
      "assets/images/profile icon.png";
  }

  if (firstName) firstName.value = user.first_name || "";
  if (lastName) lastName.value = user.last_name || "";
  if (email) email.value = user.email || "";
  if (phone) phone.value = user.phone || "";
}

/* ================= SETTINGS TABS  ================= */

async function loadSettingsSection() {
  showGlobalLoader();

  try {
    await loadAdminProfile();

    document.querySelector('[data-target="settingsProfilePanel"]')?.click();
  } finally {
    hideGlobalLoader();
  }
}

function setupSettingsTabs() {
  const tabs = document.querySelectorAll(".settingsTabBtn");
  const panels = document.querySelectorAll(".settingsPanel");

  tabs.forEach((tab) => {
    tab.onclick = function () {
      const targetId = this.dataset.target;

      tabs.forEach((item) => {
        item.classList.remove("border", "border-[#30BBC7]");
      });

      panels.forEach((panel) => {
        panel.classList.add("hidden");
      });

      this.classList.add("border", "border-[#30BBC7]");

      const panel = document.getElementById(targetId);
      if (panel) panel.classList.remove("hidden");
    };
  });
}
/* ================= PROFILE UPDATE ================= */

function setupSettingsProfileUpdate() {
  const photoBtn = document.getElementById("settingsProfilePhotoBtn");
  const photoInput = document.getElementById("settingsProfilePhotoInput");
  const photoPreview = document.getElementById("settingsProfilePhotoPreview");
  const updateBtn = document.getElementById("settingsProfileUpdateBtn");

  const confirmBtn = document.getElementById("confirmProfilePhotoBtn");
  const cancelBtn = document.getElementById("cancelProfilePhotoBtn");
  const modal = document.getElementById("profilePhotoConfirmModal");
  const modalPreview = document.getElementById("profilePhotoModalPreview");

  if (
    !photoBtn ||
    !photoInput ||
    !photoPreview ||
    !updateBtn ||
    !confirmBtn ||
    !cancelBtn ||
    !modal ||
    !modalPreview
  ) {
    return;
  }

  // Open file picker
  photoBtn.addEventListener("click", function () {
    photoInput.click();
  });

  // Select image and show popup preview
  photoInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    selectedProfilePhoto = file;

    modalPreview.src = URL.createObjectURL(file);

    modal.classList.remove("hidden");
  });

  // Cancel upload
  cancelBtn.addEventListener("click", function () {
    selectedProfilePhoto = null;

    photoInput.value = "";

    modal.classList.add("hidden");
  });

  // Upload image
  confirmBtn.addEventListener("click", async function () {
    try {
      if (!selectedProfilePhoto) {
        showActionPopupMessage(
          "Please select a profile photo first.",
          "error"
        );
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = "Updating...";

      const formData = new FormData();
      formData.append("photo", selectedProfilePhoto);

      const response = await fetch(
        `${API_BASE_URL}/admin/profile/photo`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${AUTH_TOKEN}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to upload profile photo"
        );
      }

     

const updatedUser = result.data;

sessionStorage.setItem("admin_user", JSON.stringify(updatedUser));

photoPreview.src = updatedUser.profile_photo_url || "assets/images/profile icon.png";

renderAdminProfile(updatedUser);
renderSettingsProfile(updatedUser);

selectedProfilePhoto = null;
photoInput.value = "";

modal.classList.add("hidden");

showActionPopupMessage(
  "Profile photo updated successfully!"
);

    } catch (error) {
      showActionPopupMessage(
        error.message || "Unable to update profile photo.",
        "error"
      );
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Update";
    }
  });
}



function setupSettingsPasswordToggle() {
  document.querySelectorAll(".settingsPasswordToggle").forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = document.getElementById(this.dataset.target);
      const icon = this.querySelector("i");

      if (!input || !icon) return;

      if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-regular fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fa-regular fa-eye";
      }
    });
  });
}
async function changeAdminPassword(data) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({
      current_password: data.currentPassword,
      new_password: data.newPassword,
      new_password_confirmation: data.confirmPassword
    })
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to update password");
  }

  return result;
}

function setupSettingsPasswordUpdate() {
  const updateBtn = document.getElementById("settingsPasswordUpdateBtn");
  if (!updateBtn) return;

  updateBtn.addEventListener("click", async function () {
    const currentPassword = document.getElementById("settingsOldPassword")?.value.trim();
    const newPassword = document.getElementById("settingsNewPassword")?.value.trim();
    const confirmPassword = document.getElementById("settingsConfirmPassword")?.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showActionPopupMessage("Please fill in all password fields.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showActionPopupMessage("New password and confirmation do not match.", "error");
      return;
    }

    try {
      updateBtn.disabled = true;
      updateBtn.textContent = "Updating...";

      await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      document.getElementById("settingsOldPassword").value = "";
      document.getElementById("settingsNewPassword").value = "";
      document.getElementById("settingsConfirmPassword").value = "";

      showActionPopupMessage("Password updated successfully.");
    } catch (error) {
      showActionPopupMessage(error.message || "Unable to update password.", "error");
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = "Update Password";
    }
  });
}
/* ================= USER UPDATE ================= */

function setupUsersToggles() {
  document.querySelectorAll(".toggleBtn").forEach(btn => {
    btn.addEventListener("click", function () {
      const circle = this.querySelector(".toggleCircle");
      const isActive = this.classList.contains("bg-[#30BBC7]");

      if (isActive) {
        this.classList.remove("bg-[#30BBC7]");
        this.classList.add("bg-[#D0D5DD]");
        circle.style.left = "2px";
      } else {
        this.classList.remove("bg-[#D0D5DD]");
        this.classList.add("bg-[#30BBC7]");
        circle.style.left = "24px";
      }
    });
  });
}


function setupUsersSave() {
  const btn = document.getElementById("settingsUsersSaveBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const data = {
      maxUsers: document.getElementById("settingsMaxUsers").value,
      defaultRole: document.getElementById("settingsDefaultRole").value,
    };

    localStorage.setItem("settingsUsersData", JSON.stringify(data));

    showSettingsSuccessModal("User settings updated successfully");
  });
}

/* ================= NOTIFICATION UPDATE ================= */
function setupSettingsToggleButtons() {
  document.querySelectorAll(".settingsToggleBtn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const circle = this.querySelector(".settingsToggleCircle");
      const isActive = this.classList.contains("bg-[#30BBC7]");

      if (isActive) {
        this.classList.remove("bg-[#30BBC7]");
        this.classList.add("bg-[#D0D5DD]");
        if (circle) circle.style.left = "2px";
      } else {
        this.classList.remove("bg-[#D0D5DD]");
        this.classList.add("bg-[#30BBC7]");
        if (circle) circle.style.left = "24px";
      }
    });
  });
}

function setupSettingsNotificationsSave() {
  const saveBtn = document.getElementById("settingsNotificationsSaveBtn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", function () {
    localStorage.setItem("settingsNotificationsUpdated", "true");
    showSettingsSuccessModal("Notification settings updated successfully.");
  });
}

//* ================= SETTINGS UPDATE IN SETTINGS ================= */
function setupSettingsSecuritySave() {
  const btn = document.getElementById("settingsSecuritySaveBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const data = {
      sessionTimeout: document.getElementById("settingsSessionTimeout").value,
      maxAttempts: document.getElementById("settingsMaxAttempts").value,
      lockoutDuration: document.getElementById("settingsLockoutDuration").value
    };

    localStorage.setItem("settingsSecurityData", JSON.stringify(data));

    showSettingsSuccessModal("Security settings updated successfully.");
  });
}

//* ================= SYSTEM PANEL SETTINGS ================= */
function setupSettingsSystemSave() {
  const btn = document.getElementById("settingsSystemSaveBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const data = {
      retention: document.getElementById("settingsRetention").value,
      backupFrequency: document.getElementById("settingsBackupFrequency").value
    };

    localStorage.setItem("settingsSystemData", JSON.stringify(data));

    showSettingsSuccessModal("System settings updated successfully.");
  });
}
/*===================   END OF SETTINGS =============================*/

document.addEventListener("DOMContentLoaded", function () {
  setupSettingsTabs();
  setupSettingsProfileUpdate();
  setupSettingsPasswordToggle();
  setupSettingsPasswordUpdate();
  
    setupUsersToggles();
    setupUsersSave();
    setupSettingsToggleButtons();
    setupSettingsNotificationsSave();
    setupSettingsSecuritySave();
    setupSettingsSystemSave();
});



/* ================= END OF SETTINGS SECTION ================= */


/* ================= LOGOUT SECTION ================= */
function setupLogoutSection() {
  const cancelBtn = document.getElementById("cancelLogoutBtn");
  const confirmBtn = document.getElementById("confirmLogoutBtn");

  cancelBtn?.addEventListener("click", function () {
    window.location.hash = "#logout";
  });

  confirmBtn?.addEventListener("click", async function () {
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Logging out...";

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      });
    } catch (error) {
      
    }

    sessionStorage.clear();
    localStorage.clear();

    window.location.href = "signin.html";
  });
}

document.addEventListener("DOMContentLoaded",function () {
  setupLogoutSection();
});

/* ================= END OF LOGOUT SECTION ================= */

/* ================= ADMIN USERS================= */


let adminUsers = [];

let selectedAdminUserId = null;

function adminUsersAuthHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${AUTH_TOKEN}`
  };
}

async function fetchAllAdminUsers() {
  const response = await fetch(`${API_BASE_URL}/admin/admin-users/all`, {
    method: "GET",
    headers: adminUsersAuthHeaders()
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to load admin users");
  }

  return Array.isArray(result.data?.users) ? result.data.users : [];
}

async function loadAdminUsers() {
  showGlobalLoader();

  try {
    adminUsers = await fetchAllAdminUsers();
    renderAdminUsers(adminUsers);
  } catch (error) {
    console.error("Admin users error:", error);
    showActionPopupMessage(error.message || "Unable to load admin users.", "error");
  } finally {
    hideGlobalLoader();
  }
}

function getAdminStatusBadge(isActive) {
  if (Number(isActive) === 1 || isActive === true) {
    return `
      <span class="inline-flex items-center h-[22px] px-[8px] rounded-[5px] bg-[#EAF8F1] text-[#3BB273] text-[11px] font-semibold">
        Active
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center h-[22px] px-[8px] rounded-[5px] bg-[#FDECEF] text-[#E57373] text-[11px] font-semibold">
      Inactive
    </span>
  `;
}

function getAdminRoleBadge(role) {
  return `
    <span class="inline-flex items-center h-[22px] px-[8px] rounded-[5px] bg-[#EAFBFD] text-[#30BBC7] text-[11px] font-semibold capitalize">
      ${role || "admin"}
    </span>
  `;
}

function renderAdminUsers(users = []) {
  const body = document.getElementById("adminUsersTableBody");
  if (!body) return;

  body.innerHTML = "";

  if (!users.length) {
    body.innerHTML = `
      <div class="w-full h-[58px] flex items-center px-[8px] border-b border-[#E5E7EB] text-[#7C8AA0] text-[12px]">
        No admin users found.
      </div>
    `;
    return;
  }

  users.forEach((user, index) => {
    body.innerHTML += `
      <div class="w-full h-[58px] flex items-center border-b border-[#E5E7EB] text-[#11313B] text-[12px]">
        <div class="w-[50px] px-[8px]">${index + 1}</div>

        <div class="w-[115px] px-[8px] font-semibold truncate">
          ${user.first_name || "N/A"}
        </div>

        <div class="w-[115px] px-[8px] truncate">
          ${user.last_name || "N/A"}
        </div>

        <div class="w-[200px] px-[8px] truncate">
          ${user.email || "N/A"}
        </div>

        <div class="w-[160px] px-[8px] truncate">
          ${user.phone || "N/A"}
        </div>

        <div class="w-[115px] px-[8px]">
          ${getAdminRoleBadge(user.role)}
        </div>

        <div class="w-[110px] px-[8px]">
          ${getAdminStatusBadge(user.is_active)}
        </div>

        <div class="w-[110px] px-[8px]">
          <button
            type="button"
            class="openUpdateAdminBtn inline-flex items-center gap-[5px] h-[26px] px-[10px] rounded-[6px] bg-[#EAFBFD] text-[#30BBC7] text-[12px] font-medium cursor-pointer hover:bg-[#DDF7FA]"
            data-admin-id="${user.id}"
          >
            <i class="fa-solid fa-pen text-[11px]"></i>
            Update
          </button>
        </div>
      </div>
    `;
  });
}



const updateModal = document.getElementById("updateAdminUserModal");

document.addEventListener("click", async function (event) {
  const updateBtn = event.target.closest(".openUpdateAdminBtn");
  if (!updateBtn) return;

  const adminId = updateBtn.dataset.adminId;
  if (!adminId) return;

  window.location.hash = `#admin-users/${adminId}`;
});

async function openUpdateAdminModal(adminId) {
  try {
    showGlobalLoader();

    const response = await fetch(`${API_BASE_URL}/admin/admin-users/${adminId}`, {
      method: "GET",
      headers: adminUsersAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to load admin user.");
    }

    const user = result.data?.user;
    if (!user) throw new Error("Admin user not found.");

    fillUpdateAdminModal(user);

    updateModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  } catch (error) {
    console.error("Open update admin modal error:", error);
    showActionPopupMessage(error.message || "Unable to open admin user.", "error");
  } finally {
    hideGlobalLoader();
  }
}

function closeUpdateModal() {
  updateModal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");

  if (window.location.hash.startsWith("#admin-users/")) {
    window.location.hash = "#admin-users";
  }
}

document
  .getElementById("closeUpdateAdminModalBtn")
  ?.addEventListener("click", closeUpdateModal);

document
  .getElementById("cancelUpdateAdminBtn")
  ?.addEventListener("click", closeUpdateModal);

updateModal?.addEventListener("click", function (event) {
  if (event.target === updateModal) {
    closeUpdateModal();
  }
});

function fillUpdateAdminModal(user) {
  document.getElementById("updateAdminUserForm").dataset.adminId = user.id;

  document.getElementById("updateAdminFirstName").value = user.first_name || "";
  document.getElementById("updateAdminLastName").value = user.last_name || "";
  document.getElementById("updateAdminEmail").value = user.email || "";
  document.getElementById("updateAdminRole").value = user.role || "admin";

  const phone = user.phone || "";
  const phoneCode = phone.startsWith("+1") ? "+1" : "+234";
  const phoneNumber = phone.replace(phoneCode, "");

  document.getElementById("updatePhoneCode").value = phoneCode;
  document.getElementById("updateAdminPhone").value = phoneNumber;
}

document
  .getElementById("updateAdminUserForm")
  ?.addEventListener("submit", updateAdminRights);

async function updateAdminRights(event) {
  event.preventDefault();

  const form = event.target;
  const adminId = form.dataset.adminId;

  if (!adminId) {
    showActionPopupMessage("Admin ID not found.", "error");
    return;
  }

  const rights = {
    can_manage_drivers:
      document.querySelector('input[name="drivers"]:checked')?.value === "yes",

    can_manage_support_ticket:
      document.querySelector('input[name="support"]:checked')?.value === "yes",

    can_manage_payouts:
      document.querySelector('input[name="payouts"]:checked')?.value === "yes",

    can_create_admins:
      document.querySelector('input[name="admins"]:checked')?.value === "yes"
  };

  try {
    showGlobalLoader();

    const response = await fetch(
      `${API_BASE_URL}/admin/admin-users/${adminId}/rights`,
      {
        method: "POST",
        headers: {
          ...adminUsersAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rights })
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to update admin rights.");
    }

    showActionPopupMessage("Admin rights updated successfully.", "success");

    closeUpdateModal();
    loadAdminUsers();
  } catch (error) {
    console.error("Update admin rights error:", error);
    showActionPopupMessage(error.message || "Unable to update admin rights.", "error");
  } finally {
    hideGlobalLoader();
  }
}

document.getElementById("openCreateAdminFormBtn")?.addEventListener("click", function () {
  window.location.hash = "#admin-users/create";
});

document.getElementById("backToAdminUsersBtn")?.addEventListener("click", function () {
  window.location.hash = "#admin-users";
});

document.getElementById("cancelCreateAdminBtn")?.addEventListener("click", function () {
  window.location.hash = "#admin-users";
});


// ================= CREATE ADMIN USER =================

document
  .getElementById("createAdminUserForm")
  ?.addEventListener("submit", createAdminUser);

// Generate random 8-digit password
function generateRandomPassword() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function createAdminUser(e) {
  e.preventDefault();

  const phoneCode = document
    .getElementById("adminPhoneCodeInput")
    .value.split(" ")[1];

  const password = generateRandomPassword();

  const payload = {
  first_name: document.getElementById("adminFirstNameInput").value.trim(),
  last_name: document.getElementById("adminLastNameInput").value.trim(),
  email: document.getElementById("adminEmailInput").value.trim(),
  phone: phoneCode + document.getElementById("adminPhoneInput").value.trim(),
  role: document.getElementById("adminRoleInput").value,

  password,
  password_confirmation: password,

  rights: JSON.stringify({
    can_manage_drivers:
      document.querySelector('input[name="canManageDrivers"]:checked')?.value === "true",

    can_manage_support_ticket:
      document.querySelector('input[name="canManageSupportTicket"]:checked')?.value === "true",

    can_manage_payouts:
      document.querySelector('input[name="canManagePayouts"]:checked')?.value === "true",

    can_create_admins:
      document.querySelector('input[name="canCreateAdmins"]:checked')?.value === "true"
  })
};

  try {
    showGlobalLoader();

    const response = await fetch(
      `${API_BASE_URL}/admin/admin-users/create`,
      {
        method: "POST",
        headers: {
          ...adminUsersAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || "Unable to create admin user."
      );
    }

    showActionPopupMessage(
      "Admin user created successfully.",
      "success"
    );

    // Reset the form
    document.getElementById("createAdminUserForm").reset();

    // Return to Admin Users page
    window.location.hash = "#admin-users";

    // Reload admin list
    if (typeof loadAdminUsers === "function") {
      loadAdminUsers();
    }
  } catch (error) {
    console.error("Create Admin User Error:", error);

    showActionPopupMessage(
      error.message || "Something went wrong.",
      "error"
    );
  } finally {
    hideGlobalLoader();
  }
}