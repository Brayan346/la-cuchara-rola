document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let map;
    let markers = [];
    let restaurants = [];

    const menuToggle = document.querySelector('.menu-toggle');
const barranav = document.querySelector('.barranav');

if (menuToggle && barranav) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        barranav.classList.toggle('active');
    });

    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.barranav a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            barranav.classList.remove('active');
        });
    });
}

    // Inicialización del mapa
    const initMap = () => {
        try {
            const bogotaBounds = L.latLngBounds(
                [4.48, -74.3],  // Suroeste
                [4.83, -73.99]  // Noreste
            );

            map = L.map('map', {
                maxBounds: bogotaBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 12,
                maxZoom: 18
            }).setView([4.711, -74.0721], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            loadRestaurants(700); // Limitado a 700 restaurantes
        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
        }
    };

    // Cargar y mostrar restaurantes
    const loadRestaurants = (limit = 700) => {
        // Comenzar con los restaurantes locales
        restaurants = [...localRestaurants];

        const apiQuery = `
            [out:json][timeout:50];
            (
                node["amenity"="restaurant"]["name"](4.48,-74.3,4.83,-73.99);
                node["amenity"="cafe"]["name"](4.48,-74.3,4.83,-73.99);
                node["amenity"="fast_food"]["name"](4.48,-74.3,4.83,-73.99);
            );
            out body ${limit};
            >;
            out skel qt;
        `;

        fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: apiQuery
        })
        .then(res => res.json())
        .then(data => {
            const apiRestaurants = data.elements
                .filter(el => {
                    const validCuisines = [
                        'regional', 'colombian', 'mexican', 'italian', 
                        'chinese', 'japanese', 'thai', 'indian', 
                        'american', 'burger', 'pizza'
                    ];

                    return el.tags?.name && 
                           !el.tags?.disused && 
                           !el.tags?.abandoned &&
                           (!el.tags?.cuisine || validCuisines.some(c => 
                               el.tags.cuisine.toLowerCase().includes(c)
                           ));
                })
                .map(el => ({
                    id: el.id,
                    name: el.tags.name,
                    description: el.tags.description || 
                               `${el.tags.cuisine || 'Variada'} - ${el.tags.amenity === 'restaurant' ? 'Restaurante' : 
                                 el.tags.amenity === 'cafe' ? 'Café' : 'Comida Rápida'}`,
                    image: getDefaultImage(el.tags.cuisine, el.tags.amenity),
                    location: {
                        lat: el.lat,
                        lon: el.lon
                    },
                    cuisine: el.tags.cuisine || "Variada"
                }))
                .slice(0, limit);

            restaurants = [...localRestaurants, ...apiRestaurants];
            console.log(`Cargados ${restaurants.length} restaurantes`);
            
            addMarkersToMap(restaurants);
            generateRestaurantCards(restaurants, false);
        })
        .catch(err => {
            console.error("Error al obtener datos de Overpass:", err);
            addMarkersToMap(restaurants);
            generateRestaurantCards(restaurants, false);
        });
    };

    // Función para obtener imágenes por defecto según el tipo de cocina
    const getDefaultImage = (cuisine, amenity) => {
        const type = (cuisine || '').toLowerCase();
        if (type.includes('pizza')) {
            return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500';
        } else if (type.includes('burger')) {
            return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500';
        } else if (type.includes('colombian')) {
            return 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=500';
        } else if (amenity === 'cafe') {
            return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500';
        }
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500';
    };

    // Agregar marcadores al mapa
    const addMarkersToMap = (restaurantsData) => {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        restaurantsData.forEach(restaurant => {
            const { location, name, cuisine } = restaurant;
            
            let emoji = "🍽️";
            if (cuisine.toLowerCase().includes("colombiana")) emoji = "🇨🇴";
            else if (cuisine.toLowerCase().includes("pizza")) emoji = "🍕";
            else if (cuisine.toLowerCase().includes("burger")) emoji = "🍔";
            else if (cuisine.toLowerCase().includes("cafe")) emoji = "☕";
            else if (cuisine.toLowerCase().includes("internacional")) emoji = "🌎";

            if (location.lat && location.lon) {
                const marker = L.marker([location.lat, location.lon])
                    .bindPopup(`
                        <strong>${emoji} ${name}</strong>
                        <br><em>${cuisine}</em>
                        <br>${restaurant.description}
                    `);
                markers.push(marker);
                marker.addTo(map);
            }
        });
    };

    // Generar cards de restaurantes
    const generateRestaurantCards = (restaurantsData, showAll = false) => {
        const grid = document.querySelector('.grid');
        if (!grid) return;

        grid.innerHTML = '';
        const restaurantsToShow = showAll ? restaurantsData : restaurantsData.slice(0, 4);

        restaurantsToShow.forEach(restaurant => {
            const card = `
                <div class="wrapper">
                    <div class="card" data-restaurant-id="${restaurant.id}">
                        <div class="card-img">
                            <img src="${restaurant.image}" 
                                 alt="${restaurant.name}"
                                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500';">
                        </div>
                        <div class="card-content">
                            <h2>${restaurant.name}</h2>
                            <p>${restaurant.description}</p>
                            <div class="rating">
                                <div class="stars">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                                <span class="rating-value">(0)</span>
                                <span class="average-rating">Promedio: 0</span>
                            </div>
                            <button class="btn" onclick="showOnMap(${restaurant.location.lat}, ${restaurant.location.lon})">Ver en mapa</button>
                        </div>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });

        if (!showAll && restaurantsData.length > 4) {
            const viewMoreSection = document.createElement('section');
            viewMoreSection.className = 'view-more-section';
            viewMoreSection.innerHTML = `
                <button id="viewMoreBtn" class="view-more-btn">
                    Ver más restaurantes
                </button>
            `;
            
            grid.parentNode.insertBefore(viewMoreSection, grid.nextSibling);

            document.getElementById('viewMoreBtn').addEventListener('click', () => {
                generateRestaurantCards(restaurantsData, true);
                viewMoreSection.remove();
            });
            initializeRatings();
        }
    };

    const initializeRatings = () => {
    const stars = document.querySelectorAll('.star');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const username = sessionStorage.getItem('username');

    // Cargar calificaciones existentes
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');

    stars.forEach(star => {
        const restaurantId = star.closest('.card').dataset.restaurantId;
        const userRatings = ratings[restaurantId] || {};
        const rating = userRatings[username];

        if (rating) {
            const cardStars = star.closest('.stars').querySelectorAll('.star');
            cardStars.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
            });
            star.closest('.rating').querySelector('.rating-value').textContent = `(${rating})`;
        }

        // Evento al pasar el mouse (visual siempre)
        star.addEventListener('mouseover', () => {
            const cardStars = star.closest('.stars').querySelectorAll('.star');
            const rating = parseInt(star.dataset.rating);
            cardStars.forEach(s => {
                s.classList.toggle('hover', parseInt(s.dataset.rating) <= rating);
            });
        });

        // Evento al quitar el mouse
        star.addEventListener('mouseout', () => {
            const cardStars = star.closest('.stars').querySelectorAll('.star');
            cardStars.forEach(s => s.classList.remove('hover'));
        });

        // Evento al hacer click (visual siempre, guarda si está logueado)
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            const cardStars = star.closest('.stars').querySelectorAll('.star');

            // Actualizar visualización
            cardStars.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
            });

            // Actualizar valor mostrado
            star.closest('.rating').querySelector('.rating-value').textContent = `(${rating})`;

            // Guardar solo si está logueado
            if (isLoggedIn && username) {
                saveRating(restaurantId, username, rating);
                updateAverageRating(restaurantId);
            } else {
                // Mostrar promedio como el mismo valor visualmente
                const card = star.closest('.card');
                if (card) {
                    card.querySelector('.average-rating').textContent = `Promedio: ${rating.toFixed(1)}`;
                }
            }
        });
    });
};


// Función para guardar calificación
const saveRating = (restaurantId, username, rating) => {
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
    
    if (!ratings[restaurantId]) {
        ratings[restaurantId] = {};
    }
    
    ratings[restaurantId][username] = rating;
    localStorage.setItem('ratings', JSON.stringify(ratings));
};

// Función para actualizar el promedio
const updateAverageRating = (restaurantId) => {
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
    const restaurantRatings = ratings[restaurantId] || {};
    const allRatings = Object.values(restaurantRatings);
    
    if (allRatings.length > 0) {
        const average = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        const card = document.querySelector(`.card[data-restaurant-id="${restaurantId}"]`);
        if (card) {
            card.querySelector('.average-rating').textContent = `Promedio: ${average.toFixed(1)}`;
        }
    }
};

    // Función global para mostrar restaurante en mapa
    window.showOnMap = (lat, lon) => {
        if (map) {
            const mapElement = document.getElementById('map');
            mapElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });

            setTimeout(() => {
                map.setView([lat, lon], 16);
                const marker = markers.find(m => 
                    m.getLatLng().lat === lat && 
                    m.getLatLng().lng === lon
                );
                if (marker) {
                    marker.openPopup();
                }
            }, 500);
        }
    };

    // Búsqueda de restaurantes
    const searchRestaurants = (query) => {
        if (!query) {
            addMarkersToMap(restaurants);
            generateRestaurantCards(restaurants, false);
            return;
        }

        const filteredRestaurants = restaurants.filter(restaurant => {
            const searchTerm = query.toLowerCase();
            return restaurant.name.toLowerCase().includes(searchTerm) || 
                   restaurant.cuisine.toLowerCase().includes(searchTerm) ||
                   restaurant.description.toLowerCase().includes(searchTerm);
        });

        addMarkersToMap(filteredRestaurants);
        generateRestaurantCards(filteredRestaurants, false);
    };

    // Event listeners para búsqueda
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchRestaurants(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchRestaurants(searchInput.value);
            }
        });
    }

    // Inicialización
    const mapElement = document.getElementById('map');
    if (mapElement) {
        setTimeout(initMap, 100);
    }
});