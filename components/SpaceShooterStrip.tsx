"use client";

import { useEffect, useRef, useState } from "react";

type GameStatus = "idle" | "running" | "failed";
type EnemyKind = "scout" | "heavy";

type Bullet = {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
};

type Enemy = {
  x: number;
  y: number;
  vx: number;
  phase: number;
  drift: number;
  hp: number;
  kind: EnemyKind;
  nextFire: number;
};

type Asteroid = {
  x: number;
  y: number;
  vx: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  hp: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

type Star = {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
};

const FIRE_INTERVAL = 220;
const DAMPING = 0.085;
const DPR_CAP = 1.5;
const MAX_ENEMIES = 8;
const MAX_PLAYER_BULLETS = 72;
const MAX_ENEMY_BULLETS = 36;
const MAX_PARTICLES = 120;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  tilt: number,
  time: number,
  alpha = 1,
) {
  const unit = width / 24;
  const flicker = Math.floor(time / 90) % 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(tilt);
  ctx.translate(-12 * unit, -6 * unit);

  ctx.fillStyle = flicker ? "#8df5ff" : "#4bdcff";
  ctx.fillRect(-Math.round((4 + flicker * 2) * unit), Math.round(4.5 * unit), Math.round(5 * unit), Math.max(1, Math.round(3 * unit)));
  ctx.fillStyle = "#d9fbff";
  ctx.fillRect(-Math.round(2 * unit), Math.round(5 * unit), Math.round(3 * unit), Math.max(1, Math.round(2 * unit)));

  ctx.fillStyle = "#172538";
  ctx.fillRect(Math.round(1 * unit), Math.round(3 * unit), Math.round(5 * unit), Math.round(7 * unit));
  ctx.fillStyle = "#31506b";
  ctx.fillRect(Math.round(3 * unit), Math.round(2 * unit), Math.round(4 * unit), Math.round(2 * unit));
  ctx.fillRect(Math.round(3 * unit), Math.round(9 * unit), Math.round(4 * unit), Math.round(2 * unit));

  ctx.fillStyle = "#8598aa";
  ctx.fillRect(Math.round(5 * unit), Math.round(3 * unit), Math.round(11 * unit), Math.round(7 * unit));
  ctx.fillStyle = "#cbd6de";
  ctx.fillRect(Math.round(7 * unit), Math.round(2 * unit), Math.round(9 * unit), Math.round(2 * unit));
  ctx.fillStyle = "#f2f7f8";
  ctx.fillRect(Math.round(8 * unit), Math.round(3 * unit), Math.round(9 * unit), Math.round(2 * unit));
  ctx.fillStyle = "#637486";
  ctx.fillRect(Math.round(7 * unit), Math.round(8 * unit), Math.round(10 * unit), Math.round(2 * unit));

  ctx.fillStyle = "#60798f";
  ctx.fillRect(Math.round(7 * unit), 0, Math.round(7 * unit), Math.round(3 * unit));
  ctx.fillRect(Math.round(7 * unit), Math.round(10 * unit), Math.round(7 * unit), Math.round(3 * unit));
  ctx.fillStyle = "#b8c7d2";
  ctx.fillRect(Math.round(10 * unit), Math.round(1 * unit), Math.round(7 * unit), Math.round(2 * unit));
  ctx.fillStyle = "#344b61";
  ctx.fillRect(Math.round(10 * unit), Math.round(11 * unit), Math.round(7 * unit), Math.round(2 * unit));

  ctx.fillStyle = "#b8cbd6";
  ctx.fillRect(Math.round(16 * unit), Math.round(4 * unit), Math.round(5 * unit), Math.round(5 * unit));
  ctx.fillStyle = "#f4f8f8";
  ctx.fillRect(Math.round(20 * unit), Math.round(5 * unit), Math.round(3 * unit), Math.round(3 * unit));
  ctx.fillStyle = "#8ea3b2";
  ctx.fillRect(Math.round(22 * unit), Math.round(6 * unit), Math.round(2 * unit), Math.max(1, Math.round(1 * unit)));

  ctx.fillStyle = "#15344a";
  ctx.fillRect(Math.round(10 * unit), Math.round(3 * unit), Math.round(5 * unit), Math.round(4 * unit));
  ctx.fillStyle = "#27bfe0";
  ctx.fillRect(Math.round(11 * unit), Math.round(3 * unit), Math.round(4 * unit), Math.round(2 * unit));
  ctx.fillStyle = "#baffff";
  ctx.fillRect(Math.round(12 * unit), Math.round(3 * unit), Math.round(2 * unit), Math.max(1, Math.round(1 * unit)));

  ctx.fillStyle = "#062438";
  ctx.fillRect(Math.round(4 * unit), Math.round(5 * unit), Math.round(4 * unit), Math.round(3 * unit));
  ctx.fillStyle = flicker ? "#baffff" : "#44e8ff";
  ctx.fillRect(Math.round(5 * unit), Math.round(5 * unit), Math.round(2 * unit), Math.round(2 * unit));
  ctx.restore();
}

