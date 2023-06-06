import { Engine, Vector, Input, CollisionType, Shape, Color, Label, Scene } from 'excalibur';
import { Resources, ResourceLoader } from './resources.js';
import { SpaceShip } from './player.js';
import { Projectile } from './projectile.js';
import { alien } from './enemy.js';
import { GameOverScene } from './gameover.js';
import { StartScene } from './startScene.js';

export class Game extends Engine {
  constructor() {
    super({ width: window.innerWidth, height: window.innerHeight });
    this.start(ResourceLoader).then(() => this.startGame());

    // Geef bepaalde values
    this.score = 0;
    this.isGameOver = false;
    this.enemySpawnTimer = null;
  }

  startGame() {
    console.log('Start the game!');

    if (!Resources.player.isLoaded()) {
      console.error('Player resource is not loaded!');
      return;
    }

    const startScene = new StartScene(this);
    this.addScene('start', startScene);
    this.goToScene('start');
  }

  // Begin de game na het klikken van spatie in het menu
  startMainScene() {
    const mainScene = new Scene();
    this.addScene('main', mainScene);
    this.goToScene('main');

    // maximaal aantal kogels
    const maxProjectiles = 20;

    // Roep de speler aan
    const player = new SpaceShip();
    mainScene.add(player);
    this.player = player;

    // Roep de score aan
    const scoreLabel = new Label('Score: 0');
    scoreLabel.pos = new Vector(
      window.innerWidth - 100,
      window.innerHeight - 100
    );
    mainScene.add(scoreLabel);
    this.scoreLabel = scoreLabel;

    const spawnEnemies = () => {
      const numEnemies = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numEnemies; i++) {
        const enemy = new alien(this);
        mainScene.add(enemy);
      }
    };

    spawnEnemies();

    this.enemySpawnTimer = setInterval(spawnEnemies, 1000);

    this.input.keyboard.on('hold', (evt) => {
      if (evt.key === Input.Keys.A) {
        player.pos.x -= 10;
      } else if (evt.key === Input.Keys.D) {
        player.pos.x += 10;
      }
    });

    this.input.keyboard.on('up', (evt) => {
      if (
        evt.key === Input.Keys.W &&
        mainScene.actors.filter((actor) => actor instanceof Projectile)
          .length < maxProjectiles
      ) {
        player.shootProjectile();
      }
    });

    this.on('postupdate', () => {
      const projectiles = mainScene.actors.filter(
        (actor) => actor instanceof Projectile
      );
      projectiles.forEach((projectile) => {
        if (
          projectile.pos.x < 0 ||
          projectile.pos.x > this.drawWidth ||
          projectile.pos.y < 0 ||
          projectile.pos.y > this.drawHeight
        ) {
          projectile.kill();
        }
      });

      const enemies = mainScene.actors.filter((actor) => actor instanceof alien);
      projectiles.forEach((projectile) => {
        enemies.forEach((enemy) => {
          if (
            projectile.pos.x < enemy.pos.x + enemy.width &&
            projectile.pos.x + projectile.width > enemy.pos.x &&
            projectile.pos.y < enemy.pos.y + enemy.height &&
            projectile.pos.y + projectile.height > enemy.pos.y
          ) {
            enemy.kill();
            projectile.kill();
            this.score += 1;
            scoreLabel.text = 'Score: ' + this.score;
          }
        });
      });

      if (!this.isGameOver) {
        enemies.forEach((enemy) => {
          if (enemy.pos.y + enemy.height > this.drawHeight) {
            this.playerHit();
          } else if (
            player.pos.x < enemy.pos.x + enemy.width &&
            player.pos.x + player.width > enemy.pos.x &&
            player.pos.y < enemy.pos.y + enemy.height &&
            player.pos.y + player.height > enemy.pos.y
          ) {
            this.playerHit();
          }
        });
      }
    });
  }

  playerHit() {
    console.log('Player hit!');
    this.player.kill();
    this.isGameOver = true;

    const gameOverScene = new GameOverScene(this.score, this);
    this.addScene('gameOver', gameOverScene);
    this.goToScene('gameOver');
  }
}

new Game();
