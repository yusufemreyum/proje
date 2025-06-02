/**
 * Hava durumu panosu için ana JavaScript.
 * İnteraktif hava durumu haritası ve grafikleri gerçek zamanlı verilerle entegre eder.
 */

// Sabitler
const DEFAULT_CITY = 'İstanbul';
const UNIT_SYMBOLS = { celsius: '°C', fahrenheit: '°F' };
const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 dakika
const MAP_CENTER = [39.925533, 32.866287]; // Türkiye merkezi
const MAP_ZOOM = 6;
const API_KEY = 'YOUR_ACTUAL_API_KEY'; // Gerçek OpenWeatherMap API anahtarıyla değiştirin

// Genel durum
let currentCity = DEFAULT_CITY;
let isDarkMode = false;
let currentUnit = 'celsius';
let favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
let weatherMap = null;
let currentLayer = 'temperature';
let chartInstances = new Map();
let cityMarkers = [];
let autoRefreshTimer = null;

// Şehir verileri (koordinatlarla)
const cityData = {
    'İstanbul': { temp: 22, desc: 'Açık ve güneşli', icon: '01d', humidity: 65, wind: 12, visibility: 10, pressure: 1013, uv: 6, aqi: 42, feelsLike: 25, high: 28, low: 15, coords: [41.0082, 28.9784], sunrise: '06:24', sunset: '19:47', moonPhase: 'Yeni Ay' },
    'Ankara': { temp: 18, desc: 'Parçalı Bulutlu', icon: '02d', humidity: 72, wind: 8, visibility: 8, pressure: 1010, uv: 4, aqi: 38, feelsLike: 20, high: 24, low: 12, coords: [39.9334, 32.8597] },
    'İzmir': { temp: 25, desc: 'Güneşli', icon: '01d', humidity: 58, wind: 15, aqi: 35, feelsLike: 27, high: 30, low: 18, visibility: 10, pressure: 1012, uv: 7, coords: [38.4192, 27.1287] },
    'Antalya': { temp: 28, desc: 'Az Bulutlu', icon: '02d', humidity: 60, wind: 10, aqi: 40, feelsLike: 30, high: 32, low: 20, visibility: 12, pressure: 1015, uv: 8, coords: [36.8969, 30.7133] },
    'Bursa': { temp: 20, desc: 'Bulutlu', icon: '03d', humidity: 70, wind: 6, aqi: 45, feelsLike: 22, high: 26, low: 14, visibility: 9, pressure: 1011, uv: 5, coords: [40.1828, 29.0670] },
    'Adana': { temp: 30, desc: 'Sıcak', icon: '01d', humidity: 55, wind: 8, aqi: 52, feelsLike: 33, high: 35, low: 22, visibility: 10, pressure: 1014, uv: 9, coords: [37.0000, 35.3250] },
    'Trabzon': { temp: 19, desc: 'Yağmurlu', icon: '10d', humidity: 85, wind: 12, aqi: 25, feelsLike: 20, high: 23, low: 15, visibility: 7, pressure: 1009, uv: 4, coords: [41.0050, 39.7269] },
    'Eskişehir': { temp: 17, desc: 'Kapalı', icon: '04d', humidity: 75, wind: 5, aqi: 35, feelsLike: 18, high: 22, low: 10, visibility: 8, pressure: 1010, uv: 3, coords: [39.7767, 30.5206] },
    'Adıyaman': { temp: 26, desc: 'Açık', icon: '01d', humidity: 50, wind: 7, visibility: 10, pressure: 1012, uv: 7, aqi: 40, feelsLike: 28, high: 30, low: 20, coords: [37.7644, 38.2763] },
    'Afyonkarahisar': { temp: 16, desc: 'Parçalı Bulutlu', icon: '02d', humidity: 70, wind: 6, visibility: 9, pressure: 1011, uv: 5, aqi: 35, feelsLike: 17, high: 22, low: 10, coords: [38.7569, 30.5387] },
    'Gaziantep': { temp: 27, desc: 'Açık', icon: '01d', humidity: 48, wind: 9, visibility: 10, pressure: 1010, uv: 8, aqi: 45, feelsLike: 29, high: 32, low: 19, coords: [37.0662, 37.3781], sunrise: '06:15', sunset: '19:40', moonPhase: 'Hilal' },
    'Erzurum': { temp: 12, desc: 'Parçalı Bulutlu', icon: '02d', humidity: 80, wind: 10, visibility: 8, pressure: 1008, uv: 4, aqi: 30, feelsLike: 14, high: 18, low: 8, coords: [39.9055, 41.2658], sunrise: '06:00', sunset: '19:30', moonPhase: 'Yeni Ay' },
    'Van': { temp: 14, desc: 'Hafif Yağmurlu', icon: '10d', humidity: 85, wind: 12, visibility: 7, pressure: 1009, uv: 5, aqi: 28, feelsLike: 15, high: 20, low: 10, coords: [38.5012, 43.3950], sunrise: '06:05', sunset: '19:35', moonPhase: 'Hilal' },
    'Mersin': { temp: 29, desc: 'Güneşli', icon: '01d', humidity: 62, wind: 9, visibility: 10, pressure: 1013, uv: 8, aqi: 48, feelsLike: 32, high: 34, low: 21, coords: [36.8121, 34.6415], sunrise: '06:20', sunset: '19:45', moonPhase: 'Yeni Ay' }
};

