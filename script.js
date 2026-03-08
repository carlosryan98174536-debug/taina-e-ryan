document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;

    // Elements
    const cards = document.querySelectorAll('.wizard-card');
    const stepBtns = document.querySelectorAll('.step-btn');
    const previewTitle = document.getElementById('preview-title');
    const previewCounter = document.getElementById('preview-counter');
    const previewMessage = document.getElementById('preview-message');
    const previewIframe = document.getElementById('preview-iframe');
    const previewVideoContainer = document.getElementById('preview-video-container');
    const previewHearts = document.getElementById('preview-hearts');

    // Inputs
    const inputTitle = document.getElementById('input-album-title');
    const inputDate = document.getElementById('input-date');
    const inputType = document.getElementById('input-type');
    const inputMessage = document.getElementById('input-message');
    const inputYoutube = document.getElementById('input-youtube');

    // Navigation
    function showStep(step) {
        cards.forEach(card => card.classList.remove('active'));
        stepBtns.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.step) < step) btn.classList.add('completed');
            else btn.classList.remove('completed');
        });

        document.getElementById(`wizard-${step}`).classList.add('active');
        document.querySelector(`.step-btn[data-step="${step}"]`).classList.add('active');
        currentStep = step;
    }

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < 7) showStep(currentStep + 1);
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) showStep(currentStep - 1);
        });
    });

    // Mirroring Inputs to Preview
    inputTitle.addEventListener('input', (e) => {
        previewTitle.innerText = e.target.value || "Seu Álbum";
    });

    inputMessage.addEventListener('input', (e) => {
        previewMessage.innerText = e.target.value;
    });

    function updateCounter() {
        if (!inputDate.value) return;
        const start = new Date(inputDate.value);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        previewCounter.innerText = `${diffDays} dias ${inputType.value}`;
    }

    inputDate.addEventListener('change', updateCounter);
    inputType.addEventListener('change', updateCounter);

    // YouTube Logic
    function extractVideoID(url) {
        if (!url) return null;
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    inputYoutube.addEventListener('input', (e) => {
        const url = e.target.value;
        const videoId = extractVideoID(url);
        if (videoId) {
            previewVideoContainer.style.display = 'block';
            previewIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`;
        } else {
            previewVideoContainer.style.display = 'none';
            previewIframe.src = '';
        }
    });

    // Final Album Logic
    function showFinalAlbum() {
        document.querySelector('main').classList.add('hidden');
        document.querySelector('header').classList.add('hidden');
        const finalView = document.getElementById('final-album-view');
        finalView.classList.remove('hidden');

        // Populate Data
        document.getElementById('final-title').innerText = document.getElementById('input-album-title').value || 'Nosso Álbum';
        document.getElementById('final-counter').innerText = previewCounter.innerText;
        document.getElementById('final-message').innerText = document.getElementById('input-message').value;

        const videoID = extractVideoID(inputYoutube.value);
        if (videoID) {
            document.getElementById('final-iframe').src = `https://www.youtube.com/embed/${videoID}?autoplay=1&mute=0&enablejsapi=1`;
        } else {
            document.getElementById('final-video-container').style.display = 'none';
        }

        // Photo logic in final view
        const finalImg = document.getElementById('final-img');
        const finalDots = document.getElementById('final-dots');

        if (uploadedImages.length > 0) {
            updatePreview(); // Sync final view image
            startSlideshow(); // Ensure it's running
        }

        // Start hearts in final view
        const finalHearts = document.getElementById('final-hearts');
        setInterval(() => {
            const heart = document.createElement('div');
            heart.classList.add('floating-heart');
            heart.innerHTML = '<i class="fas fa-heart"></i>';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.fontSize = Math.random() * 20 + 10 + 'px';
            heart.style.setProperty('--d', Math.random() * 3 + 3 + 's');
            finalHearts.appendChild(heart);
            setTimeout(() => heart.remove(), 6000);
        }, 400);
    }

    // Floating Hearts in Phone
    function createHeart() {
        const heart = document.createElement('div');
        heart.classList.add('floating-heart');
        heart.innerHTML = '<i class="fas fa-heart"></i>';

        const size = Math.random() * 15 + 10 + 'px';
        heart.style.left = Math.random() * 80 + 10 + '%';
        heart.style.fontSize = size;
        heart.style.setProperty('--d', Math.random() * 3 + 4 + 's');

        previewHearts.appendChild(heart);
        setTimeout(() => heart.remove(), 6000);
    }

    // Photo Upload Logic (Slideshow)
    const btnSelectPhotos = document.getElementById('btn-select-photos');
    const photoInput = document.getElementById('photo-input');
    const photoCountText = document.getElementById('photo-count');
    const thumbnailList = document.getElementById('thumbnail-list');

    const carouselPreview = document.getElementById('carousel-preview');
    const previewImg = document.getElementById('preview-img');
    const carouselDots = document.getElementById('carousel-dots');

    let uploadedImages = [];
    let currentImgIndex = 0;
    let slideshowInterval = null;

    btnSelectPhotos.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (uploadedImages.length >= 7) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImages.push(event.target.result);
                renderThumbnails();
                startSlideshow();
                updatePreview();
            };
            reader.readAsDataURL(file);
        });
    });

    function renderThumbnails() {
        thumbnailList.innerHTML = '';
        photoCountText.innerText = `${uploadedImages.length} de 7 imagens adicionadas`;

        uploadedImages.forEach((src, index) => {
            const thumb = document.createElement('div');
            thumb.classList.add('thumb-item');
            thumb.innerHTML = `
                <img src="${src}">
                <button class="thumb-remove" onclick="removeImage(${index})"><i class="fas fa-times"></i></button>
            `;
            thumbnailList.appendChild(thumb);
        });
    }

    window.removeImage = (index) => {
        uploadedImages.splice(index, 1);
        if (currentImgIndex >= uploadedImages.length) currentImgIndex = 0;
        renderThumbnails();
        updatePreview();
    };

    function updatePreview() {
        if (uploadedImages.length > 0) {
            carouselPreview.style.display = 'block';
            previewImg.src = uploadedImages[currentImgIndex];

            // Sync Final View
            const finalImg = document.getElementById('final-img');
            const finalDots = document.getElementById('final-dots');
            if (finalImg) finalImg.src = uploadedImages[currentImgIndex];

            // Render Dots for both
            [carouselDots, finalDots].forEach(container => {
                if (!container) return;
                container.innerHTML = '';
                uploadedImages.forEach((_, i) => {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    if (i === currentImgIndex) dot.classList.add('active');
                    container.appendChild(dot);
                });
            });
        } else {
            carouselPreview.style.display = 'none';
        }
    }

    function startSlideshow() {
        if (slideshowInterval) clearInterval(slideshowInterval);
        slideshowInterval = setInterval(() => {
            if (uploadedImages.length > 1) {
                currentImgIndex = (currentImgIndex + 1) % uploadedImages.length;
                updatePreview();
            }
        }, 5000);
    }

    document.getElementById('carousel-next-btn').addEventListener('click', () => {
        currentImgIndex = (currentImgIndex + 1) % uploadedImages.length;
        updatePreview();
        startSlideshow(); // Reset timer
    });

    document.getElementById('carousel-prev-btn').addEventListener('click', () => {
        currentImgIndex = (currentImgIndex - 1 + uploadedImages.length) % uploadedImages.length;
        updatePreview();
        startSlideshow(); // Reset timer
    });

    // Share Logic
    document.getElementById('btn-share').addEventListener('click', () => {
        const dummyUrl = window.location.href;
        navigator.clipboard.writeText(dummyUrl).then(() => {
            alert('Link do álbum copiado! Agora você pode enviar para o seu amor.');
        });
    });

    setInterval(createHeart, 600);
    document.getElementById('btn-finish').addEventListener('click', () => {
        showFinalAlbum();
    });
});
