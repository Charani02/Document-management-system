
const params = new URLSearchParams(window.location.search);

const documentIdInput = document.getElementById('documentId');

documentIdInput.value = params.get('id') || '';

async function loadAccess() {
    const documentId = documentIdInput.value;

    if (!documentId) return;

    const response = await fetch('/api/access/' + documentId);

    if (!response.ok) {
        document.getElementById('accessList').textContent =
            'Enter a document ID that you own.';
        return;
    }

    const users = await response.json();

    const container = document.getElementById('accessList');

    container.innerHTML = '';

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'document-card';

        const info = document.createElement('p');

        info.textContent =
            user.name + ' (' + user.email + ') - ' +
            user.permission;

        const button = document.createElement('button');

        button.textContent = 'Revoke Access';
        button.className = 'btn danger';

        button.onclick = async () => {
            const result = await fetch(
                '/api/access/' + user.access_id,
                { method: 'DELETE' }
            );

            const data = await result.json();

            alert(data.message);

            loadAccess();
        };

        card.append(info, button);

        container.appendChild(card);
    });
}

document.getElementById('accessForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const document_id = document.getElementById('documentId').value;
    const email = document.getElementById('email').value;
    const permission = document.getElementById('permission').value;

    const message = document.getElementById('message');

    try {
        const response = await fetch('/api/access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                document_id,
                email,
                permission
            })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            document.getElementById('email').value = '';
            loadAccess();
        }

    } catch (error) {
        message.textContent = 'Server connection failed';
    }
});

documentIdInput.addEventListener('change', loadAccess);

if (documentIdInput.value) {
    loadAccess();
}
