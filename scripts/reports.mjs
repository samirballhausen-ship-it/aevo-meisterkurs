/**
 * Fehler-Reports auslesen
 *
 * Usage: node scripts/reports.mjs
 *
 * Liest alle Reports aus Firestore (public read auf /reports).
 * Falls Firestore-Zugriff fehlschlägt, zeigt lokale Reports.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyD3NJKMcR9K5TNNVrcH9zMPbNsK5Z5wHis',
  projectId: 'meister-tischler-lernapp',
});
const db = getFirestore(app);

async function main() {
  console.log('\n🔍 Lade Fehler-Reports...\n');

  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.log('✅ Keine Reports vorhanden – alles sauber!\n');
      process.exit(0);
    }

    console.log(`📋 ${snap.size} Report(s) gefunden:\n`);
    console.log('─'.repeat(60));

    let i = 0;
    snap.forEach((doc) => {
      i++;
      const d = doc.data();
      const date = d.createdAt?.toDate?.()?.toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) ?? '?';

      console.log(`\n#${i} | ${date} | ${d.status ?? 'new'}`);
      console.log(`📝 Frage: ${d.questionId}`);
      if (d.questionPrompt) console.log(`   "${d.questionPrompt.substring(0, 100)}"`);
      console.log(`💬 Meldung: ${d.message}`);
      console.log(`👤 Von: ${d.userName ?? 'Anonym'}`);
      console.log('─'.repeat(60));
    });

    console.log(`\n📊 Zusammenfassung: ${snap.size} Report(s), davon ${
      snap.docs.filter(d => d.data().status === 'new').length
    } neue\n`);

  } catch (err) {
    console.error('❌ Firestore-Zugriff fehlgeschlagen:', err.message);
    console.log('\n💡 Tipp: Stelle sicher dass die Firestore Rule für /reports read erlaubt:');
    console.log('   match /reports/{reportId} { allow read: if true; }');
  }

  process.exit(0);
}

main();
