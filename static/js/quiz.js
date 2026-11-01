        let resultComments = {
            100: '🎉 パーフェクト！素晴らしい知識です！',
            90: '🌟 優秀！かなりの実力をお持ちですね！',
            80: '👍 良くできました！基礎はしっかりしています！',
            70: '📚 もう少し！復習して再挑戦しましょう！',
            60: '💪 基本から見直して頑張りましょう！',
            0: '🔥 諦めずに学習を続けましょう！必ず上達します！',
        };
        let questions = [];
        let currentQuestionIndex = 0;
        let score = 0;
        let selectedAnswer = null;
        let quizType = '';

        function getResultComment(score, total) {
            const percentage = (score / total) * 100;
            if (percentage >= 100) return resultComments[100];
            if (percentage >= 90) return resultComments[90];
            if (percentage >= 80) return resultComments[80];
            if (percentage >= 70) return resultComments[70];
            if (percentage >= 60) return resultComments[60];
            return resultComments[0];
        }

        async function startQuiz(type) {
            quizType = type;
            const url = type === 'ARE' ? 'static/ARE.json' : type === 'story' ? 'static/story.json' : 'static/管理者.json';
            try {
                const response = await fetch(url);
                const data = await response.json();
                questions = getRandomQuestions(data, 40);
                currentQuestionIndex = 0;
                score = 0;
                document.getElementById('quiz-selection').style.display = 'none';
                document.getElementById('quiz-area').style.display = 'block';
                document.getElementById('quiz-result').style.display = 'none';
                showQuestion();
            } catch (error) {
                alert('クイズデータの読み込みに失敗しました。');
            }
        }

        function getRandomQuestions(data, count) {
            const shuffled = data.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }

        function showQuestion() {
            const question = questions[currentQuestionIndex];
            document.getElementById('quiz-progress').textContent = `${currentQuestionIndex + 1} / 40`;
            document.getElementById('quiz-question').innerHTML = `
                <div class="question">${question.question}</div>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option" onclick="selectAnswer(${index})">${option}</div>
                    `).join('')}
                </div>
                <div id="quiz-explanation" class="quiz-explanation" style="display:none;"></div>
            `;
            selectedAnswer = null;
            document.getElementById('next-btn').style.display = 'none';
        }

        function selectAnswer(index) {
            selectedAnswer = index;
            const question = questions[currentQuestionIndex];
            const options = document.querySelectorAll('.quiz-option');
            const isCorrect = question.options[index] === question.answer;
            if (isCorrect) score++;
            options.forEach((opt, i) => {
                opt.classList.remove('selected');
                const isThisCorrect = question.options[i] === question.answer;
                if (isThisCorrect) {
                    opt.classList.add('correct');
                    opt.innerHTML = `${question.options[i]} <span style="color:black;font-weight:bold;">(正解)</span>`;
                } else if (i === index && !isCorrect) {
                    opt.classList.add('incorrect');
                    opt.innerHTML = `${question.options[i]} <span style="color:black;font-weight:bold;">(不正解)</span>`;
                } else {
                    opt.innerHTML = question.options[i];
                }
                opt.onclick = null; // 選択後クリック無効
            });
            const explanationDiv = document.getElementById('quiz-explanation');
            explanationDiv.textContent = question.explanation || '解説なし';
            explanationDiv.style.display = 'block';
            document.getElementById('next-btn').style.display = 'block';
        }

        function nextQuestion() {
            if (selectedAnswer !== null) {
                currentQuestionIndex++;
                if (currentQuestionIndex < questions.length) {
                    showQuestion();
                } else {
                    showResult();
                }
            }
        }

        function showResult() {
            document.getElementById('quiz-area').style.display = 'none';
            document.getElementById('quiz-result').style.display = 'block';
            const comment = getResultComment(score, 40);
            document.getElementById('result-text').innerHTML = `正解数: ${score} / 40<br>${comment}`;
        }

        function retireQuiz() {
            document.getElementById('quiz-area').style.display = 'none';
            document.getElementById('quiz-result').style.display = 'block';
            const comment = getResultComment(score, currentQuestionIndex);
            document.getElementById('result-text').innerHTML = `リタイアしました。正解数: ${score} / ${currentQuestionIndex}<br>${comment}`;
        }

        function restartQuiz() {
            startQuiz(quizType);
        }

        function backToSelection() {
            document.getElementById('quiz-result').style.display = 'none';
            document.getElementById('quiz-selection').style.display = 'block';
        }
    

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
	
