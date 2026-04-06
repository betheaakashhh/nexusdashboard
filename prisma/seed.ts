// prisma/seed.ts
// Run with: npx ts-node prisma/seed.ts
// Or add to package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
// Then run: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    console.log('   Email:', existing.email);
    return;
  }

  // Create admin user
  // CHANGE THESE before running the seed!
  const ADMIN_EMAIL    = process.env.SEED_EMAIL    || 'admin@nexus.local';
  const ADMIN_PASSWORD = process.env.SEED_PASSWORD || 'changeme123';
  const ADMIN_NAME     = process.env.SEED_NAME     || 'Admin';

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.create({
    data: {
      email:    ADMIN_EMAIL,
      password: hashed,
      name:     ADMIN_NAME,
      role:     'admin',
    },
  });

  console.log('✅ Admin created:', user.email);

  // Sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name:   'Alice Chen',
        phone:  '+1 415 555 0101',
        email:  'alice@example.com',
        tag:    'work',
        notes:  'Lead developer. Prefers Slack over email.',
        userId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        name:   'Bob Martinez',
        phone:  '+1 310 555 0202',
        email:  'bob@family.net',
        tag:    'family',
        notes:  'Brother. Birthday: March 14.',
        userId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        name:   'Dr. Clara Osei',
        phone:  '+1 212 555 0303',
        email:  'c.osei@hospital.org',
        tag:    'emergency',
        notes:  'Family doctor. Emergency line available.',
        userId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        name:   'David Kim',
        phone:  '+1 628 555 0404',
        email:  'david.kim@company.com',
        tag:    'work',
        notes:  'Project manager. Main point of contact for the Q4 project.',
        userId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        name:   'Eva Santos',
        phone:  '+1 503 555 0505',
        email:  'eva.s@email.com',
        tag:    'personal',
        notes:  '',
        userId: user.id,
      },
    }),
  ]);

  console.log(`✅ ${contacts.length} sample contacts created`);

  // Sample tasks
  await prisma.task.createMany({
    data: [
      {
        title:     'Follow up on Q4 proposal',
        priority:  'high',
        due:       '2025-01-15',
        done:      false,
        contactId: contacts[3].id, // David Kim
        userId:    user.id,
      },
      {
        title:     'Schedule annual checkup',
        priority:  'med',
        due:       '2025-02-01',
        done:      false,
        contactId: contacts[2].id, // Dr. Osei
        userId:    user.id,
      },
      {
        title:     'Send birthday gift',
        priority:  'low',
        due:       '2025-03-10',
        done:      false,
        contactId: contacts[1].id, // Bob
        userId:    user.id,
      },
      {
        title:     'Review Alice\'s PR',
        priority:  'high',
        due:       '2025-01-10',
        done:      true,
        contactId: contacts[0].id, // Alice
        userId:    user.id,
      },
    ],
  });

  console.log('✅ Sample tasks created');

  // Sample emails
  await prisma.email.createMany({
    data: [
      {
        sender:      'Alice Chen',
        senderEmail: 'alice@example.com',
        subject:     'Project Update — Q4 Sprint',
        body:        'Hey! Just wanted to share the latest status of the Q4 sprint. Everything is on track and we should hit the deadline. Let me know if you need anything from my side.\n\nBest,\nAlice',
        preview:     'Hey! Just wanted to share the latest status of the Q4 sprint...',
        tab:         'inbox',
        unread:      true,
        starred:     false,
        sentAt:      '10:32 AM',
        userId:      user.id,
      },
      {
        sender:      'David Kim',
        senderEmail: 'david.kim@company.com',
        subject:     'Meeting Notes — Monday Standup',
        body:        'Hi team,\n\nSharing the notes from our standup today.\n\nAction items:\n1. Finalize scope by Wednesday\n2. Review mockups before Friday\n3. Schedule client demo for next week\n\nLet me know if I missed anything.\n\nDavid',
        preview:     'Sharing the notes from our standup today. Action items...',
        tab:         'inbox',
        unread:      true,
        starred:     false,
        sentAt:      '9:14 AM',
        userId:      user.id,
      },
      {
        sender:      'Newsletter',
        senderEmail: 'news@techdigest.com',
        subject:     'Weekly Tech Digest',
        body:        'This week in tech: New AI models released, major framework updates, developer tools round-up, and industry news. Read the full digest online.',
        preview:     'Top stories: AI advancements, new frameworks, and more...',
        tab:         'inbox',
        unread:      false,
        starred:     true,
        sentAt:      'Yesterday',
        userId:      user.id,
      },
      {
        sender:      'Me',
        senderEmail: 'admin@nexus.local',
        subject:     'Re: Project Update — Q4 Sprint',
        body:        'Thanks Alice! Everything looks great. I\'ll review tonight and send feedback tomorrow morning.',
        preview:     'Thanks Alice! Everything looks great...',
        tab:         'sent',
        unread:      false,
        starred:     false,
        sentAt:      '10:45 AM',
        userId:      user.id,
      },
    ],
  });

  console.log('✅ Sample emails created');
  console.log('\n🎉 Seed complete!');
  console.log('   Login at: http://localhost:3000/login');
  console.log('   Email:   ', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
