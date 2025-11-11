// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Feny
// KELAS: Batch Repetition
// TANGGAL: 2025-11-06
// ============================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// =============================
// BUAT USER PROFILE OBJECT
// =============================

const userProfile = {
  name: 'Feny',
  joinedAt: new Date().toISOString(),
  totalHabits: 0,
  completedThisWeek: 0,

  updateStats(habits) {
    const total = habits.length;
    const today = new Date();
    const sevenDays = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      sevenDays.push(formatDate(d));
    }
    this.completedThisWeek = habits.reduce((acc, habit) => {
      const count = (habit.doneDates ?? []).filter((a) =>
        sevenDays.includes(a)
      ).length;
      return acc + (count > 0 ? 1 : 0);
    }, 0);

    this.totalHabits = total;
  },

  getDaysJoined() {
    const joined = new Date(this.joinedAt);
    const now = new Date();
    const timeDiff = now - joined;
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  },
};

// =========================
// BUAT HABIT CLASS
// =========================

class Habit {
  constructor(id, habitName, targetFrequency) {
    this.id = id;
    this.habitName = habitName;
    this.targetFrequency = targetFrequency;
    this.completions = [];
    this.createdAt = new Date().toISOString();
  }

  markComplete() {
    const today = new Date().toISOString();
    if (!this.completions.includes(today)) {
      this.completions.push(today);
      console.log(
        `Kebiasaan "${this.habitName}" berhasil diselesaikan pada ${today}.`
      );
    } else {
      console.log(`Kebiasaan "${this.habitName}" sudah diselesaikan hari ini`);
    }
  }
  getThisWeeekCompletions() {
    const today = new Date();
    const sevenDays = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      sevenDays.push(d.toISOString());
    }
    return this.completions.filter((date) => sevenDays.includes(date));
  }

  isCompletedThisWeek() {
    return this.getThisWeeekCompletions().length >= this.targetFrequency;
  }

  getProgressPercentage() {
    const completed = this.getThisWeeekCompletions().length; // jumlah pencapaian minggu ini
    const progress = (completed / this.targetFrequency) * 100;
    return Math.min(progress, 100);
  }

  getStatus() {
    const progress = this.getProgressPercentage();
    if (progress === 100) return 'Done in Week';
    if (progress >= 50) return 'Keep Going';
    return 'Go Go!';
  }
}

// =========================
//  BUAT HABIT TRACKER CLASS
// =========================

class HabitTracker {
  constructor() {
    this.habits = [];
    this.reminderInterval = null;
    this.loadFromFile();
  }

  // CRUD Operations
  addHabit(habitName, frequency) {
    const id = this.habits.length + 1;
    const newHabit = new Habit(id, habitName, frequency);
    this.habits.push(newHabit);
    console.log(`Habit "${habitName}" berhasil ditambahkan!\n
  `);
    this.saveToFile();
  }

  completeHabit(index) {
    const habit = this.habits[index] ?? null;
    if (habit) habit.markComplete();
    else console.log('Habit tidak ditemukan.');
  }

  deleteHabits(index) {
    if (index >= 0 && index < this.habits.length) {
      console.log(`Habit ${this.habits[index].habitName}" dihapus.`);
      this.habits.splice(index, 1);
      this.saveToFile();
    } else {
      console.log('Index habit tidak valid.');
    }
  }

  // Display Methods
  displayProfile() {
    userProfile.updateStats(this.habits);
    console.log('\n==== PROFIL HABIT TRACKER ====');
    console.log(`Nama: ${userProfile.name}`);
    console.log(`Bergabung: ${userProfile.getDaysJoined()} hari lalu`);
    console.log(`Total Habit: ${this.habits.length}`);
    console.log(`Completed Minggu Ini: ${userProfile.completedThisWeek}`);
    console.log(`Tanggal sekarang: ${new Date().toLocaleDateString()}`);
    console.log('================================\n');
  }

  displayHabits(filter) {
    const filtered = this.habits.filter((h) =>
      filter === 'completed' ? h.isCompletedThisWeek() : true
    );
    if (filtered.length === 0) {
      console.log('😴 Belum ada habit.');
      return;
    }
    filtered.forEach((h, i) => {
      const progress = h.getProgressPercentage();
      const bar = generateProgressBar(progress);
      console.log(`${i + 1}.${h.habitName}`);
    });
    console.log('================================\n');
  }

  displayHabitsWithWhile() {
    let i = 0;
    while (i < this.habits.length) {
      console.log(`${i + 1}. ${this.habits[i].habitName}`);
      i++;
    }
    console.log('================================\n');
  }

  displayHabitsWithFor() {
    console.log('\n Daftar Habit :');
    for (let i = 0; i < this.habits.length; i++) {
      console.log(`${i + 1}. ${this.habits[i].habitName}`);
    }
    console.log('================================\n');
  }
  displayStats() {
    const avgProgress =
      this.habits.reduce((acc, h) => acc + h.getProgressPercentage(), 0) /
      (this.habits.length || 1);
    console.log(`📊 Rata-rata progress: ${avgProgress.toFixed(1)}%`);
    console.log(`🔥 Total habit aktif: ${this.habits.length}\n`);
  }

  startReminder() {
    if (this.reminderInterval) return;
    this.reminderInterval = setInterval(
      () => this.showReminder(),
      REMINDER_INTERVAL
    );
  }

