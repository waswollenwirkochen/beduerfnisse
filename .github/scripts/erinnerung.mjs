// Schickt die abendliche Erinnerung an die installierte App.
// Enthält keine Tagebuch-Inhalte – nur einen allgemeinen Text.
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BD44RR5y0UlGAMQAirPD8RvpxMtok67YuX3NzFDIFFvcEpY4Frri-gFR1dqCbWBQcNDWpXlOAskgmGcHPppnzwU';
const MESSAGES = [
  'Wie war dein Tag? Zwei Minuten für dich 🌙',
  'Was hast du dir heute erfüllt?',
  'Kurzer Blick nach innen: Was hat sich heute gut angefühlt? ✨',
  'Zeit für deinen Abend-Check-in 🌲',
  'Gab es heute einen Moment, in dem du für dich eingestanden bist? 💪',
  'Was kam heute zu kurz – und was hat dir gutgetan?',
  'Die Sterne sind da. Kurz einchecken? 🌌',
  'Wie viel Raum hatte Selbstfürsorge heute?',
  'Welches Gefühl war heute am lautesten?',
  'Ein ruhiger Moment für dich, bevor der Tag endet 🕯️'
];

const manual = process.env.MANUAL === 'true';

function berlinOffsetHours(d) {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(d));
  return (h - d.getUTCHours() + 24) % 24;
}

if (!manual) {
  const cronHour = Number((process.env.SCHEDULE || '').trim().split(/\s+/)[1]);
  const berlinHour = (cronHour + berlinOffsetHours(new Date())) % 24;
  if (berlinHour !== 20) { console.log(`Lauf für ${berlinHour}:25 Uhr Berlin – übersprungen.`); process.exit(0); }
  const wait = Math.floor(Math.random() * 60 * 60 * 1000);
  console.log(`Warte ${Math.round(wait / 60000)} Minuten …`);
  await new Promise(r => setTimeout(r, wait));
}

if (!process.env.PUSH_SUBSCRIPTION || !process.env.VAPID_PRIVATE_KEY) {
  console.error('Secrets PUSH_SUBSCRIPTION und/oder VAPID_PRIVATE_KEY fehlen.'); process.exit(1);
}
let subs = JSON.parse(process.env.PUSH_SUBSCRIPTION);
if (!Array.isArray(subs)) subs = [subs];

webpush.setVapidDetails('mailto:waswollenwirkochen@users.noreply.github.com', VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
let failed = 0;
for (const sub of subs) {
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title: 'Bedürfnis-Diary', body }), { TTL: 3 * 3600, urgency: 'normal' });
    console.log('Gesendet:', body);
  } catch (e) {
    failed++;
    if (e.statusCode === 404 || e.statusCode === 410) console.error('Abo abgelaufen – in der App unter ⚙︎ die Erinnerung neu aktivieren und den Code erneut als Secret speichern.');
    else console.error('Fehler beim Senden:', e.statusCode || '', e.body || e.message);
  }
}
if (failed === subs.length) process.exit(1);
