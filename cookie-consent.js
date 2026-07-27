/**
 * ANGAGSU Game Studio — Cookie / Privacy Consent Banner
 * Single shared script included on every page via:
 *   <script src="cookie-consent.js" defer></script>
 *
 * Shows a GDPR-style consent banner before any analytics or
 * advertising script is allowed to run. Consent choice is stored
 * in localStorage and re-asked every 6 months.
 *
 * To gate a script behind consent, wrap its loading in:
 *   window.angagsuConsent.onConsent(function () { ... load GA / AdMob ... });
 * instead of adding it directly to the page <head>.
 */
(function () {
    var STORAGE_KEY = 'angagsu_cookie_consent';
    var REASK_DAYS = 180;

    function getStoredConsent() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            var ageDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
            if (ageDays > REASK_DAYS) return null;
            return parsed.choice; // 'accepted' | 'declined'
        } catch (e) {
            return null;
        }
    }

    function storeConsent(choice) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                choice: choice,
                timestamp: Date.now()
            }));
        } catch (e) { /* localStorage unavailable, ignore */ }
    }

    var consentCallbacks = [];
    window.angagsuConsent = {
        // Register a callback that only fires once the user has accepted.
        onConsent: function (fn) {
            var existing = getStoredConsent();
            if (existing === 'accepted') {
                fn();
            } else {
                consentCallbacks.push(fn);
            }
        },
        getChoice: getStoredConsent
    };

    function runAcceptedCallbacks() {
        consentCallbacks.forEach(function (fn) {
            try { fn(); } catch (e) { /* no-op */ }
        });
        consentCallbacks = [];
    }

    function injectBanner() {
        var wrapper = document.createElement('div');
        wrapper.id = 'cookie-consent-banner';
        wrapper.setAttribute('role', 'dialog');
        wrapper.setAttribute('aria-label', 'Cookie consent');
        wrapper.style.cssText = [
            'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:9999',
            'background:#0a0a0e', 'border-top:1px solid rgba(255,255,255,0.1)',
            'padding:20px 24px', 'font-family:Montserrat,sans-serif',
            'display:flex', 'flex-wrap:wrap', 'align-items:center',
            'justify-content:space-between', 'gap:16px',
            'box-shadow:0 -10px 40px rgba(0,0,0,0.5)'
        ].join(';');

        wrapper.innerHTML =
            '<p style="color:#94a3b8;font-size:0.85rem;line-height:1.5;margin:0;max-width:640px;flex:1 1 320px;">' +
            'We use cookies and similar technologies (including Google Analytics/Firebase and Google AdMob) to ' +
            'measure app usage and show ads. You can accept all cookies or continue with only the essential ones. ' +
            'See our <a href="privacy.html" style="color:#a78bfa;text-decoration:underline;">Privacy Policy</a> for details.' +
            '</p>' +
            '<div style="display:flex;gap:12px;flex:0 0 auto;">' +
            '<button id="cookie-decline-btn" style="background:transparent;border:1px solid #333;color:#e2e8f0;' +
            'padding:10px 20px;border-radius:8px;font-size:0.8rem;font-weight:700;text-transform:uppercase;' +
            'letter-spacing:0.05em;cursor:pointer;">Essential Only</button>' +
            '<button id="cookie-accept-btn" style="background:#6d28d9;border:1px solid #7c3aed;color:#fff;' +
            'padding:10px 20px;border-radius:8px;font-size:0.8rem;font-weight:700;text-transform:uppercase;' +
            'letter-spacing:0.05em;cursor:pointer;">Accept All</button>' +
            '</div>';

        document.body.appendChild(wrapper);

        document.getElementById('cookie-accept-btn').addEventListener('click', function () {
            storeConsent('accepted');
            wrapper.remove();
            runAcceptedCallbacks();
        });
        document.getElementById('cookie-decline-btn').addEventListener('click', function () {
            storeConsent('declined');
            wrapper.remove();
        });
    }

    function init() {
        var choice = getStoredConsent();
        if (choice === 'accepted') {
            runAcceptedCallbacks();
            return;
        }
        if (choice === 'declined') {
            return; // respect previous choice, don't nag every page load
        }
        injectBanner();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
