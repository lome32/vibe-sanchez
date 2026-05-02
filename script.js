(function () {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  var canvas = document.getElementById("starfield");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointer = { x: 0, y: 0 };
  var stars = [];
  var shootingStar = null;
  var animationFrame = null;
  var scrollScene = document.querySelector(".planet-scroll");
  var scrollAnimationFrame = null;
  var copyCards = document.querySelectorAll(".copy-card");

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function smoothstep(value) {
    var x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = window.innerWidth;
    var height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var starCount = Math.round(Math.min(190, Math.max(80, (width * height) / 7600)));
    stars = Array.from({ length: starCount }, function (_, index) {
      return {
        x: random(0, width),
        y: random(0, height),
        size: Math.random() > 0.86 ? 2 : 1,
        alpha: random(0.28, 0.88),
        pulse: random(0.002, 0.008),
        phase: random(0, Math.PI * 2),
        drift: index % 5 === 0 ? random(0.04, 0.12) : 0
      };
    });

    if (reduceMotion) {
      draw(0);
    }

    updateScrollScene();
  }

  function spawnShootingStar(width, height) {
    if (shootingStar || Math.random() > 0.008) {
      return;
    }

    shootingStar = {
      x: random(width * 0.55, width * 0.95),
      y: random(20, height * 0.36),
      vx: random(-8, -5),
      vy: random(4, 6),
      life: 0,
      maxLife: random(34, 52)
    };
  }

  function draw(timestamp) {
    var width = window.innerWidth;
    var height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(7, 8, 13, 0.74)";
    ctx.fillRect(0, 0, width, height);

    var parallaxX = pointer.x * 8;
    var parallaxY = pointer.y * 8;

    stars.forEach(function (star) {
      var twinkle = reduceMotion ? 1 : Math.sin(timestamp * star.pulse + star.phase);
      var alpha = Math.max(0.16, Math.min(0.95, star.alpha + twinkle * 0.18));
      var x = star.x + parallaxX * (star.size * 0.12);
      var y = star.y + parallaxY * (star.size * 0.12);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.size === 2 ? "#ffd36d" : "#f6f1df";
      ctx.fillRect(Math.round(x), Math.round(y), star.size, star.size);

      if (!reduceMotion && star.drift) {
        star.x += star.drift;
        if (star.x > width + 4) {
          star.x = -4;
        }
      }
    });

    ctx.globalAlpha = 1;

    if (!reduceMotion) {
      spawnShootingStar(width, height);

      if (shootingStar) {
        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;
        shootingStar.life += 1;

        var fade = 1 - shootingStar.life / shootingStar.maxLife;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = "#8df6ff";
        ctx.fillRect(Math.round(shootingStar.x), Math.round(shootingStar.y), 38, 2);
        ctx.fillStyle = "#f6f1df";
        ctx.fillRect(Math.round(shootingStar.x + 36), Math.round(shootingStar.y), 4, 4);
        ctx.globalAlpha = 1;

        if (shootingStar.life >= shootingStar.maxLife) {
          shootingStar = null;
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  function onPointerMove(event) {
    pointer.x = event.clientX / window.innerWidth - 0.5;
    pointer.y = event.clientY / window.innerHeight - 0.5;
  }

  function updateScrollScene() {
    if (!scrollScene) {
      return;
    }

    var rect = scrollScene.getBoundingClientRect();
    var width = window.innerWidth;
    var height = window.innerHeight;
    var totalScroll = Math.max(1, rect.height - height);
    var progress = clamp(-rect.top / totalScroll, 0, 1);

    if (reduceMotion) {
      progress = progress > 0.45 ? 1 : 0;
    }

    var centerProgress = smoothstep(progress / 0.48);
    var earlyGrow = smoothstep((progress - 0.08) / 0.42);
    var lateGrow = smoothstep((progress - 0.46) / 0.54);
    var messageProgress = smoothstep((progress - 0.72) / 0.2);
    var orbitOpacity = 1 - smoothstep((progress - 0.28) / 0.3);
    var planetSize = width <= 540 ? 172 : 252;
    var diagonal = Math.sqrt(width * width + height * height);
    var finalScale = Math.max(width <= 540 ? 7.4 : 7.8, (diagonal / planetSize) * 1.38);
    var centerScale = 1 + earlyGrow * 1.25;
    var scale = lerp(centerScale, finalScale, lateGrow);
    var startX = width * (width <= 540 ? 0.34 : 0.31);
    var startY = -height * (width <= 540 ? 0.035 : 0.02);

    scrollScene.style.setProperty("--planet-x", lerp(startX, 0, centerProgress) + "px");
    scrollScene.style.setProperty("--planet-y", lerp(startY, 0, centerProgress) + "px");
    scrollScene.style.setProperty("--planet-scale", scale.toFixed(3));
    scrollScene.style.setProperty("--orbit-opacity", Math.max(0, orbitOpacity).toFixed(3));
    scrollScene.style.setProperty("--message-opacity", messageProgress.toFixed(3));
    scrollScene.style.setProperty("--message-y", lerp(34, 0, messageProgress).toFixed(1) + "px");
    scrollScene.classList.toggle("is-final", messageProgress > 0.72);
  }

  function requestScrollSceneUpdate() {
    if (scrollAnimationFrame) {
      return;
    }

    scrollAnimationFrame = window.requestAnimationFrame(function () {
      scrollAnimationFrame = null;
      updateScrollScene();
    });
  }

  function fallbackCopy(text) {
    var input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    fallbackCopy(text);
    return Promise.resolve();
  }

  function showCopyState(card, label) {
    var stateLabel = card.querySelector(".copy-state span");
    var originalText = stateLabel ? stateLabel.textContent : "";

    card.classList.add("is-copied");

    if (stateLabel) {
      stateLabel.textContent = label;
    }

    window.setTimeout(function () {
      card.classList.remove("is-copied");

      if (stateLabel) {
        stateLabel.textContent = originalText || "Copy";
      }
    }, 2200);
  }

  copyCards.forEach(function (card) {
    card.addEventListener("click", function () {
      var email = card.getAttribute("data-copy-email");

      if (!email) {
        return;
      }

      copyText(email)
        .then(function () {
          showCopyState(card, "Copied");
        })
        .catch(function () {
          showCopyState(card, "Copy failed");
        });
    });
  });

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", requestScrollSceneUpdate, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  resize();

  if (!reduceMotion) {
    animationFrame = window.requestAnimationFrame(draw);
  }

  window.addEventListener("pagehide", function () {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }

    if (scrollAnimationFrame) {
      window.cancelAnimationFrame(scrollAnimationFrame);
    }
  });
})();
