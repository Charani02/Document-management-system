
async function loadUser() {
    try {
        const response = await fetch('/api/me');

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();

        document.getElementById('userName').textContent = user.name;

    } catch (error) {
        window.location.href = 'login.html';
    }
}

async function logout() {
    await fetch('/api/logout', {
        method: 'POST'
    });

    window.location.href = 'login.html';
}

loadUser();
