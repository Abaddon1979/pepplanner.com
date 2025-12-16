// API Service for Pepplanner Backend (PostgreSQL)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// SSO credentials from URL params or stored in session
let ssoCredentials = null;

export function setSSOCredentials(sso, sig) {
    ssoCredentials = { sso, sig };
    sessionStorage.setItem('pepplanner_sso', JSON.stringify({ sso, sig }));
}

export function getSSOCredentials() {
    if (ssoCredentials) return ssoCredentials;

    const stored = sessionStorage.getItem('pepplanner_sso');
    if (stored) {
        ssoCredentials = JSON.parse(stored);
        return ssoCredentials;
    }

    return null;
}

export function clearSSOCredentials() {
    ssoCredentials = null;
    sessionStorage.removeItem('pepplanner_sso');
}

async function apiRequest(endpoint, options = {}) {
    const creds = getSSOCredentials();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (creds) {
        headers['X-Discourse-SSO'] = creds.sso;
        headers['X-Discourse-Sig'] = creds.sig;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// ============================================
// Calculator API
// ============================================
export async function getCalculatorSettings() {
    return apiRequest('/api/calculator');
}

export async function saveCalculatorSettings(settings) {
    return apiRequest('/api/calculator', {
        method: 'POST',
        body: JSON.stringify(settings)
    });
}

// ============================================
// Doses/Calendar API
// ============================================
export async function getDoses() {
    return apiRequest('/api/doses');
}

export async function createDose(dose) {
    return apiRequest('/api/doses', {
        method: 'POST',
        body: JSON.stringify(dose)
    });
}

export async function createBatchDoses(doses) {
    return apiRequest('/api/doses/batch', {
        method: 'POST',
        body: JSON.stringify({ doses })
    });
}

export async function updateDose(id, updates) {
    return apiRequest(`/api/doses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
}

export async function deleteDose(id) {
    return apiRequest(`/api/doses/${id}`, {
        method: 'DELETE'
    });
}

// ============================================
// Health Check
// ============================================
export async function checkHealth() {
    return apiRequest('/api/health');
}
