import React, { createContext, useContext, useEffect, useState } from 'react';
import { setSSOCredentials, getSSOCredentials, clearSSOCredentials, checkHealth } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for SSO params in URL (when loaded via Discourse iframe)
        const params = new URLSearchParams(window.location.search);
        const sso = params.get('sso');
        const sig = params.get('sig');

        if (sso && sig) {
            // Store SSO credentials
            setSSOCredentials(sso, sig);

            // Decode SSO payload to get user info
            try {
                const decoded = atob(sso);
                const ssoParams = new URLSearchParams(decoded);
                setCurrentUser({
                    id: ssoParams.get('external_id'),
                    username: ssoParams.get('username'),
                    email: ssoParams.get('email'),
                    name: ssoParams.get('name')
                });
            } catch (e) {
                console.error('Failed to decode SSO payload:', e);
            }

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Check if we have stored credentials
            const creds = getSSOCredentials();
            if (creds) {
                // Verify credentials are still valid by calling health check
                checkHealth()
                    .then(() => {
                        // Try to decode stored SSO for user info
                        try {
                            const decoded = atob(creds.sso);
                            const ssoParams = new URLSearchParams(decoded);
                            setCurrentUser({
                                id: ssoParams.get('external_id'),
                                username: ssoParams.get('username'),
                                email: ssoParams.get('email'),
                                name: ssoParams.get('name')
                            });
                        } catch (e) {
                            console.error('Failed to decode stored SSO:', e);
                            clearSSOCredentials();
                        }
                    })
                    .catch(() => {
                        // Credentials invalid
                        clearSSOCredentials();
                    });
            }
        }

        setLoading(false);
    }, []);

    const logout = () => {
        clearSSOCredentials();
        setCurrentUser(null);
        // Redirect to Discourse or close iframe
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'pepplanner-logout' }, '*');
        } else {
            window.location.href = import.meta.env.VITE_DISCOURSE_URL || '/';
        }
    };

    const value = {
        currentUser,
        logout,
        isAuthenticated: !!currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
