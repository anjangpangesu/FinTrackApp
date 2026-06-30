const GAS_URL = "https://script.google.com/macros/s/AKfycbyxxoa2KiF2d9uokUNor5W6QT43oFeuyzztxLnOAtajjaPvN397M7jK5TUbE-WCerT2RQ/exec";

async function apiFetch(action, params = {}) {
    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        console.error("URL GAS Belum diset!");
        return { status: "error", message: "GAS URL belum diset. Silakan update api.js" };
    }

    try {
        let url = new URL(GAS_URL);
        url.searchParams.append("action", action);

        // Append other GET params if any
        for (let key in params) {
            url.searchParams.append(key, params[key]);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            // redirect: 'follow'
        });

        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
}

async function apiPost(action, payload) {
    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        return { status: "error", message: "GAS URL belum diset." };
    }

    try {
        const bodyData = {
            action: action,
            payload: payload
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(bodyData),
            // Headers omitted or set to text/plain to avoid CORS preflight if needed
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        });

        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("API Post Error:", error);
        throw error;
    }
}

// ==== API WRAPPERS ====

const api = {
    // Auth
    login: (payload) => apiPost("login", payload),

    // Keuangan
    getKeuangan: () => apiFetch("getKeuangan"),
    addKeuangan: (payload) => apiPost("addKeuangan", payload),
    updateKeuangan: (payload) => apiPost("updateKeuangan", payload),
    deleteKeuangan: (id) => apiPost("deleteKeuangan", { id }),
    deleteMultipleKeuangan: (ids) => apiPost("deleteMultipleKeuangan", { ids }),

    // Hutang
    getHutang: () => apiFetch("getHutang"),
    addHutang: (payload) => apiPost("addHutang", payload),
    updateHutang: (payload) => apiPost("updateHutang", payload),
    deleteHutang: (id) => apiPost("deleteHutang", { id }),
    deleteMultipleHutang: (ids) => apiPost("deleteMultipleHutang", { ids }),
    payHutang: (payload) => apiPost("payHutang", payload),

    // All
    getAll: () => apiFetch("getAll")
};