// Grafikler için 7 günlük tahmin verileri
const forecastData = {
    'İstanbul': { temp: [22, 21, 20, 19, 20, 22, 23], precip: [10, 15, 20, 10, 5, 0, 0], wind: [12, 10, 8, 9, 11, 12, 13], humidity: [65, 68, 70, 72, 67, 64, 62] },
    'Ankara': { temp: [18, 17, 16, 15, 17, 19, 20], precip: [20, 25, 30, 15, 10, 5, 0], wind: [8, 7, 6, 7, 8, 9, 10], humidity: [72, 74, 76, 75, 73, 70, 68] },
    'İzmir': { temp: [25, 24, 23, 22, 24, 26, 27], precip: [5, 10, 15, 5, 0, 0, 0], wind: [15, 14, 13, 12, 14, 15, 16], humidity: [58, 60, 62, 59, 57, 55, 54] },
    'Antalya': { temp: [28, 27, 26, 25, 27, 29, 30], precip: [0, 5, 10, 0, 0, 0, 0], wind: [10, 9, 8, 9, 10, 11, 12], humidity: [60, 62, 64, 61, 59, 58, 57] },
    'Bursa': { temp: [20, 19, 18, 17, 19, 21, 22], precip: [15, 20, 25, 15, 10, 5, 0], wind: [6, 5, 4, 5, 6, 7, 8], humidity: [70, 72, 74, 71, 69, 68, 67] },
    'Adana': { temp: [30, 29, 28, 27, 29, 31, 32], precip: [0, 0, 5, 0, 0, 0, 0], wind: [8, 7, 6, 7, 8, 9, 10], humidity: [55, 57, 59, 56, 54, 53, 52] },
    'Trabzon': { temp: [19, 18, 17, 16, 18, 20, 21], precip: [40, 50, 60, 40, 30, 20, 10], wind: [12, 11, 10, 11, 12, 13, 14], humidity: [85, 87, 89, 86, 84, 82, 80] },
    'Eskişehir': { temp: [17, 16, 15, 14, 16, 18, 19], precip: [20, 25, 30, 20, 15, 10, 5], wind: [5, 4, 3, 4, 5, 6, 7], humidity: [75, 77, 79, 76, 74, 72, 70] },
    'Adıyaman': { temp: [26, 25, 24, 23, 25, 27, 28], precip: [5, 10, 15, 5, 0, 0, 0], wind: [7, 6, 5, 6, 7, 8, 9], humidity: [50, 52, 54, 51, 49, 48, 47] },
    'Afyonkarahisar': { temp: [16, 15, 14, 13, 15, 17, 18], precip: [20, 25, 30, 20, 15, 10, 5], wind: [6, 5, 4, 5, 6, 7, 8], humidity: [70, 72, 74, 71, 69, 68, 67] },
    'Gaziantep': { temp: [27, 26, 25, 24, 26, 28, 29], precip: [5, 10, 15, 5, 0, 0, 0], wind: [9, 8, 7, 8, 9, 10, 11], humidity: [48, 50, 52, 49, 47, 46, 45] },
    'Erzurum': { temp: [12, 11, 10, 9, 11, 13, 14], precip: [30, 40, 50, 30, 20, 10, 5], wind: [10, 9, 8, 9, 10, 11, 12], humidity: [80, 82, 84, 81, 79, 77, 75] },
    'Van': { temp: [14, 13, 12, 11, 13, 15, 16], precip: [40, 50, 60, 40, 30, 20, 10], wind: [12, 11, 10, 11, 12, 13, 14], humidity: [85, 87, 89, 86, 84, 82, 80] },
    'Mersin': { temp: [29, 28, 27, 26, 28, 30, 31], precip: [0, 5, 10, 0, 0, 0, 0], wind: [9, 8, 7, 8, 9, 10, 11], humidity: [62, 64, 66, 63, 61, 60, 59] }
};

