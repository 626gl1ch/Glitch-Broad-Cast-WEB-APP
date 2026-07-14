// 100% Free & Unlimited Usage Utility for Glitch Broadcast Web App

export function getUsageCount() {
  return 0;
}

export function incrementUsageCount() {
  // Free & Unlimited app - no usage count increments needed
  window.dispatchEvent(new Event("glitch-usage-change"));
}

export function isSubscribed() {
  // Always true for total 100% free access
  return true;
}

export function setSubscribed() {
  localStorage.setItem("glitch_subscribed", "true");
  window.dispatchEvent(new Event("glitch-usage-change"));
}

export function isAdmin() {
  return true;
}

export function setAdmin() {
  localStorage.setItem("glitch_admin_active", "true");
  window.dispatchEvent(new Event("glitch-usage-change"));
}

export function checkUsageLimit() {
  // Always false - no paywall limits ever apply
  return false;
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyAdminCredentials() {
  return true;
}
