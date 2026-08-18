let topZIndex = 20;

function makeWindowDraggable(winEl) {
  const titlebar = winEl.querySelector(".window-titlebar");
  if (!titlebar) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function bringToFront() {
    topZIndex += 1;
    winEl.style.zIndex = topZIndex;
  }

  winEl.addEventListener("mousedown", bringToFront);

  titlebar.addEventListener("mousedown", (e) => {
    if (e.target.closest(".win-btn")) return;

    dragging = true;
    bringToFront();

    const rect = winEl.getBoundingClientRect();

    winEl.style.left = rect.left + "px";
    winEl.style.top = rect.top + "px";
    winEl.style.transform = "none";

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // Keep the window within the viewport
    const maxLeft = window.innerWidth - winEl.offsetWidth;
    const maxTop = window.innerHeight - winEl.offsetHeight - 50;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    winEl.style.left = newLeft + "px";
    winEl.style.top = newTop + "px";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
}

document.querySelectorAll(".app-window").forEach(makeWindowDraggable);

function updateClock() {
  const now = new Date();

  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  document.getElementById("clockTime").textContent = timeStr;
  document.getElementById("clockDate").textContent = dateStr;
}

updateClock();
setInterval(updateClock, 1000);

let cascadeCount = 0;

function openApp(id) {
  const win = document.getElementById(id);
  const wasHidden = win.classList.contains("hidden");
  win.classList.remove("hidden");
  topZIndex += 1;
  win.style.zIndex = topZIndex;

  if (wasHidden && !win.dataset.positioned) {
    const offset = (cascadeCount % 6) * 26;
    win.style.left = `calc(50% - ${win.offsetWidth / 2 - offset}px)`;
    win.style.top = `calc(50% - ${win.offsetHeight / 2 - offset}px)`;
    win.style.transform = "none";
    win.dataset.positioned = "true";
    cascadeCount += 1;
  }
}

function closeWindow(id) {
  document.getElementById(id).classList.add("hidden");
}

const terminalOutput = document.getElementById("terminalOutput");
const terminalInput = document.getElementById("terminalInput");

const TERMINAL_COMMANDS = {
  help: () =>
    "Available commands: help, about, date, whoami, ls, echo [text], clear, open [app]",
  about: () => "HabibiOS Dubai Edition - a custom desktop experience.",
  date: () => new Date().toString(),
  whoami: () => "habibi",
  ls: () => "Desktop  Downloads  Music  Documents  Pictures",
};

function runTerminalCommand(raw) {
  const input = raw.trim();
  if (!input) return "";

  const [cmd, ...rest] = input.split(" ");
  const arg = rest.join(" ");

  if (cmd === "clear") {
    terminalOutput.textContent = "";
    return null;
  }

  if (cmd === "echo") {
    return arg;
  }

  if (cmd === "open") {
    const appMap = {
      terminal: "terminalWindow",
      explorer: "explorerWindow",
      files: "explorerWindow",
      internet: "internetWindow",
      calculator: "calcWindow",
      calc: "calcWindow",
      music: "musicWindow",
      settings: "settingsWindow",
    };
    const target = appMap[arg.toLowerCase()];
    if (target) {
      openApp(target);
      return `Opening ${arg}...`;
    }
    return `App not found: ${arg}`;
  }

  if (TERMINAL_COMMANDS[cmd]) {
    return TERMINAL_COMMANDS[cmd]();
  }

  return `'${cmd}' is not recognized as a command. Type "help" for a list.`;
}

if (terminalInput) {
  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = terminalInput.value;
      terminalOutput.textContent += `\nhabibi@dubai:~$ ${value}`;
      const result = runTerminalCommand(value);
      if (result !== null && result !== undefined) {
        terminalOutput.textContent += `\n${result}`;
      }
      terminalOutput.textContent += "\n";
      terminalInput.value = "";
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  });
}

const FILE_DATA = {
  desktop: ["Notes.txt", "Project.docx", "Shortcut.lnk"],
  downloads: ["setup.exe", "photo1.jpg", "report.pdf", "archive.zip"],
  music: ["track01.mp3", "track02.mp3", "playlist.m3u"],
  documents: ["Resume.docx", "Budget.xlsx", "Ideas.txt"],
  pictures: ["skyline.png", "vacation.jpg", "screenshot.png"],
};

