const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
        const UPDATE_INTERVAL_MS = 30 * 60 * 1000;
        
        const forecastContainer = document.getElementById('forecast-container');
        const hourlyContainer = document.getElementById('hourly-forecast-container');
        const publishingOfficeElem = document.getElementById('publishing-office');
        const reportTimeElem = document.getElementById('report-time');

        function renderDailyForecast(forecasts) {
            forecastContainer.innerHTML = '';
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentHour = now.getHours();

            forecasts.slice(0, 3).forEach((forecast, index) => {
                const card = document.createElement('div');
                card.className = 'forecast-card';
                if (forecast.date === todayStr) {
                    card.classList.add('current-date');
                }

                let dateLabel = new Date(forecast.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
                if (index === 0) dateLabel += " (今日)";
                if (index === 1) dateLabel += " (明日)";
                
                let rainGridHTML = '<div class="rain-chance-grid">';
                const timeSlots = [
                    { label: "0-6時", endHour: 6, value: forecast.chance_of_rain[0] },
                    { label: "6-12時", endHour: 12, value: forecast.chance_of_rain[1] },
                    { label: "12-18時", endHour: 18, value: forecast.chance_of_rain[2] },
                    { label: "18-24時", endHour: 24, value: forecast.chance_of_rain[3] }
                ];

                let currentSlotFound = false;
                timeSlots.forEach(slot => {
                    let labelClass = 'rain-chance-label';
                    
                    if (forecast.date === todayStr) {
                        if (currentHour >= slot.endHour) {
                            return;
                        }
                        if (!currentSlotFound && currentHour < slot.endHour) {
                            labelClass += ' current-hour-highlight';
                            currentSlotFound = true;
                        }
                    }
                    
                    rainGridHTML += `
                        <div class="${labelClass}">${slot.label}</div>
                        <div>${slot.value}%</div>
                    `;
                });
                rainGridHTML += '</div>';

                card.innerHTML = `
                    <h2>${dateLabel}</h2>
                    <div class="weather">${esc(forecast.weather)}</div>
                    <div class="temps">
                        <span class="temp-max">${forecast.temp_max}°C</span> / <span class="temp-min">${forecast.temp_min}°C</span>
                    </div>
                    <strong>降水確率</strong>
                    ${rainGridHTML}
                `;
                forecastContainer.appendChild(card);
            });
        }

        function renderHourlyForecast(hourlyForecasts) {
            hourlyContainer.innerHTML = '';
            const now = new Date();
            
            const upcomingHourly = hourlyForecasts.filter(hour => new Date(hour.iso_time) >= now);

            let lastDate = null;
            upcomingHourly.forEach((hour, index) => {
                const hourDateObj = new Date(hour.iso_time);
                const hourDateStr = hourDateObj.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });

                if (hourDateStr !== lastDate) {
                    const dateSeparator = document.createElement('div');
                    dateSeparator.className = 'hourly-date-separator';
                    dateSeparator.textContent = hourDateStr;
                    hourlyContainer.appendChild(dateSeparator);
                    lastDate = hourDateStr;
                }

                const card = document.createElement('div');
                card.className = 'hourly-card';
                
                if (index === 0) {
                    card.classList.add('current-hour-highlight');
                }

                card.innerHTML = `
                    <div class="hourly-time">${hour.time}</div>
                    <div class="hourly-weather">${esc(hour.weather)}</div>
                    <div class="hourly-temp">${hour.temp}°C</div>
                    <div class="hourly-precip">${hour.precip}mm</div>
                `;
                hourlyContainer.appendChild(card);
            });
        }

        async function fetchAndUpdateWeather() {
            try {
                const row = await Study.siteData('weather');
                const response = { ok: true, status: 200, json: async () => row.payload };
                if (!response.ok) throw new Error(`データ取得エラー (HTTP ${response.status})`);
                
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                publishingOfficeElem.textContent = data.publishingOffice;
                reportTimeElem.textContent = new Date(data.reportDatetime).toLocaleString('ja-JP');
                
                renderDailyForecast(data.forecasts);
                renderHourlyForecast(data.hourly_forecast);

            } catch (error) {
                const needLogin = /ログインが必要/.test(error.message || '');   // ログイン画面をなくしたため、ログインなしでは読めない（取得のしくみを作り直し中）
                const errorMessage = needLogin
                    ? `<div class="message-box" style="width: 100%;"><p><strong>天気情報は、いま準備中です。</strong></p><p>しばらくしてからもう一度ひらいてください。</p></div>`
                    : `<div class="message-box error" style="width: 100%;"><p><strong>天気情報の取得に失敗しました。</strong></p><p><small>${esc(error.message)}</small></p></div>`;
                forecastContainer.innerHTML = errorMessage;
                hourlyContainer.innerHTML = errorMessage;
            }
        }

        fetchAndUpdateWeather();
        setInterval(fetchAndUpdateWeather, UPDATE_INTERVAL_MS);

// LocalStorageの古いデータをクリーンアップ(6時間以上経過したデータを削除)
		function cleanupOldWeatherData() {
			try {
				const DATA_RETENTION_HOURS = 6;
				const lastCheck = localStorage.getItem('lastWeatherCheck');
				
				if (lastCheck) {
					const checkDate = new Date(lastCheck);
					const now = new Date();
					const hoursDiff = (now - checkDate) / (1000 * 60 * 60);
					
					if (hoursDiff > DATA_RETENTION_HOURS) {
						localStorage.removeItem('lastWeatherCheck');
						console.log(`古い天気データを削除しました (${hoursDiff.toFixed(1)}時間経過)`);
					}
				}
			} catch (error) {
				console.error('データクリーンアップエラー:', error);
			}
		}
		
		// ページ読み込み時にクリーンアップ実行
		cleanupOldWeatherData();
		
		// ハンバーガーメニュー機能
		document.addEventListener('DOMContentLoaded', () => {
			const hamburgerButton = document.getElementById('hamburger-menu-btn');
			const toc = document.getElementById('table-of-contents');

			if (hamburgerButton && toc) {
				hamburgerButton.addEventListener('click', e => {
					e.stopPropagation();
					toc.classList.toggle('open');
				});
				document.body.addEventListener('click', e => {
					if (toc.classList.contains('open') && !toc.contains(e.target) && e.target !== hamburgerButton) {
						toc.classList.remove('open');
					}
				});
			}

			// 天気情報確認ポイント付与（1日1回）
			if (typeof pointsManager !== 'undefined') {
				const today = new Date().toDateString();
				const lastWeatherCheck = localStorage.getItem('lastWeatherCheck');
				
				if (lastWeatherCheck !== today) {
					setTimeout(() => {
						pointsManager.onWeatherCheck();
						localStorage.setItem('lastWeatherCheck', today);
					}, 5000); // 5秒間ページに滞在でポイント付与
				}
			}
		});
