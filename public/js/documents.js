
async function loadDocuments() {
    const search = document.getElementById('search').value;

    const response = await fetch(
        '/api/documents?search=' + encodeURIComponent(search)
    );

    if (response.status === 401) {
        window.location.href = 'login.html';
        return;
    }

    const documents = await response.json();

    const container = document.getElementById('documentsList');

    container.innerHTML = '';

    if (documents.length === 0) {
        container.textContent = 'No documents found.';
        return;
    }

    documents.forEach(doc => {
        const card = document.createElement('div');

        card.className = 'document-card';

        const title = document.createElement('h3');
        title.textContent = doc.title;

        const category = document.createElement('p');
        category.textContent = 'Category: ' + doc.category_name;

        const uploader = document.createElement('p');
        uploader.textContent = 'Uploaded by: ' + doc.uploader;

        const date = document.createElement('p');
        date.textContent = 'Date: ' +
            new Date(doc.upload_date).toLocaleDateString();

        const download = document.createElement('button');
        download.textContent = 'Download';
        download.className = 'btn';

        download.onclick = () => {
            window.location.href =
                '/api/documents/download/' + doc.document_id;
        };

        card.append(title, category, uploader, date, download);

        if (Number(doc.user_id) === Number(
            document.body.dataset.userId
        )) {
            const deleteButton = document.createElement('button');

            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn danger';

            deleteButton.onclick = async () => {
                if (!confirm('Delete this document?')) return;

                const result = await fetch(
                    '/api/documents/' + doc.document_id,
                    { method: 'DELETE' }
                );

                const data = await result.json();

                alert(data.message);

                loadDocuments();
            };

            card.appendChild(deleteButton);
        }

        const shareLink = document.createElement('a');
        shareLink.href = 'access.html?id=' + doc.document_id;
        shareLink.textContent = 'Manage Access';

        card.appendChild(shareLink);

        container.appendChild(card);
    });
}

async function loadCurrentUser() {
    const response = await fetch('/api/me');

    if (!response.ok) {
        window.location.href = 'login.html';
        return;
    }

    const user = await response.json();

    document.body.dataset.userId = user.user_id;
}

async function initDocuments() {
    await loadCurrentUser();
    loadDocuments();
}

initDocuments();