const FILE_ICONS = {
  txt: "📄", docx: "📝", xlsx: "📊", lnk: "🔗",
  exe: "⚙️", jpg: "🖼️", png: "🖼️", pdf: "📕",
  zip: "🗜️", mp3: "🎵", m3u: "🎶",
};

function getFileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || "📄";
}

function renderExplorerTab(tab) {
  const container = document.getElementById("explorerFiles");
  container.innerHTML = "";
  const files = FILE_DATA[tab] || [];

  files.forEach((name) => {
    const fileEl = document.createElement("div");
    fileEl.className = "explorer-file";
    fileEl.innerHTML = `<div class="file-icon">${getFileIcon(name)}</div><span>${name}</span>`;
    container.appendChild(fileEl);
  });

  if (files.length === 0) {
    container.innerHTML = "<p>This folder is empty.</p>";
  }
}

document.querySelectorAll(".explorer-tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    document.querySelectorAll(".explorer-tab").forEach((t) => t.classList.remove("active"));
    tabBtn.classList.add("active");
    renderExplorerTab(tabBtn.dataset.tab);
  });
});

renderExplorerTab("desktop");


let musicDB = null;
let currentPlayingId = null;

function openMusicDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("habibiOSMusicDB", 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function addSongToDB(file) {
  return new Promise((resolve, reject) => {
    const tx = musicDB.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const request = store.add({ name: file.name, blob: file });
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function deleteSongFromDB(id) {
  return new Promise((resolve, reject) => {
    const tx = musicDB.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllSongs() {
  return new Promise((resolve, reject) => {
    const tx = musicDB.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function renderMusicList() {
  const listEl = document.getElementById("musicList");
  const songs = await getAllSongs();

  if (songs.length === 0) {
    listEl.innerHTML = '<p class="music-empty">No songs uploaded yet.</p>';
    return;
  }

  listEl.innerHTML = "";
  songs.forEach((song) => {
    const item = document.createElement("div");
    item.className = "music-item" + (song.id === currentPlayingId ? " playing" : "");

    item.innerHTML = `
      <span class="track-name">🎵 ${song.name}</span>
      <span class="delete-track" data-id="${song.id}">✕</span>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-track")) return;
      playSong(song);
    });

    item.querySelector(".delete-track").addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteSongFromDB(song.id);
      if (currentPlayingId === song.id) {
        audioPlayer.pause();
        audioPlayer.src = "";
        currentPlayingId = null;
        document.getElementById("nowPlaying").textContent = "Nothing playing";
      }
      renderMusicList();
    });

    listEl.appendChild(item);
  });
}

const audioPlayer = document.getElementById("audioPlayer");

function playSong(song) {
  const url = URL.createObjectURL(song.blob);
  audioPlayer.src = url;
  audioPlayer.play();
  currentPlayingId = song.id;
  document.getElementById("nowPlaying").textContent = "Now playing: " + song.name;
  renderMusicList();
}

const musicUpload = document.getElementById("musicUpload");
if (musicUpload) {
  musicUpload.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      await addSongToDB(file);
    }
    musicUpload.value = "";
    renderMusicList();
  });
}

openMusicDB().then((db) => {
  musicDB = db;
  renderMusicList();
});


const backgroundEl = document.querySelector(".background");
const bgPreview = document.getElementById("bgPreview");
const bgUpload = document.getElementById("bgUpload");

function applyBackground(dataUrl) {
  backgroundEl.style.backgroundImage = `url('${dataUrl}')`;
  bgPreview.style.backgroundImage = `url('${dataUrl}')`;
}

const savedBackground = localStorage.getItem("habibiOSBackground");
if (savedBackground) {
  applyBackground(savedBackground);
}

if (bgUpload) {
  bgUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      applyBackground(reader.result);
      localStorage.setItem("habibiOSBackground", reader.result);
    };
    reader.readAsDataURL(file);
  });
}


const notepadArea = document.getElementById("notepadArea");
const notepadStatus = document.getElementById("notepadStatus");
const notepadClear = document.getElementById("notepadClear");

if (notepadArea) {
  const savedNote = localStorage.getItem("habibiOSNotepad");
  if (savedNote !== null) notepadArea.value = savedNote;

  let saveTimeout = null;
  notepadArea.addEventListener("input", () => {
    notepadStatus.textContent = "Saving...";
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem("habibiOSNotepad", notepadArea.value);
      notepadStatus.textContent = "Saved";
    }, 400);
  });

  notepadClear.addEventListener("click", () => {
    notepadArea.value = "";
    localStorage.removeItem("habibiOSNotepad");
    notepadStatus.textContent = "Saved";
    notepadArea.focus();
  });
}


const paintCanvas = document.getElementById("paintCanvas");

if (paintCanvas) {
  const ctx = paintCanvas.getContext("2d");
  const paintColor = document.getElementById("paintColor");
  const paintSize = document.getElementById("paintSize");
  const paintClear = document.getElementById("paintClear");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function getCanvasPos(e) {
    const rect = paintCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (paintCanvas.width / rect.width),
      y: (clientY - rect.top) * (paintCanvas.height / rect.height),
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const pos = getCanvasPos(e);
    lastX = pos.x;
    lastY = pos.y;
    e.preventDefault();
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getCanvasPos(e);

    ctx.strokeStyle = paintColor.value;
    ctx.lineWidth = paintSize.value;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
    e.preventDefault();
  }

  function stopDraw() {
    isDrawing = false;
  }

  paintCanvas.addEventListener("mousedown", startDraw);
  paintCanvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stopDraw);

  paintCanvas.addEventListener("touchstart", startDraw);
  paintCanvas.addEventListener("touchmove", draw);
  window.addEventListener("touchend", stopDraw);

  paintClear.addEventListener("click", () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
  });
}


const mineGridEl = document.getElementById("mineGrid");

if (mineGridEl) {
  const MINE_ROWS = 9;
  const MINE_COLS = 9;
  const MINE_COUNT = 10;

  const mineCounterEl = document.getElementById("mineCounter");
  const mineTimerEl = document.getElementById("mineTimer");
  const mineFaceEl = document.getElementById("mineFace");
  const mineStatsEl = document.getElementById("mineStats");

  let board = [];
  let cellEls = [];
  let flagsPlaced = 0;
  let revealedCount = 0;
  let gameOver = false;
  let gameStarted = false;
  let timerInterval = null;
  let seconds = 0;

  function loadStats() {
    const raw = localStorage.getItem("habibiOSMineStats");
    return raw ? JSON.parse(raw) : { wins: 0, losses: 0, bestTime: null };
  }

  function saveStats(stats) {
    localStorage.setItem("habibiOSMineStats", JSON.stringify(stats));
  }

  function renderStats() {
    const stats = loadStats();
    const best = stats.bestTime !== null ? stats.bestTime + "s" : "--";
    mineStatsEl.textContent = `Wins: ${stats.wins} | Losses: ${stats.losses} | Best Time: ${best}`;
  }

  function inBounds(r, c) {
    return r >= 0 && r < MINE_ROWS && c >= 0 && c < MINE_COLS;
  }

  function neighbors(r, c) {
    const result = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (inBounds(r + dr, c + dc)) result.push([r + dr, c + dc]);
      }
    }
    return result;
  }

  function placeMines(excludeR, excludeC) {
    let placed = 0;
    while (placed < MINE_COUNT) {
      const r = Math.floor(Math.random() * MINE_ROWS);
      const c = Math.floor(Math.random() * MINE_COLS);
      if (board[r][c].mine) continue;
      if (Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1) continue;
      board[r][c].mine = true;
      placed++;
    }

    for (let r = 0; r < MINE_ROWS; r++) {
      for (let c = 0; c < MINE_COLS; c++) {
        if (board[r][c].mine) continue;
        board[r][c].count = neighbors(r, c).filter(([nr, nc]) => board[nr][nc].mine).length;
      }
    }
  }

  function startTimer() {
    seconds = 0;
    mineTimerEl.textContent = "⏱ 0";
    timerInterval = setInterval(() => {
      seconds++;
      mineTimerEl.textContent = "⏱ " + seconds;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function buildBoard() {
    board = [];
    cellEls = [];
    flagsPlaced = 0;
    revealedCount = 0;
    gameOver = false;
    gameStarted = false;
    stopTimer();
    mineTimerEl.textContent = "⏱ 0";
    mineFaceEl.textContent = "🙂";
    mineCounterEl.textContent = "🚩 " + MINE_COUNT;

    mineGridEl.innerHTML = "";

    for (let r = 0; r < MINE_ROWS; r++) {
      const row = [];
      const cellRow = [];
      for (let c = 0; c < MINE_COLS; c++) {
        row.push({ mine: false, count: 0, revealed: false, flagged: false });

        const cellEl = document.createElement("div");
        cellEl.className = "mine-cell";
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        cellEl.addEventListener("click", () => handleCellClick(r, c));
        cellEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          handleFlag(r, c);
        });

        mineGridEl.appendChild(cellEl);
        cellRow.push(cellEl);
      }
      board.push(row);
      cellEls.push(cellRow);
    }

    renderStats();
  }

  function revealCell(r, c) {
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    revealedCount++;
    const el = cellEls[r][c];
    el.classList.add("revealed");

    if (cell.mine) {
      el.classList.add("mine");
      el.textContent = "💣";
      return;
    }

    if (cell.count > 0) {
      el.textContent = cell.count;
      el.dataset.count = cell.count;
    } else {
      neighbors(r, c).forEach(([nr, nc]) => revealCell(nr, nc));
    }
  }

  function handleCellClick(r, c) {
    if (gameOver) return;
    const cell = board[r][c];
    if (cell.flagged || cell.revealed) return;

    if (!gameStarted) {
      placeMines(r, c);
      gameStarted = true;
      startTimer();
    }

    if (cell.mine) {
      revealAllMines();
      endGame(false);
      return;
    }

    revealCell(r, c);
    checkWin();
  }

  function handleFlag(r, c) {
    if (gameOver) return;
    const cell = board[r][c];
    if (cell.revealed) return;

    if (!gameStarted) return;

    cell.flagged = !cell.flagged;
    flagsPlaced += cell.flagged ? 1 : -1;
    cellEls[r][c].classList.toggle("flagged");
    cellEls[r][c].textContent = cell.flagged ? "🚩" : "";
    mineCounterEl.textContent = "🚩 " + (MINE_COUNT - flagsPlaced);
  }

  function revealAllMines() {
    for (let r = 0; r < MINE_ROWS; r++) {
      for (let c = 0; c < MINE_COLS; c++) {
        if (board[r][c].mine) {
          cellEls[r][c].classList.add("revealed", "mine");
          cellEls[r][c].textContent = "💣";
        }
      }
    }
  }

  function checkWin() {
    const totalSafeCells = MINE_ROWS * MINE_COLS - MINE_COUNT;
    if (revealedCount === totalSafeCells) {
      endGame(true);
    }
  }

  function endGame(won) {
    gameOver = true;
    stopTimer();
    mineFaceEl.textContent = won ? "😎" : "💀";

    const stats = loadStats();
    if (won) {
      stats.wins++;
      if (stats.bestTime === null || seconds < stats.bestTime) {
        stats.bestTime = seconds;
      }
    } else {
      stats.losses++;
    }
    saveStats(stats);
    renderStats();
  }

  mineFaceEl.addEventListener("click", buildBoard);

  buildBoard();
}

const calcDisplay = document.getElementById("calcDisplay");
let calcExpression = "";

document.querySelectorAll(".calc-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.val;

    if (val === "C") {
      calcExpression = "";
      calcDisplay.value = "0";
      return;
    }

    if (val === "=") {
      try {
        const result = Function(`"use strict"; return (${calcExpression})`)();
        calcDisplay.value = result;
        calcExpression = String(result);
      } catch (err) {
        calcDisplay.value = "Error";
        calcExpression = "";
      }
      return;
    }

    calcExpression += val;
    calcDisplay.value = calcExpression;
  });
});