// Hava durumu önerileri
const weatherTips = {
    'Açık ve güneşli': ['Güneş kremi kullanın!', 'Açık renk kıyafet giyin.', 'Bol su için.'],
    'Parçalı Bulutlu': ['Hafif ceket alın.', 'Şemsiye taşıyın.'],
    'Güneşli': ['Güneş gözlüğü takın.', 'UV korumalı kıyafet giyin.'],
    'Az Bulutlu': ['Dışarı çıkın!', 'Hafif ceket yeter.'],
    'Bulutlu': ['İç mekan aktiviteleri yapın.', 'Moralinizi yüksek tutun!'],
    'Yağmurlu': ['Şemsiye alın.', 'Su geçirmez ayakkabı giyin.'],
    'Hafif Yağmurlu': ['Şemsiye veya yağmurluk alın.', 'Hafif su geçirmez ayakkabı giyin.'],
    'Sıcak': ['Gölgede kalın.', 'Klimalı ortamda durun.'],
    'Kapalı': ['İç mekan planları yapın.', 'Sıcak içecek alın.'],
    'Açık': ['Açık havada vakit geçirin!', 'Güneşin tadını çıkarın.']
};

/**
 * Geçerli zaman ekranını günceller.
 */
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const timeElement = document.getElementById('current-time');
    if (timeElement) timeElement.textContent = timeString;
}

/**
 * Sıcaklığı Celsius ve Fahrenheit arasında dönüştürür.
 * @param {number} temp - Sıcaklık değeri.
 * @param {string} toUnit - Hedef birim ('celsius' veya 'fahrenheit').
 * @returns {number} Dönüştürülmüş sıcaklık.
 */
function convertTemp(temp, toUnit) {
    if (toUnit === 'fahrenheit') {
        return Math.round((temp * 9 / 5) + 32);
    }
    return Math.round(temp);
}

/**
 * Leaflet haritasını OpenWeatherMap katmanları ve şehir işaretçileriyle başlatır.
 */
