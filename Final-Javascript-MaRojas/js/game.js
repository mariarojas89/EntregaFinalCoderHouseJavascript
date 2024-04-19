function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time)
    })
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 94;
        this.height = 83;
        this.x = this.game.width * 0.6 - this.width;
        this.y = this.game.height - this.height;
        this.speed = 15;
        this.lives = 1;
        this.image = document.getElementById('player');
        this.canShoot = true;

    }

    draw(context) {
        if (!this.game.gameOver) {
            context.drawImage(this.image, this.x, this.y);
        }
    }
    update() {
        ////HORIZONTAL MOVE////
        if (this.game.keys.indexOf('a') > -1) this.x -= this.speed;
        if (this.game.keys.indexOf('d') > -1) this.x += this.speed;

        ////VERTICAL MOVE////
        if (this.game.keys.indexOf('w') > -1) this.y -= this.speed;
        if (this.game.keys.indexOf('s') > -1) this.y += this.speed;

        ////MAX HORIZONTAL WALL////
        if (this.x < 0) this.x = 0;
        else if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        ////MAX VERTICAL WALL////
        if (this.y < 0) this.y = 0;
        else if (this.y > this.game.height - this.height) this.y = this.game.height - this.height;
    }
    async shoot() {
        if (this.canShoot) {
            const projectile = this.game.getProjectile();
            if (projectile) {
                this.canShoot = false;
                projectile.start(this.x + this.width * 0.5, this.y);
                await sleep(100)
                this.canShoot = true;
            }
        }
    }

    async shootBig() {
        if (this.game.PowerBar.currentLevel > 10 && this.canShoot && this.game.bigProjectile.free) {
            const projectile = this.game.bigProjectile
            this.canShoot = false;
            projectile.start(this.x + this.width * 0.5, this.y);
            this.game.PowerBar.currentLevel -= 10
            await sleep(100)
            this.canShoot = true;
        }
    }
}

class Projectile {
    constructor() {
        this.width = 5;
        this.height = 40;
        this.x = 0;
        this.y = 0;
        this.speed = 15;
        this.free = true;
        this.damage = 1;
    }
    draw(context) {
        if (!this.free) {
            context.fillRect(this.x, this.y, this.width, this.height);
            context.fillStyle = '#00f9cf';
            context.fillRect(this.x, this.y, this.width + 0.2, this.height * 0.6);
            context.fillStyle = 'white';
        }
    }
    update() {
        if (!this.free) {
            this.y -= this.speed;
            if (this.y < - this.height) this.reset();
        }
    }
    start(x, y) {
        this.x = x - this.width * 0.5;
        this.y = y;
        this.free = false;
    }
    reset() {
        this.free = true;
    }

}

class Enemy {
    constructor(game, positionX, positionY) {
        this.game = game;
        this.width = this.game.enemySize;
        this.height = this.game.enemySize;
        this.x = 0;
        this.y = 0;
        this.positionX = positionX;
        this.positionY = positionY;
        this.checkForDelete = false;
    }
    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);

    }
    update(x, y) {
        this.x = x + this.positionX;
        this.y = y + this.positionY;

        ////checking collision enemies vs projectiles/////
        [...this.game.projectilesPool, this.game.bigProjectile].forEach(projectile => {
            if (!projectile.free && this.game.checkCollision(this, projectile)) {
                this.hit(projectile.damage);
                projectile.reset();
                if (!this.game.gameOver) {
                    this.game.score++;
                    if (this instanceof invader) {
                        this.game.PowerBar.increase(5)
                    }
                }
            }
        });

        if (this.lives < 1) {
            this.checkForDelete = true;
        }

        //////condition check between enemies and the player//////
        if (!this.game.gameOver && this.game.checkCollision(this, this.game.player) && !this.checkForDelete) {
            this.checkForDelete = true;
            if (this.game.score > 0) this.game.score--;
            this.game.player.lives--;
            if (this.game.player.lives < 1) this.game.gameOver = true;
        }

        //////Losing game////// 
        if (this.y + this.height > this.game.height) {
            this.game.gameOver = true;
            this.checkForDelete = true;
        }
    }
    hit(damage) {
        this.lives -= damage;
    }
}

class BigProjectile extends Projectile {
    constructor() {
        super()
        this.width = 50;
        this.damage = 3;
    }
}

class invader extends Enemy {
    constructor(game, positionX, positionY) {
        super(game, positionX, positionY);
        this.image = document.getElementById('invader');
        this.lives = 2;
        this.maxLives = this.lives;
    }
    hit(damage) {
        this.lives -= damage;
    }
}
class robot extends Enemy {
    constructor(game, positionX, positionY) {
        super(game, positionX, positionY);
        this.image = document.getElementById('robot');
        this.lives = 1;
        this.maxLives = this.lives;
    }
    hit(damage) {
        this.lives -= damage;
    }
}



class Wave {
    constructor(game) {
        this.game = game;
        this.width = this.game.columns * this.game.enemySize;
        this.height = this.game.rows * this.game.enemySize;
        this.x = 0;
        this.y = -this.height;
        this.speedX = 3;
        this.speedY = 0;
        this.enemies = [];
        this.nextWaveTrigger = false;
        this.create();
    }