function drawScout(ctx: CanvasRenderingContext2D, enemy: Enemy, scale: number, alpha = 1) {
  const unit = scale / 16;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  ctx.fillStyle = "#121417";
  ctx.fillRect(-Math.round(7 * unit), -Math.round(3 * unit), Math.round(10 * unit), Math.round(6 * unit));
  ctx.fillStyle = "#35383c";
  ctx.fillRect(-Math.round(3 * unit), -Math.round(5 * unit), Math.round(7 * unit), Math.round(3 * unit));
  ctx.fillRect(-Math.round(3 * unit), Math.round(2 * unit), Math.round(7 * unit), Math.round(3 * unit));
  ctx.fillStyle = "#6a3a1d";
  ctx.fillRect(Math.round(3 * unit), -Math.round(2 * unit), Math.round(4 * unit), Math.round(4 * unit));
  ctx.fillStyle = "#ff9b45";
  ctx.fillRect(-Math.round(5 * unit), -Math.round(1 * unit), Math.round(3 * unit), Math.round(2 * unit));
  ctx.fillStyle = "#ffd08a";
  ctx.fillRect(-Math.round(7 * unit), 0, Math.round(2 * unit), Math.max(1, Math.round(unit)));
  ctx.restore();
}

function drawHeavy(ctx: CanvasRenderingContext2D, enemy: Enemy, scale: number) {
  const unit = scale / 20;
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  ctx.fillStyle = "#101215";
  ctx.fillRect(-Math.round(9 * unit), -Math.round(5 * unit), Math.round(15 * unit), Math.round(10 * unit));
  ctx.fillStyle = "#34383d";
  ctx.fillRect(-Math.round(4 * unit), -Math.round(7 * unit), Math.round(10 * unit), Math.round(3 * unit));
  ctx.fillRect(-Math.round(4 * unit), Math.round(4 * unit), Math.round(10 * unit), Math.round(3 * unit));
  ctx.fillStyle = "#25282d";
  ctx.fillRect(Math.round(4 * unit), -Math.round(8 * unit), Math.round(5 * unit), Math.round(4 * unit));
  ctx.fillRect(Math.round(4 * unit), Math.round(4 * unit), Math.round(5 * unit), Math.round(4 * unit));
  ctx.fillStyle = "#75411f";
  ctx.fillRect(-Math.round(4 * unit), -Math.round(3 * unit), Math.round(6 * unit), Math.round(6 * unit));
  ctx.fillStyle = "#ff8b32";
  ctx.fillRect(-Math.round(3 * unit), -Math.round(2 * unit), Math.round(4 * unit), Math.round(4 * unit));
  ctx.fillStyle = "#ffc16f";
  ctx.fillRect(-Math.round(2 * unit), -Math.round(unit), Math.round(2 * unit), Math.round(2 * unit));
  ctx.fillStyle = "#4d2c1b";
  ctx.fillRect(Math.round(6 * unit), -Math.round(3 * unit), Math.round(4 * unit), Math.round(6 * unit));
  ctx.restore();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, asteroid: Asteroid, alpha = 1) {
  const size = asteroid.size;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(asteroid.x), Math.round(asteroid.y));
  ctx.rotate(asteroid.rotation);
  ctx.fillStyle = "#393632";
  ctx.beginPath();
  ctx.moveTo(-size * 0.48, -size * 0.18);
  ctx.lineTo(-size * 0.22, -size * 0.5);
  ctx.lineTo(size * 0.24, -size * 0.42);
  ctx.lineTo(size * 0.5, -size * 0.08);
  ctx.lineTo(size * 0.38, size * 0.34);
  ctx.lineTo(-size * 0.06, size * 0.5);
  ctx.lineTo(-size * 0.44, size * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5b5147";
  ctx.fillRect(-Math.round(size * 0.2), -Math.round(size * 0.28), Math.round(size * 0.22), Math.round(size * 0.14));
  ctx.fillStyle = "#282725";
  ctx.fillRect(Math.round(size * 0.08), Math.round(size * 0.02), Math.round(size * 0.2), Math.round(size * 0.18));
  ctx.restore();
}