function initMap() {
    const mapContainer = document.getElementById('weather-map');
    const placeholder = document.getElementById('weather-map-placeholder');
    if (!mapContainer) {
        console.error('Harita konteyneri bulunamadı');
        return;
    }

    try {
        if (weatherMap) {
            weatherMap.remove();
            cityMarkers.forEach(marker => marker.remove());
            cityMarkers = [];
        }
        weatherMap = L.map('weather-map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView(MAP_CENTER, MAP_ZOOM);

        // Temel katman
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(weatherMap);

        // Şehir işaretçileri ekle
        Object.entries(cityData).forEach(([city, data]) => {
            if (data.coords) {
                const marker = L.marker(data.coords, {
                    title: city,
                    alt: `${city} hava durumu`
                }).addTo(weatherMap);
                marker.bindPopup(`
                    <b>${city}</b><br>
                    Sıcaklık: ${convertTemp(data.temp, currentUnit)}${UNIT_SYMBOLS[currentUnit]}<br>
                    Nem: ${data.humidity}%<br>
                    Rüzgar: ${data.wind} km/s<br>
                    Durum: ${data.desc}<br>
                    <button onclick="switchCity('${city}')">Detayları Gör</button>
                `);
                cityMarkers.push(marker);
            }
        });

        updateMapLayer(currentLayer);
        mapContainer.setAttribute('aria-label', 'İnteraktif hava durumu haritası');
        mapContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } catch (error) {
        console.error('Harita başlatma hatası:', error);
        mapContainer.style.display = 'none';
        if (placeholder) {
            placeholder.style.display = 'block';
            placeholder.innerHTML = `
                <div class="map-loading">
                    <i class="fas fa-map" style="font-size: 4rem; opacity: 0.3; margin-bottom: 20px;"></i>
                    <p>Harita yüklenemedi. <button onclick="initMap()">Tekrar Dene</button></p>
                </div>
            `;
        }
    }
}

/**
 * Harita hava durumu katmanını günceller.
 * @param {string} layer - Katman türü (temperature, precipitation, wind, humidity).
 */
function updateMapLayer(layer) {
    if (!weatherMap) return;

    const layerUrls = {
        temperature: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        precipitation: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        humidity: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`
    };
    const layerNames = {
        temperature: 'Sıcaklık',
        precipitation: 'Yağış',
        wind: 'Rüzgar',
        humidity: 'Nem (Bulut)'
    };

    weatherMap.eachLayer(l => {
        if (!l._url?.includes('openstreetmap')) weatherMap.removeLayer(l);
    });

    if (layerUrls[layer]) {
        L.tileLayer(layerUrls[layer], {
            attribution: `© <a href="https://openweathermap.org">OpenWeatherMap</a> (${layerNames[layer]})`,
            maxZoom: 18,
            opacity: 0.7
        }).addTo(weatherMap);
    } else {
        console.warn(`Geçersiz katman: ${layer}`);
    }
    currentLayer = layer;
    if (cityData[currentCity]?.coords) {
        weatherMap.flyTo(cityData[currentCity].coords, 8, { duration: 1 });
    }
}

/**
 * Mevcut Chart.js örneklerini yok eder.
 */
function destroyCharts() {
    chartInstances.forEach(chart => chart.destroy());
    chartInstances.clear();
}

/**
 * Chart.js grafiklerini tahmin verileriyle başlatır.
 * @param {string} period - Grafik periyodu ('7d', '14d', '30d').
 * @param {string} type - Grafik türü ('hourly' veya 'daily').
 */
function initCharts(period = '7d', type = 'daily') {
    const chartIds = ['temperature-chart', 'precipitation-chart', 'wind-chart', 'humidity-chart'];
    if (!chartIds.every(id => document.getElementById(id))) {
        console.error('Bir veya daha fazla grafik kanvası bulunamadı');
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-line" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>Grafik yüklenemedi. <button onclick="initCharts()">Tekrar Dene</button></p>
                </div>
            `;
        });
        return;
    }

    try {
        destroyCharts();
        const data = cityData[currentCity] || cityData[DEFAULT_CITY];
        let forecast = forecastData[currentCity] || {
            temp: Array(7).fill(data.temp).map((t, i) => t - (i % 2)),
            precip: Array(7).fill(0).map(() => data.desc.includes('Yağmur') ? 30 : 5),
            wind: Array(7).fill(data.wind).map((w, i) => w + (i % 3)),
            humidity: Array(7).fill(data.humidity).map((h, i) => h - (i % 4))
        };

        // Daha uzun periyotlar için simülasyon
        let daysCount = period === '14d' ? 14 : period === '30d' ? 30 : 7;
        let labels = Array(daysCount).fill().map((_, i) => `Gün ${i + 1}`);
        let tempData = forecast.temp;
        let precipData = forecast.precip;
        let windData = forecast.wind;
        let humidityData = forecast.humidity;

        if (daysCount > 7) {
            tempData = Array(daysCount).fill().map((_, i) => forecast.temp[i % 7] + (Math.random() - 0.5) * 2);
            precipData = Array(daysCount).fill().map((_, i) => forecast.precip[i % 7] * (1 + (Math.random() - 0.5) * 0.2));
            windData = Array(daysCount).fill().map((_, i) => forecast.wind[i % 7] + (Math.random() - 0.5));
            humidityData = Array(daysCount).fill().map((_, i) => forecast.humidity[i % 7] + (Math.random() - 0.5) * 2);
        }

        // Saatlik ve günlük yağış ayarı
        if (type === 'hourly') {
            precipData = precipData.map(p => p / 24); // Günlük yağışı saatlik simüle et
            labels = Array(daysCount * 24).fill().map((_, i) => `${Math.floor(i / 24) + 1}. Gün ${i % 24}:00`);
            precipData = precipData.flatMap(p => Array(24).fill(p));
        }

        const charts = [
            {
                id: 'temperature-chart',
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: `Sıcaklık (${UNIT_SYMBOLS[currentUnit]})`,
                        data: tempData.map(t => convertTemp(t, currentUnit)),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        tooltip: { enabled: true, mode: 'index', intersect: false }
                    },
                    scales: { y: { beginAtZero: false, title: { display: true, text: UNIT_SYMBOLS[currentUnit] } } },
                    onClick: (e, elements) => {
                        if (elements.length) {
                            const index = elements[0].index;
                            alert(`${labels[index]}: ${convertTemp(tempData[index], currentUnit)}${UNIT_SYMBOLS[currentUnit]}`);
                        }
                    }
                }
            },
            {
                id: 'precipitation-chart',
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: `Yağış (${type === 'hourly' ? 'mm/saat' : '%'})`,
                        data: precipData,
                        backgroundColor: '#2980b9'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        tooltip: { enabled: true }
                    },
                    scales: { y: { beginAtZero: true, title: { display: true, text: type === 'hourly' ? 'mm/saat' : '%' } } }
                }
            },
            {
                id: 'wind-chart',
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Rüzgar (km/s)',
                        data: windData,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        tooltip: { enabled: true }
                    },
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'km/s' } } }
                }
            },
            {
                id: 'humidity-chart',
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Nem (%)',
                        data: humidityData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        tooltip: { enabled: true }
                    },
                    scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } } }
                }
            }
        ];

        charts.forEach(({ id, type, data, options }) => {
            const canvas = document.getElementById(id);
            if (canvas) {
                chartInstances.set(id, new Chart(canvas, { type, data, options }));
                canvas.setAttribute('aria-label', `Haftalık ${data.datasets[0].label} grafiği`);
            }
        });
    } catch (error) {
        console.error('Grafik başlatma hatası:', error);
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-line" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>Grafik yüklenemedi. <button onclick="initCharts()">Tekrar Dene</button></p>
                </div>
            `;
        });
    }
}

/**
 * Öne çıkan şehir kartlarını günceller.
 */
function updateHighlightCards() {
    const highlightCities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Gaziantep', 'Mersin'];
    highlightCities.forEach(city => {
        const data = cityData[city];
        if (!data) return;
        const card = document.querySelector(`.highlight-card[data-city="${city.toLowerCase()}"]`);
        if (card) {
            card.querySelector('.temperature').textContent = `${convertTemp(data.temp, currentUnit)}${UNIT_SYMBOLS[currentUnit]}`;
            card.querySelector('.condition').textContent = data.desc;
            card.querySelector('.weather-icon').src = `https://openweathermap.org/img/wn/${data.icon}.png`;
            card.querySelector('.weather-icon').alt = data.desc;
        }
    });
}

