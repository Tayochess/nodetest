document.querySelectorAll('.delete-button').forEach((element) => {
    element.addEventListener('click', (e) => {
        const postId = e.currentTarget.dataset.post;
        
        axios.post('/delete', {
            postId: postId
        })
        .then(function (res) {
            if (res.status == 200) {
                alert('Запись удалена!');
            } else {
                alert(res.message);
            }
        })
        .catch(function (err) {
            console.log(err);
        });
    });
});

const editForm = document.getElementById('edit-form');

if (editForm) {
    const images = editForm.querySelectorAll('.post-image');

    images.forEach((element) => {
        element.querySelector('.remove-button').addEventListener('click', (e) => {
            element.dataset.included = false;
            e.target.remove();
        });
    });

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let oldFiles = [];

        images.forEach((element) => {
            if (element.dataset.included != "false") {
                oldFiles.push(element.dataset.file);
            }
        });

        let formData = new FormData();
        let newFiles = editForm.querySelector('#news-media').files

        if (newFiles.length > 0) 
        for (let i = 0; i < newFiles.length; i+=1) {
            formData.append('media', newFiles[i]);
        }
        
        formData.append('text', editForm.querySelector('#news-text').value);
        formData.append('oldFiles', oldFiles);
        formData.append('postId', editForm.dataset.post);

        axios.post('/edit', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(function (res) {
            if (res.status == 200) {
                alert('Запись обновлена!');
            } else {
                alert(res.message);
            }
        })
        .catch(function (err) {
            console.log(err);
        });
    });
}

