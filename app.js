document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ----------------------------------------------------
    // 1. ANIMATE HERO ELEMENTS ON LOAD
    // ----------------------------------------------------
    setTimeout(() => {
        document.querySelectorAll('.animate-on-load').forEach(el => {
            el.classList.add('active');
        });
    }, 100);




    // ----------------------------------------------------
    // 3. THREE.JS 3D CANVAS BACKGROUND (HERO SECTION)
    // ----------------------------------------------------
    const container = document.getElementById('canvas-container');
    if (container && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        
        // Setup Camera
        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
        camera.position.z = 110;

        // Setup Renderer with alpha transparency enabled
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // ----------------------------------------------------
        // 3D MONITOR MATRIX GENERATION
        // ----------------------------------------------------
        const matrixGroup = new THREE.Group();
        scene.add(matrixGroup);

        const screenCount = 6;
        const screens = [];
        const waveGeometries = [];
        
        // Screen Specs
        const screenW = 28;
        const screenH = 16;
        const screenD = 0.4;

        // Curved arc positions for the 3x2 grid
        const screenLayout = [
            // Row 1 (Top)
            { x: -34, y: 11, z: -10, rotY: 0.35, type: 'audio' },
            { x: 0, y: 11, z: 0, rotY: 0, type: 'scope' },
            { x: 34, y: 11, z: -10, rotY: -0.35, type: 'pulse' },
            // Row 2 (Bottom)
            { x: -34, y: -11, z: -10, rotY: 0.35, type: 'pulse' },
            { x: 0, y: -11, z: 0, rotY: 0, type: 'audio' },
            { x: 34, y: -11, z: -10, rotY: -0.35, type: 'scope' }
        ];

        // Create the screens
        screenLayout.forEach((layout, index) => {
            const screenGroup = new THREE.Group();
            screenGroup.position.set(layout.x, layout.y, layout.z);
            screenGroup.rotation.y = layout.rotY;
            
            // 1. Semitransparent Glass Panel
            const glassGeom = new THREE.BoxGeometry(screenW, screenH, screenD);
            const glassMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.03,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const glassMesh = new THREE.Mesh(glassGeom, glassMat);
            screenGroup.add(glassMesh);

            // 2. Glowing Panel Wireframe Edge Outlines
            const edgesGeom = new THREE.EdgesGeometry(glassGeom);
            const edgeMat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending
            });
            const edgeMesh = new THREE.LineSegments(edgesGeom, edgeMat);
            screenGroup.add(edgeMesh);

            // 3. Dynamic Waveform Visualizer Inside Screen
            // We draw 20 vertical lines (40 vertices)
            const barCount = 22;
            const barPositions = new Float32Array(barCount * 2 * 3); // 2 points per bar, 3 coords per point
            const spacing = 22 / barCount; // Spread across screen width

            // Generate initial vertex coordinates
            for (let i = 0; i < barCount; i++) {
                const x = -11 + (i * spacing) + (spacing / 2);
                
                // Top point
                barPositions[i * 6] = x;
                barPositions[i * 6 + 1] = 0;
                barPositions[i * 6 + 2] = 0.3; // Floating slightly in front
                
                // Bottom point
                barPositions[i * 6 + 3] = x;
                barPositions[i * 6 + 4] = 0;
                barPositions[i * 6 + 5] = 0.3;
            }

            const waveGeom = new THREE.BufferGeometry();
            waveGeom.setAttribute('position', new THREE.BufferAttribute(barPositions, 3));
            
            // Unique line materials for different monitor feeds
            const isRedFeed = layout.type === 'audio' || index === 1;
            const waveColor = isRedFeed ? 0xff2a42 : 0xffffff;
            const opacity = layout.type === 'audio' ? 0.65 : layout.type === 'scope' ? 0.4 : 0.45;
            const waveMat = new THREE.LineBasicMaterial({
                color: waveColor,
                transparent: true,
                opacity: opacity,
                blending: THREE.AdditiveBlending,
                linewidth: 1.5
            });

            const waveLines = new THREE.LineSegments(waveGeom, waveMat);
            screenGroup.add(waveLines);

            // Save references for animation loop
            screens.push({
                group: screenGroup,
                type: layout.type,
                barCount: barCount
            });
            waveGeometries.push(waveGeom);

            matrixGroup.add(screenGroup);
        });

        // ----------------------------------------------------
        // AMBIENT POST-STUDIO DUST PARTICLES
        // ----------------------------------------------------
        const dustCount = 80;
        const dustGeometry = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        const dustVelocities = [];

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 180;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 110;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;

            dustVelocities.push({
                x: (Math.random() - 0.5) * 0.04,
                y: (Math.random() - 0.5) * 0.04 + 0.015, // Drift upward slowly
                z: (Math.random() - 0.5) * 0.04
            });
        }

        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustCanvas = document.createElement('canvas');
        dustCanvas.width = 8;
        dustCanvas.height = 8;
        const dustCtx = dustCanvas.getContext('2d');
        const dustGrad = dustCtx.createRadialGradient(4, 4, 0, 4, 4, 4);
        dustGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        dustGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        dustCtx.fillStyle = dustGrad;
        dustCtx.fillRect(0, 0, 8, 8);
        const dustTexture = new THREE.CanvasTexture(dustCanvas);

        const dustMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.9,
            transparent: true,
            opacity: 0.3,
            map: dustTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const dustCloud = new THREE.Points(dustGeometry, dustMaterial);
        scene.add(dustCloud);

        // ----------------------------------------------------
        // MOUSE TRACKING & PARALLAX
        // ----------------------------------------------------
        let targetX = 0, targetY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;
        
        document.addEventListener('mousemove', (e) => {
            targetX = (e.clientX - windowHalfX) * 0.005;
            targetY = (e.clientY - windowHalfY) * 0.005;
        });

        const clock = new THREE.Clock();

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            const time = clock.getElapsedTime();

            // 1. Update the custom signal waveforms inside each screen
            screens.forEach((screen, sIndex) => {
                const geom = waveGeometries[sIndex];
                const positions = geom.attributes.position.array;
                const count = screen.barCount;

                for (let i = 0; i < count; i++) {
                    const topYIndex = i * 6 + 1;
                    const botYIndex = i * 6 + 4;
                    const xCoord = positions[i * 6];

                    let barHeight = 0;

                    if (screen.type === 'audio') {
                        // Standard bouncing visualizer frequencies
                        const freq1 = Math.sin(time * 3.5 + xCoord * 0.4) * Math.cos(time * 1.5 - xCoord * 0.2);
                        const freq2 = Math.sin(time * 7.0 - xCoord * 0.8) * 0.3;
                        barHeight = Math.abs(freq1 + freq2) * 5.5 + 0.3;
                    } 
                    else if (screen.type === 'scope') {
                        // Smooth, rolling visualizer curves representing vectorscopes / histograms
                        const factor = Math.sin(time * 1.5 + xCoord * 0.15) * 4.5;
                        const subFactor = Math.cos(time * 4.0 + xCoord * 0.5) * 1.0;
                        barHeight = Math.abs(factor + subFactor) + 0.8;
                    } 
                    else if (screen.type === 'pulse') {
                        // Rhythmic beats representing video beats / timestamps
                        const pulseFrequency = Math.sin(time * 4.0 - xCoord * 0.1);
                        if (pulseFrequency > 0.7) {
                            barHeight = (pulseFrequency - 0.7) * 15.0 + 0.5;
                        } else {
                            barHeight = 0.5;
                        }
                    }

                    // Keep within boundaries of the screen height
                    barHeight = Math.min(barHeight, screenH / 2 - 1.5);

                    positions[topYIndex] = barHeight;
                    positions[botYIndex] = -barHeight;
                }
                geom.attributes.position.needsUpdate = true;
            });

            // 2. Animate dust particles
            const positions = dustGeometry.attributes.position.array;
            for (let i = 0; i < dustCount; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;

                positions[ix] += dustVelocities[i].x;
                positions[iy] += dustVelocities[i].y;
                positions[iz] += dustVelocities[i].z;

                if (positions[iy] > 55) positions[iy] = -55;
                if (positions[ix] < -90 || positions[ix] > 90) dustVelocities[i].x *= -1;
                if (positions[iz] < -40 || positions[iz] > 40) dustVelocities[i].z *= -1;
            }
            dustGeometry.attributes.position.needsUpdate = true;

            // 3. Smoothly rotate the screen matrix group based on mouse movement
            matrixGroup.rotation.y += (targetX - matrixGroup.rotation.y) * 0.05;
            matrixGroup.rotation.x += (-targetY - matrixGroup.rotation.x) * 0.05;

            renderer.render(scene, camera);
        };
        animate();

        // Handle Resizing
        window.addEventListener('resize', () => {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }


""


    // ----------------------------------------------------
    // 5. NAVBAR SCROLL ACTION
    // ----------------------------------------------------
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });


    // ----------------------------------------------------
    // 6. LAZY VIDEO HOVER PLAYBACK ENGINE (LOW NETWORK OPTIMIZED)
    // ----------------------------------------------------
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        const video = card.querySelector('.card-video');
        
        card.addEventListener('mouseenter', () => {
            if (video) {
                const previewSrc = video.getAttribute('data-preview');
                if (previewSrc) {
                    video.src = previewSrc;
                    video.load(); // Load the video file into memory
                    video.play().catch(err => {
                        console.log("Autoplay block: ", err.message);
                    });
                }
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (video) {
                video.pause();
                video.src = '';
                video.removeAttribute('src'); // Stop buffering and free connection slots
                video.load(); // Reload blank state to clean memory
            }
        });
    });


    // ----------------------------------------------------
    // 7. PORTFOLIO FILTER MECHANISM
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryGrid = document.getElementById('gallery-grid');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Manage Active Class State
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');

            // 1. Toggle columns instantaneously
            if (filterValue === 'reels' || filterValue === 'colour-graded') {
                if (galleryGrid) galleryGrid.classList.add('vertical-format-grid');
            } else {
                if (galleryGrid) galleryGrid.classList.remove('vertical-format-grid');
            }

            // 2. Instant zero-lag show/hide without artificial delays
            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = '';
                    card.style.transition = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Default Load state filtering (hide non-active categories on page load)
    const activeBtn = document.querySelector('.filter-btn.active');
    if (activeBtn) {
        const defaultFilter = activeBtn.getAttribute('data-filter');
        if (defaultFilter) {
            // Initialize default vertical-format-grid class state on load
            if (defaultFilter === 'reels' || defaultFilter === 'colour-graded') {
                if (galleryGrid) galleryGrid.classList.add('vertical-format-grid');
            } else {
                if (galleryGrid) galleryGrid.classList.remove('vertical-format-grid');
            }

            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (category !== defaultFilter) {
                    card.style.display = 'none';
                }
            });
        }
    }

    // Check URL parameters or hash to activate specific tab on load (e.g. ?filter=reels or #reels)
    const urlParams = new URLSearchParams(window.location.search);
    const filterFromUrl = urlParams.get('filter') || (window.location.hash ? window.location.hash.replace('#', '') : null);
    if (filterFromUrl) {
        const matchingBtn = document.querySelector(`.filter-btn[data-filter="${filterFromUrl}"]`);
        if (matchingBtn) {
            matchingBtn.click();
        }
    }


    // ----------------------------------------------------
    // 8. IMMERSIVE VIDEO LIGHTBOX SYSTEM
    // ----------------------------------------------------
    const lightbox = document.getElementById('video-lightbox');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxIframe = document.getElementById('lightbox-iframe');
    const lightboxLoader = document.getElementById('lightbox-loader');
    const lightboxClose = document.querySelector('.lightbox-close');
    
    const lightboxTag = document.getElementById('lightbox-tag');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxClient = document.getElementById('lightbox-client');
    const lightboxRole = document.getElementById('lightbox-role');

    // Register single event hooks to hide loading spinner when media begins playing / loaded
    if (lightboxVideo) {
        lightboxVideo.addEventListener('playing', () => {
            if (lightboxLoader) lightboxLoader.classList.remove('active');
        });
        lightboxVideo.addEventListener('canplay', () => {
            if (lightboxLoader) lightboxLoader.classList.remove('active');
        });
    }
    if (lightboxIframe) {
        lightboxIframe.addEventListener('load', () => {
            // Only deactivate spinner if iframe has loaded a real video feed
            if (lightboxIframe.src && lightboxIframe.src !== 'about:blank' && !lightboxIframe.src.endsWith('blank')) {
                if (lightboxLoader) lightboxLoader.classList.remove('active');
            }
        });
    }

    // Open Lightbox on Project Click
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const videoUrl = card.getAttribute('data-video');
            const title = card.getAttribute('data-title');
            const client = card.getAttribute('data-client');
            const role = card.getAttribute('data-role');
            const categoryVal = card.getAttribute('data-category');
            const category = categoryVal ? categoryVal.toUpperCase() : '';

            // Apply reels-mode layout toggle for vertical formats (Reels and Colour Graded)
            if (categoryVal === 'reels' || categoryVal === 'colour-graded') {
                lightbox.classList.add('reels-mode');
            } else {
                lightbox.classList.remove('reels-mode');
            }

            // Clear previous configurations
            lightboxVideo.src = '';
            lightboxVideo.style.display = 'none';
            lightboxIframe.src = '';
            lightboxIframe.style.display = 'none';

            // Show loading spinner
            if (lightboxLoader) lightboxLoader.classList.add('active');

            // Detect if URL is an iframe embed (Livid, Youtube, Vimeo, etc.)
            const isEmbed = videoUrl.includes('livid.com') || 
                            videoUrl.includes('youtube.com') || 
                            videoUrl.includes('youtu.be') || 
                            videoUrl.includes('vimeo.com') ||
                            videoUrl.includes('/embed/');

            if (isEmbed) {
                let embedUrl = videoUrl;
                
                // Formulate correct embed formats
                if (videoUrl.includes('livid.com')) {

                    if (videoUrl.includes('video=')) {
                        const queryString = videoUrl.split('?')[1];
                        const urlParams = new URLSearchParams(queryString);
                        const videoId = urlParams.get('video');
                        if (videoId) {
                            embedUrl = 'https://livid.com/embed/' + videoId;
                        }
                    } else if (videoUrl.includes('/showcase/')) {
                        embedUrl = videoUrl;
                    } else if (videoUrl.includes('/v/')) {
                        embedUrl = videoUrl.replace('livid.com/v/', 'livid.com/embed/');
                    } else if (videoUrl.includes('/watch/')) {
                        embedUrl = videoUrl.replace('livid.com/watch/', 'livid.com/embed/');
                    } else if (videoUrl.includes('/watch?v=')) {
                        embedUrl = videoUrl.replace('/watch?v=', 'livid.com/embed/');
                    } else if (videoUrl.includes('livid.com/') && !videoUrl.includes('embed')) {
                        const parts = videoUrl.split('livid.com/');
                        if (parts.length > 1) {
                            embedUrl = 'https://livid.com/embed/' + parts[1];
                        }
                    }

                    // Set default playback quality to 720p (HD) to balance sharpness and smooth streaming
                    if (embedUrl.includes('?')) {
                        embedUrl += '&quality=720p';
                    } else {
                        embedUrl += '?quality=720p';
                    }
                } else if (videoUrl.includes('youtube.com/shorts/')) {
                    let clean = videoUrl.split('?')[0];
                    const parts = clean.split('/shorts/');
                    const videoId = parts[1].replace('/', '');
                    embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
                } else if (videoUrl.includes('youtube.com/watch?v=') || videoUrl.includes('youtube.com/watch/')) {
                    const videoId = videoUrl.includes('v=') ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('watch/')[1].split('?')[0];
                    embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
                } else if (videoUrl.includes('youtu.be/')) {
                    let clean = videoUrl.split('?')[0];
                    const parts = clean.split('youtu.be/');
                    const videoId = parts[1].replace('/', '');
                    embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
                } else if (videoUrl.includes('vimeo.com/') && !videoUrl.includes('player.vimeo.com')) {
                    const videoId = videoUrl.substring(videoUrl.lastIndexOf('/') + 1);
                    embedUrl = 'https://player.vimeo.com/video/' + videoId;
                }

                lightboxIframe.src = embedUrl;
                lightboxIframe.style.display = 'block';
            } else {
                // Play as native HTML5 video file (.mp4)
                lightboxVideo.src = videoUrl;
                lightboxVideo.style.display = 'block';
                lightboxVideo.play().catch(e => console.log("Autoplay blocked: ", e.message));
            }

            // Populate Modal Text Content safely if elements exist
            if (lightboxTag) lightboxTag.textContent = category;
            if (lightboxTitle) lightboxTitle.textContent = title;
            if (lightboxClient) lightboxClient.textContent = client;
            if (lightboxRole) lightboxRole.textContent = role;

            // Show Lightbox overlay
            lightbox.classList.add('active');
            
            // Adjust body scrolling behavior
            document.body.style.overflow = 'hidden';
        });
    });

    // Close Modal Functions
    const closeLightboxModal = () => {
        lightbox.classList.remove('active');
        lightbox.classList.remove('reels-mode');
        
        lightboxVideo.pause();
        lightboxVideo.src = '';
        lightboxVideo.style.display = 'none';
        
        lightboxIframe.src = '';
        lightboxIframe.style.display = 'none';
        
        if (lightboxLoader) {
            lightboxLoader.classList.remove('active');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    };

    if (lightbox && lightboxClose) {
        lightboxClose.addEventListener('click', closeLightboxModal);
        
        // Close on click outside of content container
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightboxModal();
            }
        });

        // Close on Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightboxModal();
            }
        });
    }


    // ----------------------------------------------------
    // 9. ANIMATED SCROLL STAT COUNTER
    // ----------------------------------------------------
    const statCards = document.querySelectorAll('.stat-num');
    let animatedStats = false;

    const startCounterAnimation = () => {
        statCards.forEach(stat => {
            const targetVal = parseInt(stat.getAttribute('data-val'));
            const suffix = stat.getAttribute('data-suffix') || '+';
            let currentVal = 0;
            const duration = 2000; // 2 seconds
            const increment = targetVal / (duration / 16); // 60 FPS calculation
            
            const counter = setInterval(() => {
                currentVal += increment;
                if (currentVal >= targetVal) {
                    stat.textContent = targetVal + suffix;
                    clearInterval(counter);
                } else {
                    stat.textContent = Math.floor(currentVal);
                }
            }, 16);
        });
    };

    // Trigger on visibility
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animatedStats) {
                    startCounterAnimation();
                    animatedStats = true;
                }
            });
        }, { threshold: 0.5 });
        
        statsObserver.observe(statsSection);
    }


    // ----------------------------------------------------
    // 10. SOFTWARE SKILL PROGRESS TRIGGER
    // ----------------------------------------------------
    const progressBars = document.querySelectorAll('.software-progress-bar');
    const skillsSection = document.getElementById('skills');

    if (skillsSection) {
        const skillsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    progressBars.forEach(bar => {
                        // Extract target width value from styling definition
                        const width = bar.style.width;
                        bar.style.width = '0'; // reset
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                    skillsObserver.unobserve(entry.target); // Trigger animation only once
                }
            });
        }, { threshold: 0.3 });

        skillsObserver.observe(skillsSection);
    }


    // ----------------------------------------------------
    // 11. MOBILE DRAWER NAVIGATION
    // ----------------------------------------------------
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    const toggleMobileMenu = () => {
        mobileMenuToggle.classList.toggle('active');
        mobileDrawer.classList.toggle('active');
        
        if (mobileDrawer.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Close drawer when link clicked
            mobileMenuToggle.classList.remove('active');
            mobileDrawer.classList.remove('active');
            document.body.style.overflow = '';
        });
    });


    // ----------------------------------------------------
    // 12. CTA / CONTACT FORM INTERACTIVE FEEDBACK
    // ----------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Basic Form Validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            if (!name || !email || !message) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please fill out all required fields.';
                return;
            }

            // Check if Web3Forms key is still the default placeholder
            const accessKeyInput = contactForm.querySelector('input[name="access_key"]');
            if (!accessKeyInput || accessKeyInput.value === 'YOUR_ACCESS_KEY_HERE') {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Setup Required: Please insert your Web3Forms Access Key into index.html to receive emails.';
                return;
            }

            // Set sending animation state
            formStatus.className = 'form-status';
            formStatus.textContent = 'SENDING STORY BRIEF...';
            
            const formData = new FormData(contactForm);
            const jsonObject = {};
            formData.forEach((value, key) => {
                jsonObject[key] = value;
            });
            
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(jsonObject)
            })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    formStatus.className = 'form-status success';
                    formStatus.textContent = 'MESSAGE SENT SUCCESSFULLY. I WILL REACH OUT WITHIN 24 HOURS.';
                    contactForm.reset();
                } else {
                    console.log(response);
                    formStatus.className = 'form-status error';
                    formStatus.textContent = json.message || 'Submission failed. Please try again.';
                }
            })
            .catch(error => {
                console.log(error);
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Server connection error. Please try again later.';
            })
            .then(() => {
                // Clear success message after 7 seconds
                setTimeout(() => {
                    formStatus.textContent = '';
                }, 7000);
            });
        });
    }

    // ----------------------------------------------------
    // 14. CINEMATIC FLOW & SCROLL ENGAGEMENT SYSTEM
    // ----------------------------------------------------

    // 1. Top Laser Scroll Progress Bar
    let progressBar = document.getElementById('scroll-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress-bar';
        document.body.prepend(progressBar);
    }

    // 2. Floating "Back to Top" Button
    let backToTop = document.querySelector('.back-to-top');
    if (!backToTop) {
        backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `;
        document.body.appendChild(backToTop);
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 3. Scroll Progress & Back-to-Top Toggle (60fps RAF throttled)
    let ticking = false;
    const updateScrollMetrics = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (backToTop) {
            if (scrollTop > 450) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollMetrics);
            ticking = true;
        }
    }, { passive: true });

    // 4. Smooth Anchor Scrolling for all navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: elementPosition - navHeight + 10,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 5. Scroll Spy (Active Navigation Highlighting)
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-link[href^="#"]');
    
    if (sections.length > 0 && navAnchors.length > 0) {
        const scrollSpyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute('id');
                    navAnchors.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${currentId}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, { threshold: 0.25 });

        sections.forEach(sec => scrollSpyObserver.observe(sec));
    }

    // 6. Cinematic Scroll-Reveal Stagger for Cards and Sections
    const revealTargets = document.querySelectorAll(
        '.project-card, .stat-card, .software-column, .about-text-content, .contact-details, .contact-form, .experience-badge'
    );

    revealTargets.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        const delayClass = `stagger-${(index % 3) + 1}`;
        el.classList.add(delayClass);
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    revealTargets.forEach(el => revealObserver.observe(el));


    // ----------------------------------------------------
    // 15. CLIENT INTELLIGENCE & VISITOR TRACKING SYSTEM
    // ----------------------------------------------------
    const logVisitorSession = () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const clientParam = urlParams.get('client') || urlParams.get('c') || urlParams.get('ref') || urlParams.get('p');
            
            const visitRecord = {
                timestamp: new Date().toISOString(),
                formattedTime: new Date().toLocaleString(),
                client: clientParam || 'Direct / Organic Visit',
                page: window.location.pathname + window.location.search,
                referrer: document.referrer || 'Direct Link',
                device: window.innerWidth < 768 ? 'Mobile' : (window.innerWidth < 1024 ? 'Tablet' : 'Desktop'),
                resolution: `${window.innerWidth}x${window.innerHeight}`
            };

            // Store in LocalStorage for client review
            let visits = JSON.parse(localStorage.getItem('jesnow_portfolio_visits') || '[]');
            visits.unshift(visitRecord);
            if (visits.length > 100) visits = visits.slice(0, 100);
            localStorage.setItem('jesnow_portfolio_visits', JSON.stringify(visits));

            // Send Instant Alert to Telegram via secure Vercel API
            // Rate-limited to once per browser session so navigating pages won't spam
            const sessionAlertKey = 'jesnow_telegram_alerted';
            if (!sessionStorage.getItem(sessionAlertKey)) {
                sessionStorage.setItem(sessionAlertKey, 'true');
                fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client: visitRecord.client,
                        page: visitRecord.page,
                        referrer: visitRecord.referrer,
                        device: visitRecord.device,
                        resolution: visitRecord.resolution
                    })
                }).catch(() => {/* Silent fallback if offline */});
            }

            // Expose console helper for Jesnow to view visits at any time
            window.getPortfolioVisits = () => {
                console.table(JSON.parse(localStorage.getItem('jesnow_portfolio_visits') || '[]'));
                return JSON.parse(localStorage.getItem('jesnow_portfolio_visits') || '[]');
            };

            // Press Shift + V anywhere to view the latest visit log
            window.addEventListener('keydown', (e) => {
                if (e.shiftKey && (e.key === 'V' || e.key === 'v')) {
                    const data = JSON.parse(localStorage.getItem('jesnow_portfolio_visits') || '[]');
                    const latest = data[0];
                    alert(`⚡ PORTFOLIO VISITOR INTEL\n\nTotal Visits Logged: ${data.length}\nLatest Client: ${latest?.client || 'None'}\nTime: ${latest?.formattedTime || 'N/A'}\nDevice: ${latest?.device || 'N/A'} (${latest?.resolution || 'N/A'})\n\nOpen Browser Console (F12) to see complete history table!`);
                    console.table(data);
                }
            });

            if (clientParam) {
                console.log(`%c[CLIENT DETECTED]%c Session active for: "${clientParam}"`, 'color: #ff2a42; font-weight: bold;', 'color: #ffffff;');
            }
        } catch (err) {
            console.warn('Visitor tracker active in silent mode.');
        }
    };

    logVisitorSession();
});