/**
 * Ana hava durumu ekranını günceller.
 * @param {string} city - Şehir adı.
 */
function updateMainWeather(city) {
    const data = cityData[city] || cityData[DEFAULT_CITY];
    if (!cityData[city]) {
        console.warn(`Şehir ${city} bulunamadı, ${DEFAULT_CITY} kullanılıyor`);
    }

    const elements = {
        city: document.getElementById('current-city'),
        mainTemp: document.getElementById('main-temp'),
        feelsLike: document.getElementById('feels-like'),
        weatherDesc: document.getElementById('weather-desc'),
        mainIcon: document.getElementById('main-icon'),
        humidity: document.getElementById('humidity'),
        windSpeed: document.getElementById('wind-speed'),
        visibility: document.getElementById('visibility'),
        pressure: document.getElementById('pressure'),
        uvIndex: document.getElementById('uv-index'),
        airQuality: document.getElementById('air-quality'),
        coords: document.getElementById('coordinates'),
        sunrise: document.getElementById('sunrise'),
        sunset: document.getElementById('sunset'),
        moonPhase: document.getElementById('moon-phase'),
        highTemp: document.getElementById('high-temp'),
        lowTemp: document.getElementById('low-temp')
    };

    if (elements.city) elements.city.textContent = city;
    if (elements.mainTemp) elements.mainTemp.textContent = convertTemp(data.temp, currentUnit);
    document.querySelectorAll('.temp-unit').forEach(el => { if (el) el.textContent = UNIT_SYMBOLS[currentUnit]; });
    if (elements.feelsLike) elements.feelsLike.textContent = `${convertTemp(data.feelsLike, currentUnit)}${UNIT_SYMBOLS[currentUnit]}`;
    if (elements.weatherDesc && elements.weatherDesc.lastElementChild) elements.weatherDesc.lastElementChild.textContent = data.desc;
    if (elements.mainIcon) {
        elements.mainIcon.src = `https://openweathermap.org/img/wn/${data.icon}@4x.png`;
        elements.mainIcon.alt = data.desc;
    }
    if (elements.humidity) elements.humidity.textContent = `${data.humidity}%`;
    if (elements.windSpeed) elements.windSpeed.textContent = `${data.wind} km/s`;
    if (elements.visibility) elements.visibility.textContent = `${data.visibility} km`;
    if (elements.pressure) elements.pressure.textContent = `${data.pressure} mb`;
    if (elements.uvIndex) elements.uvIndex.textContent = data.uv;
    if (elements.airQuality) elements.airQuality.textContent = data.aqi <= 50 ? 'İyi' : data.aqi <= 100 ? 'Orta' : 'Kötü';
    if (elements.coords) elements.coords.textContent = data.coords ? `${data.coords[0].toFixed(4)}° K, ${data.coords[1].toFixed(4)}° D` : 'Bilinmiyor';
    if (elements.sunrise) elements.sunrise.textContent = data.sunrise || '06:00';
    if (elements.sunset) elements.sunset.textContent = data.sunset || '20:00';
    if (elements.moonPhase && elements.moonPhase.lastElementChild) elements.moonPhase.lastElementChild.textContent = data.moonPhase || 'Bilinmiyor';
    if (elements.highTemp) elements.highTemp.textContent = `${convertTemp(data.high, currentUnit)}°`;
    if (elements.lowTemp) elements.lowTemp.textContent = `${convertTemp(data.low, currentUnit)}°`;

    const tipsContainer = document.getElementById('weather-tips');
    if (tipsContainer) {
        tipsContainer.innerHTML = '';
        const tips = weatherTips[data.desc] || ['Genel öneri: Hava durumunu takip edin.'];
        tips.forEach(tip => {
            const tipCard = document.createElement('div');
            tipCard.className = 'tip-card fade-in';
            tipCard.innerHTML = `<i class="fas fa-lightbulb"></i><p>${tip}</p>`;
            tipsContainer.appendChild(tipCard);
        });
    }

    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.innerHTML = favorites.includes(city) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        favoriteBtn.setAttribute('aria-label', favorites.includes(city) ? 'Favorilerden kaldır' : 'Favorilere ekle');
    }

    updateHighlightCards();
}

