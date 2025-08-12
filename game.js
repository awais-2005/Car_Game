class CarDodgeGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.gameState = "menu" // menu, playing, paused, gameOver

    // Game settings
    this.lanes = 3
    this.difficulty = "medium"
    this.laneWidth = 0
    this.roadWidth = 0
    this.roadHeight = 0

    // Game variables
    this.score = 0
    this.flyPower = 0
    this.playerLane = 1
    this.targetPlayerLane = 1
    this.playerLaneOffset = 0
    this.laneTransitionSpeed = 0.15
    this.playerY = 0
    this.isFlying = false
    this.flyingTime = 0
    this.gameSpeed = 2
    this.baseSpeed = 2
    this.playerSpeed = 1
    this.speedIncreaseTimer = 0
    this.gameTime = 0

    // Arrays for game objects
    this.enemyCars = []
    this.roadLines = []

    // Touch/swipe handling
    this.touchStartX = 0
    this.touchStartY = 0
    this.touchEndX = 0
    this.touchEndY = 0

    // Timing
    this.lastTime = 0
    this.carSpawnTimer = 0
    this.carSpawnInterval = 2000 // milliseconds

    // Car types with SVG paths
    this.carTypes = [
      { color: "#ff6b6b", type: "sedan" },
      { color: "#4ecdc4", type: "suv" },
      { color: "#45b7d1", type: "truck" },
      { color: "#96ceb4", type: "sports" },
      { color: "#feca57", type: "van" },
      { color: "#ff9ff3", type: "compact" },
    ]

    this.init()
  }

  init() {
    this.setupCanvas()
    this.setupEventListeners()
    this.setupTouchControls()
    this.showScreen("mainMenu")
  }

  setupCanvas() {
    const container = document.getElementById("gameContainer")
    const maxWidth = Math.min(window.innerWidth - 40, 400)
    const maxHeight = Math.min(window.innerHeight - 100, 600)

    this.canvas.width = maxWidth
    this.canvas.height = maxHeight
    this.roadWidth = maxWidth
    this.roadHeight = maxHeight

    this.updateLaneSettings()
  }

  updateLaneSettings() {
    this.laneWidth = this.roadWidth / this.lanes
    this.playerY = this.roadHeight - 80
  }

  setupEventListeners() {
    document.getElementById("startGame").addEventListener("click", () => this.startGame())
    document.getElementById("pauseBtn").addEventListener("click", () => this.pauseGame())
    document.getElementById("resumeBtn").addEventListener("click", () => this.resumeGame())
    document.getElementById("mainMenuBtn").addEventListener("click", () => this.showMainMenu())
    document.getElementById("playAgainBtn").addEventListener("click", () => this.startGame())
    document.getElementById("backToMenuBtn").addEventListener("click", () => this.showMainMenu())

    document.getElementById("laneSelect").addEventListener("change", (e) => {
      this.lanes = Number.parseInt(e.target.value)
      this.updateLaneSettings()
    })

    document.getElementById("difficultySelect").addEventListener("change", (e) => {
      this.difficulty = e.target.value
    })

    // Keyboard controls for desktop
    document.addEventListener("keydown", (e) => {
      if (this.gameState === "playing") {
        switch (e.key) {
          case "ArrowLeft":
            this.moveLeft()
            break
          case "ArrowRight":
            this.moveRight()
            break
          case "ArrowUp":
          case " ":
            if (this.flyPower > 0 && !this.isFlying) {
              this.flyPower--
              this.isFlying = true
              this.flyingTime = 1000 // 1 second of flying
              document.getElementById("flyPower").textContent = this.flyPower
            }
            break
          case "Escape":
            this.pauseGame()
            break
        }
      }
    })
  }

  setupTouchControls() {
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.touchStartX = touch.clientX
      this.touchStartY = touch.clientY
    })

    this.canvas.addEventListener("touchend", (e) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      this.touchEndX = touch.clientX
      this.touchEndY = touch.clientY
      this.handleSwipe()
    })

    // Mouse controls for desktop
    this.canvas.addEventListener("mousedown", (e) => {
      this.touchStartX = e.clientX
      this.touchStartY = e.clientY
    })

    this.canvas.addEventListener("mouseup", (e) => {
      this.touchEndX = e.clientX
      this.touchEndY = e.clientY
      this.handleSwipe()
    })
  }

  handleSwipe() {
    if (this.gameState !== "playing") return

    const deltaX = this.touchEndX - this.touchStartX
    const deltaY = this.touchEndY - this.touchStartY
    const minSwipeDistance = 30

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          this.moveRight()
        } else {
          this.moveLeft()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance && deltaY < 0) {
        if (this.flyPower > 0 && !this.isFlying) {
          this.flyPower--
          this.isFlying = true
          this.flyingTime = 1000 // 1 second of flying
          document.getElementById("flyPower").textContent = this.flyPower
        }
      }
    }
  }

  moveLeft() {
    if (this.targetPlayerLane > 0) {
      this.targetPlayerLane--
    }
  }

  moveRight() {
    if (this.targetPlayerLane < this.lanes - 1) {
      this.targetPlayerLane++
    }
  }

  startGame() {
    this.lanes = Number.parseInt(document.getElementById("laneSelect").value)
    this.difficulty = document.getElementById("difficultySelect").value

    this.resetGame()
    this.updateLaneSettings()
    this.gameState = "playing"
    this.showScreen("gameScreen")
    this.gameLoop()
  }

  resetGame() {
    this.score = 0
    this.flyPower = 0
    this.playerLane = Math.floor(this.lanes / 2)
    this.targetPlayerLane = this.playerLane
    this.playerLaneOffset = 0
    this.isFlying = false
    this.flyingTime = 0
    this.enemyCars = []
    this.roadLines = []
    this.carSpawnTimer = 0
    this.playerSpeed = 1
    this.speedIncreaseTimer = 0
    this.gameTime = 0

    // Set difficulty parameters
    switch (this.difficulty) {
      case "easy":
        this.baseSpeed = 1.5
        this.carSpawnInterval = 3000
        break
      case "medium":
        this.baseSpeed = 2
        this.carSpawnInterval = 2000
        break
      case "hard":
        this.baseSpeed = 2.5
        this.carSpawnInterval = 1500
        break
    }

    this.gameSpeed = this.baseSpeed
    this.updateUI()
    this.initRoadLines()
  }

  initRoadLines() {
    const lineHeight = 40
    const lineSpacing = 80

    for (let y = -lineSpacing; y < this.roadHeight + lineSpacing; y += lineSpacing) {
      this.roadLines.push({ y: y, height: lineHeight })
    }
  }

  pauseGame() {
    if (this.gameState === "playing") {
      this.gameState = "paused"
      this.showScreen("pauseMenu")
    }
  }

  resumeGame() {
    if (this.gameState === "paused") {
      this.gameState = "playing"
      this.showScreen("gameScreen")
      this.gameLoop()
    }
  }

  showMainMenu() {
    this.gameState = "menu"
    this.showScreen("mainMenu")
  }

  gameOver() {
    this.gameState = "gameOver"
    document.getElementById("finalScore").textContent = this.score
    this.showScreen("gameOverScreen")
  }

  showScreen(screenId) {
    const screens = document.querySelectorAll(".screen")
    screens.forEach((screen) => screen.classList.add("hidden"))
    document.getElementById(screenId).classList.remove("hidden")
  }

  spawnEnemyCar() {
    const gameTimeMinutes = this.gameTime / 60000
    const trafficComplexity = Math.min(1 + gameTimeMinutes * 0.2, 2.5)

    const maxCarsToSpawn = Math.floor(trafficComplexity)
    const shouldSpawnMultiple = Math.random() < 0.5 && this.lanes > 3 // Only spawn multiple if enough lanes
    const carsToSpawn = shouldSpawnMultiple ? Math.min(maxCarsToSpawn, Math.floor(this.lanes * 0.6)) : 1

    const occupiedLanes = this.enemyCars.filter((car) => car.y > -300 && car.y < 200).map((car) => car.lane)

    const availableLanes = []
    for (let lane = 0; lane < this.lanes; lane++) {
      if (!occupiedLanes.includes(lane)) {
        availableLanes.push(lane)
      }
    }

    const minFreeLanes = Math.max(1, Math.ceil(this.lanes * 0.4))
    const maxCarsThisSpawn = Math.min(carsToSpawn, availableLanes.length - minFreeLanes)

    for (let i = 0; i < Math.max(0, maxCarsThisSpawn); i++) {
      if (availableLanes.length > minFreeLanes) {
        const laneIndex = Math.floor(Math.random() * availableLanes.length)
        const lane = availableLanes[laneIndex]
        availableLanes.splice(laneIndex, 1) // Remove from available lanes

        const carType = this.carTypes[Math.floor(Math.random() * this.carTypes.length)]

        const relativeSpeed = this.gameSpeed * this.playerSpeed * (0.8 + Math.random() * 0.4)

        this.enemyCars.push({
          x: lane * this.laneWidth + this.laneWidth / 2,
          y: -60 - i * 150, // Increased spacing between multiple cars
          lane: lane,
          width: this.laneWidth * 0.7,
          height: 60,
          color: carType.color,
          type: carType.type,
          speed: relativeSpeed,
        })
      }
    }
  }

  updateGame(deltaTime) {
    this.gameTime += deltaTime
    this.speedIncreaseTimer += deltaTime

    if (this.speedIncreaseTimer >= 15000) {
      // 15 seconds
      this.playerSpeed += 0.15
      this.speedIncreaseTimer = 0
    }

    if (this.playerLane !== this.targetPlayerLane) {
      const direction = this.targetPlayerLane > this.playerLane ? 1 : -1
      this.playerLaneOffset += direction * this.laneTransitionSpeed

      if (Math.abs(this.playerLaneOffset) >= 1) {
        this.playerLane = this.targetPlayerLane
        this.playerLaneOffset = 0
      }
    }

    // Update flying state
    if (this.isFlying) {
      this.flyingTime -= deltaTime
      if (this.flyingTime <= 0) {
        this.isFlying = false
        this.flyingTime = 0
      }
    }

    const roadSpeed = this.gameSpeed * this.playerSpeed * 1.5 // Increased multiplier for more noticeable effect
    this.roadLines.forEach((line) => {
      line.y += roadSpeed * (deltaTime / 16)
      if (line.y > this.roadHeight + 40) {
        line.y = -40
      }
    })

    this.laneDividerOffset = (this.laneDividerOffset || 0) + roadSpeed * (deltaTime / 16)
    if (this.laneDividerOffset > 40) {
      this.laneDividerOffset = 0
    }

    // Spawn enemy cars
    this.carSpawnTimer += deltaTime
    const dynamicSpawnInterval = this.carSpawnInterval / (1 + this.playerSpeed * 0.2) // Reduced spawn rate multiplier

    if (this.carSpawnTimer >= dynamicSpawnInterval) {
      this.spawnEnemyCar()
      this.carSpawnTimer = 0

      const trafficMultiplier = this.difficulty === "hard" ? 0.95 : this.difficulty === "medium" ? 0.97 : 0.98
      this.carSpawnInterval = Math.max(1200, this.carSpawnInterval * trafficMultiplier) // Increased minimum interval
    }

    // Update enemy cars
    for (let i = this.enemyCars.length - 1; i >= 0; i--) {
      const car = this.enemyCars[i]
      const relativeSpeed = car.speed - this.playerSpeed * this.gameSpeed * 0.5
      car.y += relativeSpeed * (deltaTime / 16)

      // Remove cars that are off screen
      if (car.y > this.roadHeight + 60) {
        this.enemyCars.splice(i, 1)
        this.score += 5

        // Award fly power every 10 dodges (50 points)
        if (this.score % 50 === 0) {
          this.flyPower++
        }

        // Increase speed every 20 dodges (100 points)
        if (this.score % 100 === 0) {
          this.gameSpeed += 0.2
        }

        this.updateUI()
      }
    }

    // Check collisions (only if not flying)
    if (!this.isFlying) {
      this.checkCollisions()
    }
  }

  checkCollisions() {
    const playerX = (this.playerLane + this.playerLaneOffset) * this.laneWidth + this.laneWidth / 2
    const playerWidth = this.laneWidth * 0.6
    const playerHeight = 50

    for (const car of this.enemyCars) {
      const distance = Math.abs(car.y - this.playerY)
      const horizontalOverlap = Math.abs(car.x - playerX) < (car.width + playerWidth) / 2

      if (distance < (car.height + playerHeight) / 2 && horizontalOverlap) {
        this.gameOver()
        return
      }
    }
  }

  updateUI() {
    document.getElementById("score").textContent = this.score
    document.getElementById("flyPower").textContent = this.flyPower
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = "#34495e"
    this.ctx.fillRect(0, 0, this.roadWidth, this.roadHeight)

    // Draw road lanes with moving dashed lines
    this.ctx.strokeStyle = "#ecf0f1"
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([20, 20])
    this.ctx.lineDashOffset = -(this.laneDividerOffset || 0)

    for (let i = 1; i < this.lanes; i++) {
      const x = i * this.laneWidth
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.roadHeight)
      this.ctx.stroke()
    }

    this.ctx.setLineDash([])
    this.roadLines.forEach((line) => {
      this.ctx.fillStyle = "#95a5a6"
      this.ctx.fillRect(this.roadWidth / 2 - 3, line.y, 6, line.height)
    })

    // Draw enemy cars
    this.enemyCars.forEach((car) => {
      this.drawCar(car.x, car.y, car.width, car.height, car.color, car.type)
    })

    // Draw player car
    this.drawPlayerCar()
  }

  drawCar(x, y, width, height, color, type) {
    const ctx = this.ctx

    ctx.save()
    ctx.translate(x, y)

    // Car body
    ctx.fillStyle = color
    ctx.fillRect(-width / 2, -height / 2, width, height)

    // Car details based on type
    ctx.fillStyle = "#2c3e50"

    switch (type) {
      case "sedan":
      case "player":
        // Windows
        ctx.fillRect(-width / 2 + 5, -height / 2 + 5, width - 10, height / 3)
        // Headlights/taillights
        ctx.fillStyle = type === "player" ? "#fff" : "#ffeb3b"
        ctx.fillRect(-width / 2 + 2, height / 2 - 8, 8, 6)
        ctx.fillRect(width / 2 - 10, height / 2 - 8, 8, 6)
        break

      case "suv":
        // Larger windows
        ctx.fillRect(-width / 2 + 3, -height / 2 + 3, width - 6, height / 2)
        // Roof rack
        ctx.fillStyle = "#34495e"
        ctx.fillRect(-width / 2, -height / 2 - 2, width, 2)
        break

      case "truck":
        // Cab
        ctx.fillRect(-width / 2 + 5, -height / 2 + 5, width - 10, height / 4)
        // Cargo area
        ctx.fillStyle = "#7f8c8d"
        ctx.fillRect(-width / 2 + 2, -height / 4, width - 4, height / 2)
        break

      case "sports":
        // Low profile windows
        ctx.fillRect(-width / 2 + 8, -height / 2 + 8, width - 16, height / 4)
        // Spoiler
        ctx.fillStyle = "#2c3e50"
        ctx.fillRect(-width / 2 + 5, -height / 2 - 3, width - 10, 3)
        break

      case "van":
        // Large windows
        ctx.fillRect(-width / 2 + 3, -height / 2 + 3, width - 6, height / 2.5)
        // Side door
        ctx.strokeStyle = "#2c3e50"
        ctx.lineWidth = 2
        ctx.strokeRect(-width / 4, -height / 4, width / 2, height / 2)
        break

      case "compact":
        // Small windows
        ctx.fillRect(-width / 2 + 6, -height / 2 + 6, width - 12, height / 3.5)
        break
    }

    ctx.restore()
  }

  drawPlayerCar() {
    const x = (this.playerLane + this.playerLaneOffset) * this.laneWidth + this.laneWidth / 2
    const width = this.laneWidth * 0.6
    const height = 50

    const flyingSizeMultiplier = this.isFlying ? 1.2 : 1
    const finalWidth = width * flyingSizeMultiplier
    const finalHeight = height * flyingSizeMultiplier

    this.ctx.save()

    // Flying effect
    if (this.isFlying) {
      this.ctx.shadowColor = "#00ffff"
      this.ctx.shadowBlur = 20
      this.ctx.globalAlpha = 0.9
    }

    // Car body
    this.ctx.fillStyle = "#ff4444"
    this.ctx.fillRect(x - finalWidth / 2, this.playerY - finalHeight / 2, finalWidth, finalHeight)

    // Car details
    this.ctx.fillStyle = "#ffffff"
    this.ctx.fillRect(x - finalWidth / 3, this.playerY - finalHeight / 3, (finalWidth * 2) / 3, finalHeight / 4)

    // Wheels
    this.ctx.fillStyle = "#333333"
    this.ctx.fillRect(x - finalWidth / 2 + 5, this.playerY - finalHeight / 2 + 5, 8, 12)
    this.ctx.fillRect(x + finalWidth / 2 - 13, this.playerY - finalHeight / 2 + 5, 8, 12)
    this.ctx.fillRect(x - finalWidth / 2 + 5, this.playerY + finalHeight / 2 - 17, 8, 12)
    this.ctx.fillRect(x + finalWidth / 2 - 13, this.playerY + finalHeight / 2 - 17, 8, 12)

    this.ctx.restore()
  }

  gameLoop(currentTime = 0) {
    if (this.gameState !== "playing") return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.updateGame(deltaTime)
    this.render()

    requestAnimationFrame((time) => this.gameLoop(time))
  }
}

// Initialize game when page loads
window.addEventListener("load", () => {
  window.game = new CarDodgeGame()
})

// Handle window resize
window.addEventListener("resize", () => {
  // Reinitialize canvas size if needed
  const canvas = document.getElementById("gameCanvas")
  if (canvas && window.game) {
    window.game.setupCanvas()
  }
})
