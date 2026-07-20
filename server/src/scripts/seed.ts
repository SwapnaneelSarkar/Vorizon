import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { AIEmployee } from '../models/AIEmployee.js';
import { Responsibility } from '../models/Responsibility.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { Contact } from '../models/Contact.js';
import { logger } from '../utils/logger.js';

async function seed() {
  await connectDb();

  const email = 'demo@vorizon.ai';
  await User.deleteOne({ email });
  const existingOrg = await Organization.findOne({ name: 'Demo Business' });
  if (existingOrg) {
    await Promise.all([
      AIEmployee.deleteMany({ organizationId: existingOrg._id }),
      Responsibility.deleteMany({ organizationId: existingOrg._id }),
      KnowledgeItem.deleteMany({ organizationId: existingOrg._id }),
      Contact.deleteMany({ organizationId: existingOrg._id }),
      Organization.deleteOne({ _id: existingOrg._id }),
    ]);
  }

  const org = await Organization.create({ name: 'Demo Business', billingStatus: 'active' });
  const user = await User.create({
    name: 'Demo Owner',
    email,
    passwordHash: await bcrypt.hash('password123', 10),
    organizationId: org._id,
    role: 'owner',
  });
  await Organization.updateOne({ _id: org._id }, { createdBy: user._id });

  const inbound = await AIEmployee.create({
    organizationId: org._id,
    type: 'inbound',
    name: 'Riley (Reception)',
    department: 'Front Desk',
    status: 'draft',
  });
  await KnowledgeItem.create({
    organizationId: org._id,
    aiEmployeeId: inbound._id,
    kind: 'description',
    title: 'About Demo Business',
    content: 'Demo Business sells premium coffee equipment and offers repair services.',
    parsedText: 'Demo Business sells premium coffee equipment and offers repair services.',
    chunks: [{ text: 'Demo Business sells premium coffee equipment and offers repair services.' }],
  });
  await Responsibility.insertMany([
    { organizationId: org._id, aiEmployeeId: inbound._id, label: 'Answer customer questions', kind: 'preset', enabled: true },
    { organizationId: org._id, aiEmployeeId: inbound._id, label: 'Book appointments', kind: 'preset', enabled: true },
  ]);

  await AIEmployee.create({
    organizationId: org._id,
    type: 'outbound',
    name: 'Sam (Sales)',
    department: 'Sales',
    status: 'draft',
  });

  await Contact.insertMany([
    { organizationId: org._id, name: 'Alice Johnson', phone: '+14155550101', validationStatus: 'valid' },
    { organizationId: org._id, name: 'Bob Smith', phone: '+14155550102', validationStatus: 'valid' },
  ]);

  logger.info('Seed complete.');
  logger.info(`Login with: ${email} / password123`);
  await disconnectDb();
}

seed().catch(async (err) => {
  logger.error({ err }, 'Seed failed');
  await disconnectDb();
  process.exit(1);
});