/**
 * Saatlik tahmin oluşturur.
 */
function generateHourlyForecast() {
    const container = document.getElementById('hourly-forecast');
    if (!container) return;
    container.innerHTML = '';
    const data = cityData[currentCity] || cityData[DEFAULT_CITY];
    const now = new Date();

    for (let i = 1; i <= 24; i++) {
        const hour = (now.getHours() + i) % 24;
        const temp = convertTemp(data.temp + (hour > 18 ? -2 : 1), currentUnit);
        const precipitation = hour > 12 && data.desc.includes('Yağmur') ? 40 : 10;
        const windDir = ['Kuzey', 'Güney', 'Doğu', 'Batı'][Math.floor(Math.random() * 4)];
        const icon = data.icon.includes('n') && hour >= 18 ? data.icon.replace('d', 'n') : data.icon;

        const item = document.createElement('div');
        item.className = 'hourly-item fade-in';
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `${hour}:00 hava durumu`);
        item.innerHTML = `
            <div class="hourly-time">${hour.toString().padStart(2, '0')}:00</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${data.desc}" class="hourly-icon">
            <div class="hourly-temp">${temp}${UNIT_SYMBOLS[currentUnit]}</div>
        `;
        item.addEventListener('click', () => {
            const precipEl = document.getElementById('hourly-precipitation');
            const windDirEl = document.getElementById('hourly-wind-direction');
            const detailsEl = document.getElementById('hourly-details');
            if (precipEl) precipEl.textContent = `${precipitation}%`;
            if (windDirEl) windDirEl.textContent = windDir;
            if (detailsEl) detailsEl.classList.remove('hidden');
        });
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
        container.appendChild(item);
    }
}

/**
 * Haftalık tahmin oluşturur.
 * @param {string} view - Görünüm türü ('simple' veya 'detailed').
 */
function generateWeeklyForecast(view = 'simple') {
    const container = document.getElementById('weekly-forecast');
    if (!container) return;
    container.innerHTML = '';
    const data = cityData[currentCity] || cityData[DEFAULT_CITY];
    const forecast = forecastData[currentCity] || {
        temp: Array(7).fill(data.temp).map((t, i) => t - (i % 2)),
        precip: Array(7).fill(0).map(() => data.desc.includes('Yağmur') ? 30 : 5),
        wind: Array(7).fill(data.wind).map((w, i) => w + (i % 3)),
        humidity: Array(7).fill(data.humidity).map((h, i) => h - (i % 4))
    };
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const day = days[date.getDay()];
        const temp = convertTemp(forecast.temp[i], currentUnit);
        const icon = data.icon;

        const item = document.createElement('div');
        item.className = `weekly-item fade-in ${view === 'simple' ? 'simple-view' : ''}`;
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `${day} hava durumu`);
        item.innerHTML = `
            <div class="weekly-day">${day}</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Hava durumu" class="weekly-icon">
            <div class="weekly-temp">${temp}${UNIT_SYMBOLS[currentUnit]}</div>
            <div class="weekly-details ${view === 'simple' ? 'hidden' : ''}" data-view="detailed">
                <div class="detail-item"><i class="fas fa-tint"></i> Nem: ${forecast.humidity[i]}%</div>
                <div class="detail-item"><i class="fas fa-wind"></i> Rüzgar: ${forecast.wind[i]} km/s</div>
                <div class="detail-item"><i class="fas fa-cloud-rain"></i> Yağış: ${forecast.precip[i]}%</div>
            </div>
        `;
        container.appendChild(item);
    }
}

/**
 * Şehir kartları oluşturur.
 * @param {string} filter - Bölge filtresi ('all' veya bölge adı).
 */
