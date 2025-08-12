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
    this.playerX = 0
    this.playerY = 0
    this.isDragging = false
    this.dragOffsetX = 0
    this.dragOffsetY = 0
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
    this.playerX = this.roadWidth / 2
    this.playerY = this.roadHeight - 80
  }

  setupEventListeners() {
    document.getElementById("startGame").addEventListener("click", () => this.startGame())
    document.getElementById("pauseBtn").addEventListener("click", () => this.pauseGame())
    document.getElementById("resumeBtn").addEventListener("click", () => this.resumeGame())
    document.getElementById("mainMenuBtn").addEventListener("click", () => this.showMainMenu())
    document.getElementById("playAgainBtn").addEventListener("click", () => this.startGame())
    document.getElementById("backToMenuBtn").addEventListener("click", () => this.showMainMenu())

    this.setupCustomDropdowns()

    // Keyboard controls for desktop
    document.addEventListener("keydown", (e) => {
      if (this.gameState === "playing") {
        switch (e.key) {
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

  setupCustomDropdowns() {
    // Lane dropdown
    const laneDropdown = document.getElementById("laneDropdown")
    const laneSelected = laneDropdown.querySelector(".dropdown-selected")
    const laneOptions = laneDropdown.querySelector(".dropdown-options")

    laneSelected.addEventListener("click", () => {
      laneDropdown.classList.toggle("open")
      // Close other dropdowns
      document.getElementById("difficultyDropdown").classList.remove("open")
    })

    laneOptions.addEventListener("click", (e) => {
      if (e.target.classList.contains("dropdown-option")) {
        const value = e.target.dataset.value
        const text = e.target.textContent

        laneSelected.querySelector("span").textContent = text
        laneSelected.dataset.value = value

        // Update selected state
        laneOptions.querySelectorAll(".dropdown-option").forEach((opt) => opt.classList.remove("selected"))
        e.target.classList.add("selected")

        // Update game settings
        this.lanes = Number.parseInt(value)
        this.updateLaneSettings()

        laneDropdown.classList.remove("open")
      }
    })

    // Difficulty dropdown
    const difficultyDropdown = document.getElementById("difficultyDropdown")
    const difficultySelected = difficultyDropdown.querySelector(".dropdown-selected")
    const difficultyOptions = difficultyDropdown.querySelector(".dropdown-options")

    difficultySelected.addEventListener("click", () => {
      difficultyDropdown.classList.toggle("open")
      // Close other dropdowns
      document.getElementById("laneDropdown").classList.remove("open")
    })

    difficultyOptions.addEventListener("click", (e) => {
      if (e.target.classList.contains("dropdown-option")) {
        const value = e.target.dataset.value
        const text = e.target.querySelector("span:last-child").textContent

        difficultySelected.querySelector("span").textContent = text
        difficultySelected.dataset.value = value

        // Update selected state
        difficultyOptions.querySelectorAll(".dropdown-option").forEach((opt) => opt.classList.remove("selected"))
        e.target.classList.add("selected")

        // Update game settings
        this.difficulty = value

        difficultyDropdown.classList.remove("open")
      }
    })

    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
          dropdown.classList.remove("open")
        })
      }
    })

    // Set initial selected states
    laneOptions.querySelector('[data-value="3"]').classList.add("selected")
    difficultyOptions.querySelector('[data-value="medium"]').classList.add("selected")
  }

  setupTouchControls() {
    this.canvas.addEventListener("touchstart", (e) => {
      if (e.cancelable) {
        e.preventDefault()
      }
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top

      // Check if touch is on player car
      if (this.isPointOnPlayerCar(touchX, touchY)) {
        this.isDragging = true
        this.dragOffsetX = touchX - this.playerX
        this.dragOffsetY = touchY - this.playerY
      }
    })

    this.canvas.addEventListener("touchmove", (e) => {
      if (e.cancelable) {
        e.preventDefault()
      }
      if (this.isDragging && this.gameState === "playing") {
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top

        this.updatePlayerPosition(touchX - this.dragOffsetX, touchY - this.dragOffsetY)
      }
    })

    this.canvas.addEventListener("touchend", (e) => {
      if (e.cancelable) {
        e.preventDefault()
      }
      this.isDragging = false
    })

    // Mouse controls for desktop
    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (this.isPointOnPlayerCar(mouseX, mouseY)) {
        this.isDragging = true
        this.dragOffsetX = mouseX - this.playerX
        this.dragOffsetY = mouseY - this.playerY
      }
    })

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging && this.gameState === "playing") {
        const rect = this.canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        this.updatePlayerPosition(mouseX - this.dragOffsetX, mouseY - this.dragOffsetY)
      }
    })

    this.canvas.addEventListener("mouseup", (e) => {
      this.isDragging = false
    })

    let lastTapTime = 0
    this.canvas.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTapTime
      if (tapLength < 500 && tapLength > 0) {
        this.activateFlyPower()
      }
      lastTapTime = currentTime
      this.isDragging = false
    })

    this.canvas.addEventListener("dblclick", (e) => {
      this.activateFlyPower()
    })
  }

  isPointOnPlayerCar(x, y) {
    const carWidth = this.laneWidth * 0.6 * (this.isFlying ? 1.2 : 1)
    const carHeight = 50 * (this.isFlying ? 1.2 : 1)

    return (
      x >= this.playerX - carWidth / 2 &&
      x <= this.playerX + carWidth / 2 &&
      y >= this.playerY - carHeight / 2 &&
      y <= this.playerY + carHeight / 2
    )
  }

  updatePlayerPosition(newX, newY) {
    const carWidth = this.laneWidth * 0.6 * (this.isFlying ? 1.2 : 1)
    const carHeight = 50 * (this.isFlying ? 1.2 : 1)

    // Keep car within road bounds
    this.playerX = Math.max(carWidth / 2, Math.min(this.roadWidth - carWidth / 2, newX))
    this.playerY = Math.max(carHeight / 2, Math.min(this.roadHeight - carHeight / 2, newY))
  }

  activateFlyPower() {
    if (this.flyPower > 0 && !this.isFlying && this.gameState === "playing") {
      this.flyPower--
      this.isFlying = true
      this.flyingTime = 1000 // 1 second of flying
      document.getElementById("flyPower").textContent = this.flyPower
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
    if (this.isFlying) return // No collisions while flying

    const playerWidth = this.laneWidth * 0.6
    const playerHeight = 50

    for (const enemy of this.enemyCars) {
      const enemyWidth = this.laneWidth * 0.6
      const enemyHeight = 50

      if (
        this.playerX < enemy.x + enemyWidth &&
        this.playerX + playerWidth > enemy.x &&
        this.playerY < enemy.y + enemyHeight &&
        this.playerY + playerHeight > enemy.y
      ) {
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
    this.ctx.fillRect(this.playerX - finalWidth / 2, this.playerY - finalHeight / 2, finalWidth, finalHeight)

    // Car details
    this.ctx.fillStyle = "#ffffff"
    this.ctx.fillRect(
      this.playerX - finalWidth / 3,
      this.playerY - finalHeight / 3,
      (finalWidth * 2) / 3,
      finalHeight / 4,
    )

    // Wheels
    this.ctx.fillStyle = "#333333"
    this.ctx.fillRect(this.playerX - finalWidth / 2 + 5, this.playerY - finalHeight / 2 + 5, 8, 12)
    this.ctx.fillRect(this.playerX + finalWidth / 2 - 13, this.playerY - finalHeight / 2 + 5, 8, 12)
    this.ctx.fillRect(this.playerX - finalWidth / 2 + 5, this.playerY + finalHeight / 2 - 17, 8, 12)
    this.ctx.fillRect(this.playerX + finalWidth / 2 - 13, this.playerY + finalHeight / 2 - 17, 8, 12)

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

  startGame() {
    this.lanes = Number.parseInt(
      document.getElementById("laneDropdown").querySelector(".dropdown-selected").dataset.value,
    )
    this.difficulty = document.getElementById("difficultyDropdown").querySelector(".dropdown-selected").dataset.value

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
