/**
 * LA FANTACIA — Master Interactions & Mobile Carousel Controller
 * Features:
 * - Mobile Horizontal Tracks with 5-Second Auto-Scroll & Smooth Manual Swipe
 * - Touch & Pointer Pause/Resume
 * - Dynamic Active Dot Indicators
 * - Scroll Progress Bar & Header Blur Transition
 * - Mobile Drawer Menu
 * - IntersectionObserver Scroll Reveal
 * - Lightbox Modal & FAQ Accordions
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Sticky Header & Back to Top Button
    const header = document.getElementById('site-header');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;

        if (header) {
            if (winScroll > 30) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }

        if (backToTopBtn) {
            if (winScroll > 400) backToTopBtn.classList.add('is-visible');
            else backToTopBtn.classList.remove('is-visible');
        }
    }, { passive: true });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 2. Mobile Drawer Navigation
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    const drawer = document.getElementById('mobile-drawer');
    const closeBtn = document.getElementById('mobile-drawer-close');
    const backdrop = document.getElementById('mobile-drawer-backdrop');

    const openDrawer = () => {
        if (!drawer) return;
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        if (toggleBtn) {
            toggleBtn.classList.add('is-active');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
        if (backdrop) backdrop.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        if (!drawer) return;
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        if (toggleBtn) {
            toggleBtn.classList.remove('is-active');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
        if (backdrop) backdrop.classList.remove('is-active');
        document.body.style.overflow = '';
    };

    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = drawer.classList.contains('is-open');
            if (isOpen) closeDrawer();
            else openDrawer();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDrawer();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeDrawer);
    }

    if (drawer) {
        drawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeDrawer);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) {
            closeDrawer();
        }
    });

    // 3. Ensure all sections and elements are immediately active & visible (no scroll delays)
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => el.classList.add('active'));

    // 4. Mobile Horizontal Tracks: Auto-Scroll (5s) + Manual Swipe Controller
    const initMobileCarousels = () => {
        const selector = '.divisions-grid, .catering-pillars-grid, .steps-timeline-grid, .packages-grid, .testimonials-grid, .gallery-grid-interactive, .mobile-horizontal-track';
        const tracks = document.querySelectorAll(selector);

        tracks.forEach(track => {
            const allItems = Array.from(track.children);
            if (allItems.length <= 1) return;

            // Generate dot indicators container if not present
            let dotsContainer = track.nextElementSibling;
            if (!dotsContainer || !dotsContainer.classList.contains('mobile-dots-indicator')) {
                dotsContainer = document.createElement('div');
                dotsContainer.className = 'mobile-dots-indicator';
                track.parentNode.insertBefore(dotsContainer, track.nextSibling);
            }

            const renderDots = () => {
                dotsContainer.innerHTML = '';
                const visibleItems = allItems.filter(el => {
                    return el.offsetParent !== null && getComputedStyle(el).display !== 'none';
                });

                visibleItems.forEach((item, idx) => {
                    const dot = document.createElement('span');
                    dot.className = 'mobile-dot' + (idx === 0 ? ' is-active' : '');
                    dot.setAttribute('data-index', idx);
                    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
                    dot.addEventListener('click', () => {
                        pauseAndScheduleResume();
                        track.scrollTo({
                            left: item.offsetLeft - track.offsetLeft,
                            behavior: 'smooth'
                        });
                    });
                    dotsContainer.appendChild(dot);
                });
            };

            renderDots();

            // Function to update active dot on scroll
            const updateActiveDot = () => {
                if (window.innerWidth > 768) return;
                const visibleItems = allItems.filter(el => {
                    return el.offsetParent !== null && getComputedStyle(el).display !== 'none';
                });
                if (visibleItems.length === 0) return;

                const scrollLeft = track.scrollLeft;
                let activeIdx = 0;
                let minDiff = Infinity;

                visibleItems.forEach((item, idx) => {
                    const diff = Math.abs((item.offsetLeft - track.offsetLeft) - scrollLeft);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIdx = idx;
                    }
                });

                const dots = dotsContainer.querySelectorAll('.mobile-dot');
                dots.forEach((d, i) => {
                    if (i === activeIdx) d.classList.add('is-active');
                    else d.classList.remove('is-active');
                });
            };

            track.addEventListener('scroll', updateActiveDot, { passive: true });

            // Auto-scroll every 5 seconds (5000ms) on mobile
            let autoScrollTimer = null;
            let isUserInteracting = false;
            let isTrackInView = true;
            let resumeTimeout = null;

            // Track visibility so off-screen carousels don't drift
            if ('IntersectionObserver' in window) {
                const trackObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        isTrackInView = entry.isIntersecting;
                    });
                }, { threshold: 0.15 });
                trackObserver.observe(track);
            }

            const nextSlide = () => {
                if (window.innerWidth > 768 || isUserInteracting || !isTrackInView) return;

                const visibleItems = allItems.filter(el => {
                    return el.offsetParent !== null && getComputedStyle(el).display !== 'none';
                });
                if (visibleItems.length <= 1) return;

                const scrollLeft = track.scrollLeft;
                let activeIdx = 0;
                let minDiff = Infinity;

                visibleItems.forEach((item, idx) => {
                    const diff = Math.abs((item.offsetLeft - track.offsetLeft) - scrollLeft);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIdx = idx;
                    }
                });

                // Next index with smooth loop back to 0
                const nextIdx = (activeIdx + 1) % visibleItems.length;
                const targetItem = visibleItems[nextIdx];

                if (targetItem) {
                    track.scrollTo({
                        left: targetItem.offsetLeft - track.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            };

            const startAutoScroll = () => {
                stopAutoScroll();
                if (window.innerWidth <= 768) {
                    autoScrollTimer = setInterval(nextSlide, 5000);
                }
            };

            const stopAutoScroll = () => {
                if (autoScrollTimer) {
                    clearInterval(autoScrollTimer);
                    autoScrollTimer = null;
                }
            };

            const pauseAndScheduleResume = () => {
                isUserInteracting = true;
                stopAutoScroll();
                if (resumeTimeout) clearTimeout(resumeTimeout);
                resumeTimeout = setTimeout(() => {
                    isUserInteracting = false;
                    startAutoScroll();
                }, 5000);
            };

            // Touch & Manual Swipe Listeners
            track.addEventListener('touchstart', () => {
                isUserInteracting = true;
                stopAutoScroll();
                if (resumeTimeout) clearTimeout(resumeTimeout);
            }, { passive: true });

            track.addEventListener('touchend', pauseAndScheduleResume, { passive: true });
            track.addEventListener('pointerdown', () => {
                isUserInteracting = true;
                stopAutoScroll();
                if (resumeTimeout) clearTimeout(resumeTimeout);
            }, { passive: true });

            track.addEventListener('pointerup', pauseAndScheduleResume, { passive: true });

            // Support mouse enter/leave on emulator
            track.addEventListener('mouseenter', () => {
                isUserInteracting = true;
                stopAutoScroll();
            });

            track.addEventListener('mouseleave', () => {
                pauseAndScheduleResume();
            });

            // Start 3-second auto-scroll
            startAutoScroll();

            // Listen for custom filter change (e.g. Gallery)
            window.addEventListener('galleryFiltered', () => {
                renderDots();
                updateActiveDot();
            });

            // Recheck on window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth <= 768) {
                    startAutoScroll();
                } else {
                    stopAutoScroll();
                }
            });
        });
    };

    initMobileCarousels();

    // 4.1 Events by Occasion: Luxury Interactive Deck Carousel & Mouse-Grab Controller
    const initOccasionsCarousel = () => {
        const track = document.getElementById('occasionsTrack');
        if (!track) return;

        const cards = Array.from(track.querySelectorAll('.occasion-card'));
        if (cards.length === 0) return;

        const prevBtn = document.getElementById('occasionsPrevBtn');
        const nextBtn = document.getElementById('occasionsNextBtn');
        const floatingPrev = document.getElementById('occasionsFloatingPrev');
        const floatingNext = document.getElementById('occasionsFloatingNext');
        const currentSlideEl = document.querySelector('#occasionsCounter .current-slide');
        const totalSlidesEl = document.querySelector('#occasionsCounter .total-slides');

        if (totalSlidesEl) {
            totalSlidesEl.textContent = String(cards.length).padStart(2, '0');
        }

        let currentIndex = 0;
        let isMouseDown = false;
        let startX = 0;
        let scrollStart = 0;
        let dragDistance = 0;
        let isAnimating = false;

        const updateActiveCardState = (newIdx) => {
            currentIndex = Math.max(0, Math.min(newIdx, cards.length - 1));
            cards.forEach((card, idx) => {
                if (idx === currentIndex) {
                    card.classList.add('is-active-card');
                } else {
                    card.classList.remove('is-active-card');
                }
            });

            if (currentSlideEl) {
                currentSlideEl.textContent = String(currentIndex + 1).padStart(2, '0');
            }
        };

        const getCardOffset = (targetIdx) => {
            const card = cards[targetIdx];
            if (!card) return 0;
            const isDesktop = window.innerWidth >= 992;
            const containerWidth = track.clientWidth;
            const cardWidth = card.clientWidth;

            if (isDesktop) {
                const targetCenter = (card.offsetLeft - track.offsetLeft) - ((containerWidth - cardWidth) / 2);
                return Math.max(0, Math.min(targetCenter, track.scrollWidth - containerWidth));
            } else {
                return (card.offsetLeft - track.offsetLeft) - 16;
            }
        };

        const goToSlide = (targetIdx, smooth = true) => {
            if (targetIdx < 0) targetIdx = cards.length - 1;
            else if (targetIdx >= cards.length) targetIdx = 0;

            const targetScroll = getCardOffset(targetIdx);
            isAnimating = true;

            track.scrollTo({
                left: targetScroll,
                behavior: smooth ? 'smooth' : 'auto'
            });

            updateActiveCardState(targetIdx);

            setTimeout(() => {
                isAnimating = false;
            }, 450);
        };

        // Navigation click handlers
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex - 1); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex + 1); });
        if (floatingPrev) floatingPrev.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex - 1); });
        if (floatingNext) floatingNext.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex + 1); });

        // Mouse Grab-to-Drag Implementation
        track.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            isMouseDown = true;
            startX = e.pageX - track.offsetLeft;
            scrollStart = track.scrollLeft;
            dragDistance = 0;
            track.classList.add('is-dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const currentX = e.pageX - track.offsetLeft;
            const walk = (currentX - startX) * 1.35;
            dragDistance = Math.abs(walk);
            track.scrollLeft = scrollStart - walk;
        });

        const handleDragEnd = () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            track.classList.remove('is-dragging');

            if (dragDistance > 35) {
                // Find card closest to viewport center
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewCenter = track.scrollLeft + (track.clientWidth / 2);

                cards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewCenter);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                goToSlide(closestIdx);
            }
        };

        window.addEventListener('mouseup', handleDragEnd);
        track.addEventListener('mouseleave', handleDragEnd);

        // Prevent accidental link navigation when user was dragging
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (dragDistance > 10) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });

        // Touch & manual scroll active card detection
        let scrollTimeout = null;
        track.addEventListener('scroll', () => {
            if (isMouseDown || isAnimating) return;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewPos = track.scrollLeft + (track.clientWidth / 2);

                cards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewPos);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                updateActiveCardState(closestIdx);
            }, 60);
        }, { passive: true });

        // Initialize state
        updateActiveCardState(0);
    };

    initOccasionsCarousel();

    // 4.2 Culinary Excellence & Catering: Haute Cuisine Interactive Showcase & Filter System
    const initCateringShowcase = () => {
        const track = document.getElementById('cateringTrack');
        if (!track) return;

        const cards = Array.from(track.querySelectorAll('.food-cat-card'));
        if (cards.length === 0) return;

        const prevBtn = document.getElementById('cateringPrevBtn');
        const nextBtn = document.getElementById('cateringNextBtn');
        const floatingPrev = document.getElementById('cateringFloatingPrev');
        const floatingNext = document.getElementById('cateringFloatingNext');
        const currentCourseEl = document.querySelector('#cateringCounter .current-course');
        const totalCoursesEl = document.querySelector('#cateringCounter .total-courses');
        const filterPills = Array.from(document.querySelectorAll('.catering-pill'));

        if (totalCoursesEl) {
            totalCoursesEl.textContent = String(cards.length).padStart(2, '0');
        }

        let currentIndex = 0;
        let isMouseDown = false;
        let startX = 0;
        let scrollStart = 0;
        let dragDistance = 0;
        let isAnimating = false;

        const updateActiveDishState = (newIdx) => {
            currentIndex = Math.max(0, Math.min(newIdx, cards.length - 1));
            cards.forEach((card, idx) => {
                if (idx === currentIndex) {
                    card.classList.add('is-active-dish');
                } else {
                    card.classList.remove('is-active-dish');
                }
            });

            if (currentCourseEl) {
                currentCourseEl.textContent = String(currentIndex + 1).padStart(2, '0');
            }

            // Sync filter pills if not in "all" manual selection mode
            const activeCardCategory = cards[currentIndex]?.getAttribute('data-category');
            if (activeCardCategory) {
                filterPills.forEach(pill => {
                    const pillFilter = pill.getAttribute('data-filter');
                    if (pillFilter === activeCardCategory) {
                        pill.classList.add('active');
                        pill.setAttribute('aria-selected', 'true');
                    } else if (pillFilter !== 'all') {
                        pill.classList.remove('active');
                        pill.setAttribute('aria-selected', 'false');
                    }
                });
            }
        };

        const getCardOffset = (targetIdx) => {
            const card = cards[targetIdx];
            if (!card) return 0;
            const isDesktop = window.innerWidth >= 992;
            const containerWidth = track.clientWidth;
            const cardWidth = card.clientWidth;

            if (isDesktop) {
                const targetCenter = (card.offsetLeft - track.offsetLeft) - ((containerWidth - cardWidth) / 2);
                return Math.max(0, Math.min(targetCenter, track.scrollWidth - containerWidth));
            } else {
                return (card.offsetLeft - track.offsetLeft) - 16;
            }
        };

        const goToSlide = (targetIdx, smooth = true) => {
            if (targetIdx < 0) targetIdx = cards.length - 1;
            else if (targetIdx >= cards.length) targetIdx = 0;

            const targetScroll = getCardOffset(targetIdx);
            isAnimating = true;

            track.scrollTo({
                left: targetScroll,
                behavior: smooth ? 'smooth' : 'auto'
            });

            updateActiveDishState(targetIdx);

            setTimeout(() => {
                isAnimating = false;
            }, 450);
        };

        // Navigation click handlers
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex - 1); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex + 1); });
        if (floatingPrev) floatingPrev.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex - 1); });
        if (floatingNext) floatingNext.addEventListener('click', (e) => { e.preventDefault(); goToSlide(currentIndex + 1); });

        // Category Filter Pills Interactive Click
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => {
                    p.classList.remove('active');
                    p.setAttribute('aria-selected', 'false');
                });
                pill.classList.add('active');
                pill.setAttribute('aria-selected', 'true');

                const filter = pill.getAttribute('data-filter');
                if (filter === 'all') {
                    goToSlide(0);
                } else {
                    const matchIdx = cards.findIndex(c => c.getAttribute('data-category') === filter);
                    if (matchIdx !== -1) {
                        goToSlide(matchIdx);
                    }
                }
            });
        });

        // Mouse Grab-to-Drag Implementation
        track.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isMouseDown = true;
            startX = e.pageX - track.offsetLeft;
            scrollStart = track.scrollLeft;
            dragDistance = 0;
            track.classList.add('is-dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const currentX = e.pageX - track.offsetLeft;
            const walk = (currentX - startX) * 1.35;
            dragDistance = Math.abs(walk);
            track.scrollLeft = scrollStart - walk;
        });

        const handleDragEnd = () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            track.classList.remove('is-dragging');

            if (dragDistance > 35) {
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewCenter = track.scrollLeft + (track.clientWidth / 2);

                cards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewCenter);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                goToSlide(closestIdx);
            }
        };

        window.addEventListener('mouseup', handleDragEnd);
        track.addEventListener('mouseleave', handleDragEnd);

        // Prevent accidental link navigation when user was dragging
        cards.forEach(card => {
            const link = card.querySelector('a');
            if (link) {
                link.addEventListener('click', (e) => {
                    if (dragDistance > 10) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }
        });

        // Touch swipe active course detection on scroll
        let scrollTimeout = null;
        track.addEventListener('scroll', () => {
            if (isMouseDown || isAnimating) return;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewPos = track.scrollLeft + (track.clientWidth / 2);

                cards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewPos);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                updateActiveDishState(closestIdx);
            }, 60);
        }, { passive: true });

        // Initialize state
        updateActiveDishState(0);
    };

    initCateringShowcase();
 
    // 4b. Why Choose Us (Trust Pillars) Interactive Atelier Carousel
    const initTrustPillarsCarousel = () => {
        const track = document.getElementById('trustTrack');
        if (!track) return;

        const cards = Array.from(track.querySelectorAll('.trust-pillar-card'));
        if (cards.length === 0) return;

        const prevBtn = document.getElementById('trustPrevBtn');
        const nextBtn = document.getElementById('trustNextBtn');
        const floatPrev = document.getElementById('trustFloatingPrev');
        const floatNext = document.getElementById('trustFloatingNext');
        const currentPillarText = document.getElementById('trustCurrentPillar');
        const progressBar = document.getElementById('trustProgressBar');
        const dotBtns = Array.from(document.querySelectorAll('.trust-dot-btn'));

        let currentIndex = 0;
        let isMouseDown = false;
        let startX = 0;
        let scrollStart = 0;
        let dragDistance = 0;
        let isAnimating = false;

        const updatePillarState = (index) => {
            if (index < 0) index = 0;
            if (index >= cards.length) index = cards.length - 1;
            currentIndex = index;

            // Update active card class
            cards.forEach((card, idx) => {
                if (idx === currentIndex) {
                    card.classList.add('is-active');
                } else {
                    card.classList.remove('is-active');
                }
            });

            // Update counter
            if (currentPillarText) {
                const formattedNum = String(currentIndex + 1).padStart(2, '0');
                currentPillarText.textContent = formattedNum;
            }

            // Update progress bar
            if (progressBar) {
                const pct = ((currentIndex + 1) / cards.length) * 100;
                progressBar.style.width = pct + '%';
            }

            // Update dots
            dotBtns.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('is-active');
                } else {
                    dot.classList.remove('is-active');
                }
            });
        };

        const goToPillar = (index, smooth = true) => {
            if (index < 0) index = cards.length - 1;
            if (index >= cards.length) index = 0;

            const targetCard = cards[index];
            if (!targetCard) return;

            isAnimating = true;
            updatePillarState(index);

            // Calculate scroll target based on alignment
            let targetScroll = targetCard.offsetLeft - track.offsetLeft;
            // Center the card if on desktop/mobile
            const offsetPadding = (track.clientWidth - targetCard.clientWidth) / 2;
            if (offsetPadding > 0) {
                targetScroll = targetScroll - offsetPadding;
            }

            track.scrollTo({
                left: Math.max(0, targetScroll),
                behavior: smooth ? 'smooth' : 'auto'
            });

            setTimeout(() => {
                isAnimating = false;
            }, 450);
        };

        // Navigation button events
        const handlePrev = (e) => {
            e.preventDefault();
            goToPillar(currentIndex - 1);
        };

        const handleNext = (e) => {
            e.preventDefault();
            goToPillar(currentIndex + 1);
        };

        if (prevBtn) prevBtn.addEventListener('click', handlePrev);
        if (nextBtn) nextBtn.addEventListener('click', handleNext);
        if (floatPrev) floatPrev.addEventListener('click', handlePrev);
        if (floatNext) floatNext.addEventListener('click', handleNext);

        // Dot buttons
        dotBtns.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                goToPillar(idx);
            });
        });

        // Mouse Grab-to-Drag
        track.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isMouseDown = true;
            startX = e.pageX - track.offsetLeft;
            scrollStart = track.scrollLeft;
            dragDistance = 0;
            track.classList.add('is-dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const currentX = e.pageX - track.offsetLeft;
            const walk = (currentX - startX) * 1.35;
            dragDistance = Math.abs(walk);
            track.scrollLeft = scrollStart - walk;
        });

        const handleMouseUp = () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            track.classList.remove('is-dragging');

            if (dragDistance > 30) {
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewCenter = track.scrollLeft + (track.clientWidth / 2);

                cards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewCenter);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                goToPillar(closestIdx);
            }
        };

        window.addEventListener('mouseup', handleMouseUp);
        track.addEventListener('mouseleave', handleMouseUp);

        // Click on a card to activate and center it
        cards.forEach((card, idx) => {
            card.addEventListener('click', () => {
                if (dragDistance > 10) return;
                goToPillar(idx);
            });
        });

        // Touch & Scroll listener for mobile swipe sync
        let scrollTimeout = null;
        track.addEventListener('scroll', () => {
            if (isMouseDown || isAnimating) return;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewPos = track.scrollLeft + (track.clientWidth / 2);

                cards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewPos);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                updatePillarState(closestIdx);
            }, 60);
        }, { passive: true });

        // Initialize state at index 0
        updatePillarState(0);
    };

    initTrustPillarsCarousel();
 
    // 4c. Authentic Testimonials / Google Reviews Interactive Atelier Controller
    const initTestimonialsCarousel = () => {
        const track = document.getElementById('reviewsTrack');
        if (!track) return;

        const cards = Array.from(track.querySelectorAll('.testimonial-card'));
        if (cards.length === 0) return;

        const prevBtn = document.getElementById('reviewPrevBtn');
        const nextBtn = document.getElementById('reviewNextBtn');
        const floatPrev = document.getElementById('reviewFloatingPrev');
        const floatNext = document.getElementById('reviewFloatingNext');
        const currentStoryText = document.getElementById('reviewCurrentStory');
        const progressBar = document.getElementById('reviewProgressBar');
        const dotBtns = Array.from(document.querySelectorAll('.review-dot-btn'));
        const filterPills = Array.from(document.querySelectorAll('.review-filter-pill'));

        let currentIndex = 0;
        let isMouseDown = false;
        let startX = 0;
        let scrollStart = 0;
        let dragDistance = 0;
        let isAnimating = false;

        const getVisibleCards = () => {
            return cards.filter(card => getComputedStyle(card).display !== 'none');
        };

        const updateReviewState = (index) => {
            const visibleCards = getVisibleCards();
            if (visibleCards.length === 0) return;

            if (index < 0) index = 0;
            if (index >= visibleCards.length) index = visibleCards.length - 1;
            currentIndex = index;

            // Update active state on visible cards
            cards.forEach(card => card.classList.remove('is-active'));
            if (visibleCards[currentIndex]) {
                visibleCards[currentIndex].classList.add('is-active');
            }

            // Update counter
            if (currentStoryText) {
                const formattedNum = String(currentIndex + 1).padStart(2, '0');
                currentStoryText.textContent = formattedNum;
            }

            // Update progress bar
            if (progressBar) {
                const pct = ((currentIndex + 1) / visibleCards.length) * 100;
                progressBar.style.width = pct + '%';
            }

            // Update dots
            dotBtns.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('is-active');
                } else {
                    dot.classList.remove('is-active');
                }
            });
        };

        const goToStory = (index, smooth = true) => {
            const visibleCards = getVisibleCards();
            if (visibleCards.length === 0) return;

            if (index < 0) index = visibleCards.length - 1;
            if (index >= visibleCards.length) index = 0;

            const targetCard = visibleCards[index];
            if (!targetCard) return;

            isAnimating = true;
            updateReviewState(index);

            let targetScroll = targetCard.offsetLeft - track.offsetLeft;
            const offsetPadding = (track.clientWidth - targetCard.clientWidth) / 2;
            if (offsetPadding > 0) {
                targetScroll = targetScroll - offsetPadding;
            }

            track.scrollTo({
                left: Math.max(0, targetScroll),
                behavior: smooth ? 'smooth' : 'auto'
            });

            setTimeout(() => {
                isAnimating = false;
            }, 450);
        };

        // Occasion filter pill clicks
        if (filterPills.length > 0) {
            filterPills.forEach(pill => {
                pill.addEventListener('click', () => {
                    filterPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');

                    const filter = pill.getAttribute('data-filter');
                    cards.forEach(card => {
                        const category = card.getAttribute('data-category');
                        if (filter === 'all' || category === filter) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });

                    // Reset to first visible story
                    goToStory(0, false);
                });
            });
        }

        // Navigation button events
        const handlePrev = (e) => {
            e.preventDefault();
            goToStory(currentIndex - 1);
        };

        const handleNext = (e) => {
            e.preventDefault();
            goToStory(currentIndex + 1);
        };

        if (prevBtn) prevBtn.addEventListener('click', handlePrev);
        if (nextBtn) nextBtn.addEventListener('click', handleNext);
        if (floatPrev) floatPrev.addEventListener('click', handlePrev);
        if (floatNext) floatNext.addEventListener('click', handleNext);

        // Dot buttons
        dotBtns.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                goToStory(idx);
            });
        });

        // Mouse Grab-to-Drag
        track.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isMouseDown = true;
            startX = e.pageX - track.offsetLeft;
            scrollStart = track.scrollLeft;
            dragDistance = 0;
            track.classList.add('is-dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const currentX = e.pageX - track.offsetLeft;
            const walk = (currentX - startX) * 1.35;
            dragDistance = Math.abs(walk);
            track.scrollLeft = scrollStart - walk;
        });

        const handleMouseUp = () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            track.classList.remove('is-dragging');

            if (dragDistance > 30) {
                const visibleCards = getVisibleCards();
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewCenter = track.scrollLeft + (track.clientWidth / 2);

                visibleCards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewCenter);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                goToStory(closestIdx);
            }
        };

        window.addEventListener('mouseup', handleMouseUp);
        track.addEventListener('mouseleave', handleMouseUp);

        // Click card to center it
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (dragDistance > 10) return;
                const visibleCards = getVisibleCards();
                const cardIndex = visibleCards.indexOf(card);
                if (cardIndex !== -1) {
                    goToStory(cardIndex);
                }
            });
        });

        // Touch & Scroll listener for mobile swipe sync
        let scrollTimeout = null;
        track.addEventListener('scroll', () => {
            if (isMouseDown || isAnimating) return;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const visibleCards = getVisibleCards();
                let closestIdx = 0;
                let minDiff = Infinity;
                const viewPos = track.scrollLeft + (track.clientWidth / 2);

                visibleCards.forEach((card, idx) => {
                    const cardCenter = (card.offsetLeft - track.offsetLeft) + (card.clientWidth / 2);
                    const diff = Math.abs(cardCenter - viewPos);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = idx;
                    }
                });

                updateReviewState(closestIdx);
            }, 60);
        }, { passive: true });

        // Initialize state at index 0
        updateReviewState(0);
    };

    initTestimonialsCarousel();

    // 5. Gallery Filter & Lightbox Modal (if gallery present)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryTiles = document.querySelectorAll('.gallery-tile');
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close-btn');

    if (filterBtns.length > 0 && galleryTiles.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                galleryTiles.forEach(tile => {
                    const category = tile.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        tile.style.display = '';
                    } else {
                        tile.style.display = 'none';
                    }
                });
                window.dispatchEvent(new CustomEvent('galleryFiltered'));
            });
        });
    }

    if (lightbox && lightboxImg) {
        galleryTiles.forEach(tile => {
            tile.addEventListener('click', () => {
                const src = tile.getAttribute('data-src') || tile.querySelector('img')?.src;
                const caption = tile.getAttribute('data-caption') || tile.querySelector('.gallery-tile-title')?.textContent;
                if (src) {
                    lightboxImg.src = src;
                    if (lightboxCaption) lightboxCaption.textContent = caption || '';
                    lightbox.classList.add('is-active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('is-active');
            lightboxImg.src = '';
            document.body.style.overflow = '';
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('is-active')) closeLightbox();
        });
    }

    // 6. FAQ Accordion Interaction (if present)
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.parentElement;
                const isOpen = item.classList.contains('is-active');

                document.querySelectorAll('.faq-item').forEach(fi => {
                    fi.classList.remove('is-active');
                    const q = fi.querySelector('.faq-question');
                    if (q) q.setAttribute('aria-expanded', 'false');
                });

                if (!isOpen) {
                    item.classList.add('is-active');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

});
