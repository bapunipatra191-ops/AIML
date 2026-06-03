document.addEventListener('DOMContentLoaded', () => {
    // Initialise Lucide icons
    lucide.createIcons();

    // Tab Routing System
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const tabMetadata = {
        overview: { title: "Operations Control", subtitle: "Real-time deep learning analytics and cognitive automated management" },
        food: { title: "AI Menu Optimizer", subtitle: "Recalculate dish recommendation matching scores and predict order volume" },
        forecaster: { title: "ML Demand Forecaster", subtitle: "Train parametric regression models on historical restaurant variables" },
        nlp: { title: "NLP Sentiment Engine", subtitle: "Process customer text feedback, assess polarity, and map entity metrics" },
        vision: { title: "CV Kitchen Guard", subtitle: "Surveillance streams evaluated by convolutional neural networks for safety" },
        pricing: { title: "Dynamic Pricing Engine", subtitle: "Reinforcement Q-learning models optimizing hotel revenue limits" }
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Toggle active classes
            navButtons.forEach(b => b.classList.remove('active'));

            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabId}-panel`).classList.add('active');

            // Update Titles
            if (tabMetadata[tabId]) {
                pageTitle.textContent = tabMetadata[tabId].title;
                pageSubtitle.textContent = tabMetadata[tabId].subtitle;
            }

            // Trigger specific canvas redraws when switching tabs
            if (tabId === 'forecaster') {
                drawRegression();
            } else if (tabId === 'pricing') {
                drawPricingCurve();
            } else if (tabId === 'vision') {
                startCVStream();
            } else if (tabId === 'food') {
                renderFoodOptimizer();
            }
        });
    });

    // Neural Network Activity Feed (Overview Dashboard)
    const feedContainer = document.getElementById('activity-feed');
    const feedLogs = [
        { icon: "shield-alert", color: "green", text: "CV Kitchen Guard: Chef hairnet & mask compliance verified (Confidence 98.4%)" },
        { icon: "trending-up", color: "blue", text: "ML Forecaster: Base demand weights refreshed. Today's forecast: 184 bookings." },
        { icon: "banknote", color: "yellow", text: "Dynamic Pricing: Room rates adjusted (+14.2% demand surcharge applied for Monsoon Weekend)." },
        { icon: "message-square-code", color: "purple", text: "NLP Engine: Positive feedback captured from Room 304. Service score: +0.92." },
        { icon: "user-check", color: "green", text: "CV Lobby Stream: Self check-in kiosk crowd density verified as optimal." },
        { icon: "chef-hat", color: "blue", text: "AI Chef: Suggested menu rotation of Tandoori Platter based on rising search queries." }
    ];

    function createFeedItem(log) {
        const item = document.createElement('div');
        item.className = 'feed-item';

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

        item.innerHTML = `
            <div class="feed-item-icon ${log.color}">
                <i data-lucide="${log.icon}"></i>
            </div>
            <div class="feed-item-details">
                <p>${log.text}</p>
                <span class="time">${timeStr} - Threads ID: ${Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
        `;
        return item;
    }

    // Initialize Feed
    feedLogs.forEach(log => {
        feedContainer.appendChild(createFeedItem(log));
    });
    lucide.createIcons({ attrs: { "class": "logo-icon" } }); // re-initialize for dynamically added icons

    // Add random operational logs periodically
    setInterval(() => {
        const randomLog = feedLogs[Math.floor(Math.random() * feedLogs.length)];
        const item = createFeedItem(randomLog);
        feedContainer.insertBefore(item, feedContainer.firstChild);

        if (feedContainer.children.length > 25) {
            feedContainer.removeChild(feedContainer.lastChild);
        }

        // Reinitialize icon
        const iconElement = item.querySelector('[data-lucide]');
        if (iconElement) lucide.createIcons({ attrs: { "class": "logo-icon" } });

        // Update latency counter randomly
        document.getElementById('latency-val').textContent = `${Math.floor(Math.random() * 12 + 6)}ms`;
    }, 4500);

    // Resync Models Animation
    const resyncBtn = document.getElementById('reseed-btn');
    resyncBtn.addEventListener('click', () => {
        const icon = resyncBtn.querySelector('i');
        icon.classList.add('animate-spin');
        resyncBtn.querySelector('span').textContent = 'Syncing Neurons...';

        setTimeout(() => {
            icon.classList.remove('animate-spin');
            resyncBtn.querySelector('span').textContent = 'Re-Sync Models';
            alert("AI Inference cores recalibrated successfully. All active weights re-seeded.");
        }, 1200);
    });


    // ==========================================
    // MODULE 1: ML DEMAND FORECASTER (REGRESSION)
    // ==========================================
    const rfCanvas = document.getElementById('regression-canvas');
    const rfCtx = rfCanvas.getContext('2d');
    const btnTrain = document.getElementById('btn-train');
    const btnResetData = document.getElementById('btn-reset-data');
    const selectModel = document.getElementById('model-type');
    const sliderLR = document.getElementById('learning-rate');
    const lrVal = document.getElementById('lr-val');
    const sliderEpochs = document.getElementById('training-epochs');
    const epochsVal = document.getElementById('epochs-val');
    const forecasterLogs = document.getElementById('forecaster-logs');
    const trainingStatus = document.getElementById('training-status');
    const lossValEl = document.getElementById('loss-val');
    const r2ValEl = document.getElementById('r2-val');

    sliderLR.addEventListener('input', () => lrVal.textContent = sliderLR.value);
    sliderEpochs.addEventListener('input', () => epochsVal.textContent = sliderEpochs.value);

    // Data generation state
    let dataset = [];
    // Model Weights: representing weights for y = w0 + w1*x + w2*x^2 + w3*x^3
    let weights = [0, 0, 0, 0];
    let isTraining = false;

    // Canvas scaling helpers
    function resizeCanvas(canvas) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height || 300;
    }

    function generateDataset() {
        dataset = [];
        // Generate relationship between temperature (10°C to 40°C) and Orders (50 to 280)
        // Let's make it a nice curved relationship: peak demand at around 26°C
        for (let i = 0; i < 60; i++) {
            const temp = 10 + Math.random() * 30; // 10 to 40
            // Quadratic curve + noise
            const cleanOrders = 250 - 0.7 * Math.pow(temp - 25, 2);
            const noise = (Math.random() - 0.5) * 40;
            const orders = Math.max(20, Math.floor(cleanOrders + noise));

            dataset.push({ x: temp, y: orders });
        }
    }

    // Normalized training calculations
    // Normalize X to [0,1] and Y to [0,1] to prevent gradient explosion
    let xMin = 10, xMax = 40;
    let yMin = 0, yMax = 300;

    function getNormalizedData() {
        return dataset.map(d => ({
            x: (d.x - xMin) / (xMax - xMin),
            y: (d.y - yMin) / (yMax - yMin)
        }));
    }

    // Run prediction based on normalized x and current weights
    function predict(normX, modelType, w) {
        if (modelType === 'linear') {
            return w[0] + w[1] * normX;
        } else if (modelType === 'quadratic') {
            return w[0] + w[1] * normX + w[2] * Math.pow(normX, 2);
        } else { // cubic
            return w[0] + w[1] * normX + w[2] * Math.pow(normX, 2) + w[3] * Math.pow(normX, 3);
        }
    }

    // Draw the dataset and model fit
    function drawRegression() {
        resizeCanvas(rfCanvas);
        rfCtx.clearRect(0, 0, rfCanvas.width, rfCanvas.height);

        // Drawing configurations
        const padding = 45;
        const width = rfCanvas.width - padding * 2;
        const height = rfCanvas.height - padding * 2;

        // Draw grid lines
        rfCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        rfCtx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const x = padding + (width / 5) * i;
            const y = padding + (height / 5) * i;

            // Vertical lines
            rfCtx.beginPath();
            rfCtx.moveTo(x, padding);
            rfCtx.lineTo(x, padding + height);
            rfCtx.stroke();

            // Horizontal lines
            rfCtx.beginPath();
            rfCtx.moveTo(padding, y);
            rfCtx.lineTo(padding + width, y);
            rfCtx.stroke();
        }

        // Draw Axes Labels
        rfCtx.fillStyle = '#64748b';
        rfCtx.font = '10px JetBrains Mono';
        rfCtx.textAlign = 'center';
        rfCtx.fillText("Temperature (°C)", rfCanvas.width / 2, rfCanvas.height - 10);

        rfCtx.save();
        rfCtx.translate(15, rfCanvas.height / 2);
        rfCtx.rotate(-Math.PI / 2);
        rfCtx.fillText("Daily Restaurant Orders", 0, 0);
        rfCtx.restore();

        // Map domain to screen coordinate helpers
        function mapX(xVal) {
            return padding + ((xVal - xMin) / (xMax - xMin)) * width;
        }
        function mapY(yVal) {
            return padding + height - ((yVal - yMin) / (yMax - yMin)) * height;
        }

        // Draw Actual Data points (Cyan Dots)
        dataset.forEach(d => {
            rfCtx.beginPath();
            rfCtx.arc(mapX(d.x), mapY(d.y), 5, 0, Math.PI * 2);
            rfCtx.fillStyle = 'rgba(0, 242, 254, 0.8)';
            rfCtx.fill();
            rfCtx.lineWidth = 1;
            rfCtx.strokeStyle = '#00f2fe';
            rfCtx.stroke();
        });

        // Draw Fitting Line / Curve (Purple Curve)
        const modelType = selectModel.value;
        rfCtx.beginPath();
        rfCtx.strokeStyle = '#9d4edd';
        rfCtx.lineWidth = 3;

        let first = true;
        for (let screenX = padding; screenX <= padding + width; screenX++) {
            // Convert screen X to domain X
            const pct = (screenX - padding) / width;
            const normX = pct; // already normalized to [0,1]
            const normY = predict(normX, modelType, weights);

            // Map back to raw orders
            const rawY = normY * (yMax - yMin) + yMin;
            const screenY = mapY(rawY);

            if (screenX === padding) {
                rfCtx.moveTo(screenX, screenY);
            } else {
                rfCtx.lineTo(screenX, screenY);
            }
        }
        rfCtx.stroke();
    }

    // Train implementation using gradient descent
    async function trainModel() {
        if (isTraining) return;
        isTraining = true;

        trainingStatus.textContent = "Training";
        trainingStatus.className = "badge neon-yellow";

        const lr = parseFloat(sliderLR.value);
        const epochs = parseInt(sliderEpochs.value);
        const modelType = selectModel.value;
        const normData = getNormalizedData();
        const N = normData.length;

        // Initialize random weights
        weights = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];

        forecasterLogs.textContent = `Starting ${modelType} gradient descent training...\nLR: ${lr}, Epochs: ${epochs}\n`;

        for (let epoch = 1; epoch <= epochs; epoch++) {
            let totalLoss = 0;

            // Gradients for up to cubic regression weights
            let dw = [0, 0, 0, 0];

            normData.forEach(d => {
                const yHat = predict(d.x, modelType, weights);
                const error = yHat - d.y;
                totalLoss += Math.pow(error, 2);

                dw[0] += error;
                dw[1] += error * d.x;
                dw[2] += error * Math.pow(d.x, 2);
                dw[3] += error * Math.pow(d.x, 3);
            });

            // Mean Squared Error
            const loss = totalLoss / N;

            // Update weights
            weights[0] -= (2 / N) * dw[0] * lr;
            weights[1] -= (2 / N) * dw[1] * lr;
            weights[2] -= (2 / N) * dw[2] * lr;
            weights[3] -= (2 / N) * dw[3] * lr;

            // Compute R² Score
            let yMean = 0;
            normData.forEach(d => yMean += d.y);
            yMean /= N;

            let ssTot = 0, ssRes = 0;
            normData.forEach(d => {
                const yHat = predict(d.x, modelType, weights);
                ssTot += Math.pow(d.y - yMean, 2);
                ssRes += Math.pow(d.y - yHat, 2);
            });
            const r2 = 1 - (ssRes / ssTot);

            // Periodically log and draw fitting visualization
            if (epoch === 1 || epoch % 10 === 0 || epoch === epochs) {
                lossValEl.textContent = loss.toFixed(5);
                r2ValEl.textContent = r2.toFixed(3);

                forecasterLogs.textContent = `Epoch ${epoch}/${epochs} | Loss (MSE): ${loss.toFixed(6)} | R²: ${r2.toFixed(4)}\n`;
                forecasterLogs.scrollTop = forecasterLogs.scrollHeight;

                drawRegression();

                // Sleep for animation effect
                await new Promise(resolve => setTimeout(resolve, 20));
            }
        }

        isTraining = false;
        trainingStatus.textContent = "CONVERGED";
        trainingStatus.className = "badge neon-green";

        // Log finished weights
        forecasterLogs.textContent += `\nTraining Complete!\nFinal weights:\n`;
        weights.forEach((w, idx) => {
            forecasterLogs.textContent += ` w${idx} = ${w.toFixed(4)}\n`;
        });
        forecasterLogs.scrollTop = forecasterLogs.scrollHeight;

        // Update Overview Dashboard Forecast Metric based on dynamic weather
        document.getElementById('overview-predicted-orders').textContent = `${Math.floor(predict(0.5, modelType, weights) * 300)} orders`;
    }

    btnTrain.addEventListener('click', trainModel);
    btnResetData.addEventListener('click', () => {
        generateDataset();
        drawRegression();
        lossValEl.textContent = '--';
        r2ValEl.textContent = '--';
        forecasterLogs.textContent = 'Dataset refreshed. Ready to fit model.';
    });

    // Initialize Model
    generateDataset();
    window.addEventListener('resize', () => {
        if (document.getElementById('forecaster-panel').classList.contains('active')) {
            drawRegression();
        }
    });


    // ==========================================
    // MODULE 2: NLP SENTIMENT ENGINE
    // ==========================================
    const reviewInput = document.getElementById('review-input');
    const nlpPresets = document.querySelectorAll('.preset-btn');
    const sentimentFill = document.getElementById('sentiment-fill');
    const sentimentPercent = document.getElementById('sentiment-percent');
    const sentimentBadge = document.getElementById('sentiment-badge');
    const tokenCountEl = document.getElementById('token-count');
    const tokenWeightsEl = document.getElementById('token-weights');
    const entityTagsEl = document.getElementById('entity-tags');

    // Custom mini lexicon
    const sentimentLexicon = {
        // Positive words
        amazing: 4, delicious: 4, fantastic: 4, excellent: 4, outstanding: 4, great: 3, good: 2, nice: 2,
        friendly: 3, clean: 3, comfortable: 3, love: 3, perfect: 4, hot: 1, crisp: 2, prompt: 3, tasty: 3,
        creamy: 2, beautiful: 3, wonderful: 4, recommended: 3, serves: 1, super: 3,
        // Negative words
        bad: -3, dirty: -4, slow: -3, loud: -2, noisy: -3, cold: -2, terrible: -4, horrible: -4, disappointed: -4,
        stains: -3, average: -1, poor: -3, leaking: -3, delay: -3, delayed: -3, rude: -4, wait: -2, broken: -3,
        unclean: -3, dust: -2, smell: -2, smellly: -3
    };

    const stopWords = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'was', 'were', 'it', 'for', 'of', 'with', 'on', 'at', 'but', 'by']);

    const entityCatalog = {
        dish: ['biryani', 'roti', 'butter chicken', 'tandoori', 'paneer', 'soup', 'salad', 'dessert', 'food', 'chilli chicken', 'naan'],
        service: ['service', 'waiter', 'staff', 'manager', 'cleanliness', 'behavior', 'response', 'hospitality'],
        hotel: ['room', 'bed', 'bathroom', 'ac', 'air conditioner', 'sheet', 'pillow', 'reception', 'lobby', 'hotel', 'stay']
    };

    function analyzeText() {
        const text = reviewInput.value.toLowerCase();
        if (!text.trim()) {
            // Reset NLP
            sentimentFill.style.width = '50%';
            sentimentPercent.textContent = '50% Neutral';
            sentimentBadge.textContent = 'NEUTRAL';
            sentimentBadge.className = 'sentiment-badge neutral';
            tokenCountEl.textContent = '0 Words';
            tokenWeightsEl.innerHTML = '';
            entityTagsEl.innerHTML = '<div class="no-entities">No entities detected yet. Start typing a review above.</div>';
            return;
        }

        // Tokenize and clean
        const rawTokens = text.split(/[\s,.\/#!$%\^&\*;:{}=\-_`~()?]+/).filter(Boolean);
        const filteredTokens = rawTokens.filter(t => !stopWords.has(t));

        // Score sentiment
        let score = 0;
        let matchedCount = 0;

        tokenWeightsEl.innerHTML = '';

        rawTokens.forEach(token => {
            const normalizedToken = token.toLowerCase();
            const tokenWeight = sentimentLexicon[normalizedToken] || 0;
            score += tokenWeight;

            const wordEl = document.createElement('span');
            wordEl.textContent = token + ' ';
            wordEl.className = 'token-word ';

            if (tokenWeight > 0) {
                wordEl.className += 'pos-word';
                matchedCount++;
            } else if (tokenWeight < 0) {
                wordEl.className += 'neg-word';
                matchedCount++;
            } else {
                wordEl.className += 'neutral-word';
            }
            tokenWeightsEl.appendChild(wordEl);
        });

        tokenCountEl.textContent = `${rawTokens.length} Words`;

        // Normalize score between 0 and 100
        // Max weight range is roughly cap at +/- 10 for normal sentences
        const range = 8;
        let sentimentVal = 50 + (score / range) * 50; // map -range..range to 0..100
        sentimentVal = Math.max(0, Math.min(100, sentimentVal));

        sentimentFill.style.width = `${sentimentVal}%`;

        let label = 'NEUTRAL';
        let badgeClass = 'neutral';
        if (sentimentVal > 58) {
            label = 'POSITIVE';
            badgeClass = 'positive';
            sentimentPercent.textContent = `${Math.round(sentimentVal)}% Positive`;
        } else if (sentimentVal < 42) {
            label = 'NEGATIVE';
            badgeClass = 'negative';
            sentimentPercent.textContent = `${Math.round(100 - sentimentVal)}% Negative`;
        } else {
            sentimentPercent.textContent = '50% Neutral';
        }

        sentimentBadge.textContent = label;
        sentimentBadge.className = `sentiment-badge ${badgeClass}`;

        // Entity recognition (finding substrings matching our catalog)
        entityTagsEl.innerHTML = '';
        let entitiesFound = false;

        for (const [type, entities] of Object.entries(entityCatalog)) {
            entities.forEach(entity => {
                if (text.includes(entity)) {
                    entitiesFound = true;
                    const tag = document.createElement('div');
                    tag.className = `entity-tag ${type}`;

                    // Assign dummy model confidence based on length and match position
                    const conf = 85 + Math.floor(Math.random() * 14);

                    tag.innerHTML = `
                        ${entity.toUpperCase()}
                        <span>${type.toUpperCase()}</span>
                        <span>${conf}%</span>
                    `;
                    entityTagsEl.appendChild(tag);
                }
            });
        }

        if (!entitiesFound) {
            entityTagsEl.innerHTML = '<div class="no-entities">No specific entities matched.</div>';
        }
    }

    reviewInput.addEventListener('input', analyzeText);

    nlpPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            reviewInput.value = btn.getAttribute('data-text');
            analyzeText();
        });
    });


    // ==========================================
    // MODULE 3: CV SURVEILLANCE FEED SIMULATOR
    // ==========================================
    const cvCanvas = document.getElementById('cv-canvas');
    const cvCtx = cvCanvas.getContext('2d');
    const cvEventsContainer = document.getElementById('cv-events');
    const camButtons = document.querySelectorAll('.cam-btn');

    let currentCam = 'kitchen';
    let cvAnimId = null;

    // Simulated camera coordinates/state
    const entities = {
        kitchen: [
            { id: 1, name: "Chef_Bapun", type: "Person", x: 120, y: 150, targetX: 200, targetY: 150, status: "Normal", wear: ["Mask (98%)", "Hairnet (95%)"], activeTime: 0 },
            { id: 2, name: "Helper_Ramesh", type: "Person", x: 450, y: 220, targetX: 450, targetY: 280, status: "Normal", wear: ["Mask (94%)", "Hairnet (90%)"], activeTime: 0 },
            { id: 3, name: "Hygiene_Zone_Prep_Table", type: "Cleanliness", x: 280, y: 110, w: 120, h: 80, rating: "99.2%" },
            { id: 4, name: "Plated_Biryani", type: "Item", x: 300, y: 125, status: "Fresh" }
        ],
        dining: [
            { id: 1, name: "Table_12", type: "Table", x: 100, y: 100, w: 90, h: 90, status: "Occupied (4 pax)", color: "rgba(0, 242, 254, 0.3)" },
            { id: 2, name: "Table_14", type: "Table", x: 380, y: 120, w: 90, h: 90, status: "Empty", color: "rgba(57, 255, 20, 0.2)" },
            { id: 3, name: "Table_15", type: "Table", x: 240, y: 220, w: 100, h: 100, status: "Awaiting Service", color: "rgba(255, 215, 0, 0.3)" },
            { id: 4, name: "Waiter_Anil", type: "Person", x: 280, y: 150, targetX: 240, targetY: 200, status: "Serving" }
        ],
        reception: [
            { id: 1, name: "Receptionist_Priya", type: "Person", x: 280, y: 110, targetX: 280, targetY: 130, status: "Active" },
            { id: 2, name: "Guest_Kiosk_A", type: "Kiosk", x: 100, y: 220, status: "In Use" },
            { id: 3, name: "Guest_Kiosk_B", type: "Kiosk", x: 440, y: 220, status: "Idle" }
        ]
    };

    camButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            camButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCam = btn.getAttribute('data-cam');

            // Reset overlay header
            document.querySelector('.cam-id').textContent = `FEED: CAM_0${currentCam === 'kitchen' ? 1 : currentCam === 'dining' ? 2 : 3}_${currentCam.toUpperCase()}`;
        });
    });

    function addCVLog(label, confidence, isAlert = false) {
        const div = document.createElement('div');
        div.className = `cv-event ${isAlert ? 'alert' : ''}`;

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];

        div.innerHTML = `
            <span class="label">${label}</span>
            <span class="confidence">${confidence}</span>
            <span class="time">${timeStr}</span>
        `;

        cvEventsContainer.insertBefore(div, cvEventsContainer.firstChild);

        if (cvEventsContainer.children.length > 8) {
            cvEventsContainer.removeChild(cvEventsContainer.lastChild);
        }
    }

    // Initialize CV Logs
    addCVLog("CNN Engine Booted", "100.0% Conf");
    addCVLog("Static room models compiled", "99.4% Conf");

    // CV Animation Render Loop
    function startCVStream() {
        if (cvAnimId) cancelAnimationFrame(cvAnimId);

        let counter = 0;

        function renderFrame() {
            if (!document.getElementById('vision-panel').classList.contains('active')) return;

            resizeCanvas(cvCanvas);
            cvCtx.clearRect(0, 0, cvCanvas.width, cvCanvas.height);

            // Stylize CCTV camera grid
            cvCtx.strokeStyle = 'rgba(255,255,255,0.03)';
            cvCtx.lineWidth = 1;
            const gridSpacing = 30;
            for (let x = 0; x < cvCanvas.width; x += gridSpacing) {
                cvCtx.beginPath();
                cvCtx.moveTo(x, 0);
                cvCtx.lineTo(x, cvCanvas.height);
                cvCtx.stroke();
            }
            for (let y = 0; y < cvCanvas.height; y += gridSpacing) {
                cvCtx.beginPath();
                cvCtx.moveTo(0, y);
                cvCtx.lineTo(cvCanvas.width, y);
                cvCtx.stroke();
            }

            // Draw bounding boxes for current camera selection
            const scaleX = cvCanvas.width / 600;
            const scaleY = cvCanvas.height / 350;

            const camEntities = entities[currentCam];

            camEntities.forEach(ent => {
                // Smooth moving nodes
                if (ent.targetX !== undefined) {
                    ent.activeTime = (ent.activeTime || 0) + 0.01;
                    if (ent.activeTime > 1) {
                        ent.targetX = Math.floor(50 + Math.random() * 500);
                        ent.targetY = Math.floor(80 + Math.random() * 200);
                        ent.activeTime = 0;
                    }

                    // Simple linear interpolation
                    ent.x += (ent.targetX - ent.x) * 0.01;
                    ent.y += (ent.targetY - ent.y) * 0.01;
                }

                // Render bounding box
                const px = ent.x * scaleX;
                const py = ent.y * scaleY;

                cvCtx.lineWidth = 2;

                if (ent.type === 'Person') {
                    // Draw Person Rectangle
                    const w = 70 * scaleX;
                    const h = 120 * scaleY;

                    cvCtx.strokeStyle = '#00f2fe';
                    cvCtx.strokeRect(px - w / 2, py - h / 2, w, h);

                    // Draw label banner
                    cvCtx.fillStyle = 'rgba(0, 242, 254, 0.85)';
                    cvCtx.fillRect(px - w / 2 - 1, py - h / 2 - 18, w + 2, 18);

                    // Label Text
                    cvCtx.fillStyle = '#000';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} [99%]`, px - w / 2 + 5, py - h / 2 - 5);

                    // Render mini overlay compliance checks (hairnet & mask icons)
                    cvCtx.fillStyle = 'rgba(57, 255, 20, 0.8)';
                    ent.wear.forEach((wTag, idx) => {
                        cvCtx.font = '9px JetBrains Mono';
                        cvCtx.fillText(`✔ ${wTag}`, px - w / 2 + 4, py - h / 2 + 15 + idx * 12);
                    });
                }
                else if (ent.type === 'Cleanliness') {
                    const w = ent.w * scaleX;
                    const h = ent.h * scaleY;

                    cvCtx.strokeStyle = '#39ff14';
                    cvCtx.strokeRect(px, py, w, h);

                    cvCtx.fillStyle = 'rgba(57, 255, 20, 0.85)';
                    cvCtx.fillRect(px - 1, py - 18, w + 2, 18);

                    cvCtx.fillStyle = '#000';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} [Rating: ${ent.rating}]`, px + 5, py - 5);
                }
                else if (ent.type === 'Item') {
                    cvCtx.beginPath();
                    cvCtx.arc(px, py, 15, 0, Math.PI * 2);
                    cvCtx.strokeStyle = '#ffd700';
                    cvCtx.stroke();

                    cvCtx.fillStyle = '#ffd700';
                    cvCtx.font = '9px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} [${ent.status}]`, px - 35, py - 20);
                }
                else if (ent.type === 'Table') {
                    const w = ent.w * scaleX;
                    const h = ent.h * scaleY;

                    cvCtx.strokeStyle = ent.color.includes('57, 255, 20') ? '#39ff14' : ent.color.includes('0, 242, 254') ? '#00f2fe' : '#ffd700';
                    cvCtx.strokeRect(px, py, w, h);

                    cvCtx.fillStyle = ent.color;
                    cvCtx.fillRect(px, py, w, h);

                    cvCtx.fillStyle = '#fff';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name}: ${ent.status}`, px + 5, py + 15);
                }
                else if (ent.type === 'Kiosk') {
                    const w = 60 * scaleX;
                    const h = 80 * scaleY;

                    cvCtx.strokeStyle = ent.status === 'In Use' ? '#39ff14' : '#64748b';
                    cvCtx.strokeRect(px, py, w, h);

                    cvCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    cvCtx.fillRect(px, py, w, h);

                    cvCtx.fillStyle = ent.status === 'In Use' ? '#39ff14' : '#64748b';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} (${ent.status})`, px - 10, py - 8);
                }
            });

            // Randomly trigger mock events to build log output
            counter++;
            if (counter % 350 === 0) {
                const names = ["Chef_Bapun", "Helper_Ramesh", "Waiter_Anil", "Guest_Kiosk_A"];
                const acts = ["Hygienic prep verified", "Cleaning desk triggered", "Distancing metric reset", "Order placement recognized"];
                const confs = ["98.4%", "97.1%", "99.0%", "95.6%"];

                const randIdx = Math.floor(Math.random() * names.length);
                addCVLog(`${names[randIdx]}: ${acts[randIdx]}`, `${confs[randIdx]} Conf`);
            }

            cvAnimId = requestAnimationFrame(renderFrame);
        }

        renderFrame();
    }


    // ==========================================
    // MODULE 4: DYNAMIC PRICING ENGINE
    // ==========================================
    const dpBaseRate = document.getElementById('base-rate');
    const dpBaseRateVal = document.getElementById('base-rate-val');
    const dpOccupancy = document.getElementById('hotel-occupancy');
    const dpOccupancyVal = document.getElementById('occupancy-val');
    const dpDemand = document.getElementById('demand-factor');
    const dpDemandVal = document.getElementById('demand-val');
    const dpWeather = document.getElementById('weather-impact');
    const dpFinalPrice = document.getElementById('final-price');
    const dpReasoning = document.getElementById('pricing-reasoning');
    const bookingProbVal = document.getElementById('booking-prob-val');
    const yieldVal = document.getElementById('yield-val');
    const pricingCanvas = document.getElementById('pricing-canvas');
    const pricingCtx = pricingCanvas.getContext('2d');

    // UI Input updates
    dpBaseRate.addEventListener('input', () => {
        dpBaseRateVal.textContent = dpBaseRate.value;
        calculatePricing();
    });
    dpOccupancy.addEventListener('input', () => {
        dpOccupancyVal.textContent = `${dpOccupancy.value}%`;
        calculatePricing();
    });
    dpDemand.addEventListener('input', () => {
        const val = parseFloat(dpDemand.value);
        let label = "Normal";
        if (val < 0.8) label = "Subdued";
        else if (val > 1.8) label = "Surging";
        else if (val > 1.3) label = "Elevated";

        dpDemandVal.textContent = `${label} (${val}x)`;
        calculatePricing();
    });
    dpWeather.addEventListener('change', calculatePricing);

    function calculatePricing() {
        const base = parseFloat(dpBaseRate.value);
        const occupancy = parseFloat(dpOccupancy.value) / 100;
        const demand = parseFloat(dpDemand.value);
        const weather = dpWeather.value;

        // Pricing logic weights
        let weatherModifier = 1.0;
        let weatherText = "standard weather conditions";
        if (weather === 'monsoon') {
            weatherModifier = 1.15;
            weatherText = "+15% indoor monsoon demand premium";
        } else if (weather === 'festival') {
            weatherModifier = 1.40;
            weatherText = "+40% local seasonal holiday multiplier";
        } else if (weather === 'storm') {
            weatherModifier = 0.80;
            weatherText = "-20% weather hazard cancellation offset";
        }

        // Q-Learning algorithm simulation formula for rates
        // High occupancy drives prices up (scarcity pricing). Elevated competitor demand drives prices up.
        const scarcityMultiplier = 1 + (occupancy * 0.6);
        const price = base * scarcityMultiplier * demand * weatherModifier;

        // Output rate
        dpFinalPrice.textContent = price.toFixed(2);
        dpReasoning.textContent = `Optimized rate adjusted based on ${weatherText}, ${(occupancy * 100).toFixed(0)}% occupancy capacity, and a ${demand}x competitor volume factor.`;

        // Calculate booking probability (standard sigmoid elastic demand curve)
        // Prob = 1 / (1 + exp((Price - Target) / K))
        const targetPrice = base * 1.25;
        const k = base / 4; // sensitivity
        const prob = 1 / (1 + Math.exp((price - targetPrice) / k));
        bookingProbVal.textContent = `${Math.round(prob * 100)}%`;

        // Yield = current occupancy revenue + potential booking yield
        const roomsCount = 80;
        const occupiedCount = Math.round(occupancy * roomsCount);
        const dailyYield = Math.round((occupiedCount * price) + ((roomsCount - occupiedCount) * prob * price));
        yieldVal.textContent = `$${dailyYield.toLocaleString()}`;

        drawPricingCurve(price, targetPrice, k);
    }

    function drawPricingCurve(currentPrice = 120, target = 150, k = 30) {
        resizeCanvas(pricingCanvas);
        pricingCtx.clearRect(0, 0, pricingCanvas.width, pricingCanvas.height);

        const padding = 40;
        const width = pricingCanvas.width - padding * 2;
        const height = pricingCanvas.height - padding * 2;

        // Draw axes lines
        pricingCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        pricingCtx.lineWidth = 1;
        pricingCtx.beginPath();
        pricingCtx.moveTo(padding, padding);
        pricingCtx.lineTo(padding, padding + height);
        pricingCtx.lineTo(padding + width, padding + height);
        pricingCtx.stroke();

        // Labels
        pricingCtx.fillStyle = '#64748b';
        pricingCtx.font = '10px JetBrains Mono';
        pricingCtx.fillText("Room Rate ($)", pricingCanvas.width / 2, pricingCanvas.height - 8);

        pricingCtx.save();
        pricingCtx.translate(12, pricingCanvas.height / 2);
        pricingCtx.rotate(-Math.PI / 2);
        pricingCtx.fillText("Booking Prob (%)", 0, 0);
        pricingCtx.restore();

        // Draw elastic demand curve (Booking probability over prices from $20 to $400)
        pricingCtx.beginPath();
        pricingCtx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
        pricingCtx.lineWidth = 2;

        const minP = 30, maxP = 400;

        for (let screenX = padding; screenX <= padding + width; screenX++) {
            const pct = (screenX - padding) / width;
            const evalPrice = minP + pct * (maxP - minP);
            const prob = 1 / (1 + Math.exp((evalPrice - target) / k));
            const screenY = padding + height - prob * height;

            if (screenX === padding) {
                pricingCtx.moveTo(screenX, screenY);
            } else {
                pricingCtx.lineTo(screenX, screenY);
            }
        }
        pricingCtx.stroke();

        // Draw current price intersection dot (pulsing indicator)
        const curPct = (currentPrice - minP) / (maxP - minP);
        if (curPct >= 0 && curPct <= 1) {
            const curProb = 1 / (1 + Math.exp((currentPrice - target) / k));
            const dotX = padding + curPct * width;
            const dotY = padding + height - curProb * height;

            pricingCtx.beginPath();
            pricingCtx.arc(dotX, dotY, 7, 0, Math.PI * 2);
            pricingCtx.fillStyle = '#00f2fe';
            pricingCtx.fill();
            pricingCtx.lineWidth = 2;
            pricingCtx.strokeStyle = '#fff';
            pricingCtx.stroke();

            // Glow indicator ring
            pricingCtx.beginPath();
            pricingCtx.arc(dotX, dotY, 13, 0, Math.PI * 2);
            pricingCtx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
            pricingCtx.lineWidth = 1;
            pricingCtx.stroke();
        }
    }

    window.addEventListener('resize', () => {
        if (document.getElementById('pricing-panel').classList.contains('active')) {
            calculatePricing();
        }
    });

    // Default startup configurations
    calculatePricing();

    // ==========================================
    // MODULE 5: AI MENU OPTIMIZER
    // ==========================================
    const foodDatabase = [
        { id: "butter-chicken", name: "Butter Chicken", category: "non-veg", sub: "curry", price: 14.50, spice: 2, cal: 540, protein: 28, positiveSentiment: 92, predictedOrders: 48, status: "SURGING", icon: "pot" },
        { id: "chicken-biryani", name: "Chicken Biryani", category: "non-veg", sub: "rice", price: 16.00, spice: 4, cal: 680, protein: 32, positiveSentiment: 96, predictedOrders: 72, status: "PEAK", icon: "pot" },
        { id: "paneer-tikka", name: "Paneer Tikka", category: "veg", sub: "starter", price: 11.00, spice: 3, cal: 320, protein: 18, positiveSentiment: 88, predictedOrders: 25, status: "STABLE", icon: "utensils" },
        { id: "tandoori-roti", name: "Tandoori Roti", category: "veg", sub: "starter", price: 3.00, spice: 1, cal: 120, protein: 4, positiveSentiment: 95, predictedOrders: 110, status: "STABLE", icon: "salad" },
        { id: "chilli-chicken", name: "Chilli Chicken", category: "non-veg", sub: "starter", price: 12.50, spice: 5, cal: 420, protein: 22, positiveSentiment: 84, predictedOrders: 35, status: "STABLE", icon: "flame" },
        { id: "garlic-naan", name: "Garlic Naan", category: "veg", sub: "starter", price: 4.00, spice: 1, cal: 180, protein: 5, positiveSentiment: 91, predictedOrders: 85, status: "HIGH", icon: "salad" },
        { id: "gulab-jamun", name: "Gulab Jamun", category: "veg", sub: "dessert", price: 5.00, spice: 1, cal: 290, protein: 3, positiveSentiment: 98, predictedOrders: 60, status: "PEAK", icon: "ice-cream" },
        { id: "dal-makhani", name: "Dal Makhani", category: "veg", sub: "curry", price: 10.50, spice: 2, cal: 380, protein: 12, positiveSentiment: 89, predictedOrders: 40, status: "STABLE", icon: "pot" },
        { id: "tomato-soup", name: "Tomato Soup", category: "veg", sub: "starter", price: 7.00, spice: 2, cal: 110, protein: 2, positiveSentiment: 85, predictedOrders: 15, status: "SUBDUED", icon: "soup" }
    ];

    const foodGrid = document.getElementById('food-grid');
    const foodSearch = document.getElementById('food-search');
    const foodFilter = document.getElementById('food-filter');
    const prefSpice = document.getElementById('pref-spice');
    const prefSpiceVal = document.getElementById('pref-spice-val');
    const prefBudget = document.getElementById('pref-budget');
    const prefBudgetVal = document.getElementById('pref-budget-val');

    const weightSpicyBtn = document.getElementById('weight-spicy');
    const weightBudgetBtn = document.getElementById('weight-budget');
    const weightDessertBtn = document.getElementById('weight-dessert');

    const foodEmptyState = document.getElementById('selected-food-empty');
    const foodInfoState = document.getElementById('selected-food-info');

    // Selected food elements
    const foodDiagName = document.getElementById('food-diag-name');
    const foodDiagCategory = document.getElementById('food-diag-category');
    const foodDiagMatch = document.getElementById('food-diag-match');
    const foodDiagCost = document.getElementById('food-diag-cost');
    const foodDiagPredicted = document.getElementById('food-diag-predicted');
    const foodDiagStatusBadge = document.getElementById('food-diag-status-badge');
    const foodDiagCal = document.getElementById('food-diag-cal');
    const foodDiagCalFill = document.getElementById('food-diag-cal-fill');
    const foodDiagProtein = document.getElementById('food-diag-protein');
    const foodDiagProteinFill = document.getElementById('food-diag-protein-fill');
    const foodDiagSentimentFill = document.getElementById('food-diag-sentiment-fill');
    const foodDiagSentimentPercent = document.getElementById('food-diag-sentiment-percent');
    const foodDiagAvatar = document.getElementById('food-diag-avatar');

    let selectedFoodId = null;

    prefSpice.addEventListener('input', () => {
        prefSpiceVal.textContent = prefSpice.value;
        renderFoodOptimizer();
    });
    prefBudget.addEventListener('input', () => {
        prefBudgetVal.textContent = prefBudget.value;
        renderFoodOptimizer();
    });

    foodSearch.addEventListener('input', renderFoodOptimizer);
    foodFilter.addEventListener('change', renderFoodOptimizer);

    // Preset Weights Event Listeners
    weightSpicyBtn.addEventListener('click', () => {
        prefSpice.value = 5;
        prefSpiceVal.textContent = "5";
        prefBudget.value = 18;
        prefBudgetVal.textContent = "18";
        foodFilter.value = "all";
        renderFoodOptimizer();
    });

    weightBudgetBtn.addEventListener('click', () => {
        prefSpice.value = 2;
        prefSpiceVal.textContent = "2";
        prefBudget.value = 9;
        prefBudgetVal.textContent = "9";
        foodFilter.value = "all";
        renderFoodOptimizer();
    });

    weightDessertBtn.addEventListener('click', () => {
        prefSpice.value = 1;
        prefSpiceVal.textContent = "1";
        prefBudget.value = 12;
        prefBudgetVal.textContent = "12";
        foodFilter.value = "dessert";
        renderFoodOptimizer();
    });

    function calculateMatchScore(food, userSpice, userBudget) {
        // Spice Match Component
        const spiceDiff = Math.abs(food.spice - userSpice);
        const spiceScore = Math.max(0, 100 - (spiceDiff * 25));

        // Budget Match Component
        let budgetScore = 100;
        if (food.price > userBudget) {
            const overDraft = food.price - userBudget;
            budgetScore = Math.max(0, 100 - (overDraft * 20));
        } else {
            // Reward closer fits to budget
            budgetScore = 100 - ((userBudget - food.price) * 1.5);
            budgetScore = Math.max(70, budgetScore);
        }

        const match = Math.round((spiceScore * 0.55) + (budgetScore * 0.45));
        return Math.max(8, Math.min(100, match));
    }

    function selectFood(id) {
        selectedFoodId = id;
        
        // Find food in DB
        const food = foodDatabase.find(f => f.id === id);
        if (!food) return;

        // Render food diagnostic info
        foodEmptyState.classList.add('hidden');
        foodInfoState.classList.remove('hidden');

        // Update textual contents
        foodDiagName.textContent = food.name;
        foodDiagCategory.textContent = food.category.toUpperCase();
        foodDiagCategory.className = `badge ${food.category === 'veg' ? 'neon-green' : 'neon-blue'}`;
        foodDiagCost.textContent = `$${food.price.toFixed(2)}`;
        
        const spice = parseInt(prefSpice.value);
        const budget = parseInt(prefBudget.value);
        const match = calculateMatchScore(food, spice, budget);
        foodDiagMatch.textContent = `${match}%`;
        
        if (match > 75) {
            foodDiagMatch.className = "green-text";
        } else if (match > 45) {
            foodDiagMatch.className = "text-mono";
            foodDiagMatch.style.color = "var(--neon-yellow)";
        } else {
            foodDiagMatch.className = "text-mono";
            foodDiagMatch.style.color = "var(--neon-red)";
        }

        foodDiagPredicted.textContent = `${food.predictedOrders} Orders (${food.status === 'PEAK' || food.status === 'SURGING' ? 'High' : 'Normal'})`;
        foodDiagStatusBadge.textContent = food.status;
        foodDiagStatusBadge.className = `sentiment-badge ${food.status === 'PEAK' || food.status === 'SURGING' ? 'positive' : food.status === 'SUBDUED' ? 'negative' : 'neutral'}`;

        // Nutrition content bars
        foodDiagCal.textContent = `${food.cal} kcal`;
        // Map calorie relative progress bar: max scale ~800 kcal
        const calPct = Math.min(100, Math.round((food.cal / 800) * 100));
        foodDiagCalFill.style.width = `${calPct}%`;
        foodDiagCalFill.className = `progress-fill ${calPct > 75 ? 'yellow' : 'green'}`;

        foodDiagProtein.textContent = `${food.protein}g`;
        // Protein max scale ~40g
        const protPct = Math.min(100, Math.round((food.protein / 40) * 100));
        foodDiagProteinFill.style.width = `${protPct}%`;

        // Sentiment Fill
        foodDiagSentimentPercent.textContent = `${food.positiveSentiment}% Positive`;
        foodDiagSentimentFill.style.width = `${food.positiveSentiment}%`;

        // Avatar icon
        let lucideName = "soup";
        if (food.icon === 'pot') lucideName = "cooking-pot";
        else if (food.icon === 'salad') lucideName = "salad";
        else if (food.icon === 'flame') lucideName = "flame";
        else if (food.icon === 'ice-cream') lucideName = "ice-cream";

        foodDiagAvatar.innerHTML = `<i data-lucide="${lucideName}"></i>`;
        lucide.createIcons();

        // Highlight selected card class
        const cards = document.querySelectorAll('.food-item-card');
        cards.forEach(card => {
            if (card.getAttribute('data-id') === id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    function renderFoodOptimizer() {
        foodGrid.innerHTML = '';
        
        const searchVal = foodSearch.value.toLowerCase().trim();
        const categoryVal = foodFilter.value;
        const spice = parseInt(prefSpice.value);
        const budget = parseInt(prefBudget.value);

        // Step 1: Filter and compute match score on-the-fly
        let list = foodDatabase.map(food => {
            return {
                ...food,
                match: calculateMatchScore(food, spice, budget)
            };
        });

        // Filter search term
        if (searchVal) {
            list = list.filter(f => f.name.toLowerCase().includes(searchVal));
        }

        // Filter category dropdown
        if (categoryVal !== 'all') {
            if (categoryVal === 'starter') {
                list = list.filter(f => f.sub === 'starter' || f.sub === 'bread' || f.sub === 'rice');
            } else {
                list = list.filter(f => f.category === categoryVal);
            }
        }

        // Step 2: Sort by Match score descending
        list.sort((a, b) => b.match - a.match);

        // Step 3: Render card elements
        if (list.length === 0) {
            foodGrid.innerHTML = '<div class="no-entities">No dishes matched current filters.</div>';
            return;
        }

        list.forEach(food => {
            const card = document.createElement('div');
            card.className = `food-item-card ${selectedFoodId === food.id ? 'selected' : ''}`;
            card.setAttribute('data-id', food.id);

            card.innerHTML = `
                <div>
                    <h4>${food.name}</h4>
                    <div class="food-meta">
                        <span>${food.category === 'veg' ? 'Veg' : 'Non-Veg'}</span>
                        <span class="cost">$${food.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="food-match-score">${food.match}% Match</div>
            `;

            card.addEventListener('click', () => {
                selectFood(food.id);
            });

            foodGrid.appendChild(card);
        });

        // If previously selected item is still in list, re-select to refresh matching scores
        if (selectedFoodId && list.some(f => f.id === selectedFoodId)) {
            selectFood(selectedFoodId);
        } else if (list.length > 0 && !selectedFoodId) {
            // Auto-select first item
            selectFood(list[0].id);
        }
    }

    // Trigger initial render
    renderFoodOptimizer();
});
