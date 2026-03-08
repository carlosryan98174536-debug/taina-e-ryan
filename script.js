document.addEventListener('DOMContentLoaded', () => {
    // --- Persistence Logic: URL-based (no external API, pure JS) ---

    function buildShareUrl(albumData) {
        const json = JSON.stringify(albumData);
        // Use TextEncoder for proper UTF-8 → binary → base64 encoding
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        const encoded = btoa(binary);
        const base = window.location.href.split('?')[0];
        return `${base}?d=${encodeURIComponent(encoded)}`;
    }

    function decodeShareParam(encoded) {
        // base64 → binary → UTF-8 bytes → string
        const binary = atob(encoded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }

    function loadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('d');
        if (!encoded) return;
        try {
            const json = decodeShareParam(encoded);
            const data = JSON.parse(json);
            applyDataToAlbum(data);
            showFinalAlbum(true);
        } catch (e) {
            console.error('Erro ao carregar álbum:', e);
            // Show visible error to help diagnose
            document.body.insertAdjacentHTML('afterbegin',
                `<div style="background:#c9184a;color:white;padding:15px;text-align:center;position:fixed;top:0;width:100%;z-index:9999;font-size:14px">
                    Erro ao carregar álbum. Tente gerar um novo link.
                </div>`
            );
        }
    }

    function applyDataToAlbum(data) {
        if (data.title) document.getElementById('input-album-title').value = data.title;
        if (data.date) document.getElementById('input-date').value = data.date;
        if (data.type) document.getElementById('input-type').value = data.type;
        if (data.message) document.getElementById('input-message').value = data.message;
        if (data.youtube) document.getElementById('input-youtube').value = data.youtube;
        if (data.photos && data.photos.length > 0) {
            uploadedImages = data.photos;
        }
    }
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
    function showFinalAlbum(skipWizard = false) {
        if (skipWizard) {
            document.querySelector('main').style.display = 'none';
        } else {
            document.querySelector('main').classList.add('hidden');
        }
        document.querySelector('header').classList.add('hidden');
        const finalView = document.getElementById('final-album-view');
        finalView.classList.remove('hidden');

        // --- Populate text data directly from inputs ---
        const title = document.getElementById('input-album-title').value || 'Nosso Álbum';
        const dateVal = document.getElementById('input-date').value;
        const typeVal = document.getElementById('input-type').value;
        const message = document.getElementById('input-message').value;

        document.getElementById('final-title').innerText = title;
        document.getElementById('final-message').innerText = message;

        // Counter
        if (dateVal) {
            const start = new Date(dateVal);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now - start) / (1000 * 60 * 60 * 24));
            document.getElementById('final-counter').innerText = `${diffDays} dias ${typeVal}`;
        }

        // Video
        const videoID = extractVideoID(document.getElementById('input-youtube').value);
        if (videoID) {
            document.getElementById('final-iframe').src = `https://www.youtube.com/embed/${videoID}?autoplay=1&mute=0&enablejsapi=1`;
        } else {
            document.getElementById('final-video-container').style.display = 'none';
        }

        // --- Photos: direct final view slideshow, independent of wizard ---
        const finalImg = document.getElementById('final-img');
        const finalDots = document.getElementById('final-dots');
        const finalCarousel = document.getElementById('final-carousel');

        if (uploadedImages.length > 0 && finalImg) {
            finalCarousel.style.display = 'block';
            let finalIdx = 0;

            function showFinalPhoto(idx) {
                finalImg.src = uploadedImages[idx];
                if (finalDots) {
                    finalDots.innerHTML = '';
                    uploadedImages.forEach((_, i) => {
                        const dot = document.createElement('div');
                        dot.classList.add('dot');
                        if (i === idx) dot.classList.add('active');
                        finalDots.appendChild(dot);
                    });
                }
            }

            showFinalPhoto(0);

            if (uploadedImages.length > 1) {
                setInterval(() => {
                    finalIdx = (finalIdx + 1) % uploadedImages.length;
                    showFinalPhoto(finalIdx);
                }, 5000);
            }
        }

        // Start hearts
        const finalHearts = document.getElementById('final-hearts');
        if (finalHearts) {
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
            reader.onload = async (event) => {
                const compressed = await compressImage(event.target.result);
                uploadedImages.push(compressed);
                renderThumbnails();
                startSlideshow();
                updatePreview();
            };
            reader.readAsDataURL(file);
        });
    });

    const inputPhotoUrls = document.getElementById('input-photo-urls');
    if (inputPhotoUrls) {
        inputPhotoUrls.addEventListener('input', (e) => {
            const urls = e.target.value.split('\n').map(u => u.trim()).filter(u => u.length > 0);
            // Re-sync uploadedImages with both local and URL images
            // For simplicity, we'll keep local ones first, then add URLs
            const localImages = uploadedImages.filter(img => img.startsWith('data:'));
            uploadedImages = [...localImages, ...urls].slice(0, 7);
            renderThumbnails();
            updatePreview();
            startSlideshow();
        });
    }

    // Compress an image aggressively so it fits in a shared URL (150px, quality 0.12 ≈ ~1-2KB)
    function compressImage(dataUrl, maxWidth = 150, quality = 0.12) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round(h * maxWidth / w);
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = dataUrl;
        });
    }

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
        const shareBtn = document.getElementById('btn-share');
        shareBtn.disabled = true;
        shareBtn.innerText = 'Gerando link...';

        try {
            const albumData = {
                title: document.getElementById('input-album-title').value,
                date: document.getElementById('input-date').value,
                type: document.getElementById('input-type').value,
                message: document.getElementById('input-message').value,
                youtube: document.getElementById('input-youtube').value,
                photos: uploadedImages
            };

            const shareUrl = buildShareUrl(albumData);
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copiado! ❤️\nEnvie agora para o seu amor.');
            });
        } catch (err) {
            alert('Erro ao gerar link: ' + err.message);
        } finally {
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Compartilhar Link';
        }
    });

    // Initialize
    loadFromUrl();
    setInterval(createHeart, 600);
    document.getElementById('btn-finish').addEventListener('click', () => {
        showFinalAlbum();
    });
});