function generateCityCards(filter = 'all') {
    const container = document.getElementById('cities-grid');
    if (!container) return;
    container.innerHTML = '';

    const regions = {
        marmara: ['İstanbul', 'Bursa'],
        ege: ['İzmir', 'Afyonkarahisar'],
        akdeniz: ['Antalya', 'Adana', 'Mersin'],
        'ic-anadolu': ['Ankara', 'Eskişehir'],
        karadeniz: ['Trabzon'],
        'dogu-anadolu': ['Erzurum', 'Van'],
        guneydogu: ['Adıyaman', 'Gaziantep']
    };

    const cities = filter === 'all' ? Object.keys(cityData) : regions[filter] || [];

    cities.forEach(city => {
        const data = cityData[city];
        if (!data) return;
        const card = document.createElement('div');
        card.className = 'city-card fade-in';
        card.setAttribute('data-region', Object.keys(regions).find(region => regions[region].includes(city)) || 'other');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${city} hava durumu`);
        card.innerHTML = `
            <div class="city-header">
                <h3 class="city-name">${city}</h3>
                <div class="city-temp">${convertTemp(data.temp, currentUnit)}${UNIT_SYMBOLS[currentUnit]}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <img src="https://openweathermap.org/img/wn/${data.icon}.png" alt="${data.desc}" style="width: 50px;">
                <span>${data.desc}</span>
            </div>
            <div class="city-details">
                <div class="city-detail"><i class="fas fa-tint"></i> ${data.humidity}%</div>
                <div class="city-detail"><i class="fas fa-wind"></i> ${data.wind} km/s</div>
                <div class="city-detail"><i class="fas fa-lungs"></i> AQI ${data.aqi}</div>
                <div class="city-detail"><i class="fas fa-sun"></i> UV ${data.uv}</div>
            </div>
        `;
        card.addEventListener('click', () => switchCity(city));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchCity(city);
            }
        });
        container.appendChild(card);
    });
}

/**
 * Yeni bir şehre geçer ve arayüzü yeniler.
 * @param {string} city - Şehir adı.
 */
function switchCity(city) {
    if (!cityData[city]) {
        alert(`Şehir "${city}" bulunamadı.`);
        return;
    }
    currentCity = city;
    showLoading();
    setTimeout(() => {
        updateMainWeather(city);
        generateHourlyForecast();
        generateWeeklyForecast(document.querySelector('.toggle-btn.active')?.dataset.view || 'simple');
        generateCityCards(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
        initCharts();
        initMap();
        resetAutoRefresh();
        hideLoading();
    }, 500);
}

/**
 * Yükleme kaplamasını gösterir.
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }
}

/**
 * Yükleme kaplamasını gizler.
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Şehirleri önerilerle arar.
 * @param {string} query - Arama sorgusu.
 */
function searchCity(query) {
    const suggestions = document.getElementById('search-suggestions');
    if (!suggestions) return;

    if (!query) {
        suggestions.style.display = 'none';
        suggestions.setAttribute('aria-hidden', 'true');
        return;
    }

    showLoading();
    setTimeout(() => {
        const cities = Object.keys(cityData);
        const matches = cities.filter(city => city.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
        suggestions.innerHTML = '';

        if (matches.length) {
            matches.forEach(city => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.setAttribute('role', 'option');
                item.setAttribute('tabindex', '0');
                item.textContent = city;
                item.addEventListener('click', () => {
                    const input = document.getElementById('city-search');
                    if (input) input.value = city;
                    switchCity(city);
                    suggestions.style.display = 'none';
                    suggestions.setAttribute('aria-hidden', 'true');
                });
                item.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        item.click();
                    }
                });
                suggestions.appendChild(item);
            });
            suggestions.style.display = 'block';
            suggestions.setAttribute('aria-hidden', 'false');
        } else {
            suggestions.innerHTML = '<div class="suggestion-item" role="alert">Şehir bulunamadı</div>';
            suggestions.style.display = 'block';
            suggestions.setAttribute('aria-hidden', 'false');
        }
        hideLoading();
    }, 300);
}

/**
 * Bir fonksiyonun geri tepmesini önler.
 * @param {Function} func - Geri tepmesi önlenecek fonksiyon.
 * @param {number} wait - Bekleme süresi (milisaniye).
 * @returns {Function} Geri tepmesi önlenmiş fonksiyon.
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Açık/koyu temayı değiştirir.
 */
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = `<i class="${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}"></i><span>${isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>`;
        btn.setAttribute('aria-label', isDarkMode ? 'Aydınlık moda geç' : 'Karanlık moda geç');
    }
}

/**
 * Sıcaklık birimini değiştirir.
 * @param {string} unit - Birim ('celsius' veya 'fahrenheit').
 */
function toggleUnit(unit) {
    if (currentUnit === unit) return;
    currentUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(btn => {
        const isActive = btn.dataset.unit === unit;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive);
    });
    updateMainWeather(currentCity);
    generateHourlyForecast();
    generateWeeklyForecast(document.querySelector('.toggle-btn.active')?.dataset.view || 'simple');
    generateCityCards(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    initCharts();
    updateMapLayer(currentLayer);
}

/**
 * Favori şehri değiştirir.
 * @param {string} city - Şehir adı.
 */
function toggleFavorite(city) {
    favorites = favorites.includes(city) ? favorites.filter(fav => fav !== city) : [...favorites, city];
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    updateMainWeather(currentCity);
}

/**
 * Hava durumu verilerini paylaşır.
 * @param {string} platform - Platform (twitter, facebook, whatsapp, copy).
 */
function shareWeather(platform) {
    const data = cityData[currentCity];
    const text = `${currentCity} hava durumu: ${convertTemp(data.temp, currentUnit)}${UNIT_SYMBOLS[currentUnit]}, ${data.desc}`;
    const url = window.location.href;

    try {
        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(`${text} ${url}`).then(() => {
                    alert('Link kopyalandı!');
                }).catch(() => alert('Kopyalama başarısız.'));
                break;
        }
    } finally {
        const modal = document.getElementById('share-modal');
        if (modal) modal.classList.remove('active');
    }
}

/**
 * Otomatik yenileme zamanlayıcısını sıfırlar.
 */
function resetAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => switchCity(currentCity), AUTO_REFRESH_INTERVAL);
}

/**
 * Coğrafi konumu başlatır.
 */
function initGeolocation() {
    if (!navigator.geolocation) {
        alert('Konum özelliği desteklenmiyor.');
        switchCity(DEFAULT_CITY);
        return;
    }
    showLoading();
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const city = Object.entries(cityData).reduce((closest, [name, data]) => {
                if (!data.coords) return closest;
                const dist = Math.sqrt(
                    Math.pow(data.coords[0] - latitude, 2) + Math.pow(data.coords[1] - longitude, 2)
                );
                return dist < closest.dist ? { city: name, dist } : closest;
            }, { city: DEFAULT_CITY, dist: Infinity }).city;
            switchCity(city);
            hideLoading();
        },
        error => {
            console.error('Konum hatası:', error);
            alert('Konum alınamadı. İstanbul seçiliyor.');
            switchCity(DEFAULT_CITY);
            hideLoading();
        }
    );
}

/**
 * Uygulamayı başlatır ve olay dinleyicilerini kurar.
 */
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    updateMainWeather(currentCity);
    generateHourlyForecast();
    generateWeeklyForecast();
    generateCityCards();
    initMap();
    initCharts();
    resetAutoRefresh();

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => switchCity(currentCity));

    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) favoriteBtn.addEventListener('click', () => toggleFavorite(currentCity));

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.addEventListener('click', () => {
        const modal = document.getElementById('share-modal');
        if (modal) modal.classList.add('active');
    });

    const closeModal = document.querySelector('[data-action="close-modal"]');
    if (closeModal) closeModal.addEventListener('click', () => {
        const modal = document.getElementById('share-modal');
        if (modal) modal.classList.remove('active');
    });

    document.querySelectorAll('[data-action="share"]').forEach(btn => {
        btn.addEventListener('click', () => shareWeather(btn.dataset.platform));
    });

    const searchInput = document.getElementById('city-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(e => searchCity(e.target.value), 300));
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const query = searchInput.value;
                if (cityData[query]) switchCity(query);
            }
        });
    }

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.addEventListener('click', () => {
        const query = searchInput?.value;
        if (cityData[query]) switchCity(query);
    });

    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) locationBtn.addEventListener('click', initGeolocation);

    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleUnit(btn.dataset.unit));
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            generateCityCards(btn.dataset.filter);
        });
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            generateWeeklyForecast(btn.dataset.view);
        });
    });

    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.map-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            updateMapLayer(btn.dataset.layer);
        });
    });

    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.querySelectorAll('.chart-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            initCharts(btn.dataset.period || '7d', btn.dataset.type || 'daily');
        });
    });

    const toggleForecast = document.querySelector('[data-action="toggle-forecast"]');
    if (toggleForecast) toggleForecast.addEventListener('click', () => {
        const details = document.getElementById('hourly-details');
        if (details) {
            details.classList.toggle('hidden');
            const icon = toggleForecast.querySelector('i');
            if (icon) icon.className = details.classList.contains('hidden') ? 'fas fa-expand-alt' : 'fas fa-compress-alt';
            toggleForecast.setAttribute('aria-label', details.classList.contains('hidden') ? 'Saatlik tahmini genişlet' : 'Saatlik tahmini daralt');
        }
    });

    const newsletterSubscribe = document.getElementById('newsletter-subscribe');
    if (newsletterSubscribe) newsletterSubscribe.addEventListener('click', () => {
        const email = document.getElementById('newsletter-email')?.value;
        if (/^\S+@\S+\.\S+$/.test(email)) {
            alert(`Bültene abone oldunuz: ${email}`);
            const emailInput = document.getElementById('newsletter-email');
            if (emailInput) emailInput.value = '';
        } else {
            alert('Geçerli bir e-posta girin.');
        }
    });
});