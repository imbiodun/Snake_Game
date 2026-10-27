        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        const scoreTag = document.getElementById("score");
        const gameOverPanel = document.getElementById("gameOverPanel");
        const pausePanel = document.getElementById("pausePanel");
        const finalScore = document.getElementById("finalScore");
        const restartButton = document.getElementById("restartButton");
        const resumeButton = document.getElementById("resumeButton");
        const highScoreTag = document.getElementById("highScore");
        const gridSize = 20;
        const tileCount = canvas.width / gridSize;
        const startingSpeed = 150;
        const speedStep = 3;
        const speedDecrease = 12;
        const minimumSpeed = 60;
        const highScoreKey = "snake-high-score";
        const difficultyColors = [
            { body: "#A8CBB7", shadow: "#759C86", head: "#D8E9DC", food: "#E8B4A8" },
            { body: "#9DC8B4", shadow: "#63947D", head: "#D2E8DA", food: "#E5B49D" },
            { body: "#91C2B2", shadow: "#4F806D", head: "#CBE2D4", food: "#DFA989" },
            { body: "#84B6AD", shadow: "#3D6D62", head: "#C4DCD2", food: "#D69C7F" }
        ];
        const difficultyThresholds = [10, 15, 20, 25];
        const startingSnake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        let snake = [];
        let food;
        let score = 0;
        let highScore = Number(localStorage.getItem(highScoreKey)) || 0;
        let gameOver = false;
        let isPaused = false;
        let direction = { x: 1, y: 0 };
        let nextDirection = { x: 1, y: 0 };
        let gameInterval;

        function randomCell(tiles) {
            return Math.floor(Math.random() * tiles);
        }

        function getDifficulty() {
            let difficulty = 0;

            difficultyThresholds.forEach((threshold, index) => {
                if (score >= threshold) {
                    difficulty = index + 1;
                }
            });

            return Math.min(difficulty, difficultyColors.length - 1);
        }

        function getGameSpeed() {
            const speedLevel = Math.floor(score / speedStep);
            return Math.max(
                startingSpeed - speedLevel * speedDecrease,
                minimumSpeed
            );
        }

        function getColors() {
            return difficultyColors[getDifficulty()];
        }

        function updateScore() {
            if (score > highScore) {
                highScore = score;
                localStorage.setItem(highScoreKey, highScore);
            }

            scoreTag.textContent = score;
            highScoreTag.textContent = highScore;
        }

        function drawGame() {
            const colors = getColors();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
            ctx.lineWidth = 1;

            for (let cell = 1; cell < tileCount; cell += 1) {
                const position = cell * gridSize;
                ctx.beginPath();
                ctx.moveTo(position, 0);
                ctx.lineTo(position, canvas.height);
                ctx.moveTo(0, position);
                ctx.lineTo(canvas.width, position);
                ctx.stroke();
            }

            ctx.fillStyle = colors.food;
            ctx.beginPath();
            ctx.arc(
                food.x * gridSize + gridSize / 2,
                food.y * gridSize + gridSize / 2,
                gridSize * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.strokeStyle = colors.shadow;
            ctx.lineWidth = gridSize * 0.68;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            snake.slice().reverse().forEach((segment, index) => {
                const centerX = segment.x * gridSize + gridSize / 2;
                const centerY = segment.y * gridSize + gridSize / 2;
                if (index === 0) {
                    ctx.moveTo(centerX, centerY);
                } else {
                    ctx.lineTo(centerX, centerY);
                }
            });
            ctx.stroke();

            snake.slice().reverse().forEach((segment, index) => {
                const isHead = index === snake.length - 1;
                const padding = isHead ? 1 : 3;
                const size = gridSize - padding * 2;
                const x = segment.x * gridSize + padding;
                const y = segment.y * gridSize + padding;

                ctx.fillStyle = isHead ? colors.head : colors.body;
                ctx.beginPath();
                ctx.roundRect(x, y, size, size, isHead ? 8 : 6);
                ctx.fill();
            });

            const head = snake[0];
            const headX = head.x * gridSize + gridSize / 2;
            const headY = head.y * gridSize + gridSize / 2;
            const eyeX = headX + direction.x * gridSize * 0.2;
            const eyeY = headY + direction.y * gridSize * 0.2;
            const perpendicular = { x: -direction.y, y: direction.x };

            ctx.fillStyle = colors.shadow;
            [ -1, 1 ].forEach(side => {
                ctx.beginPath();
                ctx.arc(
                    eyeX + side * perpendicular.x * gridSize * 0.2,
                    eyeY + side * perpendicular.y * gridSize * 0.2,
                    gridSize * 0.07,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            });
        }

        function hasHitWall(head) {
            return (
                head.x < 0 ||
                head.x >= tileCount ||
                head.y < 0 ||
                head.y >= tileCount
            );
        }

        function hitsSelf(head) {
            return snake.some(segment =>
                segment.x === head.x && segment.y === head.y
            );
        }

        function eatFood(head) {
            return head.x === food.x && head.y === food.y;
        }

        function showGameOver() {
            finalScore.textContent = `Your score was ${score} · Best: ${highScore}`;
            gameOverPanel.classList.add("visible");
            pausePanel.classList.remove("visible");
        }

        function setPaused(paused) {
            isPaused = paused;

            if (isPaused) {
                clearInterval(gameInterval);
                pausePanel.classList.add("visible");
            } else {
                pausePanel.classList.remove("visible");
                gameInterval = setInterval(gameStep, getGameSpeed());
            }
        }

        function resetGame() {
            clearInterval(gameInterval);
            snake = startingSnake.map(segment => ({ ...segment }));
            food = { x: 15, y: 15 };
            score = 0;
            direction = { x: 1, y: 0 };
            nextDirection = { x: 1, y: 0 };
            gameOver = false;
            isPaused = false;
            gameOverPanel.classList.remove("visible");
            pausePanel.classList.remove("visible");
            updateScore();
            drawGame();
            gameInterval = setInterval(gameStep, getGameSpeed());
        }

        function gameStep() {
            direction = nextDirection;
            const newHead = {
                x: snake[0].x + direction.x,
                y: snake[0].y + direction.y
            };

            if (hasHitWall(newHead) || hitsSelf(newHead)) {
                clearInterval(gameInterval);
                gameOver = true;
                showGameOver();
                return;
            }

            snake.unshift(newHead);
            if (eatFood(newHead)) {
                score += 1;
                updateScore();
                clearInterval(gameInterval);
                gameInterval = setInterval(gameStep, getGameSpeed());
                let newX = randomCell(tileCount);
                let newY = randomCell(tileCount);
                while (hitsSelf({ x: newX, y: newY })) {
                    newX = randomCell(tileCount);
                    newY = randomCell(tileCount);
                }
                food = { x: newX, y: newY };
            } else {
                snake.pop();
            }

            drawGame();
        }

        restartButton.addEventListener("click", resetGame);
        resumeButton.addEventListener("click", () => setPaused(false));
        resetGame();

        window.addEventListener("keydown", event => {
            if (event.key.startsWith("Arrow")) {
                event.preventDefault();
            }

            switch (event.key) {
                case "ArrowUp":
                case "W":
                case "w":
                    if (direction.y === 0) nextDirection = { x: 0, y: -1 };
                    break;
                case "ArrowDown":
                case "S":
                case "s":
                    if (direction.y === 0) nextDirection = { x: 0, y: 1 };
                    break;
                case "ArrowLeft":
                case "A":
                case "a":
                    if (direction.x === 0) nextDirection = { x: -1, y: 0 };
                    break;
                case "ArrowRight":
                case "D":
                case "d":
                    if (direction.x === 0) nextDirection = { x: 1, y: 0 };
                    break;
                case "Enter":
                    if (gameOver) resetGame();
                    break;
                case " ":
                case "Spacebar":
                    event.preventDefault();
                    if (!gameOver) {
                        setPaused(!isPaused);
                    }
                    break;
            }
        });
