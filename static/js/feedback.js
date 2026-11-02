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
		});