export default function SpaceShooterStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startGameRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [hull, setHull] = useState(3);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const runtime = {
      width: 1,
      height: 1,
      dpr: 1,
      visible: false,
      status: "idle" as GameStatus,
      elapsed: 0,
      lastFrame: performance.now(),
      lastFire: 0,
      spawnCooldown: 1400,
      asteroidCooldown: 2800,
      score: 0,
      hull: 3,
      invulnerable: 0,
      pointerActive: false,
      player: { x: 0, y: 0, targetX: 0, targetY: 0, tilt: 0 },
      bullets: [] as Bullet[],
      enemyBullets: [] as Bullet[],
      enemies: [] as Enemy[],
      asteroids: [] as Asteroid[],
      particles: [] as Particle[],
      stars: [] as Star[],
    };
    let animationFrame = 0;

    const shipWidth = () => clamp(runtime.height * 0.38, 48, 64);
    const scoutWidth = () => clamp(runtime.height * 0.21, 28, 36);
    const heavyWidth = () => clamp(runtime.height * 0.29, 38, 48);

    const makeStars = () => {
      const count = Math.round(clamp(runtime.width / 28, 30, 60));
      runtime.stars = Array.from({ length: count }, () => ({
        x: Math.random() * runtime.width,
        y: Math.random() * runtime.height,
        speed: randomBetween(4, 13),
        size: Math.random() > 0.86 ? 2 : 1,
        alpha: randomBetween(0.2, 0.7),
      }));
    };

    const updateCanvasSize = () => {
      const bounds = container.getBoundingClientRect();
      const previousWidth = runtime.width;
      const previousHeight = runtime.height;
      runtime.width = Math.max(1, Math.round(bounds.width));
      runtime.height = Math.max(1, Math.round(bounds.height));
      runtime.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(runtime.width * runtime.dpr);
      canvas.height = Math.round(runtime.height * runtime.dpr);
      context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
      context.imageSmoothingEnabled = false;

      if (previousWidth <= 1 || previousHeight <= 1) {
        runtime.player.x = runtime.width * 0.18;
        runtime.player.y = runtime.height * 0.5;
      } else {
        runtime.player.x = runtime.player.x / previousWidth * runtime.width;
        runtime.player.y = runtime.player.y / previousHeight * runtime.height;
      }
      runtime.player.targetX = clamp(runtime.player.x, runtime.width * 0.06, runtime.width * 0.38);
      runtime.player.targetY = clamp(runtime.player.y, runtime.height * 0.15, runtime.height * 0.85);
      makeStars();
    };

    const addExplosion = (x: number, y: number, palette: "warm" | "cool", count = 10) => {
      const colors = palette === "warm"
        ? ["#ff8b32", "#ffc16f", "#fff3d5"]
        : ["#42ddff", "#baffff", "#ffffff"];
      for (let index = 0; index < count && runtime.particles.length < MAX_PARTICLES; index += 1) {
        const life = randomBetween(220, 440);
        runtime.particles.push({
          x,
          y,
          vx: randomBetween(-75, 75),
          vy: randomBetween(-55, 55),
          life,
          maxLife: life,
          size: randomBetween(1, 3),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const spawnEnemy = () => {
      if (runtime.enemies.length >= MAX_ENEMIES) return;
      const kind: EnemyKind = Math.random() > 0.72 ? "heavy" : "scout";
      const scale = kind === "heavy" ? heavyWidth() : scoutWidth();
      runtime.enemies.push({
        x: runtime.width + scale,
        y: randomBetween(runtime.height * 0.2, runtime.height * 0.8),
        vx: -(kind === "heavy" ? randomBetween(34, 48) : randomBetween(52, 76)),
        phase: Math.random() * Math.PI * 2,
        drift: randomBetween(3, 8),
        hp: kind === "heavy" ? 4 : 2,
        kind,
        nextFire: randomBetween(1200, 2200),
      });
    };

    const spawnAsteroid = () => {
      const size = randomBetween(clamp(runtime.height * 0.17, 24, 30), clamp(runtime.height * 0.27, 32, 42));
      runtime.asteroids.push({
        x: runtime.width + size,
        y: randomBetween(runtime.height * 0.2, runtime.height * 0.8),
        vx: -randomBetween(28, 48),
        size,
        rotation: Math.random() * Math.PI,
        rotationSpeed: randomBetween(-0.45, 0.45),
        hp: 3,
      });
    };

    const syncHud = () => {
      setScore(runtime.score);
      setHull(runtime.hull);
    };

    const setGameStatus = (nextStatus: GameStatus) => {
      runtime.status = nextStatus;
      setStatus(nextStatus);
    };

    const resetGame = () => {
      runtime.elapsed = 0;
      runtime.lastFire = 0;
      runtime.spawnCooldown = 1400;
      runtime.asteroidCooldown = 2800;
      runtime.score = 0;
      runtime.hull = 3;
      runtime.invulnerable = 0;
      runtime.bullets = [];
      runtime.enemyBullets = [];
      runtime.enemies = [];
      runtime.asteroids = [];
      runtime.particles = [];
      runtime.player.x = runtime.width * 0.18;
      runtime.player.y = runtime.height * 0.5;
      runtime.player.targetX = runtime.player.x;
      runtime.player.targetY = runtime.player.y;
      runtime.player.tilt = 0;
      syncHud();
      setGameStatus("running");
    };

    startGameRef.current = resetGame;

    const damagePlayer = () => {
      if (runtime.invulnerable > 0 || runtime.status !== "running") return;
      runtime.hull -= 1;
      runtime.invulnerable = 850;
      addExplosion(runtime.player.x, runtime.player.y, "cool", 12);
      syncHud();
      if (runtime.hull <= 0) {
        setGameStatus("failed");
        runtime.enemies = [];
        runtime.enemyBullets = [];
      }
    };

    const updatePointerTarget = (clientX: number, clientY: number) => {
      if (runtime.status !== "running") return;
      const bounds = container.getBoundingClientRect();
      const normalizedX = clamp((clientX - bounds.left) / bounds.width, 0, 1);
      const normalizedY = clamp((clientY - bounds.top) / bounds.height, 0, 1);
      runtime.player.targetX = runtime.width * (0.06 + normalizedX * 0.32);
      runtime.player.targetY = runtime.height * (0.15 + normalizedY * 0.7);
    };

    const handlePointerEnter = (event: PointerEvent) => {
      runtime.pointerActive = true;
      updatePointerTarget(event.clientX, event.clientY);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" && runtime.status === "running") event.preventDefault();
      if (event.pointerType === "touch" && event.buttons === 0 && event.pressure === 0) return;
      runtime.pointerActive = true;
      updatePointerTarget(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      runtime.pointerActive = false;
      runtime.player.targetX = runtime.width * 0.18;
      runtime.player.targetY = runtime.height * 0.5;
    };

    const update = (delta: number, now: number) => {
      const deltaSeconds = delta / 1000;
      const ambientScale = reducedMotion.matches && runtime.status !== "running" ? 0.16 : 1;

      runtime.stars.forEach((star) => {
        star.x -= star.speed * deltaSeconds * ambientScale;
        if (star.x < -2) {
          star.x = runtime.width + 2;
          star.y = Math.random() * runtime.height;
        }
      });

      runtime.particles = runtime.particles.filter((particle) => {
        particle.life -= delta;
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;
        return particle.life > 0;
      });

      if (runtime.status !== "running") {
        runtime.player.targetX = runtime.width * 0.18;
        runtime.player.targetY = runtime.height * 0.5 + Math.sin(now / 700) * (reducedMotion.matches ? 0.5 : 2);
        runtime.player.x += (runtime.player.targetX - runtime.player.x) * 0.04;
        runtime.player.y += (runtime.player.targetY - runtime.player.y) * 0.04;
        runtime.player.tilt += (0 - runtime.player.tilt) * 0.08;
        return;
      }

      runtime.elapsed += deltaSeconds;
      runtime.invulnerable = Math.max(0, runtime.invulnerable - delta);
      const previousY = runtime.player.y;
      runtime.player.x += (runtime.player.targetX - runtime.player.x) * DAMPING;
      runtime.player.y += (runtime.player.targetY - runtime.player.y) * DAMPING;
      const targetTilt = clamp((runtime.player.y - previousY) * 0.08, -0.075, 0.075);
      runtime.player.tilt += (targetTilt - runtime.player.tilt) * 0.16;

      if (now - runtime.lastFire >= FIRE_INTERVAL && runtime.bullets.length < MAX_PLAYER_BULLETS) {
        runtime.lastFire = now;
        runtime.bullets.push({
          x: runtime.player.x + shipWidth() * 0.48,
          y: runtime.player.y,
          vx: 430,
          width: clamp(runtime.height * 0.1, 12, 18),
          height: 2,
        });
      }

      const spawnInterval = runtime.elapsed < 10 ? 1750 : runtime.elapsed < 30 ? 1400 : 1120;
      runtime.spawnCooldown -= delta;
      if (runtime.spawnCooldown <= 0) {
        spawnEnemy();
        runtime.spawnCooldown = spawnInterval * randomBetween(0.82, 1.18);
      }
      runtime.asteroidCooldown -= delta;
      if (runtime.asteroidCooldown <= 0) {
        spawnAsteroid();
        runtime.asteroidCooldown = randomBetween(3200, 5200);
      }

      runtime.bullets.forEach((bullet) => {
        bullet.x += bullet.vx * deltaSeconds;
      });
      runtime.enemyBullets.forEach((bullet) => {
        bullet.x += bullet.vx * deltaSeconds;
      });

      runtime.enemies.forEach((enemy) => {
        enemy.x += enemy.vx * deltaSeconds;
        enemy.y += Math.sin(runtime.elapsed * 1.6 + enemy.phase) * enemy.drift * deltaSeconds;
        enemy.nextFire -= delta;
        if (enemy.nextFire <= 0 && runtime.enemyBullets.length < MAX_ENEMY_BULLETS) {
          runtime.enemyBullets.push({
            x: enemy.x - (enemy.kind === "heavy" ? heavyWidth() : scoutWidth()) * 0.48,
            y: enemy.y,
            vx: -randomBetween(150, 205),
            width: 11,
            height: 3,
          });
          enemy.nextFire = randomBetween(1200, 2200);
        }
      });

      runtime.asteroids.forEach((asteroid) => {
        asteroid.x += asteroid.vx * deltaSeconds;
        asteroid.rotation += asteroid.rotationSpeed * deltaSeconds;
      });

      const playerSize = shipWidth();
      const playerBounds = {
        x: runtime.player.x - playerSize * 0.38,
        y: runtime.player.y - playerSize * 0.2,
        width: playerSize * 0.76,
        height: playerSize * 0.4,
      };

      runtime.bullets.forEach((bullet) => {
        if (bullet.x > runtime.width + 24) return;
        const bulletBounds = { x: bullet.x, y: bullet.y - 2, width: bullet.width, height: 4 };
        for (const enemy of runtime.enemies) {
          if (enemy.hp <= 0) continue;
          const size = enemy.kind === "heavy" ? heavyWidth() : scoutWidth();
          if (intersects(bulletBounds, { x: enemy.x - size * 0.5, y: enemy.y - size * 0.28, width: size, height: size * 0.56 })) {
            enemy.hp -= 1;
            bullet.x = runtime.width + 100;
            if (enemy.hp <= 0) {
              runtime.score += enemy.kind === "heavy" ? 240 : 100;
              addExplosion(enemy.x, enemy.y, "warm", enemy.kind === "heavy" ? 14 : 9);
              syncHud();
            }
            break;
          }
        }
        for (const asteroid of runtime.asteroids) {
          if (asteroid.hp <= 0) continue;
          if (intersects(bulletBounds, {
            x: asteroid.x - asteroid.size * 0.45,
            y: asteroid.y - asteroid.size * 0.45,
            width: asteroid.size * 0.9,
            height: asteroid.size * 0.9,
          })) {
            asteroid.hp -= 1;
            bullet.x = runtime.width + 100;
            if (asteroid.hp <= 0) {
              runtime.score += 40;
              addExplosion(asteroid.x, asteroid.y, "warm", 8);
              syncHud();
            }
            break;
          }
        }
      });

      runtime.enemyBullets.forEach((bullet) => {
        if (intersects(
          { x: bullet.x - bullet.width, y: bullet.y - 2, width: bullet.width, height: 4 },
          playerBounds,
        )) {
          bullet.x = -100;
          damagePlayer();
        }
      });

      runtime.enemies.forEach((enemy) => {
        if (enemy.hp <= 0) return;
        const size = enemy.kind === "heavy" ? heavyWidth() : scoutWidth();
        if (intersects(
          { x: enemy.x - size * 0.45, y: enemy.y - size * 0.25, width: size * 0.9, height: size * 0.5 },
          playerBounds,
        )) {
          enemy.hp = 0;
          addExplosion(enemy.x, enemy.y, "warm", 10);
          damagePlayer();
        }
      });

      runtime.asteroids.forEach((asteroid) => {
        if (asteroid.hp <= 0) return;
        if (intersects(
          {
            x: asteroid.x - asteroid.size * 0.4,
            y: asteroid.y - asteroid.size * 0.4,
            width: asteroid.size * 0.8,
            height: asteroid.size * 0.8,
          },
          playerBounds,
        )) {
          asteroid.hp = 0;
          addExplosion(asteroid.x, asteroid.y, "warm", 8);
          damagePlayer();
        }
      });

      runtime.bullets = runtime.bullets.filter((bullet) => bullet.x < runtime.width + 30);
      runtime.enemyBullets = runtime.enemyBullets.filter((bullet) => bullet.x > -30);
      runtime.enemies = runtime.enemies.filter((enemy) => enemy.x > -80 && enemy.hp > 0);
      runtime.asteroids = runtime.asteroids.filter((asteroid) => asteroid.x > -80 && asteroid.hp > 0);
    };

    const draw = (now: number) => {
      context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, runtime.width, runtime.height);
      context.fillStyle = "#0a0a0a";
      context.fillRect(0, 0, runtime.width, runtime.height);

      runtime.stars.forEach((star) => {
        context.globalAlpha = star.alpha;
        context.fillStyle = star.size === 2 ? "#d9e7ef" : "#85929d";
        context.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
      });
      context.globalAlpha = 1;

      if (runtime.status === "idle") {
        drawScout(context, {
          x: runtime.width * 0.72,
          y: runtime.height * 0.36,
          vx: 0,
          phase: 0,
          drift: 0,
          hp: 2,
          kind: "scout",
          nextFire: 0,
        }, scoutWidth() * 0.78, 0.36);
        drawAsteroid(context, {
          x: runtime.width * 0.84,
          y: runtime.height * 0.7,
          vx: 0,
          size: clamp(runtime.height * 0.18, 22, 30),
          rotation: now / 9000,
          rotationSpeed: 0,
          hp: 1,
        }, 0.5);
      }

      runtime.bullets.forEach((bullet) => {
        context.fillStyle = "#baffff";
        context.fillRect(Math.round(bullet.x), Math.round(bullet.y), Math.round(bullet.width), Math.max(1, Math.round(bullet.height)));
        context.fillStyle = "#36dfff";
        context.fillRect(Math.round(bullet.x - 3), Math.round(bullet.y), 4, Math.max(1, Math.round(bullet.height)));
      });

      runtime.enemyBullets.forEach((bullet) => {
        context.fillStyle = "#ff7338";
        context.fillRect(Math.round(bullet.x - bullet.width), Math.round(bullet.y), Math.round(bullet.width), Math.max(2, Math.round(bullet.height)));
      });

      runtime.enemies.forEach((enemy) => {
        if (enemy.kind === "heavy") drawHeavy(context, enemy, heavyWidth());
        else drawScout(context, enemy, scoutWidth());
      });
      runtime.asteroids.forEach((asteroid) => drawAsteroid(context, asteroid));

      runtime.particles.forEach((particle) => {
        context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x), Math.round(particle.y), Math.ceil(particle.size), Math.ceil(particle.size));
      });
      context.globalAlpha = 1;

      const playerAlpha = runtime.invulnerable > 0 && Math.floor(runtime.invulnerable / 90) % 2 === 0 ? 0.28 : 1;
      drawPlayer(
        context,
        runtime.player.x,
        runtime.player.y,
        shipWidth(),
        runtime.player.tilt,
        now,
        playerAlpha,
      );
    };

    const tick = (now: number) => {
      animationFrame = 0;
      if (!runtime.visible) return;
      const delta = Math.min(32, Math.max(0, now - runtime.lastFrame));
      runtime.lastFrame = now;
      update(delta, now);
      draw(now);
      animationFrame = window.requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);
    updateCanvasSize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      runtime.visible = entry.isIntersecting;
      if (runtime.visible && animationFrame === 0) {
        runtime.lastFrame = performance.now();
        animationFrame = window.requestAnimationFrame(tick);
      } else if (!runtime.visible && animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }, { rootMargin: "120px" });
    intersectionObserver.observe(container);

    container.addEventListener("pointerenter", handlePointerEnter);
    container.addEventListener("pointermove", handlePointerMove, { passive: false });
    container.addEventListener("pointerleave", handlePointerLeave);
    container.addEventListener("pointercancel", handlePointerLeave);

    return () => {
      startGameRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointerenter", handlePointerEnter);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("pointercancel", handlePointerLeave);
      if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section id="off-duty" className="space-game-section" aria-labelledby="space-game-title">
      <div className="page-container space-game-heading">
        <h2 id="space-game-title">OFF <span className="home-title-accent">DUTY</span></h2>
        <span aria-hidden="true">PIXEL FLIGHT / 01</span>
      </div>

      <div
        ref={containerRef}
        className={`space-game${status === "running" ? " is-running" : ""}`}
      >
        <canvas
          ref={canvasRef}
          className="space-game-canvas"
          role="img"
          aria-label="Interactive pixel space shooter"
          aria-describedby="space-game-instructions"
        />

        <p id="space-game-instructions" className="space-game-sr-only">
          Mouse or touch controls the ship. Shooting is automatic after starting the mission.
        </p>

        <div className={`space-game-hud${status === "idle" ? " is-hidden" : ""}`} aria-live="polite">
          <span>SCORE {String(score).padStart(6, "0")}</span>
          <span>HULL {String(hull).padStart(2, "0")}</span>
        </div>

        <div className={`space-game-overlay${status === "running" ? " is-hidden" : ""}`}>
          {status === "failed" ? (
            <div className="space-game-prompt">
              <strong>MISSION FAILED</strong>
              <button type="button" onClick={() => startGameRef.current?.()} aria-label="Retry space mission">
                [ RETRY ]
              </button>
            </div>
          ) : (
            <div className="space-game-prompt">
              <button type="button" onClick={() => startGameRef.current?.()} aria-label="Start space mission">
                [ START MISSION ]
              </button>
              <span>MOVE TO STEER · AUTO FIRE</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
