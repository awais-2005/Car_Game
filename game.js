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
    this.playerY = 0
    this.isFlying = false
    this.flyingTime = 0
    this.gameSpeed = 2
    this.baseSpeed = 2

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
    if (this.playerLane > 0) {
      this.playerLane--
    }
  }

  moveRight() {
    if (this.playerLane < this.lanes - 1) {
      this.playerLane++
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
    this.isFlying = false
    this.flyingTime = 0
    this.enemyCars = []
    this.roadLines = []
    this.carSpawnTimer = 0

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
    const availableLanes = []

    // Find lanes that don't have cars too close to the top
    for (let i = 0; i < this.lanes; i++) {
      let canSpawn = true
      for (const car of this.enemyCars) {
        if (car.lane === i && car.y < 150) {
          canSpawn = false
          break
        }
      }
      if (canSpawn) {
        availableLanes.push(i)
      }
    }

    if (availableLanes.length > 0) {
      const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)]
      const carType = this.carTypes[Math.floor(Math.random() * this.carTypes.length)]

      this.enemyCars.push({
        x: lane * this.laneWidth + this.laneWidth / 2,
        y: -60,
        lane: lane,
        width: this.laneWidth * 0.7,
        height: 60,
        color: carType.color,
        type: carType.type,
        speed: this.gameSpeed + Math.random() * 0.5,
      })
    }
  }

  updateGame(deltaTime) {
    // Update flying state
    if (this.isFlying) {
      this.flyingTime -= deltaTime
      if (this.flyingTime <= 0) {
        this.isFlying = false
        this.flyingTime = 0
      }
    }

    // Move road lines
    this.roadLines.forEach((line) => {
      line.y += this.gameSpeed * (deltaTime / 16)
      if (line.y > this.roadHeight + 40) {
        line.y = -40
      }
    })

    // Spawn enemy cars
    this.carSpawnTimer += deltaTime
    if (this.carSpawnTimer >= this.carSpawnInterval) {
      this.spawnEnemyCar()
      this.carSpawnTimer = 0

      // Adjust spawn rate based on difficulty
      const trafficMultiplier = this.difficulty === "hard" ? 0.9 : this.difficulty === "medium" ? 0.95 : 1
      this.carSpawnInterval = Math.max(800, this.carSpawnInterval * trafficMultiplier)
    }

    // Update enemy cars
    for (let i = this.enemyCars.length - 1; i >= 0; i--) {
      const car = this.enemyCars[i]
      car.y += car.speed * (deltaTime / 16)

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
    const playerX = this.playerLane * this.laneWidth + this.laneWidth / 2
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

    // Draw road lanes
    this.ctx.strokeStyle = "#ecf0f1"
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([20, 20])

    for (let i = 1; i < this.lanes; i++) {
      const x = i * this.laneWidth
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.roadHeight)
      this.ctx.stroke()
    }

    // Draw road lines
    this.ctx.setLineDash([])
    this.roadLines.forEach((line) => {
      this.ctx.fillStyle = "#7f8c8d"
      this.ctx.fillRect(this.roadWidth / 2 - 2, line.y, 4, line.height)
    })

    // Draw enemy cars
    this.enemyCars.forEach((car) => {
      this.drawCar(car.x, car.y, car.width, car.height, car.color, car.type)
    })

    // Draw player car
    const playerX = this.playerLane * this.laneWidth + this.laneWidth / 2
    const playerWidth = this.laneWidth * 0.6
    const playerHeight = 50
    const playerColor = this.isFlying ? "#f39c12" : "#e74c3c"

    this.ctx.save()
    if (this.isFlying) {
      this.ctx.globalAlpha = 0.8
      this.ctx.shadowColor = "#f39c12"
      this.ctx.shadowBlur = 20
    }

    this.drawCar(playerX, this.playerY, playerWidth, playerHeight, playerColor, "player")
    this.ctx.restore()
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