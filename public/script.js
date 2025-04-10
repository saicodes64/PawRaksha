// Wait for DOM to fully load before running scripts
document.addEventListener('DOMContentLoaded', function() {
    // Carousel functionality
    const carouselInner = document.querySelector('.carousel-inner');
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let currentIndex = 0;
    
    // Set initial position
    updateCarousel();
    
    // Auto slide every 5 seconds
    let interval = setInterval(nextSlide, 5000);
    
    function updateCarousel() {
        const itemWidth = items[0].offsetWidth;
        carouselInner.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % items.length;
        updateCarousel();
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateCarousel();
    }
    
    // Button events
    nextBtn.addEventListener('click', function() {
        clearInterval(interval);
        nextSlide();
        interval = setInterval(nextSlide, 5000);
    });
    
    prevBtn.addEventListener('click', function() {
        clearInterval(interval);
        prevSlide();
        interval = setInterval(nextSlide, 5000);
    });
    
    // Feeder controls
    const minusBtn = document.querySelectorAll('.feeder-btn')[0];
    const plusBtn = document.querySelectorAll('.feeder-btn')[1];
    const amountInput = document.querySelector('.feeder-amount');
    
    minusBtn.addEventListener('click', function() {
        let amount = parseInt(amountInput.value);
        if (amount > 1) {
            amountInput.value = amount - 1;
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let amount = parseInt(amountInput.value);
        if (amount < 5) {
            amountInput.value = amount + 1;
        }
    });

    // Add responsive handling for window resize
    window.addEventListener('resize', function() {
        updateCarousel();
    });

    // You can add more advanced functionality below

});