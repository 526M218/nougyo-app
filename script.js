let audioContext = null;

let sec = 0;
let timer = null;

const START_ALERT = 15;   // デモ用：15秒でアラート開始
const ALERT_LENGTH = 60;  // 1分かけて強くなる
const NOTIFY_TIME = START_ALERT + ALERT_LENGTH;

const startButton = document.getElementById("startButton");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");

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

  statusText.innerText = "監視中";
  document.body.style.background = "#eef5e9";

  sec = 0;
  timerText.innerText = "00:00";

  clearInterval(timer);

  timer = setInterval(function () {
    sec++;

    let m = Math.floor(sec / 60);
    let s = sec % 60;

    timerText.innerText =
      String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

    if (sec >= START_ALERT && sec < NOTIFY_TIME) {
      let alertTime = sec - START_ALERT;
      let remain = NOTIFY_TIME - sec;
      let progress = alertTime / ALERT_LENGTH;

      statusText.innerText =
        "⚠ アラート中：通知まであと " + remain + " 秒";

      // 点滅
      if (sec % 2 === 0) {
        document.body.style.background = "#fff3cd";
      } else {
        document.body.style.background = "#ffebee";
      }

      // 最初は1秒に1回、最後は1秒に5回
let beepCount = 1 + Math.floor(progress * 4); // 1〜5回

for (let i = 0; i < beepCount; i++) {
  setTimeout(function () {
    beep(0.08 + progress * 0.45);
  }, i * 180);
}
    }


    if (sec >= NOTIFY_TIME) {
      statusText.innerText = "🚨 通知済み";
      document.body.style.background = "#ffcdd2";
      clearInterval(timer);
    }
  }, 1000);
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

window.addEventListener("devicemotion", function (event) {
  const a = event.accelerationIncludingGravity;
  if (!a) return;

  const power =
    Math.abs(a.x || 0) +
    Math.abs(a.y || 0) +
    Math.abs(a.z || 0);

  // 大きく動いたらリセット
  if (sec >= START_ALERT && power > 25) {
    sec = 0;
    statusText.innerText = "監視中";
    timerText.innerText = "00:00";
    document.body.style.background = "#eef5e9";
  }
});