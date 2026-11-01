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

			// 物語読書ポイント付与
			if (typeof pointsManager !== 'undefined') {
				// ページに30秒以上滞在したらポイント付与
				setTimeout(() => {
					const storyKey = 'story_read_' + window.location.pathname;
					if (!localStorage.getItem(storyKey)) {
						pointsManager.onStoryRead();
						localStorage.setItem(storyKey, 'true');
					}
				}, 30000);

				// 外部リンククリックでボーナス
				const externalLinks = document.querySelectorAll('a[target="_blank"]');
				externalLinks.forEach(link => {
					link.addEventListener('click', () => {
						const linkKey = 'story_link_' + link.href;
						if (!localStorage.getItem(linkKey)) {
							pointsManager.onStoryLinkClick(link.href);
							localStorage.setItem(linkKey, 'true');
						}
					});
				});
			}
		});
	
