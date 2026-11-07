
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const message = document.getElementById('message');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }

    } catch (error) {
        message.textContent = 'Server connection failed';
    }
});