  showReminder() {
    const active = this.habits.filter((h) => !h.isCompletedThisWeek());
    if (active.length > 0) {
      const randomHabit = active[Math.floor(Math.random() * active.length)];
      console.log(
        `⏰ Reminder: Jangan lupa "${randomHabit.habitName}" hari ini!\n`
      );
    }
  }

  stopReminder() {
    clearInterval(this.reminderInterval);
  }

  saveToFile() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.habits, null, 2));
  }

  loadFromFile() {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      this.habits = JSON.parse(data).map(
        (h) => new Habit(h.id, h.habitName, h.targetFrequency)
      );
    }
  }
}

// CLI Functions
function askQuestion(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function displayMenu(tracker) {
  console.log(`
==================================================
🌟 HABIT TRACKER - MENU
==================================================
1. Lihat Profil
2. Lihat Semua Kebiasaan
3. Lihat Kebiasaan Aktif
4. Lihat Kebiasaan Selesai
5. Tambah Kebiasaan Baru
6. Tandai Kebiasaan Selesai
7. Hapus Kebiasaan
8. Lihat Statistik
0. Keluar
==================================================
`);

  const choice = await askQuestion('Pilih menu: ');
  switch (choice.trim()) {
    case '1':
      tracker.displayProfile();
      break;
    case '2':
      tracker.displayHabits();
      break;
    case '3':
      tracker.displayHabits('active');
      break;
    case '4':
      tracker.displayHabits('completed');
      break;
    case '5':
      const name = await askQuestion('Nama kebiasaan: ');
      const freq = await askQuestion('Target per minggu: ');
      tracker.addHabit(name, Number(freq));
      break;
    case '6':
      const index = await askQuestion('Nomor kebiasaan yang diselesaikan: ');
      tracker.completeHabit(Number(index) - 1);
      break;
    case '7':
      const del = await askQuestion('Nomor kebiasaan yang ingin dihapus: ');
      tracker.deleteHabit(Number(del) - 1);
      break;
    case '8':
      tracker.displayStats();
      break;
    case '0':
      tracker.stopReminder();
      console.log('Terima kasih telah menggunakan Habit Tracker!');
      rl.close();
      return;
    default:
      console.log('Pilihan tidak valid.');
  }

  await displayMenu(tracker);
}

// MAIN
async function main() {
  console.log('\n Selamat datang di Habit Tracker CLI dengan Progress Bar!\n');
  const tracker = new HabitTracker();
  tracker.startReminder();
  await displayMenu(tracker);
}

main();

// ======================
// For Testing
// ======================
const tracker = new HabitTracker();
tracker.addHabit('Minum Air 8 Gelas', 7);

tracker.addHabit('Olahraga', 3);
tracker.addHabit('Baca Buku', 5);

// Tandai beberapa habit selesai
tracker.habits[0].completions = [1, 1, 1]; // Minum Air (3x/7)
tracker.habits[1].completions = [1, 1, 1, 1, 1]; // Baca Buku (5x/5)
tracker.habits[2].completions = [1]; // Olahraga (1x/3)

// Menu
console.log(`
==================================================
HABIT TRACKER - MAIN MENU
==================================================
1. Lihat Profil
2. Lihat Semua Kebiasaan
3. Lihat Kebiasaan Aktif
4. Lihat Kebiasaan Selesai
5. Tambah Kebiasaan Baru
6. Tandai Kebiasaan Selesai
7. Hapus Kebiasaan
8. Lihat Statistik
9. Demo Loop (while/for)
0. Keluar
==================================================
`);

// Lihat Profil
console.log('### PROFIL PENGGUNA');
console.log(`
Nama: Feny
Total Habit: ${tracker.habits.length}
Habit Selesai: ${
  tracker.habits.filter((h) => h.getProgressPercentage() === 100).length
}
`);

// Lihat semua kebiasaan
console.log('\n### DAFTAR SEMUA KEBIASAAN:');
tracker.habits.forEach((habit, index) => {
  const status = habit.getProgressPercentage() === 100 ? 'Selesai' : 'Aktif';
  const filled = '█'.repeat(Math.floor(habit.getProgressPercentage() / 10));
  const empty = '░'.repeat(10 - Math.floor(habit.getProgressPercentage() / 10));
  console.log(`
${index + 1}. [${status}] ${habit.habitName}
   Target: ${habit.targetFrequency}x/minggu
   Progress: ${habit.completions.length}/${
    habit.targetFrequency
  } (${habit.getProgressPercentage()}%)
   Progress Bar: ${filled}${empty} ${habit.getProgressPercentage()}%
`);
});

// reminder
console.log(`
==================================================
REMINDER: Jangan lupa "Minum Air 8 Gelas"!
==================================================
`);

//  Demo Loop
console.log('\n### DEMO LOOP (While & For)\n');

// While loop
console.log('🔁 Using While Loop:');
let i = 0;
while (i < tracker.habits.length) {
  console.log(`${i + 1}. ${tracker.habits[i].habitName}`);
  i++;
}

// For loop
console.log('\n🔁 Using For Loop:');
for (let j = 0; j < tracker.habits.length; j++) {
  console.log(`${j + 1}. ${tracker.habits[j].habitName}`);
}

console.log('\n==================================================');
console.log('DEMO SELESAI ✅');
console.log('==================================================\n');
