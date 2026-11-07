
async function loadCategories() {
    const response = await fetch('/api/categories');

    if (response.status === 401) {
        window.location.href = 'login.html';
        return;
    }

    const categories = await response.json();
    const select = document.getElementById('category');

    categories.forEach(category => {
        const option = document.createElement('option');

        option.value = category.category_id;
        option.textContent = category.category_name;

        select.appendChild(option);
    });
}

document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const message = document.getElementById('message');

    try {
        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            this.reset();
        }

    } catch (error) {
        message.textContent = 'Upload failed';
    }
});

loadCategories();