    render(context) {
        if (this.y < 0) this.y += 5;
        this.speedY = 0;
        if (this.x < 0 || this.x > this.game.width - this.width) {
            this.speedX *= -1;
            this.speedY = this.game.enemySize;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.enemies.forEach(enemy => {
            enemy.update(this.x, this.y);
            enemy.draw(context);
        })
        this.enemies = this.enemies.filter(object => !object.checkForDelete);
    }

    create() {
        for (let y = 0; y < this.game.rows; y++) {
            for (let x = 0; x < this.game.columns; x++) {
                let enemyX = x * this.game.enemySize;
                let enemyY = y * this.game.enemySize;
                if (Math.random() < 0.8) {
                    this.enemies.push(new robot(this.game, enemyX, enemyY))
                }
                else {
                    this.enemies.push(new invader(this.game, enemyX, enemyY))

                }
            }
        }
    }
}

class PowerBar {
    constructor(game) {
        this.game = game;
        this.PowerBar = document.getElementById('PowerBar')
        this.minPowerWidth = 0;
        this.maxPowerWidth = 165;
        this.minPower = 85;
        this.currentLevel = 50;
    }

    draw() {
        this.PowerBar.style.width = this.currentLevel + '%';
    }

    increase(amount) {
        this.currentLevel += amount
        if (this.currentLevel >= 100) this.currentLevel = 100
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = [];
        this.player = new Player(this);

        this.projectilesPool = [];
        this.numberOfProjectiles = 10;
        this.createProjectiles();
        this.bigProjectile = new BigProjectile();

        this.columns = 10;
        this.rows = 3;
        this.enemySize = 40;

        this.waves = [],
            this.waves.push(new Wave(this));
        this.waveCount = 1;

        this.score = 0;
        this.gameOver = false;
        this.showedGameOver = false;
        this.PowerBar = new PowerBar(this);


        ///keboyboard event listeners to move the ship///
        window.addEventListener('keydown', (e) => {
            if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key);
            if (e.key === ' ') this.player.shoot();
            if (e.key === 'm') this.player.shootBig();

        });
        window.addEventListener('keyup', e => {
            const index = this.keys.indexOf(e.key);
            if (index > -1) this.keys.splice(index, 1);

        });
    }
    render(context) {
        this.drawStatusText(context);
        [...this.projectilesPool, this.bigProjectile].forEach(projectile => {
            projectile.update();
            projectile.draw(context);
        })
        this.player.draw(context);
        this.player.update();
        this.PowerBar.draw()

        this.waves.forEach(wave => {
            wave.render(context);
            if (wave.enemies.length < 1 && !wave.nextWaveTrigger && !this.gameOver) {
                this.newWave();
                this.waveCount++;
                wave.nextWaveTrigger = true;
                this.player.lives++;

            }
        })
    }
    ////creating projectiles from object pool////
    createProjectiles() {
        for (let i = 0; i < this.numberOfProjectiles; i++) {
            this.projectilesPool.push(new Projectile());
        }
    }
    /////reusing shoots////
    getProjectile() {
        for (let i = 0; i < this.projectilesPool.length; i++) {
            if (this.projectilesPool[i].free) return this.projectilesPool[i];
        }
    }
    /////collision between projectile and enemy/////
    checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        )
    }
    //////level and score status/////
    drawStatusText() {
        document.querySelector('#scoreResults').textContent = this.score;
        document.querySelector('#waveCount').textContent = this.waveCount;
        document.querySelector("#lives-container").innerHTML = ''
        for (let index = 0; index < this.player.lives; index++) {
            let live = document.createElement("span")
            live.setAttribute('id', 'lives')
            document.querySelector("#lives-container").appendChild(live)
        }
        if (this.gameOver && !this.showedGameOver) {
            Swal.fire({
                title: "<h1>GAME OVER!</h1>",
                imageUrl: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGlrZHY5czVsc2NlcDBhejh5YzE4NzJpcmZibzRpcHo0OTl3Y3V1OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26gss3jm3vGwnrSU0/giphy.gif",
                imageWidth: 400,
                imageHeight: 200,
                color: "#bdff53",
                backdrop: `#15041bfd`,
                background: "#661e98",
                imageAlt: "Custom image",
                showCancelButton: true,
                confirmButtonText: "Reload",
                cancelButtonText: "Exit Game",


            }).then((result) => {
                if (result.isConfirmed) {
                    // Reset
                    window.location.reload()
                } else {
                    window.location.href = '/html/main.html'
                }
            });
            this.showedGameOver = true
        }
    }

    newWave() {
        if (Math.random() < 0.5 && this.columns * this.enemySize < this.width * 0.8) {
            this.columns++;
        } else if (this.rows * this.enemySize < this.height * 0.6) {
            this.rows++;
        }
        this.waves.push(new Wave(this));
    }
}

window.addEventListener('load', function () {
    const name = localStorage.getItem('name')
    const comision = localStorage.getItem('comision')

    if (!name || !comision) {
        window.location.href = "/html/main.html";
    }

    this.document.getElementById('name').textContent = name
    this.document.getElementById('comision').textContent = comision

    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 650;
    ctx.lineWidth = 5;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';

    const game = new Game(canvas);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx);
        window.requestAnimationFrame(animate);
    }
    animate();

});