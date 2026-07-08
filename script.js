let audioContext = null;

let noMoveSec = 0;
let alertSec = 0;
let timer = null;
let monitoring = false;
let alerting = false;
let notified = false;

const START_ALERT = 15;   // デモ用。本番は300
const MOVE_DIFF_THRESHOLD = 1.2;

const startButton = document.getElementById("startButton");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");

let lastPower = null;

startButton.addEventListener("click", async function () {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    const permission = await DeviceMotionEvent.requestPermission();
    if (permission !== "granted") {
      alert("モーションセンサが許可されませんでした");
      return;
    }
  }

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  audioContext.resume();

  startMonitoring();
});

function startMonitoring() {
  monitoring = true;
  alerting = false;
  notified = false;
  noMoveSec = 0;
  alertSec = 0;
  lastPower = null;

  statusText.innerText = "監視中";
  timerText.innerText = "00:00";
  document.body.style.background = "#eef5e9";

  clearInterval(timer);

  timer = setInterval(function () {
    noMoveSec++;

    let m = Math.floor(noMoveSec / 60);
    let s = noMoveSec % 60;

    timerText.innerText =
      String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

    if (noMoveSec >= START_ALERT) {
      alerting = true;
      runAlert();
    }
  }, 1000);
}

function runAlert() {
  alertSec++;

  statusText.innerText = notified
    ? "🚨 通知済み：動くまで警告を継続中"
    : "⚠ アラート中：スマホを動かすと解除";

  document.body.style.background =
    alertSec % 2 === 0 ? "#fff3cd" : "#ffebee";

  let progress = Math.min(alertSec / 20, 1);
  let beepCount = 1 + Math.floor(progress * 4);

  for (let i = 0; i < beepCount; i++) {
    setTimeout(function () {
      beep(0.08 + progress * 0.45);
    }, i * 180);
  }

  if (!notified && alertSec >= 16) {
    notified = true;
    showNotificationPopup("🚨 緊急通知", "農作業者の反応がありません。<br>登録連絡先へ通知しました。", "#d32f2f");
  }
}

function resetByMovement() {
  if (!monitoring) return;

  const wasNotified = notified;

  noMoveSec = 0;
  alertSec = 0;
  alerting = false;
  notified = false;

  timerText.innerText = "00:00";
  statusText.innerText = "監視中";
  document.body.style.background = "#eef5e9";

  if (wasNotified) {
    showNotificationPopup("✅ 解除通知", "農作業者の動きを確認しました。<br>警告を解除しました。", "#4caf50");
  }
}

window.addEventListener("devicemotion", function (event) {
  if (!monitoring) return;

  const a = event.accelerationIncludingGravity;
  if (!a) return;

  const power =
    Math.abs(a.x || 0) +
    Math.abs(a.y || 0) +
    Math.abs(a.z || 0);

  if (lastPower === null) {
    lastPower = power;
    return;
  }

  const diff = Math.abs(power - lastPower);
  lastPower = power;

  if (diff > MOVE_DIFF_THRESHOLD) {
    resetByMovement();
  }
});

function beep(volume) {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.value = 1000;
  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(audioContext.currentTime + 0.15);
}

function showNotificationPopup(title, body, color) {
  const popup = document.createElement("div");

  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 85%;
      max-width: 360px;
      background: white;
      border-left: 8px solid ${color};
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.25);
      z-index: 9999;
      text-align: left;
      font-family: sans-serif;
    ">
      <strong style="font-size:18px;">${title}</strong>
      <p style="margin:8px 0 0; font-size:15px;">
        ${body}
      </p>
    </div>
  `;

  document.body.appendChild(popup);

  setTimeout(function () {
    popup.remove();
  }, 5000);
}
